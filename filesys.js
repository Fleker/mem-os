/*
 * Note: In our high-level, poorly implemented file system, each file is
 *   only going to be in a single address regardless of actual data size.
 * As files are accessible by any process (in most cases), we lock them
 *   to prevent multiple processes writing at one time. (They can read).
 */
// Inits file system.
var filesys_init = null;
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
                var config = "# This file allows different system configurations to be changed";
                kernel_filesys_write(FILE_CONFIG, config);
                filesys_close(FILE_CONFIG);
            } else {
                // TODO Read data
            }

            const FILE_BITMAP = '/.bitmap';
            if (!filesys_exists(FILE_BITMAP)) {
                // Create .bitmap
                filesys_create(FILE_BITMAP, 777);
                // TODO Load config parameters.
                // TODO Pass in the offset which is from the file system.
                var bitmap = bitmap_init(1, 1024); // 1024 8-bit values
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
            } else {
                // Open and free
                // TODO Implement
                mem_free_volatile(filesys_read('/.volatile'));
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
            // TODO Update file size.
            // TODO parent children count.
            kernel_mem_set(directoryAddr, JSON.stringify(directory));
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

            // TODO Dream journal entries.
            // TODO handle necessary deletions in the system idle task.
             // TODO Update our directory children count.
            // TODO Update our filesystem's storage count.
            mem_free(directory[fn][FTABLE_COLUMN_ADDRESS], 1);
            delete directory[fn];
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
            // TODO Update our filesystem's storage count.
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
            // TODO Update our filesystem's storage count.
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

    // Shows details in the file explorer tab
    function update_ui() {
    }
})();
