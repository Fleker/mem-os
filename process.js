const PROCESS_STATE_WAITING = 1;
const PROCESS_STATE_READY = 2;
const PROCESS_STATE_ACTIVE = 3;

const PROCESS_TIMING_QUANTUM = 1000; // Milliseconds
const PROCESS_MAX = 1000; // For over this number of processes, the system cannot generate a uniuqe id

// Define function headers

// Inits the process system
process_init = null;
// Allows a process to be created and added to the task scheduler.
process_create = null;
// Allows a process to create a child process which can access this process's memory
process_create_child = null;
// Runs a process once
process_exec = null;
// Removes a process from the process table.
process_remove = null;
// Obtains the current process from the process table. As this will only be read by the currently running function, it shouldn't pose any security issues.
process_get_current = null;
// Removes the current process from the process table.
// You can use this to run a process once and remove it at the end.
process_remove_self = null;

// Process ID
const PTABLE_COLUMN_PID = "pid";
// Process label
const PTABLE_COLUMN_NAME = "name";
// If it has a parent, the PID of that parent process
const PTABLE_COLUMN_PARENT = "parent";
// A JS function (pointer to executable code)
const PTABLE_COLUMN_FNC = "function";
// The current process state
const PTABLE_COLUMN_STATE = "state";
// Memory address where the process can begin using
const PTABLE_COLUMN_BASE_REGISTER = "base_reg";
// Length of memory that the process can use
const PTABLE_COLUMN_LIMIT_REGISTER = "limit_reg";
// Memory address where the process can store non-volatile data in "app space"
const PTABLE_COLUMN_BASE_NVREGISTER = "base_nvreg";
// Length of memory in the process's "app space"
const PTABLE_COLUMN_LIMIT_NVREGISTER = "limit_nvreg";
// File system location which is used to read/write "app space" data
const PTABLE_COLUMN_APPLICATION_PATH = "path";
// The time in which the process was created
const PTABLE_COLUMN_TIME_EXEC = "time";
// Any arguments supplied to the process when it is created
const PTABLE_COLUMN_PROCESS_ARGS = "args";

(function() {

    var is_process_init = false;

    var process_table = undefined;
    var current_process = undefined;

    process_init = function(table) {
        if (!is_process_init) {
            process_table = table;
            is_process_init = true; // Only allows process init to occur first time
        }
    }

    process_create = function(name, process, params) {
        // Generate process
        var p = {};
        p[PTABLE_COLUMN_NAME] = name;
        p[PTABLE_COLUMN_FNC] = process;
        // Default
        p[PTABLE_COLUMN_PID] = process_generate_id();
        p[PTABLE_COLUMN_TIME_EXEC] = new Date().getTime();
        p[PTABLE_COLUMN_STATE] = PROCESS_STATE_READY;
        if (params) {
            p[PTABLE_COLUMN_PROCESS_ARGS] = params;
        }
        process_table[p[PTABLE_COLUMN_PID]] = p;

        update_ui();
    }

    process_create_child = function(name, process, params) {
        // Generate process
        var p = {};
        p[PTABLE_COLUMN_NAME] = name;
        p[PTABLE_COLUMN_FNC] = process;
        // Default
        p[PTABLE_COLUMN_PID] = process_generate_id();
        p[PTABLE_COLUMN_TIME_EXEC] = new Date().getTime();
        p[PTABLE_COLUMN_STATE] = PROCESS_STATE_READY;
        if (params) {
            p[PTABLE_COLUMN_PROCESS_ARGS] = params;
        }
        process_table[p[PTABLE_COLUMN_PID]] = p;
        // Set the parent id
        process_table[p[PTABLE_COLUMN_PARENT]] = process_get_current();

        update_ui();
    }

    process_exec = function(process) {
        // Set state to active
        process[PTABLE_COLUMN_STATE] = PROCESS_STATE_ACTIVE;
        // System Invariant - Only the current process is running.
        // This wouldn't really work in multi-core systems. Each core would need to be assigned a current process.
        current_process = process[PTABLE_COLUMN_PID];
        // Run with args
        process[PTABLE_COLUMN_FNC](process[PTABLE_COLUMN_PROCESS_ARGS]);
        // Put back into waiting
        process[PTABLE_COLUMN_STATE] = PROCESS_STATE_READY;
    }

    process_remove = function(pid) {
        if (pid == 0) {
            // Cannot end system task
            return;
        }
        // Automatic memory cleanup
        mem_free(process_table[pid][PTABLE_COLUMN_BASE_REGISTER], process_table[pid][PTABLE_COLUMN_LIMIT_REGISTER]);
        // By removing it from the process table we will not call it anymore
        delete process_table[pid];

        update_ui();
    }

    process_remove_self = function() {
        // Remove current process.
        process_remove(current_process);
    }

    process_get_current = function() {
        return current_process;
    }

    function process_generate_id() {
        var pid = -1;
        if (process_table.length == 0) {
            // Put in system idle task id
            return 0;
        }
        while (pid == -1 || process_table[pid] != undefined) {
            pid = Math.round((Math.random() * PROCESS_MAX));
            console.log(pid);
        }
        return pid;
    }

    function update_ui() {
        // Update PROCESS tab
        var out = "<table><thead><tr><td>PID</td><td>Name</td><td>State</td><td>Base Register</td><td>Limit Register</td><td>NV Base Register</td><td>NV Limit Register</td><td>Time Created</td><td>Parent PID</td><td>Path</td></tr></thead><tbody>";
        for (i in process_table) {
            var p = process_table[i];
            out += "<tr><td>" + p[PTABLE_COLUMN_PID] + "</td><td>" + p[PTABLE_COLUMN_NAME] + "</td><td>" + p[PTABLE_COLUMN_STATE] + "</td><td>" + p[PTABLE_COLUMN_BASE_REGISTER] + "</td><td>" + p[PTABLE_COLUMN_LIMIT_REGISTER] + "</td><td>" + p[PTABLE_COLUMN_BASE_NVREGISTER] + "</td><td>" + p[PTABLE_COLUMN_LIMIT_NVREGISTER] + "</td><td>" + p[PTABLE_COLUMN_TIME_EXEC] + "</td><td>" + p[PTABLE_COLUMN_PARENT] + "</td><td>" + p[PTABLE_COLUMN_APPLICATION_PATH] + "</td></tr>";
        }
        out += "</tbody></table>";
        $('#tab_1').innerHTML = out;
    }
})();
