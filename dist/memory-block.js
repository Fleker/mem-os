export default class MemoryBlock {
    constructor(address, size, type, value) {
        this.address = address;
        this.size = size;
        this.type = type;
        if (value)
            this._value = value;
    }
    attach(monitor) {
        this.monitor = monitor;
    }
    get value() {
        var _a;
        (_a = this.monitor) === null || _a === void 0 ? void 0 : _a.incRead(this.size);
        return this._value;
    }
    set value(v) {
        var _a;
        (_a = this.monitor) === null || _a === void 0 ? void 0 : _a.incWrite(this.size);
        this._value = v;
    }
}
//# sourceMappingURL=memory-block.js.map