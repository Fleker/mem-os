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

// The process does not have a parent
var MEM_ERROR_ORPHAN = -4;
// The process has more memory already allocated than it requested.
var MEM_ERROR_PROCESS_MEMORY_OVERLOAD = -3;
// The system cannot allocate enough memory.
var MEM_ERROR_ALLOCATION = -2;
// The process requested memory it cannot access.
var MEM_ERROR_BOUNDS = -1;
// Data was successfully written to the memory structure.
var MEM_WRITE_OK = 0;
// Memory was successfully freed.
var MEM_FREE_OK = 0;

(function() {
    var kernel_mem_exists = null;
    var kernel_mem_get = null;
    var kernel_mem_set = null;
    var process_table = null;
    var is_mem_init = false;
    var is_bitmap_init = false;
    // Lowest possible block of memory is 1 byte(s)
    const bitmap_min = 0; // 2 ^ _0_ = 1

    /*
     * Copies `len` bytes of data from `addr1` to `addr2`. Overwrites.
     */
    function mem_cpy(addr1, addr2, len) {
        for (var i = 0; i < len; i++) {
            // Do direct kernel memory copying.
            kernel_mem_set(addr2 + i, kernel_mem_get(addr1 + i));
        }
    }

    mem_init = function(kme, kmg, kms, kprocess_table) {
        // Pass functions in from the kernel
        if (!is_mem_init) {
            kernel_mem_exists = kme;
            kernel_mem_get = kmg;
            kernel_mem_set = kms;
            process_table = kprocess_table;
            is_mem_init = true;

            memory_map_ui_init();
            update_ui();
            return [kernel_mem_request, kernel_mem_free];
        }
    }

    var bitmap = [];
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
            update_ui();
            return bitmap;
        }
    }

    // This kernel-level function finds available blocks of memory
    //   and provides the starting memory address. Combined with the
    //   number of blocks allocated, this should be able to give
    //   a process all of the addresses it wants.
    function kernel_mem_request(bytes) {
        // We are using a version of Quick Fit to quickly allocate memory.
        // This is an array of linked nodes.
        // Try to over-allocate memory.
        // We need to check the bitmap.

        // Make sure we aren't requesting too little memory.
        if (bytes < process_table[process_get_current()][PTABLE_COLUMN_LIMIT_REGISTER]) {
            return MEM_ERROR_PROCESS_MEMORY_OVERLOAD;
        }
        var requested_bytes = Math.pow(2, Math.ceil(Math.log2(bytes)));
        var mem_alloc_index = Math.floor(Math.log2(requested_bytes)) - bitmap_min;
        for (var i = mem_alloc_index; i < bitmap.length; i++) {
            if (bitmap[i]) {
                // Allocate memory
                if (i == mem_alloc_index) {
                    // Allocate all bytes in node
                    var addr = bitmap[i].value;
                    // TODO Add these values to a memory table file.
                    // Remove from bitmap
                    bitmap[i] = bitmap[i].next;
                    if (bitmap[i]) {
                        bitmap[i].prev = null;
                    }
                    update_ui();
                    // Return the address in our kernel function. If we're doing something in
                    //   userspace, we should hide the raw address. We can use this address
                    //   for something other than a process.
                    return addr;
                } else {
                    // Splice node's bytes in half.
                    var newLength = Math.pow(2, i - 1 + bitmap_min);
                    var addr1 = new Node(bitmap[i]);
                    var addr2 = new Node(bitmap[i].value + newLength);
                    addr2.next = bitmap[i - 1];
                    addr2.prev = addr1;
                    addr1.next = addr2;
                    bitmap[i] = bitmap[i].next;
                    if (bitmap[i]) {
                        bitmap[i].prev = null;
                    }
                    bitmap[i - 1] = addr1;
                    bitmap[i - 1].prev = null;
                    // Go through the process again until we find memory.
                    return kernel_mem_request(bytes);
                }
            }
        }
        // TODO Handle a memory allocation script
        throw MEM_ERROR_ALLOCATION;
    }

    mem_request = function(bytes) {
        // This will return the address with the bytes now allocated.
        var addr = kernel_mem_request(bytes);
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

    kernel_mem_free = function(addr, len) {
        // Be conservative with how many bytes are being freed.
        var requested_bytes = Math.pow(2, Math.floor(Math.log2(len)));
        var mem_alloc_index = Math.floor(Math.log2(requested_bytes)) - bitmap_min;
        // Create a new node to put back into bitmap
        var node = new Node(addr);
        node.next = bitmap[mem_alloc_index];
        if (bitmap[mem_alloc_index]) {
            bitmap[mem_alloc_index].prev = node;
        }
        bitmap[mem_alloc_index] = node;
        // TODO Group like memory into larger blocks
        update_ui();
        return MEM_FREE_OK;
    }

    mem_free = function(addr, len) {
        return kernel_mem_free(addr + process_table[process_get_current()][PTABLE_COLUMN_BASE_REGISTER], len);
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

    function update_ui() {
        // Updates the memory display
        // For entire capacity
        // TODO Make this a promise
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
        for (var i = 0; i < 1024; i++) {
            out += "<tr><td>0x" + i.toString(16) + "</td><td class='mem_cell'>" + kernel_mem_get(i) + "</td></tr>";
        }
        out += "</tbody></table>";

        $('#tab_3').innerHTML = out;
    }

    function memory_map_ui_init() {
        // TODO Make this a promise
        console.log("Constructing memory map");
        var canvas = $('#memory_map');
        canvas.height = 10240; // Cap = 1024
        canvas.width = 176;
        ctx = canvas.getContext('2d');
        // Capacity = 1024;
        for (var i = 0; i < 1024; i++) {
            var val = kernel_mem_get(i);
            for (var j = 16; j >= 0; j--) {
                var mask = 1 << j;
                ctx.fillStyle = (val & mask) ? "#f00" : "#fff";
                ctx.fillRect((16 - j) * 10, i * 10, 10, 10);
            }
        }
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
