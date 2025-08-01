# estree-walker

Simple utility for walking an [ESTree](https://github.com/estree/estree)-compliant AST, such as one generated by [acorn](https://github.com/marijnh/acorn).

## Installation

```bash
npm i estree-walker
```

## Usage

```js
var walk = require('estree-walker').walk;
var acorn = require('acorn');

ast = acorn.parse(sourceCode, options); // https://github.com/acornjs/acorn

walk(ast, {
	enter(node, parent, prop, index) {
		// some code happens
	},
	leave(node, parent, prop, index) {
		// some code happens
	},
});
```

Inside the `enter` function, calling `this.skip()` will prevent the node's children being walked, or the `leave` function (which is optional) being called.

Call `this.replace(new_node)` in either `enter` or `leave` to replace the current node with a new one.

Call `this.remove()` in either `enter` or `leave` to remove the current node.

## Why not use estraverse?

The ESTree spec is evolving to accommodate ES6/7. I've had a couple of experiences where [estraverse](https://github.com/estools/estraverse) was unable to handle an AST generated by recent versions of acorn, because it hard-codes visitor keys.

estree-walker, by contrast, simply enumerates a node's properties to find child nodes (and child lists of nodes), and is therefore resistant to spec changes. It's also much smaller. (The performance, if you're wondering, is basically identical.)

None of which should be taken as criticism of estraverse, which has more features and has been battle-tested in many more situations, and for which I'm very grateful.

## License

MIT
