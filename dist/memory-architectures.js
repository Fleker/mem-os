export const DRAM = {
    readNs: 10,
    writeNs: 10,
    energyToWrite: 0.005,
    minBytesRead: 1
};
export const NAND_FLASH = {
    readNs: Math.pow(10, 5),
    writeNs: Math.pow(10, 5),
    energyToWrite: 1000,
    minBytesRead: 1024
};
export const HARD_DISK = {
    readNs: 5 * Math.pow(10, 6),
    writeNs: 5 * Math.pow(10, 6),
    energyToWrite: Math.pow(10, 9),
    minBytesRead: 512
};
export const CBRAM = {
    readNs: 10,
    writeNs: 10,
    energyToWrite: 0.1,
    minBytesRead: 1
};
export const SYS_SSD = [NAND_FLASH, DRAM];
export const SYS_HDD = [HARD_DISK, DRAM];
export const SYS_MEM = [CBRAM];
//# sourceMappingURL=memory-architectures.js.map