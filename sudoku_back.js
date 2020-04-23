class Coord {
    constructor(x, y) {
        'use strict';
        this.props = { x: x, y: y };
        Object.freeze(this.props);
    }
    get x () {
        'use strict';
        return this.props.x;
    }
    get y () {
        'use strict';
        return this.props.y;
    }
    static resolveIndex(x) {
        'use strict';
        return new Coord(x % 9,Math.floor(x / 9));
    }
    static resolvePosition({ x, y }) {
        return x + 9 * y;
    }
    static resolveRegion({ x, y }) {
        return new Coord(Math.floor(x / 3) * 3, Math.floor(y / 3) * 3);
    }
}

class CoordSet {
    constructor () {
        'use strict';
        this.set = new Map();
        for (const c of arguments) { this.add(c); }
    }
    has({ x, y }) {
        return this.set.has(`${x}${y}`);
    }
    add({ x, y }) {
        const n = `${x}${y}`
        if (!this.has(n)) { return this.set.set(n, { x, y }); }
    }
    remove({ x, y }) {
        return this.set.delete(`${x}${y}`);
    }
    forEach() {
        'use strict';
        return this.set.forEach(...arguments);
    }
    keys() {
        'use strict';
        return this.set.keys();
    }
    values() {
        'use strict';
        return this.set.values();
    }
    entries() {
        'use strict';
        return this.set.entries();
    }
    clear() {
        'use strict';
        return this.set.clear();
    }
    static generateNeighbors({ x, y }) {
        const s = new CoordSet();
        for (let z = 0; z < 9; z++) {
            s.add(new Coord(z, y));
            s.add(new Coord(x, z));
        }
        const { x: rx, y: ry } = Coord.resolveRegion({ x, y });
        for (let i = rx; i < rx + 3; i += 1) {
            for (let j = ry; j < ry + 3; j += 1) {
                s.add(new Coord(i, j));
            }
        }
        s.remove({ x, y });
        return s;
    }
}

class Cell {
    constructor( p, v ) {
        'use strict';
        if (!(p instanceof Coord)) {
            p = typeof p === 'number' ? Coord.resolveIndex(p) : new Coord(p.x, p.y);
        }
        this.props = {
            pos: p,
            value: null,
            neighbors: CoordSet.generateNeighbors(p)
        }
        if ( 'value' in p && ( typeof p.value === 'number' || p.value === null ) ) {
            this.value = p.value;
        }
        else if ( v && ( typeof v === 'number' || v === null ) ) {
            this.value = v;
        }
    }
    get x () {
        'use strict';
        return this.props.pos.x;
    }
    get y () {
        'use strict';
        return this.props.pos.y;
    }
    get pos () {
        'use strict';
        return this.props.pos;
    }
    set value(value) {
        'use strict';
        this.props.value = value;
    }
    get value () {
        'use strict';
        return this.props.value;
    }
    get neighbors () {
        'use strict';
        return this.props.neighbors;
    }
}

class Sudoku {
    constructor(complexity) {
        'use strict';
        complexity = complexity || 10;
        this.props = {
            cells: Array(81).fill(null).map((_, i) => new Cell(Coord.resolveIndex(i))),
            soluce: [],
            complexity: complexity
        };
        Object.freeze(this.props);
        // console.time('Sudoku Filling');
        this.fillCells();
        // console.timeEnd('Sudoku Filling');
        // console.time('Sudoku Backed-up');
        this.backupGrid();
        // console.timeEnd('Sudoku Backed-up');
        // console.time('Sudoku Emptied');
        this.solveCells();
        // console.timeEnd('Sudoku Emptied');
    }
    static shuffle(a) {
        'use strict';
        const l = [...a];
        for (let i = l.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            [l[i], l[j]] = [l[j], l[i]];
        }
        return l;
    }
    static getValidValues() {
        'use strict';
        return [1, 2, 3, 4, 5, 6, 7, 8, 9];
    }
    set cells(l) {
        'use strict';
        this.props.cells = l;
    }
    get cells() {
        'use strict';
        return this.props.cells;
    }
    set complexity(v) {
        this.props.complexity = v;
    }
    get complexity() {
        return this.props.complexity;
    }
    get soluce() {
        return this.props.soluce;
    }
    import(l) {
        if (l.every(c => 'x' in c && 'y' in c && 'value' in c)) {
            const nl = Sudoku.generateCells();
            for (const c of l) {
                nl[Coord.resolvePosition(c)] = new Cell(c);
            }
            this.cells = [...nl];
        }
        else
        if (l.every(c => typeof c === 'number' || c === null)) {
            if (l.length === 81) {
                this.cells = l.map((c, x) => new Cell(x, c));
            }
        }
    }
    getEmptyCells() {
        return this.cells.filter(c => c.value === null);
    }
    getValuesFromCoordSet(set) {
        'use strict';
        return new Set([...set.values()].map(c => this.valueAt(c)));
    }
    getAvailableValues(set) {
        'use strict';
        const vv = Sudoku.getValidValues();
        const vs = this.getValuesFromCoordSet(set);
        return vv.filter(v => !vs.has(v));
    }
    getShuffleValues(set) {
        'use strict';
        return Sudoku.shuffle(this.getAvailableValues(set));
    }
    backupGrid() {
        this.props.soluce.push(...this.cells.map(c => c.value));
    }
    columns(x) {
        const cols = [];
        for (let i = 0; i < 9; i += 1) {
            cols[i] = this.valueAt({ x, y: i });
        }
        return cols;
    }
    rows(y) {
        const rows = [];
        for (let i = 0; i < 9; i += 1) {
            rows[i] = this.valueAt({ x:i, y });
        }
        return rows;
    }
    squares({ x, y }) {
        const square = [];
        let k = 0;
        const region = Coord.resolveRegion({ x, y });
        for (let j = region.x; j < region.x + 3; j += 1){
            for (let i = region.y; i < region.y + 3; i += 1){
                square[k++] = this.valueAt({ x: i, y: j });
            }
        }
        return square;
    }
    get values() {
        return this.cells.map(c => c.value);
    }
    fillCells(list) {
        'use strict';
        list = list || [...this.cells];
        const c = list.shift();
        const n = this.getShuffleValues(c.neighbors);
        for (const v of n) {
            c.value = v;
            if (list.length === 0 || this.fillCells(list)) {
                return true;
            }
        }
        c.value = null;
        list.unshift(c);
        return false;
    }
    fillCellsBlock(list) {
        'use strict';
        list = list || this.getEmptyCells();
        let counter = 0;
        const c = list.shift();
        const e = c.value;
        const n = this.getAvailableValues(c.neighbors);
        for (const v of n) {
            c.value = v;
            if (list.length === 0 || this.fillCellsBlock(list)) {
                if (v !== this.soluce[Coord.resolvePosition(c)]) {
                    counter += 1;
                }
            }
        }
        if (counter === 0) {
            return true;
        }
        c.value = e;
        list.unshift(c);
        return false;
    }
    solveCells(list) {
        'use strict';
        const soluce = this.soluce;
        let searching = true;
        while (searching) {
            const indexes = [];
            for (let i = 0, n = 81 - ( 23 + this.complexity ); i < n; i += 1) {
                let x = null;
                do {
                    x = Math.floor(Math.random() * 81);
                } while (this.cells[x].value === null);
                indexes.push(x);
                this.cells[x].value = null;
            }
            if (this.fillCellsBlock()) {
                searching = false;
                for (const x of indexes) this.cells[x].value = null;
                return this.cells;
            }
            else {
                for (const x of indexes) this.cells[x].value = soluce[x];
            }
        }
        return false;
    }
    generateGrid() {
        this.fillCells();
    }
    at(c) {
        'use strict';
        if (typeof c === 'number') {
            return this.cells[c];
        }
        if ('x' in c && 'y' in c) {
            return this.cells[Coord.resolvePosition(c)];
        }
    }
    valueAt(c) {
        'use strict';
        return this.at(c).value;
    }
    setCell(c, value) {
        this.at(c).value = value;
        return this.valueAt(c);
    }
}

let sudoku = null;
let initialized = false;

/**
* @returns {(Window|globalThis)}
*/
function currentGlobal() {
    'use strict';
    if (typeof globalThis !== undefined) return globalThis;
    if (typeof self !== undefined) return self;
    if (typeof window !== undefined) return window;
    if (typeof global !== undefined) return global;
    throw new Error('Unable to get global object.');
}

function wrapMessage(id, data, err) {
    return { id: id, err: err, data: data };
}

self.addEventListener('message', message => {
    let { id, data: { command, func, attr, args } } = message.data;
    
    // console.info( 'command received', command );
    ({
        'init': () => {
            const { complexity } = args.length ? args[0] : {complexity:10};
            sudoku = new Sudoku(complexity);
            // console.info('Sudoku initialized.');
            self.postMessage(wrapMessage(id, sudoku));
            // console.info('Sudoku sent.');
            initialized = true;
        },
        'get': () => {
            if (attr in sudoku) {
                self.postMessage(wrapMessage(id, sudoku[attr]));
                // console.info(`Sudoku.${attr} sent.`);
            }
        },
        'set': () => {
            let arg = args[0];
            if (sudoku.setCell(attr, arg) === arg) {
                self.postMessage(wrapMessage(id, sudoku.valueAt(attr) === arg));
                // console.info(`Sudoku.Cell[${attr}] set to ${arg}.`);
            }
        },
        'call': () => {
            if (func in sudoku) {
                self.postMessage(wrapMessage(id, sudoku[func](...args)));
                // console.info(`Sudoku.${func}(...) sent.`);
            }
        }
    })[command]();
});
