var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import test from 'ava';
import ProcessTable, { Process } from '../process-table';
import BitmapMemory from '../bitmap-memory';
test('Initialize the process table', t => {
    const processTable = new ProcessTable({});
    t.is(processTable.processes.length, 1); // Kernel
});
test('Manage process lifecycle', (t) => __awaiter(void 0, void 0, void 0, function* () {
    const processTable = new ProcessTable({});
    processTable.create(new Process({ pid: 1, name: 'Test' }));
    t.deepEqual(processTable.list(), [0, 1]);
    t.is(processTable.print(1).name, 'Test');
    yield processTable.kill(1);
    t.deepEqual(processTable.list(), [0]);
}));
test('Children processes', (t) => __awaiter(void 0, void 0, void 0, function* () {
    const memory = new BitmapMemory({ minBytes: 2, physicalSize: 64 });
    const processTable = new ProcessTable({ memory });
    const testProcess = new Process({ pid: 1, name: 'Parent' });
    processTable.create(testProcess);
    testProcess.malloc(2);
    t.deepEqual(testProcess.memoryAlloc, {
        baseRegister: 62,
        limitRegister: 2
    });
    // Create forked process
    const babyProcess = new Process({ pid: 2, name: 'Baby' });
    testProcess.fork(babyProcess);
    processTable.create(babyProcess);
    t.deepEqual(processTable.list(), [0, 1, 2]);
    // Kill parent and child at the same time
    yield processTable.kill(1);
    t.deepEqual(processTable.list(), [0]);
}));
//# sourceMappingURL=process-table.test.js.map