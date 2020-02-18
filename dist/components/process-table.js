import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
export class ProcessTable extends PolymerElement {
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
          <h1>Process Table</h1>
          <table>
            <thead>
              <tr>
                <td>PID</td>
                <td>Name</td>
                <td>State</td>
                <td>Base Register</td>
                <td>Limit Register</td>
                <td>NV Base Register</td>
                <td>NV Limit Register</td>
                <td>Time Created</td>
                <td>Parent PID</td>
                <td>Path</td>
              </tr>
            </thead>
            <tbody>
            <template is="dom-repeat" items="{{system.process.processes}}">
              <tr>
                <td>{{item.pid}}</td>
                <td>{{item.name}}</td>
                <td>{{item.state}}</td>
                <td>{{item.memoryAlloc.baseRegister}}</td>
                <td>{{item.memoryAlloc.limitRegister}}</td>
                <td>{{item.nvMemoryAlloc.baseRegister}}</td>
                <td>{{item.nvMemoryAlloc.limitRegister}}</td>
                <td>{{item.created}}</td>
                <td>{{item.parent}}</td>
                <td>{{item.path}}</td>
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
    activeCallback() { }
}
window.customElements.define('process-table', ProcessTable);
//# sourceMappingURL=process-table.js.map