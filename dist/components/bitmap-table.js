import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
export class BitmapTable extends PolymerElement {
    constructor() {
        super(...arguments);
        this.bytes = [];
    }
    static get template() {
        return html `
        <style>
        thead td {
          font-weight: bold;
          border-bottom: solid 1px #999;
          border-right: solid 1px #555;
        }

        td:first-child {
          border-right: solid 2px #999;
          padding-right: 20px;
        }

        td {
          border-right: solid 1px #555;
        }
        </style>
        <div>
          <h1>Bitmap</h1>
          <table>
            <thead>
              <tr>
                <td>Bytes</td>
                <td>Starting Address</td>
              </tr>
            </thead>
            <tbody>
              <template is="dom-repeat" items="{{bytes}}">
                <tr>
                <td>{{item.bytes}}</td>
                <td>{{item.head}}</td>
                </tr>
              </template>
            </tbody>
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
        for (let i = 0; i < this.system.memory.bitmap.length; i++) {
            const mems = this.system.memory.bitmap[i];
            this.bytes[i] = {
                bytes: Math.pow(2, i + this.system.memory.minExp),
                head: (mems && mems.address > -1) ? mems.address : '-'
            };
        }
        this.set('bytes', [...this.bytes]);
    }
}
window.customElements.define('bitmap-table', BitmapTable);
//# sourceMappingURL=bitmap-table.js.map