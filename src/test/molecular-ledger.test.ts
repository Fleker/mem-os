import test from 'ava'
import { prerequisite, enqueue } from '../molecular-ledger'

test('Atom - Success', async t => {
  const successfulAtom = prerequisite('network')
    .enqueue(() => Promise.resolve())
    .operations[0]
  await successfulAtom.exec()
  t.is(successfulAtom.ready, true)
  t.is(successfulAtom.failed, false)
})

test('Atom - Fail', async t => {
  const failedAtom = prerequisite('network')
    .enqueue(() => Promise.reject())
    .operations[0]
  try {
    await failedAtom.exec()
    t.fail('Should reject')
  } catch (e) {}
  t.is(failedAtom.ready, true)
  t.is(failedAtom.failed, true)
})

test('Atom - Prerequisite fail', async t => {
  const badPrereqAtom = prerequisite('testfail')
    .enqueue(() => Promise.resolve())
    .operations[0]
  try {
    await badPrereqAtom.exec()
    t.fail('Should reject')
  } catch (e) {}
  t.is(badPrereqAtom.ready, false)
  t.is(badPrereqAtom.failed, false)
})

test('Atom - No Prerequsities', async t => {
  const noPrereqAtom = enqueue(() => Promise.resolve())
    .operations[0]
  await noPrereqAtom.exec()
  t.is(noPrereqAtom.ready, true)
  t.is(noPrereqAtom.failed, false)
})

test('Backup photos from local storage', async t => {
  const backup = prerequisite('network')
    .enqueue(() => Promise.resolve())
    .enqueue(() => Promise.resolve())
  t.is(backup.resolvedIndex, 0)
  t.is(backup.operationLength, 2)
  await backup.exec()
  t.is(backup.status().done, true)
  t.is(backup.status().failed, false)
})
