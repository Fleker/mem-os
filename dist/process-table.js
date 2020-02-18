var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// A process table is used in operating systems in order to manage different
// softwares running on a computer at a given time. CPUs can only interpret
// one instruction at a time (more or less), so the kernel-level task scheduler
// keeps a record of all running processes in the process table and allocates
// CPU time to every process.
// For over this number of processes, the system cannot generate a unique id
const PROCESS_MAX = 1000;
export default class ProcessTable {
    constructor(options) {
        this.processes = [];
        this.memory = options.memory;
        this.files = options.files;
        const kernelProcess = new Process({ pid: 1, name: 'System Idle Process' });
        this.processes[0] = kernelProcess;
    }
    create(process) {
        if (!this.processes[process.pid]) {
            process.memory = this.memory;
            this.processes[process.pid] = process;
            return process.pid;
        }
        throw new Error('Cannot create process with that ID');
    }
    list() {
        // Print all PIDs
        return this.processes
            .filter(value => !!value)
            .map((value, index) => index);
    }
    print(pid) {
        // Metadata on a process
        const { name, state, memoryAlloc, nvMemoryAlloc, created, parent, path } = this.processes[pid];
        return {
            pid,
            name,
            state,
            memoryAlloc,
            nvMemoryAlloc,
            created,
            parent,
            path
        };
    }
    kill(pid) {
        return __awaiter(this, void 0, void 0, function* () {
            if (pid > 0 && this.processes[pid]) {
                const ghost = this.processes[pid];
                yield Promise.all(ghost.children.map((ghoul) => __awaiter(this, void 0, void 0, function* () {
                    yield ghoul.onStop();
                    ghoul.close();
                    delete this.processes[ghoul.pid];
                })));
                ghost.state = ProcessState.stopping;
                yield ghost.onStop();
                ghost.close();
                delete this.processes[pid];
                return 0;
            }
            else if (pid === 0) {
                throw new Error('Cannot kill the kernel');
            }
            throw new Error('Cannot kill process with that ID');
        });
    }
}
export var ProcessState;
(function (ProcessState) {
    ProcessState[ProcessState["waiting"] = 0] = "waiting";
    ProcessState[ProcessState["ready"] = 1] = "ready";
    ProcessState[ProcessState["active"] = 2] = "active";
    ProcessState[ProcessState["inactive"] = 3] = "inactive";
    ProcessState[ProcessState["stopping"] = 4] = "stopping";
})(ProcessState || (ProcessState = {}));
export class Process {
    constructor(options) {
        this.children = [];
        // Use random number for PID
        this.pid = options.pid || Math.random() * PROCESS_MAX + 1; // Cannot be 0 as that's kernel
        this.created = new Date();
        this.state = ProcessState.waiting;
        this.name = options.name;
        this.memory = options.memory;
        this.files = options.files;
        if (this.onStart) {
            this.onStart(options.args || [])
                .then(() => {
                this.state = ProcessState.ready;
            });
        }
        if (this.onLoop) {
            this.intervalIndex = setInterval(this.onLoop, 1000);
        }
        if (!this.onStop) {
            this.onStop = () => __awaiter(this, void 0, void 0, function* () { });
        }
    }
    malloc(bytes) {
        if (!this.memory)
            throw new Error('No memory to allocate');
        const allocation = this.memory.malloc(bytes);
        this.memoryAlloc = {
            baseRegister: allocation.address,
            limitRegister: allocation.size
        };
        return bytes;
    }
    fork(child) {
        child.memoryAlloc = this.memoryAlloc;
        child.nvMemoryAlloc = this.nvMemoryAlloc;
        this.children.push(child);
    }
    close() {
        if (!this.memory)
            return;
        clearInterval(this.intervalIndex);
        // Delete volatile memory
        this.memory.mfree(this.memoryAlloc.baseRegister, this.memoryAlloc.limitRegister);
    }
}
//# sourceMappingURL=process-table.js.map