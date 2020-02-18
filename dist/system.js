/**
 * The `SYSTEM` class represents a unified representation of the computer
 * system being used, providing access to singleton components and global
 * utilities.
 */
export default class {
    constructor(options) {
        this.memory = options.memory;
        this.files = options.files;
        this.nvmMemory = options.nvmMemory;
        this.process = options.process;
        this.monitor = options.monitor;
        this.memory.attach(this.monitor);
        this.files.attach(this.monitor);
        this.version = {
            name: "January 2020",
            number: "1.0.0"
        };
    }
    restart() {
        // On a restart we need to reset all volatile memory allocations
        this.memory.memBlocks.forEach(volatileMemoryBlock => {
            this.memory.mfree(volatileMemoryBlock[0], volatileMemoryBlock[1]);
        });
    }
}
//# sourceMappingURL=system.js.map