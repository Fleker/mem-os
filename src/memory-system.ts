export default interface MemorySystem {
  readNs: number        // Nanoseconds
  writeNs: number       // Nanoseconds
  energyToWrite: number // Picojoules per bit
  minBytesRead: number
}
