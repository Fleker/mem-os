var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export class MolecularLedger {
    constructor() {
        this.molecules = [];
    }
    append(molecule) {
        this.molecules.push(molecule);
        molecule.exec();
        return molecule;
    }
    restart() {
        this.molecules
            .filter(molecule => molecule.failed && !molecule.done)
            .forEach(molecule => molecule.exec());
    }
}
export class Atom {
    constructor(prereqs, task) {
        this.operation = task;
        this.prerequisites = prereqs;
        this.ready = false;
        this.failed = false;
    }
    exec() {
        return __awaiter(this, void 0, void 0, function* () {
            this.ready = false;
            // Check that all pre-reqs are completed
            if (this.prerequisites.length > 0) {
                try {
                    yield Promise.all(this.prerequisites.map(pre => pre()));
                }
                catch (e) {
                    return Promise.reject(e);
                }
            }
            this.ready = true;
            // Run operation
            try {
                yield this.operation();
            }
            catch (e) {
                this.failed = true;
                return Promise.reject(e);
            }
            return Promise.resolve();
        });
    }
}
export class Molecule {
    constructor() {
        this.operations = [];
        this.prereqs = [];
        this.resolvedIndex = 0;
        this.operationLength = 0;
        this.failed = false;
        this.done = false;
    }
    prerequisite(condition) {
        this.prereqs.push(conditionMap.get(condition));
        return this;
    }
    enqueue(task) {
        this.operationLength++;
        this.operations.push(new Atom([...this.prereqs], task));
        return this;
    }
    exec() {
        return __awaiter(this, void 0, void 0, function* () {
            for (let i = this.resolvedIndex; i < this.operationLength; i++) {
                try {
                    yield this.operations[i].exec();
                    this.resolvedIndex++;
                }
                catch (e) {
                    this.failed = true;
                    return Promise.reject(e);
                }
            }
            this.done = true;
            return Promise.resolve();
        });
    }
    status() {
        return {
            failed: this.failed,
            done: this.done
        };
    }
}
const conditionMap = new Map()
    .set('network', () => Promise.resolve())
    .set('charging', () => Promise.resolve())
    .set('testpass', () => Promise.resolve())
    .set('testfail', () => Promise.reject('test'));
export const prerequisite = (condition) => {
    return new Molecule().prerequisite(condition);
};
export const enqueue = (task) => {
    return new Molecule().enqueue(task);
};
//# sourceMappingURL=molecular-ledger.js.map