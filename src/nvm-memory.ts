import BitmapMemory from './bitmap-memory'

export interface NvmMemoryManagerOptions {
  memory: BitmapMemory
}

export default class NvmMemoryManager {
  memory: BitmapMemory

  constructor(options: NvmMemoryManagerOptions) {
    this.memory = options.memory
  }

  canAlloc(bytes: number) {
    return this.memory.canAlloc(bytes)
  }

  malloc(bytes: number) {
    const memory = this.memory.malloc(bytes, 'Nonvolatile')
    return memory
  }

  mfree(address: number, bytes: number) {
    return this.memory.mfree(address, bytes)
  }
}
