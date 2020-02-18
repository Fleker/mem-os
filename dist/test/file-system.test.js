import test from 'ava';
import FileSystem from '../file-system';
import BitmapMemory from '../bitmap-memory';
test('File system - Create', t => {
    const memory = new BitmapMemory({ minBytes: 2, physicalSize: 512 });
    const fs = new FileSystem({
        memory,
        inodeSize: 4
    });
    const testFile = fs.create('/file.txt');
    t.is(testFile.data.address, 508); // 512-4
});
test('File system - Read/Update', t => {
    const memory = new BitmapMemory({ minBytes: 2, physicalSize: 512 });
    const fs = new FileSystem({
        memory,
        inodeSize: 4
    });
    const testFile = fs.create('/file.txt');
    t.is(testFile.data.address, 508); // 512-4
    fs.update('/file.txt', 'ABCDEFGHIJKLMNOP');
    t.is(testFile.data.address, 508);
    t.is(testFile.data.next.address, 496);
    t.is(testFile.data.next.next.address, 500);
    t.is(testFile.data.next.next.next.address, 504);
    // Reduce number of inodes
    fs.update('/file.txt', 'ABCDEFGH');
    t.is(testFile.data.address, 508);
    t.is(testFile.data.next.address, 496);
    t.is(testFile.data.next.next, undefined);
    const contents = fs.read('/file.txt');
    t.is('ABCDEFGH', contents);
    // Increase number of inodes again
    fs.update('/file.txt', 'ABCDEFGHIJKLMNOP');
    t.is(testFile.data.address, 508);
    t.is(testFile.data.next.address, 496);
    t.is(testFile.data.next.next.address, 500);
    t.is(testFile.data.next.next.next.address, 504);
    const contents2 = fs.read('/file.txt');
    t.is('ABCDEFGHIJKLMNOP', contents2);
});
test('File System - Delete', t => {
    const memory = new BitmapMemory({ minBytes: 2, physicalSize: 512 });
    const fs = new FileSystem({
        memory,
        inodeSize: 4
    });
    const testFile = fs.create('/file.txt');
    t.is(testFile.data.address, 508); // 512-4
    fs.delete('/file.txt');
    t.is(fs.root.children.length, 0);
});
test('Directory system', t => {
    const memory = new BitmapMemory({ minBytes: 2, physicalSize: 512 });
    const fs = new FileSystem({
        memory,
        inodeSize: 4
    });
    fs.createDirectory('/demo');
    t.is(fs.root.children.length, 1);
    t.true(fs.root.children[0].isDirectory);
    fs.create('/demo/test.txt');
    t.false(fs.listDirectory('/demo')[0].isDirectory);
    t.is(fs.listDirectory('/demo')[0].name, 'test.txt');
    fs.deleteDirectory('/demo');
    t.is(fs.root.children.length, 0);
});
//# sourceMappingURL=file-system.test.js.map