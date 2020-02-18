import MemorySystem from "./memory-system";
export default class {
    reads: number[];
    writes: number[];
    constructor();
    calcPerf(system: MemorySystem[]): {
        readTime: number;
        writeTime: number;
        energy: number;
        power: number;
    };
    incRead(bytes: number): void;
    incWrite(bytes: number): void;
}
