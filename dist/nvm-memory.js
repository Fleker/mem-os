export default class NvmMemoryManager {
    constructor(options) {
        this.memory = options.memory;
    }
    canAlloc(bytes) {
        return this.memory.canAlloc(bytes);
    }
    malloc(bytes) {
        const memory = this.memory.malloc(bytes, 'Nonvolatile');
        return memory;
    }
    mfree(address, bytes) {
        return this.memory.mfree(address, bytes);
    }
}
//# sourceMappingURL=nvm-memory.js.map