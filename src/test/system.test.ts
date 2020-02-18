import test from 'ava'

import FileSystem from '../file-system'
import BitmapMemory from '../bitmap-memory'
import ResourceMonitor from '../resource-monitor'
import NvmMemoryManager from '../nvm-memory'
import System from '../system'
import ProcessTable from '../process-table'

test('Verify only volatile memory resets', t => {
  const monitor = new ResourceMonitor()
  const memory = new BitmapMemory({minBytes: 2, physicalSize: 512})
  const files = new FileSystem({
    memory,
    inodeSize: 4
  })
  const nvmMemory = new NvmMemoryManager({memory})
  const process = new ProcessTable({memory, files})

  const system = new System({monitor, memory, files, nvmMemory, process})

  files.create('/file.txt')
  files.update('/file.txt', 'ABCDEFGH')
  const volatileBlock = memory.malloc(4)
  volatileBlock.value = 'ABCD'
  const nvmBlock = nvmMemory.malloc(4)
  nvmBlock.value = 'ABCD'

  system.restart()
  const contents = files.read('/file.txt')
  t.is('ABCDEFGH', contents)
  t.is('ABCD', nvmBlock.value)
})