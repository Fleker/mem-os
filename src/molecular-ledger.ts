export class MolecularLedger {
  molecules: Array<Molecule>

  constructor() {
    this.molecules = []
  }

  append(molecule: Molecule) {
    this.molecules.push(molecule)
    molecule.exec()
    return molecule
  }

  restart() {
    this.molecules
      .filter(molecule => molecule.failed && !molecule.done)
      .forEach(molecule => molecule.exec())
  }
}

export class Atom {
  operation: () => Promise<any>
  prerequisites: Array<() => Promise<any>>
  ready: boolean
  failed: boolean

  constructor(prereqs: Array<() => Promise<any>>, task: () => Promise<any>) {
    this.operation = task
    this.prerequisites = prereqs
    this.ready = false
    this.failed = false
  }

  async exec() {
    this.ready = false
    // Check that all pre-reqs are completed
    if (this.prerequisites.length > 0) {
      try {
        await Promise.all(this.prerequisites.map(pre => pre()))
      } catch (e) {
        return Promise.reject(e)
      }
    }
    this.ready = true
    // Run operation
    try {
      await this.operation()
    } catch (e) {
      this.failed = true
      return Promise.reject(e)
    }
    return Promise.resolve()
  }
}

export class Molecule {
  operations: Array<Atom>
  resolvedIndex: number
  operationLength: number
  failed: boolean
  done: boolean
  prereqs: Array<() => Promise<any>>

  constructor() {
    this.operations = []
    this.prereqs = []
    this.resolvedIndex = 0
    this.operationLength = 0
    this.failed = false
    this.done = false
  }

  prerequisite(condition: Condition) {
    this.prereqs.push(conditionMap.get(condition)!)
    return this
  }

  enqueue(task: () => Promise<any>) {
    this.operationLength++
    this.operations.push(new Atom([...this.prereqs], task))
    return this
  }

  async exec() {
    for (let i = this.resolvedIndex; i < this.operationLength; i++) {
      try {
        await this.operations[i].exec()
        this.resolvedIndex++
      } catch (e) {
        this.failed = true
        return Promise.reject(e)
      }
    }
    this.done = true
    return Promise.resolve()
  }

  status() {
    return {
      failed: this.failed,
      done: this.done
    }
  }
}

export type Condition = 'network' | 'charging' | 'testpass' | 'testfail'

type ConditionMap = Map<Condition, () => Promise<void>>

const conditionMap: ConditionMap = new Map<Condition, () => Promise<void>>()
  .set('network', () => Promise.resolve())
  .set('charging', () => Promise.resolve())
  .set('testpass', () => Promise.resolve())
  .set('testfail', () => Promise.reject('test'))

export const prerequisite = (condition: Condition) => {
  return new Molecule().prerequisite(condition)
}

export const enqueue = (task: () => Promise<any>) => {
  return new Molecule().enqueue(task)
}
