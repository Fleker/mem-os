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
import { prerequisite, enqueue } from '../molecular-ledger';
test('Atom - Success', (t) => __awaiter(void 0, void 0, void 0, function* () {
    const successfulAtom = prerequisite('network')
        .enqueue(() => Promise.resolve())
        .operations[0];
    yield successfulAtom.exec();
    t.is(successfulAtom.ready, true);
    t.is(successfulAtom.failed, false);
}));
test('Atom - Fail', (t) => __awaiter(void 0, void 0, void 0, function* () {
    const failedAtom = prerequisite('network')
        .enqueue(() => Promise.reject())
        .operations[0];
    try {
        yield failedAtom.exec();
        t.fail('Should reject');
    }
    catch (e) { }
    t.is(failedAtom.ready, true);
    t.is(failedAtom.failed, true);
}));
test('Atom - Prerequisite fail', (t) => __awaiter(void 0, void 0, void 0, function* () {
    const badPrereqAtom = prerequisite('testfail')
        .enqueue(() => Promise.resolve())
        .operations[0];
    try {
        yield badPrereqAtom.exec();
        t.fail('Should reject');
    }
    catch (e) { }
    t.is(badPrereqAtom.ready, false);
    t.is(badPrereqAtom.failed, false);
}));
test('Atom - No Prerequsities', (t) => __awaiter(void 0, void 0, void 0, function* () {
    const noPrereqAtom = enqueue(() => Promise.resolve())
        .operations[0];
    yield noPrereqAtom.exec();
    t.is(noPrereqAtom.ready, true);
    t.is(noPrereqAtom.failed, false);
}));
test('Backup photos from local storage', (t) => __awaiter(void 0, void 0, void 0, function* () {
    const backup = prerequisite('network')
        .enqueue(() => Promise.resolve())
        .enqueue(() => Promise.resolve());
    t.is(backup.resolvedIndex, 0);
    t.is(backup.operationLength, 2);
    yield backup.exec();
    t.is(backup.status().done, true);
    t.is(backup.status().failed, false);
}));
//# sourceMappingURL=molecular-ledger.test.js.map