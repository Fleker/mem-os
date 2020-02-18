import LinkedList from "./linked-list";
export default class FileSystem {
    constructor(options) {
        this.memory = options.memory;
        this.inodeSize = options.inodeSize;
        this.root = {
            fullPath: '/',
            name: '',
            metadata: {},
            children: [],
            isDirectory: true
        };
    }
    attach(monitor) {
        this.monitor = monitor;
    }
    traverseDir(dir, stub) {
        if (stub === '')
            return dir;
        for (let i = 0; i < dir.children.length; i++) {
            if (dir.children[i].name === stub)
                return dir.children[i];
        }
        throw new Error(`Cannot traverse directory for ${stub}`);
    }
    traverse(path) {
        const dirs = path.split('/');
        let f = this.root;
        for (let i = 0; i < dirs.length - 1; i++) {
            f = this.traverseDir(f, dirs[i]);
        }
        for (let i = 0; i < f.children.length; i++) {
            if (f.children[i].fullPath === path)
                return f.children[i];
        }
        throw new Error(`Cannot traverse files path ${path}`);
    }
    indexOf(files, path) {
        const dirs = path.split('/');
        let f = this.root;
        for (let i = 0; i < dirs.length - 1; i++) {
            f = this.traverseDir(f, dirs[i]);
        }
        for (let i = 0; i < f.children.length; i++) {
            if (f.children[i].fullPath === path)
                return i;
        }
        return -1;
    }
    create(fullPath) {
        const metadata = {
            size: this.inodeSize
        };
        // Pick memory
        const address = this.memory.malloc(this.inodeSize, 'File');
        const data = new LinkedList(address.address);
        const dirs = fullPath.split('/');
        const name = dirs[dirs.length - 1];
        const file = {
            fullPath,
            name,
            metadata,
            data,
            isDirectory: false
        };
        let f = this.root;
        for (let i = 0; i < dirs.length - 1; i++) {
            f = this.traverseDir(f, dirs[i]);
        }
        f.children.push(file);
        return file;
    }
    createDirectory(fullPath) {
        const dirs = fullPath.split('/');
        const name = dirs[dirs.length - 1];
        const newDir = {
            children: [],
            metadata: {},
            fullPath,
            name,
            isDirectory: true
        };
        let f = this.root;
        for (let i = 0; i < dirs.length - 1; i++) {
            f = this.traverseDir(f, dirs[i]);
        }
        f.children.push(newDir);
        return newDir;
    }
    read(path) {
        var _a;
        const file = this.traverse(path);
        let data = '';
        let node = file.data;
        do {
            data += node.value;
            (_a = this.monitor) === null || _a === void 0 ? void 0 : _a.incRead(node.value.length);
            node = node.next;
        } while (node);
        return data;
    }
    listDirectory(fullPath) {
        const dirs = fullPath.split('/');
        let f = this.root;
        for (let i = 0; i < dirs.length; i++) {
            f = this.traverseDir(f, dirs[i]);
        }
        return f.children;
    }
    update(path, data) {
        var _a;
        const file = this.traverse(path);
        // Check if we need to allocate more memory
        const memoryToBeAllocated = Math.ceil(data.length / this.inodeSize) -
            Math.ceil(file.metadata.size / this.inodeSize);
        const newAddresses = [];
        if (memoryToBeAllocated > 0) {
            // Allocate new addresses
            for (let i = 0; i < memoryToBeAllocated; i++) {
                const block = this.memory.malloc(this.inodeSize, 'File');
                newAddresses.push(block);
            }
        }
        else if (memoryToBeAllocated < 0) {
            // Free memory
            let node = file.data;
            let i = Math.ceil(data.length / this.inodeSize);
            do {
                if (i <= 0) {
                    this.memory.mfree(node.address, this.inodeSize);
                }
                i--;
                node = node.next;
            } while (node);
            // Break links
            node = file.data;
            i = Math.ceil(data.length / this.inodeSize);
            do {
                if (i === 1) {
                    node.next = undefined;
                }
                i--;
                node = node.next;
            } while (node);
        }
        // Perform data replacement
        let node = file.data;
        let i = 0;
        do {
            node.value = data.substring(i, i + this.inodeSize);
            i += this.inodeSize;
            if (!node.next && newAddresses.length) {
                const address = newAddresses.pop();
                node.next = new LinkedList(address.address);
            }
            (_a = this.monitor) === null || _a === void 0 ? void 0 : _a.incWrite(node.value.length);
            node = node.next;
        } while (node);
        file.metadata.size = data.length;
        return file;
    }
    delete(path) {
        const file = this.traverse(path);
        // Delete all memory
        let node = file.data;
        do {
            this.memory.mfree(node.address, this.inodeSize);
            node = node.next;
        } while (node);
        file.data.next = undefined;
        file.data.value = undefined;
        const dirs = path.split('/');
        let f = this.root;
        for (let i = 0; i < dirs.length - 1; i++) {
            f = this.traverseDir(f, dirs[i]);
        }
        f.children.splice(this.indexOf(f.children, path), 1);
        return true;
    }
    deleteDirectory(fullPath) {
        const dirs = fullPath.split('/');
        let f = this.root;
        for (let i = 0; i < dirs.length - 1; i++) {
            f = this.traverseDir(f, dirs[i]);
        }
        const index = this.indexOf(f.children, fullPath);
        const dirToDelete = f.children[index];
        // Recursive delete
        dirToDelete.children.forEach(storage => {
            if (storage.isDirectory) {
                this.deleteDirectory(storage.fullPath);
            }
            else {
                this.delete(storage.fullPath);
            }
        });
        f.children.splice(index, 1);
    }
}
//# sourceMappingURL=file-system.js.map