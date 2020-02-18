import LinkedList from "./linked-list";
import MemoryBlock, { MemType } from "./memory-block";
import ResourceMonitor from "./resource-monitor";
export interface BitmapMemoryOptions {
    physicalSize: number;
    minBytes?: number;
}
export default class BitmapMemory {
    private monitor;
    physicalSize: number;
    minBytes: number;
    minExp: number;
    bitmap: LinkedList<any>[];
    memBlocks: Array<Array<number>>;
    allocationArray: string[];
    constructor(options: BitmapMemoryOptions);
    attach(monitor: ResourceMonitor): void;
    peekIndex(index: number): number;
    traverseAddresses(index: number): any[];
    canAlloc(bytes: number): boolean;
    private pop;
    malloc(bytes: number, type?: MemType): MemoryBlock;
    mfree(address: number, bytes: number): void;
    free(memory: MemoryBlock): void;
}
