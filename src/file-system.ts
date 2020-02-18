import BitmapMemory from "./bitmap-memory";
import LinkedList from "./linked-list";
import ResourceMonitor from "./resource-monitor";

export interface StorageUnit {
  fullPath: string
  name: string
  isDirectory: boolean
}

export interface FileMetadata {
  size: number
}

export interface File extends StorageUnit {
  metadata: FileMetadata
  data: LinkedList<any> // Memory addresses
}

export interface DirectoryMetadata {
}

export interface Directory extends StorageUnit {
  metadata: DirectoryMetadata
  children: StorageUnit[] // inode everything at some point?
}

export interface FileSystemOptions {
  memory: BitmapMemory
  inodeSize: number
}

export default class FileSystem {
  private monitor: ResourceMonitor
  memory: BitmapMemory
  inodeSize: number
  root: Directory

  constructor(options: FileSystemOptions) {
    this.memory = options.memory
    this.inodeSize = options.inodeSize
    this.root = {
      fullPath: '/',
      name: '',
      metadata: {},
      children: [],
      isDirectory: true
    }
  }

  attach(monitor: ResourceMonitor) {
    this.monitor = monitor
  }

  private traverseDir(dir: Directory, stub: string): Directory {
    if (stub === '') return dir
    for (let i = 0; i < dir.children.length; i++) {
      if (dir.children[i].name === stub) return dir.children[i] as Directory
    }
    throw new Error(`Cannot traverse directory for ${stub}`)
  }

  private traverse(path: string): File {
    const dirs = path.split('/')
    let f: Directory = this.root
    for (let i = 0; i < dirs.length - 1; i++) {
      f = this.traverseDir(f, dirs[i])
    }
    for (let i = 0; i < f.children.length; i++) {
      if (f.children[i].fullPath === path) return f.children[i] as File
    }
    throw new Error(`Cannot traverse files path ${path}`)
  }

  private indexOf(files: StorageUnit[], path: string): number {
    const dirs = path.split('/')
    let f: Directory = this.root
    for (let i = 0; i < dirs.length - 1; i++) {
      f = this.traverseDir(f, dirs[i])
    }
    for (let i = 0; i < f.children.length; i++) {
      if (f.children[i].fullPath === path) return i
    }
    return -1
  }

  create(fullPath: string) {
    const metadata: FileMetadata = {
      size: this.inodeSize
    }
    // Pick memory
    const address = this.memory.malloc(this.inodeSize, 'File')
    const data = new LinkedList<any>(address.address)
    const dirs = fullPath.split('/')
    const name = dirs[dirs.length - 1]
    const file: File = {
      fullPath,
      name,
      metadata,
      data,
      isDirectory: false
    }
    let f: Directory = this.root
    for (let i = 0; i < dirs.length - 1; i++) {
      f = this.traverseDir(f, dirs[i])
    }

    f.children.push(file)
    return file
  }

  createDirectory(fullPath: string) {
    const dirs = fullPath.split('/')
    const name = dirs[dirs.length - 1]
    const newDir: Directory = {
      children: [],
      metadata: {},
      fullPath,
      name,
      isDirectory: true
    }
    let f: Directory = this.root
    for (let i = 0; i < dirs.length - 1; i++) {
      f = this.traverseDir(f, dirs[i])
    }
    f.children.push(newDir)
    return newDir
  }

  read(path: string) {
    const file = this.traverse(path)
    let data = ''
    let node = file.data
    do {
      data += node.value
      this.monitor?.incRead(node.value.length)
      node = node.next!
    } while (node)
    return data
  }

  listDirectory(fullPath: string) {
    const dirs = fullPath.split('/')
    let f: Directory = this.root
    for (let i = 0; i < dirs.length; i++) {
      f = this.traverseDir(f, dirs[i])
    }
    return f.children
  }

  update(path: string, data: string) {
    const file = this.traverse(path)

    // Check if we need to allocate more memory
    const memoryToBeAllocated = Math.ceil(data.length / this.inodeSize) -
        Math.ceil(file.metadata.size / this.inodeSize)
    const newAddresses = []
    if (memoryToBeAllocated > 0) {
      // Allocate new addresses
      for (let i = 0; i < memoryToBeAllocated; i++) {
        const block = this.memory.malloc(this.inodeSize, 'File')
        newAddresses.push(block)
      }
    } else if (memoryToBeAllocated < 0) {
      // Free memory
      let node = file.data
      let i = Math.ceil(data.length / this.inodeSize)
      do {
        if (i <= 0) {
          this.memory.mfree(node.address, this.inodeSize)
        }
        i--
        node = node.next!
      } while (node)
      // Break links
      node = file.data
      i = Math.ceil(data.length / this.inodeSize)
      do {
        if (i === 1) {
          node.next = undefined
        }
        i--
        node = node.next!
      } while (node)
    }

    // Perform data replacement
    let node = file.data
    let i = 0;
    do {
      node.value = data.substring(i, i + this.inodeSize)
      i += this.inodeSize
      if (!node.next && newAddresses.length) {
        const address = newAddresses.pop()!
        node.next = new LinkedList(address.address)
      }
      this.monitor?.incWrite(node.value.length)
      node = node.next!
    } while (node)
    file.metadata.size = data.length
    return file
  }

  delete(path: string) {
    const file = this.traverse(path)

    // Delete all memory
    let node = file.data
    do {
      this.memory.mfree(node.address, this.inodeSize)
      node = node.next!
    } while (node)

    file.data.next = undefined
    file.data.value = undefined

    const dirs = path.split('/')
    let f: Directory = this.root
    for (let i = 0; i < dirs.length - 1; i++) {
      f = this.traverseDir(f, dirs[i])
    }

    f.children.splice(this.indexOf(f.children, path), 1)
    return true
  }

  deleteDirectory(fullPath: string) {
    const dirs = fullPath.split('/')
    let f: Directory = this.root
    for (let i = 0; i < dirs.length - 1; i++) {
      f = this.traverseDir(f, dirs[i])
    }
    const index = this.indexOf(f.children, fullPath)
    const dirToDelete = f.children[index] as Directory
    // Recursive delete
    dirToDelete.children.forEach(storage => {
      if (storage.isDirectory) {
        this.deleteDirectory(storage.fullPath)
      } else {
        this.delete(storage.fullPath)
      }
    })
    f.children.splice(index, 1)
  }
}
