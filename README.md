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

### Memory
* `mem_request(bytes)`
* `mem_free(addr, bytes)`
* `mem_read(addr)`
* `mem_set(addr, bytes)`

### Processes
* `process_add(name, process_function, [args])`
* `process_remove(pid)`
* `process_remove_self()`
* `process_get_current()`

### Terminal
* `cli_register(keyword, function)`
* `cli_history_append(text)`
* `cli_process(terminal_cmd)`

### Known Issues
* Memory / storage isn't actually that secure due to `localStorage` limitations.