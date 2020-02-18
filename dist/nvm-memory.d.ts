import BitmapMemory from './bitmap-memory';
export interface NvmMemoryManagerOptions {
    memory: BitmapMemory;
}
export default class NvmMemoryManager {
    memory: BitmapMemory;
    constructor(options: NvmMemoryManagerOptions);
    canAlloc(bytes: number): boolean;
    malloc(bytes: number): import("./memory-block").default;
    mfree(address: number, bytes: number): void;
}
