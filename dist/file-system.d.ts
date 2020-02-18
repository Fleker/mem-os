import BitmapMemory from "./bitmap-memory";
import LinkedList from "./linked-list";
import ResourceMonitor from "./resource-monitor";
export interface StorageUnit {
    fullPath: string;
    name: string;
    isDirectory: boolean;
}
export interface FileMetadata {
    size: number;
}
export interface File extends StorageUnit {
    metadata: FileMetadata;
    data: LinkedList<any>;
}
export interface DirectoryMetadata {
}
export interface Directory extends StorageUnit {
    metadata: DirectoryMetadata;
    children: StorageUnit[];
}
export interface FileSystemOptions {
    memory: BitmapMemory;
    inodeSize: number;
}
export default class FileSystem {
    private monitor;
    memory: BitmapMemory;
    inodeSize: number;
    root: Directory;
    constructor(options: FileSystemOptions);
    attach(monitor: ResourceMonitor): void;
    private traverseDir;
    private traverse;
    private indexOf;
    create(fullPath: string): File;
    createDirectory(fullPath: string): Directory;
    read(path: string): string;
    listDirectory(fullPath: string): StorageUnit[];
    update(path: string, data: string): File;
    delete(path: string): boolean;
    deleteDirectory(fullPath: string): void;
}
