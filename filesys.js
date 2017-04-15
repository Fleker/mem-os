/*
 * Note: In our high-level, poorly implemented file system, each file is
 *   only going to be in a single address regardless of actual data size.
 */
// Inits file system.
var filesys_init = null;
// Creates a file.
var filesys_create = null;
// Opens a file and locks it.
var filesys_open = null;
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

/* The file system also supports non-volatile RAM or nv memory */
// Requests a total number of bytes of memory for the process.
var nvmem_request = null;
// Reads an address in memory.
var nvmem_read = null;
// Reads an address in memory of a parent process.
var nvmem_read_parent = null;
// Sets an address in memory.
var nvmem_set = null;
// Sets a memory address of a parent process.
var nvmem_set_parent = null;
// Frees a certain amount of memory from a process.
var nvmem_free = null;

// Path to access the file, including filename (can pull out of path)
FTABLE_COLUMN_PATH = "path";
// ie. 1777 - chmod but left-most bit has lock or not
FTABLE_COLUMN_ACCESS = "access";
// File metadata, whatever makes sense for the file
FTABLE_COLUMN_METADATA = "metadata"; // Cheating, is a JSON
// If it has children, shows children. If not, it is a file.
FTABLE_COLUMN_CHILDREN = "children";

(function() {
    var filesys_table = [];
    var is_filesys_init = false;
    filesys_init = function(table) {
        if (!is_filesys_init) {
            filesys_table = table;
            // Inflate file system into browser memory
            // Check whether certain files exist. If not, create them.
            is_filesys_init = true;
        }
    }

    // Shows details in the file explorer tab
    function update_ui() {
    }
})();
