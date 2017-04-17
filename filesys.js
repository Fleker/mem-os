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
    var kernel_mem_get = null;
    var kernel_mem_set = null;
    var kernel_mem_exist = null;
    var kernel_mem_request = null;
    var is_filesys_init = false;
    var current_directory = "/";
    filesys_init = function(kmg, kms, kme, kmr) {
        if (!is_filesys_init) {
            kernel_mem_get = kmg;
            kernel_mem_set = kms;
            kernel_mem_exist = kme;
            kernel_mem_request = kmr;
            // Inflate file system into browser memory
            filesys_table = JSON.parse(kernel_mem_get(0));
            if (!filesys_table[FTABLE_COLUMN_PATH]) {
                filesys_install();
            }
            // TODO Check whether certain files exist. If not, create them.
            if (!filesys_exists('/.config')) {
                filesys_create('/.config', 777);
                 // Create .config
                kernel_filesys_open('/.config')
                var config = "# This file allows different system configurations to be changed";
                addr = kernel_mem_request(1); // Request a byte
                filesys_table['']

            }
            is_filesys_init = true;
        }
    }

    // Opens up a file with respect to the kernel, so locking it with a special path that doesn't resolve.
    function kernel_filesys_open(filename) {
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
        if (directory[path[path.length - 1]]) {
            throw FILESYS_ERROR_FILE_ALREADY_EXISTS;
        }
        var fn = path[path.length - 1];

        if (!directory[fn]) {
            throw FILESYS_ERROR_FILE_NOT_FOUND;
        }
        if (directory[fn][FTABLE_COLUMN_CHILDREN]) {
            throw FILESYS_ERROR_ISNT_FILE;
        }
        // Add lock
        directory[fn][FTABLE_COLUMN_LOCK] = '/.kernel';
        return FILESYS_OP_OK;
    }

    filesys_exists = function(filename) {
        var path = filename.split('/');
        // Inflate file system
        var root = JSON.parse(kernel_mem_get(0));
        var directory = root;
        for (var i = 0; i < path.length - 1; i++) {
            // Traverse file system
            if (!root[path[i]]) {
                return false;
            }
            directory = root[path[i]];
        }
        if (!directory[path[path.length - 1]]) {
            return false;
        }
        if (directory[path[path.length - 1]][FTABLE_COLUMN_CHILDREN]) {
            return false;
        }
        return true;
    }

    filesys_create = function(filename, chmod) {
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
        if (directory[path[path.length - 1]]) {
            throw FILESYS_ERROR_FILE_ALREADY_EXISTS;
        }
        var fn = path[path.length - 1];

        directory[fn] = {};
        // Allocate file memory
        // FIXME All files are 1 byte.
        var addr = kernel_mem_request(1);
        directory[fn][FTABLE_COLUMN_ADDRESS] = addr;
        directory[fn][FTABLE_COLUMN_ACCESS] = chmod;
        directory[fn][FTABLE_COLUMN_CHILDREN] = 0; // Because it's a file.
        // Save our directory back in its address.
        kernel_mem_set(directoryAddr, JSON.stringify(directory));
    }

    // Call this to initialize the file system.
    function filesys_install() {
        // Create our file table
        filesys_table = {};

        // Create .inode.bitmap
        filesys_table['.inode.bitmap'] = {};
        filesys_table['.inode.bitmap'][FTABLE_COLUMN_ACCESS] = 700;
        filesys_table['.inode.bitmap'][FTABLE_COLUMN_ADDRESS] = 2;
        filesys_table['.inode.bitmap'][FTABLE_COLUMN_CHILDREN] = 0;
        bitmap_init(3); // We only have three things in our filesystem.
        // Other times, we use a file which stores the filesystem size
        kernel_mem_set(0, JSON.stringify(filesys_table));
        kernel_mem_set(1, config);
        kernel_mem_set(2, 3); // Filesystem size
    }

    // Shows details in the file explorer tab
    function update_ui() {
    }
})();
