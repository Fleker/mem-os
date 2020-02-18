/// <reference types="node" />
import BitmapMemory from "./bitmap-memory";
import FileSystem from "./file-system";
export interface ProcessTableOptions {
    memory?: BitmapMemory;
    files?: FileSystem;
}
export default class ProcessTable {
    processes: Process[];
    memory?: BitmapMemory;
    files?: FileSystem;
    constructor(options: ProcessTableOptions);
    create(process: Process): number;
    list(): number[];
    print(pid: number): {
        pid: number;
        name: string;
        state: ProcessState;
        memoryAlloc: {
            baseRegister: number;
            limitRegister: number;
        };
        nvMemoryAlloc: {
            baseRegister: number;
            limitRegister: number;
        };
        created: Date;
        parent: number;
        path: string;
    };
    kill(pid: number): Promise<number>;
}
export declare enum ProcessState {
    waiting = 0,
    ready = 1,
    active = 2,
    inactive = 3,
    stopping = 4
}
export interface ProcessOptions {
    pid?: number;
    name: string;
    args?: string[];
    memory?: BitmapMemory;
    files?: FileSystem;
}
declare type ProcessStart = (args: string[]) => Promise<void>;
declare type ProcessLoop = () => Promise<void>;
declare type ProcessStop = () => Promise<void>;
export declare class Process {
    readonly pid: number;
    name: string;
    state: ProcessState;
    function: Function;
    args: string[];
    memoryAlloc: {
        baseRegister: number;
        limitRegister: number;
    };
    nvMemoryAlloc: {
        baseRegister: number;
        limitRegister: number;
    };
    readonly created: Date;
    readonly parent: number;
    readonly path: string;
    readonly intervalIndex: NodeJS.Timeout;
    onStart: ProcessStart;
    onLoop: ProcessLoop;
    onStop: ProcessStop;
    memory?: BitmapMemory;
    files?: FileSystem;
    children: Process[];
    constructor(options: ProcessOptions);
    malloc(bytes: number): number;
    fork(child: Process): void;
    close(): void;
}
export {};
