import test from 'ava';
import ResourceMonitor from '../resource-monitor';
import * as Arch from '../memory-architectures';
test('Editing a 4KB file', t => {
    const resourceMonitor = new ResourceMonitor();
    // Open a 4KB file
    resourceMonitor.incRead(4 * 1024);
    // Make an edit
    resourceMonitor.incWrite(4 * 1024);
    // 8KB => 64 * 1024 bits
    const perfHdd = resourceMonitor.calcPerf(Arch.SYS_HDD);
    t.deepEqual(perfHdd, {
        readTime: 5000010,
        writeTime: 5000010,
        energy: 32768000000163.84,
        power: 0.000009102222222267733 // kWh
    });
    const perfSsd = resourceMonitor.calcPerf(Arch.SYS_SSD);
    t.deepEqual(perfSsd, {
        readTime: 100010,
        writeTime: 100010,
        energy: 32768163.84,
        power: 9.102267733333333e-12 // kWh
    });
    const perfMem = resourceMonitor.calcPerf(Arch.SYS_MEM);
    t.deepEqual(perfMem, {
        readTime: 10,
        writeTime: 10,
        energy: 3276.8,
        power: 9.102222222222222e-16
    });
});
test('Editing video clips', t => {
    const resourceMonitor = new ResourceMonitor();
    // Read two 10MB video files into video editing software
    resourceMonitor.incRead(10 * 1024 * 1024);
    resourceMonitor.incRead(10 * 1024 * 1024);
    // Send video files to the renderer tool, which is a separate 30MB program
    resourceMonitor.incRead(30 * 1024 * 1024);
    // 15MB video is rendered as the output
    resourceMonitor.incWrite(15 * 1024 * 1024);
    const perfHdd = resourceMonitor.calcPerf(Arch.SYS_HDD);
    t.deepEqual(perfHdd, {
        readTime: 15000030,
        writeTime: 5000010,
        energy: 125829120000629150,
        power: 0.0349525333335081 // kWh
    });
    const perfSsd = resourceMonitor.calcPerf(Arch.SYS_SSD);
    t.deepEqual(perfSsd, {
        readTime: 300030,
        writeTime: 100010,
        energy: 125829749145.6,
        power: 3.4952708096e-8 // kWh
    });
    const perfMem = resourceMonitor.calcPerf(Arch.SYS_MEM);
    t.deepEqual(perfMem, {
        readTime: 30,
        writeTime: 10,
        energy: 12582912,
        power: 3.4952533333333333e-12
    });
});
test('Training data for ML', t => {
    const resourceMonitorStd = new ResourceMonitor();
    const resourceMonitorMem = new ResourceMonitor();
    // We have a 1 TB dataset
    // On standard computer architectures, we need to move this data in
    // 16GB increments to not fill RAM
    const readIterations = (1 * 1024 * 1024 * 1024 * 1024) / (16 * 1024 * 1024 * 1024);
    for (let i = 0; i < readIterations; i++) {
        resourceMonitorStd.incRead(16 * 1024 * 1024 * 1024);
    }
    // In a memristive architecture, things can be read without needing to perform
    // a secondary increment operation
    resourceMonitorMem.incRead(1 * 1024 * 1024 * 1024 * 1024);
    // After training our dataset, we end up with a 50 MB model that we write back
    resourceMonitorStd.incWrite(50 * 1024 * 1024);
    resourceMonitorMem.incWrite(50 * 1024 * 1024);
    const perfHdd = resourceMonitorStd.calcPerf(Arch.SYS_HDD);
    t.deepEqual(perfHdd, {
        readTime: 320000640,
        writeTime: 5000010,
        energy: 419430400002097150,
        power: 0.11650844444502699 // kWh
    });
    const perfSsd = resourceMonitorStd.calcPerf(Arch.SYS_SSD);
    t.deepEqual(perfSsd, {
        readTime: 6400640,
        writeTime: 100010,
        energy: 419432497152,
        power: 1.1650902698666666e-7 // kWh
    });
    const perfMem = resourceMonitorMem.calcPerf(Arch.SYS_MEM);
    t.deepEqual(perfMem, {
        readTime: 10,
        writeTime: 10,
        energy: 41943040,
        power: 1.1650844444444444e-11
    });
});
//# sourceMappingURL=resource-monitor.test.js.map