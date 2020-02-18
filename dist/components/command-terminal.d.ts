import { PolymerElement } from '@polymer/polymer/polymer-element.js';
import '@polymer/polymer/lib/elements/dom-repeat.js';
import System from '../system';
export declare type Bin = (opts: BinOptions) => Promise<number>;
export interface BinOptions {
    args: string[];
    terminal: History;
    system: System;
}
export declare const bin: {
    [title: string]: Bin;
};
export interface History {
    input: string;
    output: string;
}
export declare class CommandTerminal extends PolymerElement {
    static get template(): HTMLTemplateElement;
    history: History[];
    system: System;
    static get properties(): {
        history: {
            type: ArrayConstructor;
            value: never[];
        };
    };
    static get observers(): never[];
    ready(): void;
    connectedCallback(): void;
    activeCallback(): void;
    handleCmd(): boolean;
}
