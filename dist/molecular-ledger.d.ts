export declare class MolecularLedger {
    molecules: Array<Molecule>;
    constructor();
    append(molecule: Molecule): Molecule;
    restart(): void;
}
export declare class Atom {
    operation: () => Promise<any>;
    prerequisites: Array<() => Promise<any>>;
    ready: boolean;
    failed: boolean;
    constructor(prereqs: Array<() => Promise<any>>, task: () => Promise<any>);
    exec(): Promise<void>;
}
export declare class Molecule {
    operations: Array<Atom>;
    resolvedIndex: number;
    operationLength: number;
    failed: boolean;
    done: boolean;
    prereqs: Array<() => Promise<any>>;
    constructor();
    prerequisite(condition: Condition): this;
    enqueue(task: () => Promise<any>): this;
    exec(): Promise<void>;
    status(): {
        failed: boolean;
        done: boolean;
    };
}
export declare type Condition = 'network' | 'charging' | 'testpass' | 'testfail';
export declare const prerequisite: (condition: Condition) => Molecule;
export declare const enqueue: (task: () => Promise<any>) => Molecule;
