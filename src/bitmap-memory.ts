import LinkedList from "./linked-list";
import MemoryBlock, { MemType } from "./memory-block";
import ResourceMonitor from "./resource-monitor";

export interface BitmapMemoryOptions {
  physicalSize: number
  minBytes?: number
}

export default class BitmapMemory {
  private monitor: ResourceMonitor
  physicalSize: number
  minBytes: number = 128
  minExp: number = 7
  bitmap: LinkedList<any>[]
  // We need to keep track of volatile memory
  // as its own thing to make sure it does not get
  // freed on a system reset.
  // [
  //   [address, numBytes]
  // ]
  memBlocks: Array<Array<number>>
  // This is an allocation array so we know what memory is what type
  // Primarily, this is used for debugging and tracing and not meant
  // to be a production-ready value
  allocationArray: string[]

  // Optionally load a bitmap from a source in order to simulate known conditions
  constructor(options: BitmapMemoryOptions) {
    this.bitmap = []
    if (options.minBytes) {
      this.minBytes = options.minBytes
    }
    this.physicalSize = options.physicalSize
    const maxIndex = Math.log2(options.physicalSize / this.minBytes)
    this.minExp = Math.log2(this.minBytes)
    this.bitmap[maxIndex] = new LinkedList(0)
    this.memBlocks = []
    this.allocationArray = []
  }

  attach(monitor: ResourceMonitor) {
    this.monitor = monitor
  }

  peekIndex(index: number) {
    return this.bitmap[index].address
  }

  traverseAddresses(index: number) {
    const addresses: any[] = []
    const linkedList = this.bitmap[index]
    if (!linkedList) return addresses
    let node = linkedList
    do {
      addresses.push(node.address)
      node = node.next!
    } while (node)
    return addresses
  }

  canAlloc(bytes: number) {
    const startingIndex = Math.ceil(Math.log2(bytes / this.minBytes))
    for (let i = startingIndex; i < this.bitmap.length; i++) {
      if (this.bitmap[i]) {
        return true
      }
    }
    return false
  }

  private pop(bitmapIndex: number) {
    const memBlock = this.bitmap[bitmapIndex]
    if (this.bitmap[bitmapIndex].next) {
      this.bitmap[bitmapIndex] = this.bitmap[bitmapIndex].next as LinkedList<any>
    } else {
      this.bitmap[bitmapIndex] = {} as LinkedList<any>
    }
    memBlock.next = undefined
    return memBlock
  }

  malloc(bytes: number, type: MemType = 'Volatile') {
    // We need to allocate at least bytes starting from this position
    const startingIndex = Math.ceil(Math.log2(bytes / this.minBytes))
    if (this.bitmap[startingIndex] && 
        this.bitmap[startingIndex].address !== undefined) {
      // We can allocate directly from this position by popping the LinkedList
      // of address spaces
      const block = this.pop(startingIndex)
      const memBlock = new MemoryBlock(block.address, bytes, type)
      memBlock.attach(this.monitor)
      for (let i = 0; i < bytes; i++) {
        this.allocationArray[memBlock.address + i] = type
      }
      if (type === 'Volatile') {
        this.memBlocks.push([memBlock.address, memBlock.size])
      }
      return memBlock
    }

    // Otherwise we need to find the smallest possible address block and
    // break it until we have a small enough piece
    const splitIndex = (() => {
      for (let i = startingIndex; i < this.bitmap.length; i++) {
        if (this.bitmap[i] && this.bitmap[i].address !== undefined) {
          return i
        }
      }
      throw new Error(`Cannot allocate ${bytes} bytes`)
    })()

    const blockToSplit = this.pop(splitIndex)
    let address = blockToSplit.address

    // We have found a valid block for 2^{splitIndex} bytes
    // Split into: 2^{startingIndex}, 2^{startingIndex}, ... 2^{splitIndex - 1}
    for (let i = splitIndex - 1 ; i >= startingIndex; i--) {
      // Prepend array
      const curr = this.bitmap[i]
      this.bitmap[i] = {address, next: curr}
      // Increment the address
      address += Math.pow(2, i + this.minExp)
    }
    // Finally, the block of memory that remains free can be given to allocation
    const memBlock = new MemoryBlock(address, bytes, type)
    memBlock.attach(this.monitor)
    for (let i = 0; i < bytes; i++) {
      this.allocationArray[memBlock.address + i] = type
    }
    if (type === 'Volatile') {
      this.memBlocks.push([memBlock.address, memBlock.size])
    }
    return memBlock
  }

  mfree(address: number, bytes: number) {
    // We are freeing bytes back into our system
    // To make things easy on us, let's always assume we can free 2^n bytes
    // without some sort of offset (ie. 6 bytes rounds up to 8 bytes)
    const startingIndex = Math.ceil(Math.log2(bytes / this.minBytes))
    // Prepend array
    const curr = this.bitmap[startingIndex]
    // This command wipes the memory's value by not actually copying it over
    // back into our bitmap.
    // In a standard C-lang OS, this memory would likely need to be explicitly
    // rewritten or wiped on reassignment to prevent data leakage
    // between processes.
    // This function also does not check the ownership of the memory. One may
    // potentially free memory that was already free.
    this.bitmap[startingIndex] = {address, next: curr}

    // Look to remove from our volatile memory blocks array
    for (let i = 0; i < bytes; i++) {
      this.allocationArray[address + i] = '' // Empty string
    }
    for (let i = 0; i < this.memBlocks.length; i++) {
      if (this.memBlocks[i][0] === address) {
        this.memBlocks.splice(i, 1)
      }
    }
  }

  free(memory: MemoryBlock) {
    // Helper function to directly free memory from our data structure
    this.mfree(memory.address, memory.size)
  }
}
