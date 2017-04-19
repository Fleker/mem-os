# MemOS
_An operating system emulator using solely resistive-based memory_

[Try it Out](index.html)

## What does it do?
* Process table
* Memory
* File system

## What does it _not_ do?
* Virtual memory
    * We have ample amounts of memory. We don't need VM.
* Paging Table
    * Again, we don't have VM do we don't need to do paging.
* Cache / Registers
    * Lower-level than I plan on implementing.
* Separate memory / storage systems
    * As this is simulating a system with a joint memory/storage, this isn't something I plan on implementing.
    
## What is that thing?
This is the mascot of MemOS, MemGiraffre.

## Developing for MemOS

### System Invariants
* The current process is the only one running. System calls are based on obtaining the current process and performing a table lookup.
* Terminal commands are run in a sandbox, with their own memory pool.
* Some memory calls throw errors in certain bounding cases.
* Values in memory, if not set, will be set through an "installation" process
    * Memory location `0` contains the root directory

### MemOS Development Notes
* Many tricky functions throw errors. You will have to `try` and `catch` to do exception handling.
* A process does not _need_ a `path` for basic functions, but will need it to handle files or non-volatile memory.
* Relative paths currently are not supported. Everything must be absolute.

### Files
In most computer systems you have a standard user file system in "user space". With every application writing directly to non-volatile memory, each app can allocate both volatile and non-volatile memory blocks. When the system restarts, all volatile memory blocks keep their previous value. If allocated, the new process must take care to clear the values themselves. Non-volatile memory is stored in a specific `.data` file in their script's location. This file is hidden and inaccessible to other processes. 

### Memory
* `mem_request(length)`
* `mem_free(addr, length)`
* `mem_read(addr)`
* `mem_read_parent(addr)`
* `mem_set(addr, data)`
* `mem_set_parent(addr, data)`

### NV Memory
Resistive-based memory systems are non-volatile, allowing memory allocated to a process to persist after a power cycle. Processes are able to request and allocate memory for non-volatile purposes. These address links are stored in the process table and in a separate `.data` file that lives in _app space_. When the power cycle happens and a process is restarted, those NV addresses are added back to the process table, allowing the process to pick up where it was before.

Aside from the non-volatility, the functions and their behaviors are identical.

* `nvmem_request(length)`
* `nvmem_free(addr, length)`
* `nvmem_read(addr)`
* `nvmem_read_parent(addr)`
* `nvmem_set(addr, data)`
* `nvmem_set_parent(addr, data)`

### Processes
* `process_create(name, process_function, [args])`
* `process_create_child(name, process_function, [args])`
* `process_remove(pid)`
* `process_remove_self()`
* `process_get_current()`

### Terminal
* `cli_register(keyword, function)`
* `cli_history_append(text)`
* `cli_process(terminal_cmd)`

### File System
Files are basically what you'd expect. Each one exists in a tree-hierarchy similar to UNIX-based operating systems. In order to write to a file, one must first `open` it, placing a *lock* on the file until the file receives a `close`. While a file is locked, no other processes can open or write to it. However, every process is able to read from any file. 

In the future, full file system reading will not be possible as file access codes will be set up. Until that happens, be careful. Plus, unlocked files can be written or deleted by any process.

Note that all paths must be absolute for now. The terminal does not manage the current directory. To access a file in a hierarchy, one must write out everything, **including the precluding slash**.

Files may contain optional metadata, which is a JSON object with custom properties. Processes may use this metadata in their system.

* `filesys_create`
* `filesys_open(filename)`
* `filesys_exists(filename)`
* `filesys_close(filename)`
* `filesys_read(filename)`
* `filesys_write(filename, data)`
* `filesys_read_meta(filename)`
* `filesys_write_meta(filename, metadata)`
* `filesys_create_dir(dirname)`
* `filesys_has_lock(filename)`
* `filesys_is_dir(filename)`
* `filesys_get_children(filename)`
* `filesys_get_access(filename)`
* `filesys_delete_file(filename)`
* `filesys_delete_dir(filename)`

### Dream Journal
The dream journal is a global ledger for processes to resume actions that did not complete before the system shut down. This acts like a queue, with each process being able to push items to the end and pop from the front.

* `journal_add_entry(data)`
* `journal_pop_entry()`
* `journal_count()`
* `journal_has_entries()`

### Known Issues
* Memory / storage isn't actually that secure due to `localStorage` limitations.
* One memory cell can technically store a virtually unlimited amount of data.