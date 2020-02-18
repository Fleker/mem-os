import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
export class MemoryMap extends PolymerElement {
    constructor() {
        super(...arguments);
        this.memoryColors = {
            'Nonvolatile': '#00FF00',
            'File': '#0000FF',
            'Volatile': '#FF0000',
            '': '#FFFFFF',
        };
    }
    static get template() {
        return html `
      <style>
        #memory_map {
          background-color: white;
          width: 160px; /* 32 bytes / row */
        }
      </style>
      <div>
        <h1>Memory Map</h1>
        <table>
          <tr>
            <td>
              <canvas id='memory_map' width='160'></canvas>
            </td>
            <td style="vertical-align: top">
              <small>
                Red - Volatile memory<br>
                Blue - Nonvolatile memory<br>
                Green - File NV memory
              </small>
            </td>
          </tr>
        </table>
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
    activeCallback() {
        // Write pixels to our memory map based on the type of memory
        const map = this.$['memory_map'];
        map.height = this.system.memory.physicalSize / 32;
        const ctx = map.getContext('2d');
        // Volatile memory = red
        ctx.fillStyle = '#FF0000';
        this.system.memory.allocationArray.forEach((value, index) => {
            const row = index % 32 * 5;
            const col = Math.floor(index / 32) * 5;
            ctx.fillRect(row, col, 5, 5);
        });
    }
}
window.customElements.define('memory-map', MemoryMap);
//# sourceMappingURL=memory-map.js.map