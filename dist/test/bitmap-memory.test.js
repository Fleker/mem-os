import test from 'ava';
import BitmapMemory from '../bitmap-memory';
test('Large bitmap initializes', t => {
    // 128, 256, 512
    const bitmap = new BitmapMemory({ minBytes: 128, physicalSize: 512 });
    t.is(bitmap.peekIndex(2), 0); // Address 0
    t.true(bitmap.canAlloc(64));
    t.true(bitmap.canAlloc(128));
    t.false(bitmap.canAlloc(1024));
});
test('Simple memory allocation', t => {
    const bitmap = new BitmapMemory({ minBytes: 2, physicalSize: 64 });
    t.is(bitmap.peekIndex(5), 0); // Address 0
    t.true(bitmap.canAlloc(64));
    const allocation = bitmap.malloc(64);
    t.is(0, allocation.address);
});
test('Splitting bitmap memory allocation', t => {
    /**
     * In this test I want to make sure that when I split memory I am correctly
     * splitting the largest block into smaller blocks of each size.
     *
     * | BYTES | ADDRESSES |        | BYTES | ADDRESSES |
     * |     2 |           |        |     2 | 60        |
     * |     4 |           |        |     4 | 56        |
     * |     8 |           |   =>   |     8 | 48        |
     * |    16 |           |        |    16 | 32        |
     * |    32 |           |        |    32 | 0         |
     * |    64 | 0         |        |    64 |           |
     *
     *  malloc address 62 as the final batch of memory
     */
    const bitmap = new BitmapMemory({ minBytes: 2, physicalSize: 64 });
    t.true(bitmap.canAlloc(2));
    const allocation = bitmap.malloc(2);
    t.is(allocation.address, 62);
    // Check split occurred correctly
    t.is(bitmap.peekIndex(4), 0);
    t.is(bitmap.peekIndex(3), 32);
    t.is(bitmap.peekIndex(2), 48);
    t.is(bitmap.peekIndex(1), 56);
    t.is(bitmap.peekIndex(0), 60);
});
test('Bitmap memory allocation and subsequent freeing', t => {
    /**
     * In this test I want to make sure that when I split memory I am correctly
     * splitting the largest block into smaller blocks of each size.
     *
     * | BYTES | ADDRESSES |        | BYTES | ADDRESSES |
     * |     2 |           |        |     2 | 62 -> 60  |
     * |     4 |           |        |     4 | 56        |
     * |     8 |           |   =>   |     8 | 48        |
     * |    16 |           |        |    16 | 32        |
     * |    32 |           |        |    32 | 0         |
     * |    64 | 0         |        |    64 |           |
     *
     *  malloc address 62 as the final batch of memory
     */
    const bitmap = new BitmapMemory({ minBytes: 2, physicalSize: 64 });
    t.true(bitmap.canAlloc(2));
    const allocation = bitmap.malloc(2);
    t.is(allocation.address, 62);
    t.is(allocation.size, 2);
    bitmap.mfree(62, 2);
    t.is(bitmap.peekIndex(0), 62); // 62 -> 60
    t.deepEqual(bitmap.traverseAddresses(0), [62, 60]);
    const allocationTwo = bitmap.malloc(4);
    t.is(allocationTwo.address, 56);
    bitmap.free(allocationTwo);
    t.is(bitmap.peekIndex(1), 56); // We put it back
});
//# sourceMappingURL=bitmap-memory.test.js.map