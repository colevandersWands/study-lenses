import * as steps from './tables/steps.js';
import * as values from './tables/values.js';
import * as operators from './tables/operators.js';

export class TraceTable extends HTMLElement {
	constructor() {
		super();
		this.shadow = this.attachShadow({ mode: 'open' });
	}

	static get observedAttributes() {
		return ['steps', 'operators'];
	}

	connectedCallback() {
		this.render();
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (this.isConnected) {
			this.render();
		}
	}

	getTableType() {
		if (this.hasAttribute('steps')) return 'steps';
		if (this.hasAttribute('operators')) return 'operators';
		return 'values'; // default
	}

	getTableModule(type) {
		switch (type) {
			case 'steps':
				return steps;
			case 'operators':
				return operators;
			default:
				return values;
		}
	}

	render() {
		// Clear previous content
		this.shadow.innerHTML = '';

		// Determine table type from attributes
		const tableType = this.getTableType();
		const module = this.getTableModule(tableType);

		// Create container structure
		const closableDiv = document.createElement('div');

		// Add CSS
		this.shadow.innerHTML = module.style;
		this.shadow.appendChild(closableDiv);

		// Add HTML content
		const tableContainer = document.createElement('div');
		tableContainer.innerHTML = module.table;
		closableDiv.appendChild(tableContainer);

		// Initialize behaviors
		module.init(this.shadow);

		// Add close handler
		this.setupCommonBehavior();
	}

	setupCommonBehavior() {
		// Close button handler
		const closeButton = this.shadow.getElementById('close-button');
		if (closeButton) {
			const closeTable = () => {
				if (this.parentElement) {
					this.parentElement.removeChild(this);
				}
			};
			closeButton.addEventListener('click', closeTable);
		}

		// jQuery dragging setup (if jQuery is available)
		if (typeof window.$ !== 'undefined') {
			$(this)
				.draggable()
				.dblclick(() => {
					$(this).draggable({ disabled: false });
				})
				.click(() => {
					$(this).draggable({ disabled: true });
				});
		}

		// Set positioning styles
		this.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      z-index: 1500;
    `;
	}
}

// could eventually have the table type configured by an attribute
//  <trace-table steps></trace-table>
if (!customElements.get('trace-table')) {
	customElements.define('trace-table', TraceTable);
}
