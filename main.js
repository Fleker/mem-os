// Kernel

function boot_state(txt) {
    console.log(txt);
    $('#boot_status').innerHTML = txt;
}

function delay(ms) {
    var time = new Date().getTime();
    while (new Date().getTime() - time < ms) {}
}

// Label for the OS version
const VERSION_NAME = "0.0.1";
// Numerical build number for OS version
const VERSION_CODE = 1;

(function() {
    var process_table = [];
    var kernel_mem_request = null;
    const init_process = new Promise(function(fulfill, reject) {
        // Schedule idle task
        // As JS passes by reference, we can create the ptable here and pass it into the process manager
        process_init(process_table);
        function task_scheduler() {
            // Iterate through every process and execute it.
            // Simple round robin implementation. No priority.
            for (i in process_table) {
                // TODO Handle Process Waiting State
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

        kernel_mem_request = mem_init(kernel_mem_exist, kernel_mem_get, kernel_mem_set, process_table);

        // Init file system
        filesys_init(kernel_mem_get, kernel_mem_set, kernel_mem_exist, kernel_mem_request, process_table);

        // Free volatile memory


        // TODO Inflate `/.config`
        // TODO Set system configuration parameters

        fulfill();
    });

    const init_dream_journal = new Promise(function(fulfill, reject) {
        // TODO Complete system tasks where needed.
        journal_init(process_table);
        fulfill();
    })

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
            return "Usage : kill [pid]<br>pid - Process id. Can be obtained by running `processes`.";
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

    const kernel_mem_exist = function(addr) {
        // TODO Verify address
        return mem_get(addr) != undefined;
    }

    const kernel_mem_get = function(addr) {
        // TODO Verify address
        return localStorage['memos_memory_' + addr];
    }

    const kernel_mem_set = function(addr, val) {
        // TODO Verify address
        localStorage['memos_memory_' + addr] = val;
    }

    boot_state("Loading...");

    cli_register("shutdown", cmd_shutdown);
    cli_register("processes", cmd_process);
    cli_register("help", cmd_help);
    cli_register("memtest", cmd_mem_test);
    cli_register("kill", cmd_kill);
    cli_register("clear", cmd_clear);
    cli_register("about", cmd_about);

    // TODO Reload files and configure bitmap
    // TODO Delete volatile memory
    // TODO If never loaded, install everything

    boot_state("Remembering...");

    init_process.then(function() {
        boot_state("Restarting tasks...");
        init_dream_journal.then(function() {
            setTimeout(function() {
                $('#splashscreen').style.display = 'none';
                show_tab(0); // Show terminal
                $('#entry').focus();
            }, 2000);
        });
    });
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
