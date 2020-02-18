import test from 'ava'
import ProcessTable, { Process } from '../process-table'
import BitmapMemory from '../bitmap-memory'

test('Initialize the process table', t => {
  const processTable = new ProcessTable({})
  t.is(processTable.processes.length, 1) // Kernel
})

test('Manage process lifecycle', async t => {
  const processTable = new ProcessTable({})
  processTable.create(new Process({pid: 1, name: 'Test'}))
  t.deepEqual(processTable.list(), [0, 1])
  t.is(processTable.print(1).name, 'Test')
  await processTable.kill(1)
  t.deepEqual(processTable.list(), [0])
})

test('Children processes', async t => {
  const memory = new BitmapMemory({minBytes: 2, physicalSize: 64})
  const processTable = new ProcessTable({memory})
  const testProcess = new Process({pid: 1, name: 'Parent'})
  processTable.create(testProcess)
  testProcess.malloc(2)
  t.deepEqual(testProcess.memoryAlloc, {
    baseRegister: 62,
    limitRegister: 2
  })

  // Create forked process
  const babyProcess = new Process({pid: 2, name: 'Baby'})
  testProcess.fork(babyProcess)
  processTable.create(babyProcess)
  t.deepEqual(processTable.list(), [0, 1, 2])

  // Kill parent and child at the same time
  await processTable.kill(1)
  t.deepEqual(processTable.list(), [0])
})
