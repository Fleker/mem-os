// Inits the journaling system
var journal_init = null;
// Adds an entry to the journal
var journal_add_entry = null;
// Removes the earliest journal entry and returns it.
var journal_pop_entry = null;
// Gets the number of relevant entries in the journal for the current process
var journal_count = null;
// Returns whether there are any journal entries for the current process
var journal_has_entries = null;

// Thrown if journal has no entries when popping.
var JOURNAL_ERROR_NO_ENTRIES = -2;
// Thrown if process adding journal entry doesn't have a defined path.
var JOURNAL_ERROR_NO_PROCESS_PATH = -1;
// Journal operation executed without error.
var JOURNAL_OP_OK = 0;

// This is a helpful library for processes, so this can live in userspace.
// The only thing it needs is a process table to do path lookups.
(function() {
    const FILE_DREAM_JOURNAL = '/.dream-journal';
    var is_journal_init = false;
    var process_table = [];

    journal_init = function(ptable) {
        if (!is_journal_init) {
            process_table = ptable;
            is_journal_init = true;
            return [kernel_journal_add_entry, kernel_journal_pop_entry];
        }
    }

    kernel_journal_add_entry = function(entry_data, path_name) {
        // Inflate journal
        filesys_open(FILE_DREAM_JOURNAL);
        var dj = JSON.parse(filesys_read(FILE_DREAM_JOURNAL));
        var path = path_name || '/.kernel';
        if (!path) {
            throw JOURNAL_ERROR_NO_PROCESS_PATH;
        }
        if (dj[path]) {
            // Append
            dj[path].push(entry_data);
        } else {
            // Create first entry
            dj[path] = [entry_data];
        }
        // Save back to memory
        filesys_write(FILE_DREAM_JOURNAL, JSON.stringify(dj));
        filesys_close(FILE_DREAM_JOURNAL);
        return JOURNAL_OP_OK;
    }

    journal_add_entry = function(entry_data) {
        if (!process_table[process_get_current()][PTABLE_COLUMN_APPLICATION_PATH]) {
            throw JOURNAL_ERROR_NO_PROCESS_PATH;
        }
        return kernel_journal_add_entry(entry_data, process_table[process_get_current()][PTABLE_COLUMN_APPLICATION_PATH]);
    }

    kernel_journal_pop_entry = function(path_name) {
        // Inflate journal
        filesys_open(FILE_DREAM_JOURNAL);
        var dj = JSON.parse(filesys_read(FILE_DREAM_JOURNAL));
        var path = path_name || '/.kernel';
        if (!path) {
            throw JOURNAL_ERROR_NO_PROCESS_PATH;
        }
        if (!dj[path]) {
            throw JOURNAL_ERROR_NO_ENTRIES;
        }
        if (!dj[path].length) {
            throw JOURNAL_ERROR_NO_ENTRIES;
        }
        var result = dj[path].splice(0, 1);
        // Save back to memory
        filesys_write(FILE_DREAM_JOURNAL, JSON.stringify(dj));
        filesys_close(FILE_DREAM_JOURNAL);
        return result;
    }

    journal_pop_entry = function() {
        if (!process_table[process_get_current()][PTABLE_COLUMN_APPLICATION_PATH]) {
            throw JOURNAL_ERROR_NO_PROCESS_PATH;
        }
        return kernel_journal_pop_entry(process_table[process_get_current()][PTABLE_COLUMN_APPLICATION_PATH]);
    }

    journal_count = function() {
        var dj = JSON.parse(filesys_read(FILE_DREAM_JOURNAL));
        var path = process_table[process_get_current()][PTABLE_COLUMN_APPLICATION_PATH];
        if (!path) {
            throw JOURNAL_ERROR_NO_PROCESS_PATH;
        }
        if (!dj[path]) {
            return 0;
        }
        return dj[path].length;
    }

    journal_has_entries = function() {
        return journal_count() > 0;
    }
})();
