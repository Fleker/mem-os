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

## Developing for MemOS

### System Invariants
* The current process is the only one running. System calls are based on obtaining the current process and performing a table lookup.
* Terminal commands are run in a sandbox, with their own memory pool.
* Some memory calls throw errors in certain bounding cases.

### Files
In most computer systems you have a standard user file system in "user space". With every application writing directly to non-volatile memory, each app can allocate both volatile and non-volatile memory blocks. When the system restarts, all volatile memory blocks keep their previous value. If allocated, the new process must take care to clear the values themselves. Non-volatile memory is stored in a specific `.data` file in their script's location. This file is hidden and inaccessible to other processes. 

### Memory
* `mem_request(length)`
* `mem_free(addr, length)`
* `mem_read(addr)`
* `mem_read_parent(addr)`
* `mem_set(addr, data)`
* `mem_set_parent(addr, data)`

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

### Known Issues
* Memory / storage isn't actually that secure due to `localStorage` limitations.
* One memory cell can technically store a virtually unlimited amount of data.