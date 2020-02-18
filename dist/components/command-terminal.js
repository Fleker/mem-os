import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import '@polymer/polymer/lib/elements/dom-repeat.js';
import { Process } from '../process-table';
export const bin = {};
export class CommandTerminal extends PolymerElement {
    constructor() {
        super(...arguments);
        this.history = [];
    }
    static get template() {
        return html `
        <style>
        /* Fancy Scrollbar */
        #cmd-history::-webkit-scrollbar, #tab_3::-webkit-scrollbar {
          width: 1em;
        }

        #cmd-history::-webkit-scrollbar-track, #tab_3::-webkit-scrollbar-track {
          -webkit-box-shadow: inset 0 0 6px rgba(0,0,0,0.3);
        }

        #cmd-history::-webkit-scrollbar-thumb, #tab_3::-webkit-scrollbar-thumb {
          background-color: darkgrey;
          outline: 1px solid slategrey;
        }

        .terminal {
          width: 90vw;
          height: calc(100% - 96px);
        }
        
        #cmd-history {
          min-height: calc(100% - 64px);
          padding-left: 8px;
          overflow-y: scroll;
          padding-top: 16px;
        }

        #cmd-history span.input::before {
          content: "$  "
        }

        #cmd-history span.output {
          white-space: pre-wrap;
        }

        #cmd-history span {
          margin-left: 20px;
          margin-bottom: 4px;
          display: block;
        }
        
        .highlight-green {
          background-color: #1B5E20;
        }
        
        #entry::before {
          content: ">"
        }
        
        #entry {
          height: 20px;
          background-color: black;
          color: #efefef;
          border: none;
          padding-left: 8px;
          width: calc(100% - 80px);
          border-top: solid 1px rgba(255, 255, 255, 0.1);
          padding-top: 2px;
          padding-bottom: 2px;
          font-family: monospace;
        }
        
        #entry:focus {
          border: solid 1px #999;
        }
        </style>

        <div id='terminal'>
          <div id='cmd-history'>
            <template is="dom-repeat" items="{{history}}" id="temp-history">
              <span class="input">{{item.input}}</span>
              <span class="output">{{item.output}}</span>
            </template>
          </div>
          <form id='cli'>
              <span>&emsp; &raquo; &nbsp;</span>
              <input id='entry'
                  placeholder="Type a command, or ask for 'help'"
                  autocomplete="off" />
          </form>
        </div>
      `;
    }
    static get properties() {
        return {
            history: {
                type: Array,
                value: []
            }
        };
    }
    static get observers() {
        return [];
    }
    ready() {
        super.ready();
        this.history = [];
        bin['about'] = ({ terminal }) => {
            terminal.output = `~MemOS~\n
        An OS emulator for resistive-based memory
        Find out more in the project write-up.
        version ${this.system.version.name} (${this.system.version.number})`;
            return Promise.resolve(0);
        };
        bin['clear'] = ({}) => {
            this.history = [];
            return Promise.resolve(0);
        };
        bin['help'] = ({ terminal }) => {
            terminal.output = `Here are a list of bins:\n\n`;
            Object.keys(bin).forEach(title => {
                terminal.output += `  * ${title}\n`;
            });
            return Promise.resolve(0);
        };
    }
    connectedCallback() {
        super.connectedCallback();
        const commandLine = this.$.cli;
        commandLine.onsubmit = () => {
            this.handleCmd();
            return false;
        };
    }
    activeCallback() {
        const input = this.$.entry;
        input.focus();
    }
    handleCmd() {
        const input = this.$.entry;
        const cmd = input.value;
        const cmdTitle = cmd.split(' ')[0];
        if (bin[cmdTitle]) {
            const terminalEntry = {
                input: cmd,
                output: ''
            };
            this.history.push(terminalEntry);
            this.set('history', [...this.history]);
            const pid = this.system.process.create(new Process({ name: 'Terminal' }));
            const opts = {
                args: cmd.split(' '),
                terminal: terminalEntry,
                system: this.system
            };
            bin[cmdTitle](opts)
                .then(() => {
                this.set('history', [...this.history]);
                this.system.process.kill(pid);
            });
        }
        else {
            // Append to history
            this.history.push({
                input: cmd,
                output: `Command ${cmdTitle} is not found`
            });
            this.set('history', [...this.history]);
        }
        // Clear entry
        input.value = '';
        return false;
    }
}
window.customElements.define('command-terminal', CommandTerminal);
//# sourceMappingURL=command-terminal.js.map