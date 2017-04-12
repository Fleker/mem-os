// Kernel

function boot_state(txt) {
    console.log(txt);
    $('#boot_status').innerHTML = txt;
}

function delay(ms) {
    var time = new Date().getTime();
    while (new Date().getTime() - time < ms) {}
}

(function() {
    var process_table = [];
    const init_process = new Promise(function(fulfill, reject) {
        // Schedule idle task
        // As JS passes by reference, we can create the ptable here and pass it into the process manager
        process_init(process_table);
        function task_scheduler() {
            // Iterate through every process and execute it.
            // Simple round robin implementation. No priority.
            for (i in process_table) {
                var p = process_table[i];
                process_exec(p);
            }
            // Now set up another system call in a second - This is the null process
            setTimeout(task_scheduler, PROCESS_TIMING_QUANTUM);
        }

         function idle() {
             // Don't do anything
         }

         process_add("System Idle Process", idle);
         setTimeout(task_scheduler, PROCESS_TIMING_QUANTUM);
         fulfill();
    });

    const init_dream_journal = new Promise(function(fulfill, reject) {
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

    const mem_exist = function(addr) {
        // TODO Verify address
        return mem_get(addr) != undefined;
    }

    const mem_get = function(addr) {
        // TODO Verify address
        return localStorage['memos_memory_' + addr];
    }

    const mem_set = function(addr, val) {
        // TODO Verify address
        localStorage['memos_memory_' + addr] = val;
    }

    boot_state("Loading...");

    cli_register("shutdown", cmd_shutdown);
    cli_register("processes", cmd_process);
    cli_register("help", cmd_help);

    boot_state("Remembering...");

    mem_init(mem_exist, mem_get, mem_set, process_table);
    // TODO Load config parameters.
    // TODO Pass in the offset which is from the file system.
    // Right now no bytes are used for the file system.
    bitmap_init(0, 1024); // 1024 8-bit values

    init_process.then(function() {
        boot_state("Restarting tasks...");
        init_dream_journal.then(function() {
            setTimeout(function() {
                $('#splashscreen').style.display = 'none';
                $('#entry').focus();
            }, 2000);
        });
    });
})();

/* Node Class */
function Node(val) {
    this.value = val;
    this.prev  = null;
    this.next  = null;
}
