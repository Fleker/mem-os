import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
export class MemoryAllocation extends PolymerElement {
    static get template() {
        return html `
        <style include="iron-flex iron-flex-alignment">
        </style>
        <div>
          <h1>Memory Allocation</h1>
        </div>
      `;
    }
    static get properties() {
        return {};
    }
    static get observers() {
        return [];
    }
    ready() {
        super.ready();
    }
    connectedCallback() {
        super.connectedCallback();
    }
}
window.customElements.define('memory-allocation', MemoryAllocation);
//# sourceMappingURL=memory-allocation.js.map