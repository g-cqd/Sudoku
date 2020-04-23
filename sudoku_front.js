class Coord {
	constructor(x, y) {
		'use strict';
		this.props = { x: x, y: y };
		Object.freeze(this.props);
	}
	get x() {
		'use strict';
		return this.props.x;
	}
	get y() {
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
		return { x: Math.floor(x / 3) * 3, y: Math.floor(y / 3) * 3 };
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
		if (!this.has(n)) { return this.set.set(n, c); }
	}
	remove({ x, y }) {
		const n = `${x}${y}`;
		if (this.has(n)) { return this.set.delete(n); }
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
		const { x: rx, y: ry } = Cell.resolveRegion({ x, y });
		for (let i = rx; i < rx + 3; i += 1) {
			for (let j = ry; j < ry + 3; j += 1) {
				s.add(new Coord(i, j));
			}
		}
		s.remove(new Coord(x, y));
		return s;
	}
}

class Cell {
	constructor({ p, v, r, s, f }) {
		this.props = {
			pos: p,
			value: v || null,
			readonly: r || false,
			focused: f || false,
			sudoku: s
		};
		// Coordinates
		const { x, y } = p; 
		// Set Authorized Key Codes Lists
		const movementKeyCodeList = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'];
		const resetKeyCodeList = ['0', ' ', 'Backspace'];
		const inputKeyCodeList = ['1', '2', '3', '4', '5', '6', '7', '8', '9', ...resetKeyCodeList];
		const authorizedKeyCodes = [...movementKeyCodeList, ...inputKeyCodeList];
		// Create the HTML Element to Control <Case> Object
		this.input = ecs({
			$: 'input',
			id: `sd-${x}-${y}`,
			class: ['sd-input', ...(r ? ['sd-readonly'] : [])],
			attr: { type: 'number', min: 1, max: 9, value: v, autocomplete: 'off', pattern: '[1-9]', ...(r ? { readonly: true } : {}) },
			events: [
				['keypress', inhibitEvent],
				['keyup', inhibitEvent],
				['keydown', event => {
					// Inhib Event Behavior
					inhibitEvent(event);
					// Get some Key triggered and Value of input
					const { key } = event;
					const { value, x, y, sudoku } = this;
					if (authorizedKeyCodes.includes(key)) {
						if (movementKeyCodeList.includes(key)) {
							switch (key) {
								case 'ArrowUp': {
									try { sudoku.at({ x: x, y: y - 1 }).focus(); }
									catch (_) { }
									break;
								}
								case 'ArrowDown': {
									try { sudoku.at({ x: x, y: y + 1 }).focus(); }
									catch (_) { }
									break;
								}
								case 'ArrowLeft': {
									try { sudoku.at({ x: x - 1, y: y }).focus(); }
									catch (_) { }
									break;
								}
								case 'ArrowRight': {
									try { sudoku.at({ x: x + 1, y: y }).focus(); }
									catch (_) { }
									break;
								}
								case 'Tab': {
									try { sudoku.at({ x: x + 1, y: y }).focus(); }
									catch (_) {
										try { sudoku.at({ x: 0, y: y + 1 }).focus(); }
										catch (_) { }
									}
									break;
								}
								default: {
									break;
								}
							}
						}
						else if (!this.readonly && inputKeyCodeList.includes(key)) {
							if (resetKeyCodeList.includes(key)) { this.setValue(null); }
							else { this.setValue(Number(key)); }
							when.delay(async () => console.info('Sudoku correct ?', await sudoku.checkCell(this)));
						}
						else { this.setValue(value); }
					}
				}],
				['focusout', () => this.blur()],
				['blur', () => this.blur()]
			]
		});
	}
	get x() {
		'use strict';
		return this.props.pos.x;
	}
	get y() {
		'use strict';
		return this.props.pos.y;
	}
	get pos() {
		'use strict';
		return this.props.pos;
	}
	get sudoku() {
		'use strict';
		return this.props.sudoku;
	}
	set readonly(value) {
		'use strict';
		this.props.readonly = value;
		if (this.readonly) {
		    addClass( this.input, 'sd-readonly' );
		    this.input.setAttribute('readonly', true);
		}
		else {
		    removeClass(this.input, 'sd-readonly');
		    this.input.removeAttribute('readonly');
		}
	}
	get readonly() {
		'use strict';
		return this.props.readonly;
	}
	set focused(value) {
		'use strict';
		this.props.focused = !!value;
		return this.props.focused;
	}
	get focused() {
		'use strict';
		return this.props.focused;
	}
	set value(value) {
		'use strict';
		this.props.value = value;
		this.input.value = value;
	}
	async setValue(value) {
		'use strict';
		const oldValue = this.value;
		if (typeof value === 'number' && value > 0 && value < 10 || value === null) {
			if (await this.sudoku.setCell(Coord.resolvePosition(this.pos), value)) {
				this.value = value;
			}
			else {
				this.sudoku.setCell(Coord.resolvePosition(this.pos), oldValue);
				this.value = oldValue;
			}
		}
	}
	get value() {
		'use strict';
		return Number(this.input.value) === this.props.value ? this.props.value : false;
	}
	html() {
		'use strict';
		return this.input;
	}
	focus() {
		'use strict';
		this.focused = true;
		this.input.focus();
		return this;
	}
	blur() {
		'use strict';
		this.focused = false;
		this.input.blur();
		return this;
	}
}

class Sudoku {
	constructor({htmlElement,complexity}) {
		this.props = {
			focused: null,
			complexity: complexity || 10,
			grid: Array(81).fill(null).map((_, i) => new Cell({ p: Coord.resolveIndex(i), s: this })),
			worker: new PromiseWorker('sudoku_back.js'),
			helper: new PromiseWorker('sudoku_helper.js'),
			htmlElement: htmlElement
		};
		this.insert();
		this.init(this.complexity);
	}
	set complexity(value) {
		this.props.complexity = value;
		id('sd-complexity').value = 10 - value;
	}
	get complexity() {
		return this.props.complexity;
	}
	get parent() {
		'use strict';
		return this.props.htmlElement;
	}
	get grid() {
		'use strict';
		return this.props.grid;
	}
	get worker() {
		'use strict';
		return this.props.worker;
	}
	get helper() {
		'use strict';
		return this.props.helper;
	}
	set focused(c) {
		'use strict';
		this.props.focused = this.at(c).focus();
	}
	get focused() {
		'use strict';
		return this.props.focused;
	}
	get layout() {
		'use strict';
		return this.props.layout;
	}
	async columns() {
		return await this.worker.postMessage({ command: 'get', attr: 'columns' });
	}
	async rows() {
		return await this.worker.postMessage({ command: 'get', attr: 'rows' });
	}
	at(c) {
		'use strict';
		if (typeof c === 'number') {
            return this.grid[c];
		}
		else
        if ('x' in c && 'y' in c) {
            return this.grid[Coord.resolvePosition(c)];
        }
	}
	valueAt(c) {
        return this.at(c).value;
	}
	createNewWorker() {
		this.props.worker = new PromiseWorker('sudoku_back.js');

	}
	async init(c) {
		c = c || 10;
		await this.worker.postMessage({ command: 'init', args: [{complexity:c}] });
		const [values, complexity] = await Promise.all([
			this.worker.postMessage({ command: 'get', attr: 'values' }),
			this.worker.postMessage({ command: 'get', attr: 'complexity' })
		]);
		values.forEach( async (v, x) => {
			const cell = this.at(x);
			cell.setValue(v);
			cell.readonly = v !== null;
		});
		this.complexity = complexity;
	}
	html() {
		return ecs({
			$: 'article', id: 'sudoku', _: [{
				$: 'section',
				class: ['sd-body'],
				_: [{
					class: ['sd-grid'],
					_: Array(9).fill().map((_, x) => ecs({
						class: ['sd-region'],
						_: Array(9).fill().map((_, i) => {
							const [rx, ry] = [x % 3, Math.floor(x / 3)];
							const [ix, iy] = [i % 3, Math.floor(i / 3)];
							return ecs({ class: ['sd-cell'], _: [this.at({ x: rx * 3 + ix, y: ry * 3 + iy }).html()] });
						})
					}))
				}]
			}, {
				$: 'aside',
				class: ['sd-panel'],
				_: [{
					$: 'form',
					_: [{
						$: 'label',
						_: [
							{ $: 'span', class: ['sd-sp-label'], _: ['Difficulty'] },
							{
								$: 'input',
								id: "sd-complexity",
								class: ['sd-pan-input'],
								attr: { type: 'number', min: '0', max: '9', value: 10 - this.complexity },
								events: [
									['change', event => {
										inhibitEvent(event);
										this.createNewWorker();
										this.init(10 - Number(event.target.value));
									}]
								]
							}
						]
					},
					{ $:'label', _: [ { $:'input', attr:{ type:'button', value: '-' }, events:
					[ ['click',event=>{inhibitEvent(event);id('sd-complexity').value++;id('sd-complexity').dispatchEvent(new Event('change') );}] ] } ] },
					{ $:'label', _: [ { $:'input', attr:{ type:'button', value: '+' }, events:
					[ ['click',event=>{inhibitEvent(event);id('sd-complexity').value--;id('sd-complexity').dispatchEvent(new Event('change') );}] ] } ] },
					],
					events: [
                        ['submit',inhibitEvent]
					]
				}]
			}]
		});
	}
	insert() {
		this.parent.appendChild(this.html());
	}
	async setCell(c, value) {
		return await this.worker.postMessage({command:'set',attr:c,args:[value]})
	}
	async checkColumn(c) {
		const { x } = c;
		const column = await this.worker.postMessage({ command: 'call', func: 'columns', args: [x] });
		return await this.helper.postMessage({ command: 'call', func: 'unicity', args: [column] });
	}
	async checkRow(c) {
		const { y } = c;
		const row = await this.worker.postMessage({ command: 'call', func: 'rows', args: [y] });
		return await this.helper.postMessage({ command: 'call', func: 'unicity', args: [row] });
	}
	async checkSquare(c) {
		const { x, y } = c;
		const square = await this.worker.postMessage({ command: 'call', func: 'squares', args: [{ x, y }] });
		return await this.helper.postMessage({ command: 'call', func: 'unicity', args: [square] });
	}
	async checkCell(c) {
		const self = this;
		const [i, j, k] = await Promise.all([
			self.checkColumn(c),
			self.checkRow(c),
			self.checkSquare(c)
		]);
		const bool = i && j && k;
		console.log('grid :', bool);
		return bool;
	}
}

const s = new Sudoku({ htmlElement: id('sudoku'), layout: 'grid' });