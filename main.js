// Kernel

function boot_state(txt) {
    console.log(txt);
    $('#boot_status').innerHTML = txt;
}

function delay(ms) {
    var time = new Date().getTime();
    while (new Date().getTime() - time < ms) {}
}

// Gets the hardware read duration in nanoseconds.
var config_get_read_ns = null;
// Gets the hardware write duration in nanoseconds.
var config_get_write_ns = null;
// Gets the hardware energy used per byte read and write.
var config_get_energy = null;
// Gets the hardware system capacity.
var config_get_capacity = null;
// Gets the hardware clock frequency in GHz.
var config_get_clock = null;

// Label for the OS version
const VERSION_NAME = "0.1.0";
// Numerical build number for OS version
const VERSION_CODE = 2;

(function() {
    var process_table = [];
    // TODO Move all kernel-level functions to this file and pass them in to function inits
    var kernel_mem_request = null;
    var kernel_mem_free = null;
    var kernel_journal_pop_entry = null;
    var config = {};

//    const init_process = new Promise(function(fulfill, reject) {
    const init_process = function() {
        // Schedule idle task
        // As JS passes by reference, we can create the ptable here and pass it into the process manager
        process_init(process_table);
        function task_scheduler() {
            // Iterate through every process and execute it.
            // Simple round robin implementation. No priority.
            for (i in process_table) {
                // TODO Handle Process Waiting State with semaphores
                var p = process_table[i];
                process_exec(p);
            }
            // Now set up another system call in a second - This is the null process
            setTimeout(task_scheduler, PROCESS_TIMING_QUANTUM);
        }

        function idle() {
            // Don't do anything
        }

        process_create("System Idle Process", idle);
        setTimeout(task_scheduler, PROCESS_TIMING_QUANTUM);

        var mem_vector = mem_init(kernel_mem_exists, kernel_mem_get, kernel_mem_set, process_table, kernel_filesys_open, kernel_filesys_write, kernel_filesys_close, kernel_filesys_read);
        kernel_mem_request = mem_vector[0];
        kernel_mem_free = mem_vector[1];

        // Init file system
        filesys_init(kernel_mem_get, kernel_mem_set, kernel_mem_exists, kernel_mem_request, process_table, kernel_filesys_open, kernel_filesys_access_file, kernel_filesys_close, kernel_filesys_write, kernel_filesys_read);

        // Free volatile memory
        var volatile_memory = JSON.parse(kernel_filesys_read('/.volatile'));
        for (i in volatile_memory) {
            var vm = volatile_memory[i];
            // Expecting a series of 2-col tables giving the mem address and bytes
            // Do kernel mem free function
            kernel_mem_free(vm[0], vm[1]);
        }
        // Now we can reset that file entirely
        const FILENAME = '/.volatile';
        kernel_filesys_open(FILENAME);
        kernel_filesys_write(FILENAME, JSON.stringify([]));
        kernel_filesys_close(FILENAME);

        // Inflate `/.config` and set system configuration parameters
        var configuration = JSON.parse(kernel_filesys_read('/.config'));
        if (configuration['read_ns']) {
            config['read_ns'] = configuration['read_ns'] || 1;
        }
        if (configuration['write_ns']) {
            config['write_ns'] = configuration['write_ns'] || 1;
        }
        if (configuration['energy']) {
            config['energy'] = configuration['energy'] || 1;
        }
        if (configuration['capacity']) {
            config['capacity'] = configuration['capacity'] || 1;
        }
        if (configuration['clock']) {
            config['clock'] = configuration['clock'] || 3;
        }
//        fulfill();
//    });
    }

//    const init_dream_journal = new Promise(function(fulfill, reject) {
    const init_dream_journal = function() {
        // TODO Complete system tasks where needed.
        var vector = journal_init(process_table, kernel_filesys_open, kernel_filesys_write, kernel_filesys_close, kernel_filesys_read);
        kernel_journal_pop_entry = vector[1];
        filesys_journal_init(vector[0], vector[1]);

        try {
            var remaining_tasks = kernel_journal_pop_entry();
            while (remaining_tasks) {
                // Split up our message to parse.
                var task = remaining_tasks.split(',');
                if (task[0] == "Update") {
                    var delta = task[1];
                    var FILENAME = '/.capacity';
                    filesys_open(FILENAME);
                    var capacity = JSON.parse(filesys_read(FILENAME));
                    capacity[index] += delta;
                    filesys_write(FILENAME, JSON.stringify(capacity));
                    filesys_close(FILENAME);
                } else if (task[0] == "Free") {
                    var addr = task[1];
                    kernel_mem_free(addr, 1);
                } else if (task[0] == "Delete") {
                    var directoryAddr = task[1];
                    var fn = task[2];
                    // Inflate directory
                    var directory = JSON.parse(kernel_mem_get(directoryAddr));
                    delete directory[fn];
                    // Now save
                    kernel_mem_set(directoryAddr, JSON.stringify(directory));
                }

                remaining_tasks = kernel_journal_pop_entry();
            }
        } catch(e) {
            console.info("There are no tasks to resume");
        }

//        fulfill();
//    });
    }

    config_get_read_ns = function() {
        return config['read_ns'];
    }

    config_get_write_ns = function() {
        return config['write_ns'];
    }

    config_get_energy = function() {
        return config['energy'];
    }

    config_get_capacity = function() {
        return config['capacity'];
    }

    config_get_clock = function() {
        return config['clock'];
    }

    const cmd_shutdown = function(args) {
        if (args[1] == "-r") {
            window.location.reload();
            return "Rebooting...";
        } else if (args[1] == "-s") {
            // Can't close window itself, redirect to help
            window.location.href = "README.md";
            return;
        } else {
            return "-r : Reboot<br>-s : Shutdown";
        }
    }

    const cmd_process = function(args) {
        return $('#tab_1').innerHTML;
    }

    const cmd_help = function(args) {
        var out = "Available Commands:<br>";
        var keys = Object.keys(cli_commands).sort();
        for (i in keys) {
            out += "&nbsp;" + keys[i] + "<br>";
        }
        return out;
    }

    // Runs a memory test process
    const cmd_mem_test = function(args) {
        var addr = mem_request(12);
        var out = "Received bytes: " + addr + "<br>";
        out += mem_read(0) + " --<br>";
        mem_set(0, 20);
        mem_set(1, 41);
        out += mem_read(0) + " --<br>";
        out += mem_read(1) + " --<br>";
        return out;
    }

    // Allows a process to be force stopped
    const cmd_kill = function(args) {
        if (args.length > 1) {
            try {
                var pid = parseInt(args[1]);
                if (pid == 0) {
                    return "Cannot end system process";
                }
                process_remove(pid);
                return "Process killed";
            } catch (e) {
                return e.message;
            }
        } else {
            return "Usage : kill [pid]<br>pid - Process id. Can be obtained by executing `processes`.";
        }
    }

    // Clears the history
    const cmd_clear = function(args) {
        $('#history').innerHTML = "";
        return "";
    }

    const cmd_about = function(args) {
        return "~MemOS~<br>An OS emulator for resistive-based memory<br>Find out more in our project write-up.<br>version " + VERSION_NAME + "  (" + VERSION_CODE + ")";
    }

    const cmd_read = function(args) {
        // TODO Handle . and ..
        return filesys_read(args[1]);
    }

    const cmd_ls = function(args) {
        // TODO implement
    }

    const cmd_rm = function(args) {
        // Handle factory reset
        // TODO implement
    }

    const cmd_edit = function(args) {
        // TODO implement
    }

    /*
     * Here are all of our Kernel Functions. These are passed into other components for sandbox purposes.
     *
     * Our Kernel Memory Functions
     */
    const kernel_mem_exists = function(addr) {
        if (addr < 0 || addr >= config_get_capacity()) {
            throw MEM_ERROR_KERNEL_BOUNDS;
        }
        return mem_get(addr) != undefined;
    }

    const kernel_mem_get = function(addr) {
        if (addr < 0 || addr >= config_get_capacity()) {
            throw MEM_ERROR_KERNEL_BOUNDS;
        }
        return localStorage['memos_memory_' + addr];
    }

    const kernel_mem_set = function(addr, val) {
        if (addr < 0 || addr >= config_get_capacity()) {
            throw MEM_ERROR_KERNEL_BOUNDS;
        }
        localStorage['memos_memory_' + addr] = val;
    }

    /*
     * Our Kernel File System Functions
     */
    // Traverses file structure and returns vector of relevant data
    const kernel_filesys_access_file = function(filename, dothrow) {
        if (typeof dothrow == "undefined") {
            // Default to throwing errors
            dothrow = true;
        }
        // First, navigate to the directory
        var path = filename.split('/');
        // Inflate file system
        var root = JSON.parse(kernel_mem_get(0));
        var directory = root;
        var directoryAddr = 0;
        for (var i = 1; i < path.length - 1; i++) {
            // Traverse file system
            if (dothrow && !root[path[i]]) {
                throw FILESYS_ERROR_FILE_NOT_FOUND;
            }
            directory = root[path[i]];
            directoryAddr = root[path[i]][FTABLE_COLUMN_ADDRESS];
        }
        if (dothrow && !directory[path[path.length - 1]]) {
            throw FILESYS_ERROR_FILE_NOT_FOUND;
        }
        if (dothrow && directory[path[path.length - 1]][FTABLE_COLUMN_CHILDREN]) {
            throw FILESYS_ERROR_ISNT_FILE;
        }
        var fn = path[path.length - 1];
        return [directory, directoryAddr, fn];
    }
    // Opens up a file with respect to the kernel, so locking it with a special path that doesn't resolve.
    const kernel_filesys_open = function(filename, process_path) {
        process_path = process_path || "/.kernel";
        try {
            var vector = kernel_filesys_access_file(filename);
            var directory = vector[0];
            var directoryAddr = vector[1];
            var fn = vector[2];

            if (directory[fn][FTABLE_COLUMN_LOCK] && directory[fn][FTABLE_COLUMN_LOCK] != process_path) {
                throw FILESYS_ERROR_WRITE_LOCK;
            }

            directory[fn][FTABLE_COLUMN_LOCK] = process_path;

            kernel_mem_set(directoryAddr, JSON.stringify(directory));
        } catch (e) {
            throw e;
        }
    }
    // Opens up a file with respect to the kernel, so locking it with a special path that doesn't resolve.
    const kernel_filesys_read = function(filename, process_path) {
        process_path = process_path || "/.kernel";
        try {
            var vector = kernel_filesys_access_file(filename);
            var directory = vector[0];
            var directoryAddr = vector[1];
            var fn = vector[2];

            return kernel_mem_get(directory[fn][FTABLE_COLUMN_ADDRESS]);
        } catch (e) {
            throw e;
        }
    }
    // Writes data to a certain memory address corresponding to a file.
    const kernel_filesys_write = function(filename, data, process_path) {
        try {
            var vector = kernel_filesys_access_file(filename);
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
    // Closes file with respect to the kernel
    const kernel_filesys_close = function(filename, process_path) {
        try {
            var vector = kernel_filesys_access_file(filename);
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
            kernel_mem_set(directoryAddr, JSON.stringify(directory));
            return FILESYS_OP_OK;
         } catch (e) {
             throw e;
         }
    }

    boot_state("Loading...");

    cli_register("shutdown", cmd_shutdown);
    cli_register("processes", cmd_process);
    cli_register("help", cmd_help);
    cli_register("questions", cmd_help);
    cli_register("questions?", cmd_help);
    cli_register("memtest", cmd_mem_test);
    cli_register("kill", cmd_kill);
    cli_register("clear", cmd_clear);
    cli_register("about", cmd_about);
    cli_register("read", cmd_read);

    boot_state("Remembering...");

//    init_process.then(function() {
    init_process();
        boot_state("Restarting tasks...");
//        init_dream_journal.then(function() {
    init_dream_journal();
            setTimeout(function() {
                $('#splashscreen').style.display = 'none';
                show_tab(0); // Show terminal
                $('#entry').focus();
            }, 2000);
//        });
//    });
})();

/* Node Class */
function Node(val) {
    if (val instanceof Node) {
        val = val.value;
    }
    this.value = val;
    this.prev  = null;
    this.next  = null;
}
