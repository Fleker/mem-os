import { PolymerElement } from '@polymer/polymer/polymer-element.js';
import System from '../system';
export declare class MemoryMap extends PolymerElement {
    static get template(): HTMLTemplateElement;
    system: System;
    memoryColors: {
        'Nonvolatile': string;
        'File': string;
        'Volatile': string;
        '': string;
    };
    static get properties(): {};
    static get observers(): never[];
    ready(): void;
    connectedCallback(): void;
    activeCallback(): void;
}
