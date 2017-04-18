/*
 * Note: In our high-level, poorly implemented file system, each file is
 *   only going to be in a single address regardless of actual data size.
 * As files are accessible by any process (in most cases), we lock them
 *   to prevent multiple processes writing at one time. (They can read).
 */
// Inits file system.
var filesys_init = null;
// Inits journal system hooks in filesys
var filesys_journal_init = null;
// Creates a file.
var filesys_create = null;
// Opens a file and locks it.
var filesys_open = null;
// Checks if file exists.
var filesys_exists = null;
// Closes a file, removing the lock. As these are non-volatile, locks are kept even after reboots, making it important for processes to manage files correctly.
var filesys_close = null;
// Reads data from a file that has been opened.
var filesys_read = null;
// Writes data to a file at a given path.
var filesys_write = null;
// Reads file metadata.
var filesys_read_meta = null;
// Writes a particular property of a file.
var filesys_write_meta = null;
// Creates a directory.
var filesys_create_dir = null;
// States whether the file is locked.
var filesys_has_lock = null;
// States whether it is a directory or not.
var filesys_is_dir = null;
// Returns children inside of directory.
var filesys_get_children = null;
// Gets file access
var filesys_get_access = null;
// Deletes a file
var filesys_delete_file = null;
// Deletes a directory
var filesys_delete_dir = null;

/* The file system also supports non-volatile RAM or nv memory
 * As these are exclusive to each process, they don't need to be locked.
 */
// Requests a total number of bytes of non-volatile memory for the process.
var nvmem_request = null;
// Reads an address in non-volatile memory.
var nvmem_read = null;
// Reads an address in non-volatile memory of a parent process.
var nvmem_read_parent = null;
// Sets an address in non-volatile memory.
var nvmem_set = null;
// Sets a non-volatile memory address of a parent process.
var nvmem_set_parent = null;
// Frees a certain amount of non-volatile memory from a process.
var nvmem_free = null;

// Path to access the file, including filename (can pull out of path)
//   But since our paths are found through a system of current directories and object keys, this isn't strictly necesasary
//FTABLE_COLUMN_PATH = "path";
// ie. 777 - chmod
FTABLE_COLUMN_ACCESS = "access";
// File metadata, whatever makes sense for the file
FTABLE_COLUMN_METADATA = "metadata"; // Cheating, is a JSON
// If it has children, shows children. If not, it is a file.
FTABLE_COLUMN_CHILDREN = "children";
// Address in memory of the data
FTABLE_COLUMN_ADDRESS = "address";
// The process path that has a lock on the file. As these locks persist after restart, cannot just store the process id. If invalid, file isn't locked.
FTABLE_COLUMN_LOCK = "lock";
// The address in memory of the file's parent (if it exists).
FTABLE_COLUMN_PADDRESS = "paddress";

// One cannot a non-empty directory
const FILESYS_ERROR_NONEMPTY_DIR = -7;
// Lock cannot be completed for some reason
const FILESYS_ERROR_CANNOT_LOCK = -6;
// Trying to create a file but that file already exists
const FILESYS_ERROR_FILE_ALREADY_EXISTS = -5;
// Trying to access a file that isn't there
const FILESYS_ERROR_FILE_NOT_FOUND = -4;
// Trying to write to a locked file, or writing to an unlocked file.
const FILESYS_ERROR_WRITE_LOCK = -3;
// Trying to use a directory as a file
const FILESYS_ERROR_ISNT_FILE = -2;
// Trying to use a file as a directory
const FILESYS_ERROR_ISNT_DIRECTORY = -1;
// File system operation was successful
const FILESYS_OP_OK = 0;
(function() {
    var filesys_table = {};
    var process_table = [];
    var kernel_mem_get = null;
    var kernel_mem_set = null;
    var kernel_mem_exist = null;
    var kernel_mem_request = null;
    var kernel_journal_add_entry = null;
    var kernel_journal_pop_entry = null;

    var is_filesys_init = false;
    var current_directory = "/";
    filesys_init = function(kmg, kms, kme, kmr, ptable) {
        if (!is_filesys_init) {
            kernel_mem_get = kmg;
            kernel_mem_set = kms;
            kernel_mem_exist = kme;
            kernel_mem_request = kmr;
            process_table = ptable;
            // Inflate file system into browser memory
            filesys_table = JSON.parse(kernel_mem_get(0));
            if (!filesys_table[FTABLE_COLUMN_PATH]) {
                filesys_install();
            }

            // Check whether certain files exist. If not, create them.
            const FILE_CONFIG = '/.config';
            if (!filesys_exists(FILE_CONFIG)) {
                 // Create .config
                filesys_create(FILE_CONFIG, 777);
                kernel_filesys_open(FILE_CONFIG);
                var config = "{/* This file allows system parameters to be changed */}";
                kernel_filesys_write(FILE_CONFIG, config);
                filesys_close(FILE_CONFIG);
            }

            const FILE_BITMAP = '/.bitmap';
            if (!filesys_exists(FILE_BITMAP)) {
                // Create bitmap
                filesys_create(FILE_BITMAP, 777);
                // Pass in the offset which is from the file system.
                // If the capacity is now lower, some data will be cut-off. Some things may not work as expected.
                var bitmap = bitmap_init(1, config_get_capacity()); // 1024 8-bit values
                // TODO Bitmap update function
                kernel_filesys_open(FILE_BITMAP);
                kernel_filesys_write(FILE_BITMAP, JSON.stringify(bitmap));
                filesys_close(FILE_BITMAP);
            } else {
                // Inflate bitmap
                kernel_filesys_open(FILE_BITMAP);
                var bitmap = JSON.parse(filesys_read(FILE_BITMAP));
                bitmap_init(bitmap);
            }

            const FILE_VOLATILE_MEMORY = '/.volatile';
            if (!filesys_exists(FILE_VOLATILE_MEMORY)) {
                // Create
                filesys_create(FILE_VOLATILE_MEMORY, 777);
                kernel_filesys_open(FILE_VOLATILE_MEMORY);
                // TODO Allow memory changes to write to file
                kernel_filesys_write(FILE_VOLATILE_MEMORY, JSON.stringify([]));
                filesys_close(FILE_VOLATILE_MEMORY);
            }

            const FILE_DREAM_JOURNAL = '/.dream-journal';
            if (!filesys_exists(FILE_DREAM_JOURNAL)) {
                // Create
                filesys_create(FILE_DREAM_JOURNAL, 777);
                kernel_filesys_open(FILE_DREAM_JOURNAL);
                // TODO Allow memory changes to write to file
                kernel_filesys_write(FILE_DREAM_JOURNAL, JSON.stringify([]));
                filesys_close(FILE_DREAM_JOURNAL);
            } else {
                // Open and inflate
                // TODO Implement
            }

            // File capacity contains allocation count of filesystem, nv, and v memory
            const FILE_CAPACITY = "/.capacity";
            if (!filesys_exists(FILE_CAPACITY)) {
                // Create
                filesys_create(FILE_CAPACITY, 777);
                kernel_filesys_open(FILE_CAPACITY);
                // TODO Allow memory changes to write to file
                // 6 is the base filesystem size.
                kernel_filesys_write(FILE_CAPACITY, JSON.stringify([6, 0, 0]));
                filesys_close(FILE_CAPACITY);
            }

            is_filesys_init = true;
        }
    }

    var is_filesys_journal_init = false;
    filesys_journal_init = function(kjae, kjpe) {
        if (!is_filesys_journal_init) {
            kernel_journal_add_entry = kjae;
            kernel_journal_pop_entry = kjpe;
            is_filesys_journal_init = true;
        }
    }

    // Opens up a file with respect to the kernel, so locking it with a special path that doesn't resolve.
    function kernel_filesys_open(filename, process_path) {
        process_path = process_path || "/.kernel";
        try {
            var vector = filesys_access_file(filename);
            var directory = vector[0];
            var directoryAddr = vector[1];
            var fn = vector[2];

            if (!directory[fn][FTABLE_COLUMN_LOCK]) {
                throw FILESYS_ERROR_WRITE_LOCK;
            }
            if (directory[fn][FTABLE_COLUMN_LOCK] != process_path) {
                throw FILESYS_ERROR_WRITE_LOCK;
            }
            kernel_mem_set(directory[fn][FTABLE_COLUMN_ADDRESS], data);
        } catch (e) {
            throw e;
        }
    }

    filesys_open = function(filename) {
        // Opens a file and locks it based on the curr process.
        if (!process_table[process_get_current()][PTABLE_COLUMN_APPLICATION_PATH]) {
            throw FILESYS_ERROR_CANNOT_LOCK;
        }
        return kernel_filesys_open(filename, process_table[process_get_current()][PTABLE_COLUMN_APPLICATION_PATH]);
    }

    function kernel_filesys_write(filename, data, process_path) {
        try {
            var vector = filesys_access_file(filename);
            var directory = vector[0];
            var directoryAddr = vector[1];
            var fn = vector[2];

            process_path = process_path || "/.kernel";
            if (!directory[fn][FTABLE_COLUMN_LOCK]) {
                throw FILESYS_ERROR_WRITE_LOCK;
            }
            if (directory[fn][FTABLE_COLUMN_LOCK] != process_path) {
                throw FILESYS_ERROR_WRITE_LOCK;
            }
            kernel_mem_set(directory[fn][FTABLE_COLUMN_ADDRESS], data);
        } catch (e) {
            throw e;
        }
    }

    filesys_write = function(filename, data) {
        // Opens a file and locks it based on the curr process.
        if (!process_table[process_get_current()][PTABLE_COLUMN_APPLICATION_PATH]) {
            throw FILESYS_ERROR_CANNOT_LOCK;
        }
        return kernel_filesys_write(filename, process_table[process_get_current()][PTABLE_COLUMN_APPLICATION_PATH]);
    }

    function kernel_filesys_write_meta(filename, data, process_path) {
        try {
            var vector = filesys_access_file(filename);
            var directory = vector[0];
            var directoryAddr = vector[1];
            var fn = vector[2];

            process_path = process_path || "/.kernel";
            if (!directory[fn][FTABLE_COLUMN_LOCK]) {
                throw FILESYS_ERROR_WRITE_LOCK;
            }
            if (directory[fn][FTABLE_COLUMN_LOCK] != process_path) {
                throw FILESYS_ERROR_WRITE_LOCK;
            }
            directory[fn][FTABLE_COLUMN_METADATA] = JSON.stringify(data);
            kernel_mem_set(directoryAddr, JSON.stringify(directory));
            return FILESYS_OP_OK;
        } catch (e) {
            throw e;
        }
    }

    filesys_write_meta = function(filename, data) {
        // Opens a file and locks it based on the curr process.
        if (!process_table[process_get_current()][PTABLE_COLUMN_APPLICATION_PATH]) {
            throw FILESYS_ERROR_CANNOT_LOCK;
        }
        return kernel_filesys_write_meta(filename, process_table[process_get_current()][PTABLE_COLUMN_APPLICATION_PATH]);
    }

    // Closes file with respect to the kernel
    function kernel_filesys_close(filename, process_path) {
        try {
             var vector = filesys_access_file(filename);
             var directory = vector[0];
             var directoryAddr = vector[1];
             var fn = vector[2];

             process_path = process_path || "/.kernel";
             if (!directory[fn]) {
                 throw FILESYS_ERROR_FILE_NOT_FOUND;
             }
             if (directory[fn][FTABLE_COLUMN_CHILDREN]) {
                 throw FILESYS_ERROR_ISNT_FILE;
             }
             if (!directory[fn][FTABLE_COLUMN_LOCK]) {
                 throw FILESYS_ERROR_WRITE_LOCK;
             }
             if (directory[fn][FTABLE_COLUMN_LOCK] != process_path) {
                 throw FILESYS_ERROR_WRITE_LOCK;
             }
             // Remove lock
             delete directory[fn][FTABLE_COLUMN_LOCK];
             return FILESYS_OP_OK;
         } catch (e) {
             throw e;
         }
    }

    filesys_close = function(filename) {
        // Opens a file and locks it based on the curr process.
        if (!process_table[process_get_current()][PTABLE_COLUMN_APPLICATION_PATH]) {
            throw FILESYS_ERROR_CANNOT_LOCK;
        }
        return kernel_filesys_close(filename, process_table[process_get_current()][PTABLE_COLUMN_APPLICATION_PATH]);
    }

    // Opens up a file with respect to the kernel, so locking it with a special path that doesn't resolve.
    function kernel_filesys_read(filename, process_path) {
        process_path = process_path || "/.kernel";
        try {
            var vector = filesys_access_file(filename);
            var directory = vector[0];
            var directoryAddr = vector[1];
            var fn = vector[2];

            return kernel_mem_read(directory[fn][FTABLE_COLUMN_ADDRESS]);
        } catch (e) {
            throw e;
        }
    }

    filesys_read = function(filename) {
        return kernel_filesys_read(filename, process_table[process_get_current()][PTABLE_COLUMN_APPLICATION_PATH]);
    }

    filesys_read_meta = function(filename) {
        try {
            var vector = filesys_access_file(filename);
            var directory = vector[0];
            var directoryAddr = vector[1];
            var fn = vector[2];

            return JSON.stringify(directory[fn][FTABLE_COLUMN_METADATA]);
        } catch (e) {
            throw e;
        }
    }

    filesys_has_lock = function(filename) {
        try {
            var vector = filesys_access_file(filename);
            var directory = vector[0];
            var directoryAddr = vector[1];
            var fn = vector[2];

            return directory[fn][FTABLE_COLUMN_LOCK] !== undefined;
        } catch (e) {
            throw e;
        }
    }

    filesys_is_dir = function(filename) {
        try {
            var vector = filesys_access_file(filename);
            var directory = vector[0];
            var directoryAddr = vector[1];
            var fn = vector[2];

            return directory[fn][FTABLE_COLUMN_CHILDREN] !== 0;
        } catch (e) {
            throw e;
        }
    }

    filesys_get_access = function(filename) {
        try {
            var vector = filesys_access_file(filename);
            var directory = vector[0];
            var directoryAddr = vector[1];
            var fn = vector[2];

            return directory[fn][FTABLE_COLUMN_ACCESS];
        } catch (e) {
            throw e;
        }
    }

    filesys_get_children = function(filename) {
        try {
            var vector = filesys_access_file(filename);
            var directory = vector[0];
            var directoryAddr = vector[1];
            var fn = vector[2];

            // Returns the filenames in the directory.
            return Object.keys(directory);
        } catch (e) {
            throw e;
        }
    }

    filesys_create_dir = function(filename) {
        try {
            // First, navigate to the directory
            var path = filename.split('/');
            // Inflate file system
            var root = JSON.parse(kernel_mem_get(0));
            var directory = root;
            var directoryAddr = 0;
            for (var i = 0; i < path.length - 1; i++) {
                // Traverse file system
                directory = root[path[i]];
                directoryAddr = root[path[i]][FTABLE_COLUMN_ADDRESS];
            }
            var fn = path[path.length - 1];
            directory[fn] = {}; // Empty directory
            var addr = kernel_mem_request(1);
            directory[fn][FTABLE_COLUMN_ADDRESS] = addr;
            directory[fn][FTABLE_COLUMN_CHILDREN] = 1;
            update_capacity(0, 1);
            // TODO parent children count.
            kernel_mem_set(directoryAddr, JSON.stringify(directory));
            kernel_mem_set(addr, JSON.stringify({}));
        } catch (e) {
            throw e;
        }
    }

    filesys_exists = function(filename) {
        try {
            var vector = filesys_access_file(filename);
            return true;
        } catch (e) {
            return false;
        }
    }

    filesys_delete_file = function(filename) {
         try {
            var vector = filesys_access_file(filename);
            var directory = vector[0];
            var directoryAddr = vector[1];
            var fn = vector[2];

            // TODO Update our directory children count.
            kernel_journal_add_entry("Update,-1");
            update_capacity(0, -1);
            // Pop our last entry and add another
            kernel_journal_pop_entry();

            kernel_journal_add_entry("Free," + directory[fn][FTABLE_COLUMN_ADDRESS]);
            mem_free(directory[fn][FTABLE_COLUMN_ADDRESS], 1);
            kernel_journal_pop_entry();

            kernel_journal_add_entry("Delete," + directoryAddr + "," + fn);
            delete directory[fn];
            kernel_journal_pop_entry();

            kernel_mem_set(directoryAddr, JSON.stringify(directory));
            return FILESYS_OP_OK;
        } catch (e) {
            throw e;
        }
    }

    filesys_delete_dir = function(filename) {
        try {
            // First, navigate to the directory
            var path = filename.split('/');
            // Inflate file system
            var root = JSON.parse(kernel_mem_get(0));
            var directory = root;
            var directoryAddr = 0;
            for (var i = 0; i < path.length - 1; i++) {
                // Traverse file system
                directory = root[path[i]];
                directoryAddr = root[path[i]][FTABLE_COLUMN_ADDRESS];
            }
            var fn = path[path.length - 1];
            // Verify is empty
            if (directory[fn][FTABLE_COLUMN_CHILDREN] > 1) {
                throw FILESYS_ERROR_NONEMPTY_DIR;
            }
            // TODO Update our directory children count.
            update_capacity(0, -1);
            mem_free(directory[fn][FTABLE_COLUMN_ADDRESS], 1);
            delete directory[fn];
            kernel_mem_set(directoryAddr, JSON.stringify(directory));
            return FILESYS_OP_OK;
        } catch (e) {
            throw e;
        }
    }

    filesys_create = function(filename, chmod) {
        try {
            var vector = filesys_access_file(filename);
            var directory = vector[0];
            var directoryAddr = vector[1];
            var fn = vector[2];

            directory[fn] = {};
            // Allocate file memory
            // FIXME All files are 1 byte.
            var addr = kernel_mem_request(1);
            directory[fn][FTABLE_COLUMN_ADDRESS] = addr;
            directory[fn][FTABLE_COLUMN_ACCESS] = chmod;
            directory[fn][FTABLE_COLUMN_CHILDREN] = 0; // Because it's a file.
            // Save our directory back in its address.
            // TODO Update our directory children count.
            update_capacity(0, 1);
            kernel_mem_set(directoryAddr, JSON.stringify(directory));
        } catch (e) {
            throw e;
        }
    }

    // Returns a vector of items related to accessing a file.
    function filesys_access_file(path) {
        // First, navigate to the directory
        var path = filename.split('/');
        // Inflate file system
        var root = JSON.parse(kernel_mem_get(0));
        var directory = root;
        var directoryAddr = 0;
        for (var i = 0; i < path.length - 1; i++) {
            // Traverse file system
            if (!root[path[i]]) {
                throw FILESYS_ERROR_FILE_NOT_FOUND;
            }
            directory = root[path[i]];
            directoryAddr = root[path[i]][FTABLE_COLUMN_ADDRESS];
        }
        if (!directory[path[path.length - 1]]) {
            throw FILESYS_ERROR_FILE_NOT_FOUND;
        }
        if (directory[path[path.length - 1]][FTABLE_COLUMN_CHILDREN]) {
            throw FILESYS_ERROR_ISNT_FILE;
        }
        var fn = path[path.length - 1];
        return [directory, directoryAddr, fn];
    }

    // Call this to initialize the file system.
    function filesys_install() {
        // Create our file table and save it.
        kernel_mem_set(0, JSON.stringify({}));
    }

    function update_capacity(index, delta) {
        const FILENAME = '/.capacity';
        filesys_open(FILENAME);
        var capacity = JSON.parse(filesys_read(FILENAME));
        capacity[index] += delta;
        filesys_write(FILENAME, JSON.stringify(capacity));
        filesys_close(FILENAME);
    }

    // Shows details in the file explorer tab
    function update_ui() {
    }

    nvmem_request = function(bytes) {
        update_capacity(1, bytes);
        // TODO Update bitmap file

        // Request memory
        var addr = kernel_mem_request(bytes);
        // Get process name
        var path = process_table[process_get_current()][PTABLE_COLUMN_APPLICATION_PATH];
        // Open our `.data` file for the process and save these two parameters to recall later.
        const FILENAME = path + '.data';
        if (!filesys_exists(FILENAME)) {
            filesys_create(FILENAME, 777);
        }
        // FIXME Try to increase memory allocation in-place if possible
        if (process_table[process_get_current()][PTABLE_COLUMN_BASE_REGISTER]) {
            mem_cpy(process_table[process_get_current()][PTABLE_COLUMN_BASE_REGISTER], addr, process_table[process_get_current()][PTABLE_COLUMN_LIMIT_REGISTER]);
        }
        try {
            var vector = filesys_access_file(FILENAME);
            var directory = vector[0];
            var directoryAddr = vector[1];
            var fn = vector[2];

            process_table[process_get_current()][PTABLE_COLUMN_BASE_NVREGISTER] = addr;
            process_table[process_get_current()][PTABLE_COLUMN_LIMIT_NVREGISTER] = bytes;
            kernel_filesys_open(FILENAME);
            kernel_filesys_write(FILENAME, addr + ',' + bytes);
            kernel_filesys_close(FILENAME);
            return bytes;
        } catch (e) {
            throw e;
        }
    }

    nvmem_read = function(addr) {
        if (addr > process_table[process_get_current()][PTABLE_COLUMN_LIMIT_NVREGISTER]) {
            throw MEM_ERROR_BOUNDS;
        }
        // Translate to kernel address
        var kaddr = process_table[process_get_current()][PTABLE_COLUMN_BASE_NVREGISTER] + addr;
        memory_map_ui('toread', kaddr);

        var result = kernel_mem_get(kaddr);
        memory_map_ui('didread', kaddr);
        return result;
    }

    nvmem_read_parent = function(addr) {
        var parent_pid = process_table[process_get_current()][PTABLE_COLUMN_PARENT];
        if (!parent_pid) {
            throw MEM_ERROR_ORPHAN;
        }
        if (addr > process_table[parent_pid][PTABLE_COLUMN_LIMIT_NVREGISTER]) {
            throw MEM_ERROR_BOUNDS;
        }
        // Translate to kernel address
        var kaddr = process_table[parent_pid][PTABLE_COLUMN_BASE_NVREGISTER] + addr;
        memory_map_ui('toread', kaddr);

        var result = kernel_mem_get(kaddr);
        memory_map_ui('didread', kaddr);
        return result;
    }

    nvmem_set = function(addr, val) {
        if (addr > process_table[process_get_current()][PTABLE_COLUMN_LIMIT_NVREGISTER]) {
            throw MEM_ERROR_BOUNDS;
        }
        // Translate to kernel address
        var kaddr = process_table[process_get_current()][PTABLE_COLUMN_BASE_NVREGISTER] + addr;
        memory_map_ui('towrite', kaddr);
        kernel_mem_set(kaddr, val);

        update_ui();
        memory_map_ui('didwrite', kaddr);
        return MEM_WRITE_OK;
    }

    nvmem_set_parent = function(addr, val) {
        var parent_pid = process_table[process_get_current()][PTABLE_COLUMN_PARENT];
        if (!parent_pid) {
            throw MEM_ERROR_ORPHAN;
        }
        if (addr > process_table[parent_pid][PTABLE_COLUMN_LIMIT_NVREGISTER]) {
            throw MEM_ERROR_BOUNDS;
        }
        // Translate to kernel address
        var kaddr = process_table[parent_pid][PTABLE_COLUMN_BASE_NVREGISTER] + addr;
        memory_map_ui('towrite', kaddr);
        kernel_mem_set(kaddr, val);

        update_ui();
        memory_map_ui('didwrite', kaddr);
        return MEM_WRITE_OK;
    }

    nvmem_free = function(addr, len) {
         var prevLength = process_table[process_get_current()][PTABLE_COLUMN_LIMIT_NVREGISTER];
        // Reallocate memory in process table
        // TODO Update bitmap file
        if (addr < 0 || addr + len > prevLength) {
            throw MEM_ERROR_BOUNDS;
        }
        // We need to make sure a proper chunk of memory is freed to avoid splitting process memory.
        if (addr == 0) {
            // Crop length
            process_table[process_get_current()][PTABLE_COLUMN_BASE_NVREGISTER] = len;
        } else {
            process_table[process_get_current()][PTABLE_COLUMN_LIMIT_NVREGISTER] = addr;
        }

        // Update capacity
        update_capacity(1, -len);
        addr = process_table[process_get_current()][PTABLE_COLUMN_BASE_NVREGISTER];
        len  = process_table[process_get_current()][PTABLE_COLUMN_LIMIT_NVREGISTER];
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
})();
