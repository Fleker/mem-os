export default class LinkedList<T> {
    address: number;
    next?: LinkedList<T>;
    value?: T;
    constructor(address: number, value?: T);
}
