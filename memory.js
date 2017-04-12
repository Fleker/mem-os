var mem_init = null;
var bitmap_init = null;
// Requests a total number of bytes of memory for the process.
var mem_request = null;
// Reads an address in memory.
var mem_read = null;
// Sets an address in memory.
var mem_set = null;
// Frees a certain amount of memory from a process.
var mem_free = null;

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
    // Lowest possible block of memory is 4 bytes
    const bitmap_min = 2; // 2 ^ _2_ = 4

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
        }
    }

    var bitmap = [];
    bitmap_init = function(offset, length) {
        if (!is_bitmap_init) {
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
        }
    }

    mem_request = function(bytes) {
        // We are using a version of Quick Fit to quickly allocate memory.
        // This is an array of linked nodes.
        // Try to over-allocate memory.
        //
        // We need to check the bitmap.
        // TODO Check whether process already has too much memory.
        var requested_bytes = Math.pow(2, Math.ceil(Math.log2(bytes)));
        var mem_alloc_index = Math.floor(Math.log2(requested_bytes)) - bitmap_min;
        for (var i = mem_alloc_index; i < bitmap.length; i++) {
            if (bitmap[i]) {
                // Allocate memory
                if (i == mem_alloc_index) {
                    // Allocate all bytes in node
                    var addr = bitmap[i].value;
                    process_table[process_get_current()][PTABLE_COLUMN_BASE_REGISTER] = addr;
                    process_table[process_get_current()][PTABLE_COLUMN_LIMIT_REGISTER] = requested_bytes;
                    // Remove from bitmap
                    bitmap[i] = bitmap[i].next;
                    bitmap[i].prev = null;
                    // TODO Check if memory has already been allocated to process. MemCpy.
                    return addr;
                } else {
                    // Splice node's bytes in half.
                    var newLength = Math.pow(2, i - 1);
                    var addr1 = new Node(bitmap[i]);
                    var addr2 = new Node(bitmap[i] + newLength);
                    addr2.next = bitmap[i - 1];
                    addr2.prev = addr1;
                    addr1.next = addr;
                    bitmap[i] = bitmap[i].next;
                    bitmap[i - 1] = addr1;
                    // Go through the process again until we find memory.
                    return mem_request(bytes);
                }
            }
        }
        throw MEM_ERROR_ALLOCATION;
    }

    mem_free = function(addr, len) {
        // Be conservative with how many bytes are being freed.
        var requested_bytes = Math.pow(2, Math.floor(Math.log2(bytes)));
        var mem_alloc_index = Math.floor(Math.log2(requested_bytes)) - bitmap_min;
        // Create a new node to put back into bitmap
        var node = new Node(addr);
        node.next = bitmap[mem_alloc_index];
        bitmap[mem_alloc_index].prev = node;
        bitmap[mem_alloc_index] = node;
        return MEM_FREE_OK;
    }

    mem_read = function(addr) {
        if (addr > process_table[process_get_current()][PTABLE_COLUMN_LIMIT_REGISTER]) {
            throw MEM_ERROR_BOUNDS;
        }
        // Translate to kernel address
        var kaddr = process_table[process_get_current()][PTABLE_COLUMN_BASE_REGISTER] + addr;
        return kernel_mem_get(kaddr);
    }

    mem_set = function(addr, val) {
        if (addr > process_table[process_get_current()][PTABLE_COLUMN_LIMIT_REGISTER]) {
            throw MEM_ERROR_BOUNDS;
        }
        // Translate to kernel address
        var kaddr = process_table[process_get_current()][PTABLE_COLUMN_BASE_REGISTER] + addr;
        kernel_mem_set(kaddr, val);
        return MEM_WRITE_OK;
    }
})();
