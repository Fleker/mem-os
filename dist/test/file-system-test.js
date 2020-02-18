"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = require("ava");
const file_system_1 = require("../file-system");
const bitmap_memory_1 = require("../bitmap-memory");
ava_1.default('Test File System CRUD', t => {
    const bitmap = new bitmap_memory_1.default({ minBytes: 4, physicalSize: 512 });
    const fs = new file_system_1.default({
        memory: bitmap,
        inodeSize: 4
    });
    const testFile = fs.create('file.txt');
    console.log(testFile.data.address);
    fs.update('file.txt', 'ABCDEFGHIJKLMNOP');
    console.log(testFile.data);
    const contents = fs.read('file.txt');
    console.log(contents);
    fs.delete('file.txt');
    console.log(fs.files);
});
//# sourceMappingURL=file-system-test.js.map