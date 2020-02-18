import ResourceMonitor from "./resource-monitor";
export declare type MemType = 'Volatile' | 'Nonvolatile' | 'File';
export default class MemoryBlock {
    private monitor;
    readonly address: number;
    readonly size: number;
    readonly type: MemType;
    private _value;
    constructor(address: number, size: number, type: MemType, value?: string);
    attach(monitor: ResourceMonitor): void;
    get value(): string;
    set value(v: string);
}
