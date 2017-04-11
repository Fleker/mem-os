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
     var init_process = new Promise(function(fulfill, reject) {
        // Schedule idle task
        var process_table = [];
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

         process_add("System Idle Process", idle, 'process_table');
         setTimeout(task_scheduler, PROCESS_TIMING_QUANTUM);
         fulfill();
    });

    var init_dream_journal = new Promise(function(fulfill, reject) {
        fulfill();
    })

    boot_state("Loading...");
    init_process.then(function() {
        boot_state("Restarting tasks...");
        init_dream_journal.then(function() {
            setTimeout(function() {
                $('#splashscreen').style.display = 'none';
            }, 2000);
        });
    });
})();
