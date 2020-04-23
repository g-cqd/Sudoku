class SudokuHelper {

    constructor() { }
    
    static unicity(list) {
        for (let i = 0, n = list.length; i < n; i += 1) {
            for (let j = i + 1, v = list[i]; j < n; j += 1) {
                if (v !== null && v === list[j]) {
                    return false;
                }
            }
        }
        return true;
    }

}

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
    let { id, data: { command, func, args } } = message.data;
    args = args || [];
    console.info( 'command received', command );
    ({
        'call': () => {
            if (func in SudokuHelper) {
                self.postMessage( wrapMessage( id, SudokuHelper[func](...args) ) );
                console.info( `Sudoku.${func}(...) sent.` );
            }
        }
    })[command]();
});
