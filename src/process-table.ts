import BitmapMemory from "./bitmap-memory";
import FileSystem from "./file-system";

// A process table is used in operating systems in order to manage different
// softwares running on a computer at a given time. CPUs can only interpret
// one instruction at a time (more or less), so the kernel-level task scheduler
// keeps a record of all running processes in the process table and allocates
// CPU time to every process.

// For over this number of processes, the system cannot generate a unique id
const PROCESS_MAX = 1000

export interface ProcessTableOptions {
  memory?: BitmapMemory
  files?: FileSystem
}

export default class ProcessTable {
  processes: Process[] = []
  memory?: BitmapMemory
  files?: FileSystem

  constructor(options: ProcessTableOptions) {
    this.memory = options.memory
    this.files = options.files
    const kernelProcess = new Process({pid: 1, name: 'System Idle Process'})
    this.processes[0] = kernelProcess
  }

  create(process: Process) {
    if (!this.processes[process.pid]) {
      process.memory = this.memory
      this.processes[process.pid] = process
      return process.pid
    }
    throw new Error('Cannot create process with that ID')
  }

  list() {
    // Print all PIDs
    return this.processes
      .filter(value => !!value)
      .map((value, index) => index)
  }

  print(pid: number) {
    // Metadata on a process
    const {
      name,
      state,
      memoryAlloc,
      nvMemoryAlloc,
      created,
      parent,
      path
    } = this.processes[pid]
    return {
      pid,
      name,
      state,
      memoryAlloc,
      nvMemoryAlloc,
      created,
      parent,
      path
    }
  }

  async kill(pid: number) {
    if (pid > 0 && this.processes[pid]) {
      const ghost = this.processes[pid]
      await Promise.all(ghost.children.map(async ghoul => {
        await ghoul.onStop()
        ghoul.close()
        delete this.processes[ghoul.pid]
      }))
      ghost.state = ProcessState.stopping
      await ghost.onStop()
      ghost.close()
      delete this.processes[pid]
      return 0
    } else if (pid === 0) {
      throw new Error('Cannot kill the kernel')
    }
    throw new Error('Cannot kill process with that ID')
  }
}

export enum ProcessState {
  waiting = 0,
  ready = 1,
  active = 2,
  inactive = 3,
  stopping = 4,
}

export interface ProcessOptions {
  pid?: number
  name: string
  args?: string[]
  memory?: BitmapMemory
  files?: FileSystem
}

type ProcessStart = (args: string[]) => Promise<void>
type ProcessLoop = () => Promise<void>
type ProcessStop = () => Promise<void>

export class Process {
  readonly pid: number // Process ID
  name: string
  state: ProcessState
  function: Function
  args: string[] // Args supplied to function
  memoryAlloc: {
    baseRegister: number
    limitRegister: number
  }
  nvMemoryAlloc: {
    baseRegister: number
    limitRegister: number
  }
  readonly created: Date
  readonly parent: number // Parent process ID if valid
  readonly path: string // Filepath to system

  // Computations
  readonly intervalIndex: NodeJS.Timeout // Loop process
  onStart: ProcessStart
  onLoop: ProcessLoop
  onStop: ProcessStop

  // Access other systems
  memory?: BitmapMemory
  files?: FileSystem
  children: Process[] = []

  constructor(options: ProcessOptions) {
    // Use random number for PID
    this.pid = options.pid || Math.random() * PROCESS_MAX + 1 // Cannot be 0 as that's kernel
    this.created = new Date()
    this.state = ProcessState.waiting
    this.name = options.name
    this.memory = options.memory
    this.files = options.files
    if (this.onStart) {
      this.onStart(options.args || [])
        .then(() => {
          this.state = ProcessState.ready
        })
    }
    if (this.onLoop) {
      this.intervalIndex = setInterval(this.onLoop, 1000)
    }
    if (!this.onStop) {
      this.onStop = async () => {}
    }
  }

  malloc(bytes: number) {
    if (!this.memory) throw new Error('No memory to allocate')
    const allocation = this.memory.malloc(bytes)
    this.memoryAlloc = {
      baseRegister: allocation.address,
      limitRegister: allocation.size
    }
    return bytes
  }

  fork(child: Process) {
    child.memoryAlloc = this.memoryAlloc
    child.nvMemoryAlloc = this.nvMemoryAlloc
    this.children.push(child)
  }

  close() {
    if (!this.memory) return
    clearInterval(this.intervalIndex)
    // Delete volatile memory
    this.memory.mfree(this.memoryAlloc.baseRegister, this.memoryAlloc.limitRegister)
  }
}
