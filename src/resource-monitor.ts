import MemorySystem from "./memory-system";

export default class {
  reads: number[]
  writes: number[]

  constructor() {
    this.reads = []
    this.writes = []
  }

  calcPerf(system: MemorySystem[]) {
    let readTime = 0, writeTime = 0, energy = 0, power = 0
    this.reads.forEach(bytesRead => {
      system.forEach(memory => {
        readTime += memory.readNs
      })
    })
    this.writes.forEach(bytesWritten => {
      system.forEach(memory => {
        writeTime += memory.writeNs
        const bytes = Math.max(memory.minBytesRead, bytesWritten)
        energy += bytes * memory.energyToWrite * 8
      })
    })
    // picojoules / 3.6e+18 => kWh
    power = energy / (3.6e18) 
    return {
      readTime,
      writeTime,
      energy,
      power
    }
  }

  incRead(bytes: number) {
    this.reads.push(bytes)
  }
  
  incWrite(bytes: number) {
    this.writes.push(bytes)
  }
}
