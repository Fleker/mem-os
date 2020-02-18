import test from 'ava'
import FileSystem from '../file-system'
import BitmapMemory from '../bitmap-memory'
import ResourceMonitor from '../resource-monitor'
import { SYS_MEM } from '../memory-architectures'

test('Integration - File system I/O', t => {
  const monitor = new ResourceMonitor()
  const memory = new BitmapMemory({minBytes: 2, physicalSize: 512})
  const fs = new FileSystem({
    memory,
    inodeSize: 4
  })

  fs.attach(monitor)

  fs.create('/file.txt')
  fs.update('/file.txt', 'ABCDEFGH')
  const contents = fs.read('/file.txt')
  t.is('ABCDEFGH', contents)

  t.deepEqual(monitor.calcPerf(SYS_MEM), {
    readTime: 20,
    writeTime: 20,
    energy: 6.4,
    power: 1.7777777777777777e-18,
  })
})

test('Integration - Memory System', t => {
  const monitor = new ResourceMonitor()
  const bitmap = new BitmapMemory({minBytes: 2, physicalSize: 64})
  bitmap.attach(monitor)

  const allocation = bitmap.malloc(64)
  allocation.value = 'ABCDEF'
  t.is(allocation.value, 'ABCDEF')

  t.deepEqual(monitor.calcPerf(SYS_MEM), {
    readTime: 10,
    writeTime: 10,
    energy: 4.800000000000001,
    power: 1.3333333333333336e-18
  })
})
