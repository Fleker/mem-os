import FileSystem from "./file-system";
import BitmapMemory from "./bitmap-memory";
import NvmMemoryManager from "./nvm-memory";
import ProcessTable from "./process-table";
import ResourceMonitor from "./resource-monitor";
export interface SystemOptions {
    memory: BitmapMemory;
    files: FileSystem;
    nvmMemory: NvmMemoryManager;
    process: ProcessTable;
    monitor: ResourceMonitor;
}
interface Version {
    name: string;
    number: string;
}
/**
 * The `SYSTEM` class represents a unified representation of the computer
 * system being used, providing access to singleton components and global
 * utilities.
 */
export default class {
    files: FileSystem;
    memory: BitmapMemory;
    nvmMemory: NvmMemoryManager;
    process: ProcessTable;
    monitor: ResourceMonitor;
    version: Version;
    constructor(options: SystemOptions);
    restart(): void;
}
export {};
