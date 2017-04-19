var mem_init = null;
var bitmap_init = null;
// Requests a total number of bytes of memory for the process.
var mem_request = null;
// Reads an address in memory.
var mem_read = null;
// Reads an address in memory of a parent process.
var mem_read_parent = null;
// Sets an address in memory.
var mem_set = null;
// Sets a memory address of a parent process.
var mem_set_parent = null;
// Frees a certain amount of memory from a process.
var mem_free = null;
// Updates display - for UI purposes
var update_memory_ui = null;

// Memory address issue found in the kernel.
const MEM_ERROR_KERNEL_BOUNDS = -5;
// The process does not have a parent.
const MEM_ERROR_ORPHAN = -4;
// The process has more memory already allocated than it requested.
const MEM_ERROR_PROCESS_MEMORY_OVERLOAD = -3;
// The system cannot allocate enough memory.
const MEM_ERROR_ALLOCATION = -2;
// The process requested memory it cannot access.
const MEM_ERROR_BOUNDS = -1;
// Data was successfully written to the memory structure.
const MEM_WRITE_OK = 0;
// Memory was successfully freed.
const MEM_FREE_OK = 0;

(function() {
    var kernel_mem_exists = null;
    var kernel_mem_get = null;
    var kernel_mem_set = null;
    var kernel_mem_request = null;
    var kernel_mem_free = null;
    var kernel_filesys_open = null;
    var kernel_filesys_read = null;
    var kernel_filesys_write = null;
    var kernel_filesys_close = null;
    var update_capacity = null;
    var process_table = null;
    var is_mem_init = false;
    var is_bitmap_init = false;
    var bitmap_min = null;
    var bitmap = [];

    /*
     * Copies `len` bytes of data from `addr1` to `addr2`. Overwrites.
     */
    function mem_cpy(addr1, addr2, len) {
        for (var i = 0; i < len; i++) {
            // Do direct kernel memory copying.
            kernel_mem_set(addr2 + i, kernel_mem_get(addr1 + i));
        }
    }

    mem_init = function(kme, kmg, kms, kprocess_table, kfo, kfw, kfc, kfr, kmf, kmr, bm, bit, uvc) {
        // Pass functions in from the kernel
        if (!is_mem_init) {
            kernel_mem_exists = kme;
            kernel_mem_get = kmg;
            kernel_mem_set = kms;
            kernel_mem_free = kmf;
            kernel_mem_request = kmr;
            process_table = kprocess_table;
            kernel_filesys_open = kfo;
            kernel_filesys_read = kfr;
            kernel_filesys_write = kfw;
            kernel_filesys_close = kfc;
            bitmap_min = bm;
            bitmap = bit;
            update_capacity = uvc;

            is_mem_init = true;

            memory_map_ui_init();
            update_memory_ui();
            return [kernel_mem_request, kernel_mem_free];
        }
    }

    bitmap_init = function(offset, length) {
        if (!is_bitmap_init) {
            if (typeof offset == "object") {
                // We can just use this bitmap instead, inflated from storage.
                bitmap = offset;
                return FILESYS_OP_OK;
            }

            var start = Math.log2(length); // We start from here.
            var mem_remaining = length;
            while (mem_remaining > bitmap_min) {
                // Get index
                var mem_alloc_index = Math.floor(Math.log2(length)) - bitmap_min;
                var mem_alloc = Math.pow(2, Math.floor(Math.log2(length)));
                var mem_addr = mem_remaining - mem_alloc + offset; // Get the address for this block.
                bitmap[mem_alloc_index] = new Node(mem_addr);
                mem_remaining -= mem_alloc;
            }
            // Exit once we've got memory in each location
            is_bitmap_init = true;
            update_memory_ui();
            return bitmap;
        }
    }

    mem_request = function(bytes) {
        // Make sure we aren't requesting too little memory.
        if (bytes < process_table[process_get_current()][PTABLE_COLUMN_LIMIT_REGISTER]) {
            return MEM_ERROR_PROCESS_MEMORY_OVERLOAD;
        }

        // This will return the address with the bytes now allocated.
        var addr = kernel_mem_request(bytes);
        // Add these values to a memory table file.
        const FILENAME = '/.volatile';
        filesys_open(FILENAME);
        var volatile = JSON.parse(filesys_read(FILENAME));
        volatile[process_table[process_get_current()][PTABLE_COLUMN_APPLICATION_PATH]] = [addr, bytes];
        filesys_write(FILENAME, JSON.stringify(volatile));
        filesys_close(FILENAME);
        // Update our memory file
        update_capacity(bytes);

        // Put this into our process table with some checks.
        // Check if memory has already been allocated to process. If so, copy bytes.
        // FIXME Try to increase memory allocation in-place if possible

        if (process_table[process_get_current()][PTABLE_COLUMN_BASE_REGISTER]) {
            mem_cpy(process_table[process_get_current()][PTABLE_COLUMN_BASE_REGISTER], addr, process_table[process_get_current()][PTABLE_COLUMN_LIMIT_REGISTER]);
        }

        process_table[process_get_current()][PTABLE_COLUMN_BASE_REGISTER] = addr;
        process_table[process_get_current()][PTABLE_COLUMN_LIMIT_REGISTER] = requested_bytes;
        // Return amount of bytes allocated
        return bytes;
    }

    mem_free = function(addr, len) {
        var prevLength = process_table[process_get_current()][PTABLE_COLUMN_LIMIT_REGISTER];
        // Reallocate memory in process table
        if (addr < 0 || addr + len > prevLength) {
            throw MEM_ERROR_BOUNDS;
        }
        // We need to make sure a proper chunk of memory is freed to avoid splitting process memory.
        if (addr == 0) {
            // Crop length
            process_table[process_get_current()][PTABLE_COLUMN_BASE_NVREGISTER] -= len;
        } else {
            process_table[process_get_current()][PTABLE_COLUMN_LIMIT_NVREGISTER] = addr;
        }

        // Update our memory file
        const FILENAME = '/.volatile';
        kernel_filesys_open(FILENAME);
        var volatile = JSON.parse(filesys_read(FILENAME));
        volatile[process_table[process_get_current()][PTABLE_COLUMN_APPLICATION_PATH]] = [process_table[process_get_current()][PTABLE_COLUMN_BASE_REGISTER], process_table[process_get_current()][PTABLE_COLUMN_LIMIT_REGISTER]];
        kernel_filesys_write(FILENAME, JSON.stringify(volatile));
        kernel_filesys_close(FILENAME);

        return kernel_mem_free(process_table[process_get_current()][PTABLE_COLUMN_BASE_REGISTER], process_table[process_get_current()][PTABLE_COLUMN_LIMIT_REGISTER]);
    }

    mem_read = function(addr) {
        if (addr > process_table[process_get_current()][PTABLE_COLUMN_LIMIT_REGISTER]) {
            throw MEM_ERROR_BOUNDS;
        }
        // Translate to kernel address
        var kaddr = process_table[process_get_current()][PTABLE_COLUMN_BASE_REGISTER] + addr;
        memory_map_ui('toread', kaddr);

        var result = kernel_mem_get(kaddr);
        memory_map_ui('didread', kaddr);
        return result;
    }


    mem_read_parent = function(addr) {
        var parent_pid = process_table[process_get_current()][PTABLE_COLUMN_PARENT];
        if (!parent_pid) {
            throw MEM_ERROR_ORPHAN;
        }
        if (addr > process_table[parent_pid][PTABLE_COLUMN_LIMIT_REGISTER]) {
            throw MEM_ERROR_BOUNDS;
        }
        // Translate to kernel address
        var kaddr = process_table[parent_pid][PTABLE_COLUMN_BASE_REGISTER] + addr;
        memory_map_ui('toread', kaddr);

        var result = kernel_mem_get(kaddr);
        memory_map_ui('didread', kaddr);
        return result;
    }

    mem_set = function(addr, val) {
        if (addr > process_table[process_get_current()][PTABLE_COLUMN_LIMIT_REGISTER]) {
            throw MEM_ERROR_BOUNDS;
        }
        // Translate to kernel address
        var kaddr = process_table[process_get_current()][PTABLE_COLUMN_BASE_REGISTER] + addr;
        memory_map_ui('towrite', kaddr);
        kernel_mem_set(kaddr, val);

        update_ui();
        memory_map_ui('didwrite', kaddr);
        return MEM_WRITE_OK;
    }

    mem_set_parent = function(addr) {
        var parent_pid = process_table[process_get_current()][PTABLE_COLUMN_PARENT];
        if (!parent_pid) {
            throw MEM_ERROR_ORPHAN;
        }
        if (addr > process_table[parent_pid][PTABLE_COLUMN_LIMIT_REGISTER]) {
            throw MEM_ERROR_BOUNDS;
        }
        // Translate to kernel address
        var kaddr = process_table[parent_pid][PTABLE_COLUMN_BASE_REGISTER] + addr;
        memory_map_ui('towrite', kaddr);
        kernel_mem_set(kaddr, val);

        update_ui();
        memory_map_ui('didwrite', kaddr);
        return MEM_WRITE_OK;
    }

    update_memory_ui = function() {
        // Updates the memory display
        // For entire capacity
        new Promise(function(fulfill, reject) {
            var out = "<table><thead><tr><td>Bytes</td><td>Starting Address</td></thead><tbody>";
            for (var i = 0; i < bitmap.length; i++) {
                var v = (bitmap[i]) ? bitmap[i].value : "Undefined";
                out += "<tr><td>" + Math.pow(2, i + bitmap_min) + "</td><td>" + v;
                var node = bitmap[i];
                while (node) {
                    if (node.next) {
                        out += "->" + node.next.value;
                    }
                    node = node.next;
                }
                out += "</td></tr>";
            }
            out += "</tbody></table>";
            $('#tab_2').innerHTML = out;

            out = "<table><thead><tr><td>Address</td><td>Value</td></thead><tbody>";
            for (var i = 0; i < config_get_capacity(); i++) {
                out += "<tr><td>0x" + i.toString(16) + "</td><td class='mem_cell'>" + kernel_mem_get(i) + "</td></tr>";
            }
            out += "</tbody></table>";

            $('#tab_3').innerHTML = out;
            fulfill();
        }).then();
    }

    function memory_map_ui_init() {
        new Promise(function(fulfill, reject) {
            console.log("Constructing memory map");
            var canvas = $('#memory_map');
            canvas.height = config_get_capacity() * 10;
            canvas.width = 176;
            ctx = canvas.getContext('2d');
            for (var i = 0; i < config_get_capacity(); i++) {
                var val = kernel_mem_get(i);
                for (var j = 16; j >= 0; j--) {
                    var mask = 1 << j;
                    ctx.fillStyle = (val & mask) ? "#f00" : "#fff";
                    ctx.fillRect((16 - j) * 10, i * 10, 10, 10);
                }
            }
            fulfill();
        }).then();
    }

    function memory_map_ui(action, i) {
        var canvas = $('#memory_map');
        ctx = canvas.getContext('2d');
        if (action == 'toread') {
            for (var j = 16; j >= 0; j--) {
                var val = kernel_mem_get(i);
                var mask = 1 << j;
                ctx.fillStyle = "#00f";
                ctx.fillRect((16 - j) * 10, i * 10, 10, 10);
            }
        } else if (action == "didread" || action == "didwrite") {
            for (var j = 16; j >= 0; j--) {
                var val = kernel_mem_get(i);
                var mask = 1 << j;
                ctx.fillStyle = (val & mask) ? "#f00" : "#fff";
                ctx.fillRect((16 - j) * 10, i * 10, 10, 10);
            }
        } else if (action == "towrite") {
            for (var j = 16; j >= 0; j--) {
                var val = kernel_mem_get(i);
                var mask = 1 << j;
                ctx.fillStyle = "#0f0";
                ctx.fillRect((16 - j) * 10, i * 10, 10, 10);
            }
        }
    }
})();
