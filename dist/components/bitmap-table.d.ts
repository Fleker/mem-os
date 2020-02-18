import { PolymerElement } from '@polymer/polymer/polymer-element.js';
import System from '../system';
export declare class BitmapTable extends PolymerElement {
    static get template(): HTMLTemplateElement;
    bytes: any[];
    system: System;
    static get properties(): {};
    static get observers(): never[];
    ready(): void;
    connectedCallback(): void;
    activeCallback(): void;
}
