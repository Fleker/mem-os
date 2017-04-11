const PROCESS_STATE_WAITING = 1;
const PROCESS_STATE_READY = 2;
const PROCESS_STATE_ACTIVE = 3;

const PROCESS_TIMING_QUANTUM = 1000; // Milliseconds
const PROCESS_MAX = 1000; // For over this number of processes, the system cannot generate a uniuqe id

// Define function headers

// Inits the process system
process_init = null;
// Allows a process to be created and added to the task scheduler.
process_add = null;
// Runs a process once
process_exec = null;

(function() {
    const PTABLE_COLUMN_PID = "pid";
    const PTABLE_COLUMN_NAME = "name";
    const PTABLE_COLUMN_FNC = "function";
    const PTABLE_COLUMN_STATE = "state";
    const PTABLE_COLUMN_BASE_REGISTER = "base_reg";
    const PTABLE_COLUMN_LIMIT_REGISTER = "lim_reg";

    var is_process_init = false;

    var process_table = undefined;

    process_init = function(table) {
        if (!is_process_init) {
            process_table = table;
            is_process_init = true; // Only allows process init to occur first time
        }
    }

    process_add = function(name, process) {
        // Generate process
        var p = {};
        p[PTABLE_COLUMN_NAME] = name;
        p[PTABLE_COLUMN_FNC] = process;
        // Default
        p[PTABLE_COLUMN_PID] = process_generate_id();
        p[PTABLE_COLUMN_STATE] = PROCESS_STATE_READY;
        process_table[p[PTABLE_COLUMN_PID]] = p;
    }

    process_exec = function(process) {
        // Set state to active
        process[PTABLE_COLUMN_STATE] = PROCESS_STATE_ACTIVE;
        process[PTABLE_COLUMN_FNC]();
        // Put back into waiting
        process[PTABLE_COLUMN_STATE] = PROCESS_STATE_READY;
    }

    function process_generate_id() {
        var pid = -1;
        while (pid == -1 || process_table[pid] != undefined) {
            pid = Math.round((Math.random() * PROCESS_MAX));
            console.log(pid);
        }
        return pid;
    }
})();
