import { PolymerElement } from '@polymer/polymer/polymer-element.js';
import System from '../system';
export declare class ResourceMonitor extends PolymerElement {
    static get template(): HTMLTemplateElement;
    bootTime: number;
    fullTime: string;
    upTime: string;
    bytesRead: number;
    bytesWritten: number;
    perfReads: number[];
    perfWrites: number[];
    perfEnergy: number[];
    perfPower: number[];
    system: System;
    static get properties(): {
        system: {
            type: ObjectConstructor;
            value: {};
        };
        perfReads: {
            type: ArrayConstructor;
            value: never[];
        };
        perfWrites: {
            type: ArrayConstructor;
            value: never[];
        };
        perfEnergy: {
            type: ArrayConstructor;
            value: never[];
        };
        perfPower: {
            type: ArrayConstructor;
            value: never[];
        };
    };
    static get observers(): never[];
    ready(): void;
    connectedCallback(): void;
    activeCallback(): void;
    calcPerf(): void;
    timeStr(): string;
    upTimeStr(): string;
}
