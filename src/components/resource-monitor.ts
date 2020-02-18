import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import System from '../system';
import { SYS_MEM, SYS_HDD, SYS_SSD } from '../memory-architectures';

export class ResourceMonitor extends PolymerElement {
    static get template() {
      return html`
        <style>
          thead td {
            font-weight: bold;
            border-bottom: solid 1px #999;
          }

          td:first-child {
            border-right: solid 2px #999;
            text-align: left;
          }

          td {
            text-align: right;
            width: 20vw;
            padding-right: 20px;
          }
        </style>

        <div>
          <h1>Resource Monitor</h1>
          <div>
            The current time is {{fullTime}}.<br>
            &emsp;System uptime: {{upTime}}
          </div>
          <br><br><br>
          <div>
            Total bytes read: {{bytesRead}}<br>
            Total bytes written: {{bytesWritten}}<br>
            Memory I/O time:
            <table>
              <thead>
                <tr>
                  <td></td>
                  <td>Nvm OS</td>
                  <td>SSD &amp; DDR4 RAM</td>
                  <td>HDD &amp; DDR3 RAM</td>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Reads (ns)</td>
                  <template is="dom-repeat" items="{{perfReads}}">
                    <td>{{item}}</td>
                  </template>
                </tr>
                <tr>
                  <td>Writes (ns)</td>
                  <template is="dom-repeat" items="{{perfWrites}}">
                    <td>{{item}}</td>
                  </template>
                </tr>
                <tr>
                  <td>Energy (pJ)</td>
                  <template is="dom-repeat" items="{{perfEnergy}}">
                    <td>{{item}}</td>
                  </template>
                </tr>
                <tr>
                  <td>Power (kWh)</td>
                  <template is="dom-repeat" items="{{perfPower}}">
                    <td>{{item}}</td>
                  </template>
                </tr>
              </tbody>
            </table>
          </div>
          <br><br><br>
          <div>
          System Config:<br>
          &emsp;Capacity: {{system.memory.physicalSize}} bytes
          </div>
        </div>
      `
    }

  bootTime: number
  fullTime: string
  upTime: string
  bytesRead: number
  bytesWritten: number
  perfReads: number[] = []
  perfWrites: number[] = []
  perfEnergy: number[] = []
  perfPower : number[] = []
  system: System
  static get properties() {
    return {
      system: {
        type: Object,
        value: {}
      },
      perfReads: {
        type: Array,
        value: []
      },
      perfWrites: {
        type: Array,
        value: []
      },
      perfEnergy: {
        type: Array,
        value: []
      },
      perfPower: {
        type: Array,
        value: []
      },
    }
  }

  static get observers() {
    return [
    ]
  }

  ready() {
    super.ready()
    this.bootTime = Date.now()
  }

  connectedCallback() {
    super.connectedCallback();
  }

  activeCallback() {
    this.fullTime = this.timeStr()
    this.upTime = this.upTimeStr()
    if (this.system.monitor.reads.length) {
      this.bytesRead = this.system.monitor.reads
        .reduce((acc, curr) => acc + curr)
      this.bytesWritten = this.system.monitor.writes
        .reduce((acc, curr) => acc + curr)
      this.calcPerf()
    } else {
      this.bytesRead = 0
      this.bytesWritten = 0
    }
  }

  calcPerf() {
    const architectures = [SYS_MEM, SYS_SSD, SYS_HDD]
    this.perfReads = []
    this.perfWrites = []
    this.perfEnergy = []
    this.perfPower = []
    architectures.forEach(arch => {
      const perf = this.system.monitor.calcPerf(arch)
      this.push('perfReads', perf.readTime)
      this.push('perfWrites', perf.writeTime)
      this.push('perfEnergy', perf.energy)
      this.push('perfPower', perf.power)
    })
  }

  timeStr() {
    const time = new Date();
    const timeStr = time.getHours() + ":" + ((time.getMinutes() < 10) ? "0" : "") + time.getMinutes();
    return timeStr
  }

  upTimeStr() {
    const time = Date.now()
    let up = time - this.bootTime;
    const upH = Math.floor(up / (1000 * 60 * 60))
    up -= upH * (1000 * 60 * 60);
    const upM = Math.floor(up / (1000 * 60));
    up -= upM * (1000 * 60);
    const upS = Math.floor(up/1000);
    up -= upS * 1000;
    const upStr = upH + ":" + ((upM < 10) ? "0" : "") +
      upM + ":" + ((upS < 10) ? "0" : "") +
      upS + "." + up;
    return upStr
  }
}

window.customElements.define('resource-monitor', ResourceMonitor);
