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