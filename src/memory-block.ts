import ResourceMonitor from "./resource-monitor"

export type MemType = 'Volatile' | 'Nonvolatile' | 'File'

export default class MemoryBlock {
  private monitor: ResourceMonitor
  readonly address: number
  readonly size: number
  readonly type: MemType
  private _value: string

  constructor(address: number, size: number, type: MemType, value?: string) {
    this.address = address
    this.size = size
    this.type = type
    if (value) this._value = value
  }

  attach(monitor: ResourceMonitor) {
    this.monitor = monitor
  }
  
  get value() {
    this.monitor?.incRead(this.size)
    return this._value
  }

  set value(v) {
    this.monitor?.incWrite(this.size)
    this._value = v
  }
}
