(function () {
	function r(e, n, t) {
		function o(i, f) {
			if (!n[i]) {
				if (!e[i]) {
					var c = 'function' == typeof require && require;
					if (!f && c) return c(i, !0);
					if (u) return u(i, !0);
					var a = new Error("Cannot find module '" + i + "'");
					throw ((a.code = 'MODULE_NOT_FOUND'), a);
				}
				var p = (n[i] = { exports: {} });
				e[i][0].call(
					p.exports,
					function (r) {
						var n = e[i][1][r];
						return o(n || r);
					},
					p,
					p.exports,
					r,
					e,
					n,
					t
				);
			}
			return n[i].exports;
		}
		for (
			var u = 'function' == typeof require && require, i = 0;
			i < t.length;
			i++
		)
			o(t[i]);
		return o;
	}
	return r;
})()(
	{
		1: [
			function (require, module, exports) {
				window.Aran = require('./lib/main.js');
				window.Acorn = require('acorn');
				window.Astring = require('astring');
			},
			{ './lib/main.js': 21, acorn: 34, astring: 36 },
		],
		2: [
			function (require, module, exports) {
				const ArrayLite = require('array-lite');
				const Escape = require('./escape.js');
				const Build = require('../build');
				const Visit = require('./visit.js');

				const abruptize = (name, serial, trap, block) =>
					name
						? Build.BLOCK(
								[],
								Build.Try(
									[],
									block,
									Build.BLOCK(
										[],
										Build.Throw(
											trap[name](
												Build.read('error'),
												serial
											)
										)
									),
									Build.BLOCK([], [])
								)
							)
						: block;

				exports.BLOCK = (
					{ 1: identifiers, 2: statements, 3: serial },
					trap,
					tag,
					labels
				) =>
					abruptize(
						tag === 'program'
							? 'failure'
							: tag === 'closure'
								? 'abrupt'
								: null,
						serial,
						trap,
						Build.BLOCK(
							ArrayLite.concat(
								tag === 'closure' ? ['argindex'] : [],
								ArrayLite.map(identifiers, Escape)
							),
							ArrayLite.concat(
								tag === 'closure'
									? trap.Arrival(
											Build.read('callee'),
											Build.read('new.target'),
											Build.read('this'),
											Build.read('arguments'),
											serial
										)
									: [],
								tag === 'closure'
									? Build.Write(
											'argindex',
											Build.primitive(-1)
										)
									: [],
								tag === 'program'
									? trap.Program(
											Build.builtin('global'),
											serial
										)
									: [],
								trap.Enter(
									Build.primitive(tag),
									Build.apply(
										Build.builtin('Array.of'),
										Build.primitive(void 0),
										ArrayLite.map(labels, (label) =>
											Build.primitive(label)
										)
									),
									Build.apply(
										Build.builtin('Array.of'),
										Build.primitive(void 0),
										ArrayLite.map(
											identifiers,
											(identifier) =>
												Build.primitive(identifier)
										)
									),
									serial
								),
								tag === 'program' || tag === 'eval'
									? statements.length === 0 ||
										statements[statements.length - 1][0] !==
											'Expression'
										? (() => {
												throw new Error(
													'Invalid program/eval'
												);
											})()
										: ArrayLite.concat(
												ArrayLite.flatMap(
													ArrayLite.slice(
														statements,
														0,
														statements.length - 1
													),
													(statement) =>
														Visit.Statement(
															statement,
															trap
														)
												),
												tag === 'program'
													? Build.Expression(
															trap.success(
																Visit.expression(
																	statements[
																		statements.length -
																			1
																	][1],
																	trap
																),
																serial
															)
														)
													: Build.Expression(
															Visit.expression(
																statements[
																	statements.length -
																		1
																][1],
																trap
															)
														)
											)
									: ArrayLite.concat(
											ArrayLite.flatMap(
												statements,
												(statement) =>
													Visit.Statement(
														statement,
														trap
													)
											),
											tag === 'switch' &&
												ArrayLite.every(
													statements,
													(statement) =>
														statement[0] !==
															'Case' ||
														statement[1]
												)
												? Build.Case(null)
												: [],
											trap.Leave(serial)
										)
							)
						)
					);
			},
			{
				'../build': 11,
				'./escape.js': 3,
				'./visit.js': 8,
				'array-lite': 35,
			},
		],
		3: [
			function (require, module, exports) {
				module.exports = (identifier) =>
					identifier === 'new.target'
						? '$0newtarget'
						: '$' + identifier;
			},
			{},
		],
		4: [
			function (require, module, exports) {
				(function (global) {
					(function () {
						const ArrayLite = require('array-lite');
						const Escape = require('./escape');
						const Build = require('../build');
						const Visit = require('./visit.js');

						const Error = global.Error;

						exports.trap = (
							{ 1: name, 2: expressions, 3: serial },
							trap
						) => {
							throw new Error(
								'trap expression should not appear here'
							);
						};

						exports.closure = ({ 1: block, 2: serial }, trap) =>
							trap.closure(
								Build.closure(
									Visit.BLOCK(block, trap, 'closure', [])
								),
								serial
							);

						exports.error = ({ 1: serial }, trap) =>
							trap.error(Build.read('error'), serial);

						exports.argument = ({ 1: string, 2: serial }, trap) =>
							string === 'next'
								? trap.argument(
										Build.apply(
											Build.builtin('Reflect.get'),
											Build.primitive(void 0),
											[
												Build.read('arguments'),
												Build.write(
													'argindex',
													Build.binary(
														'+',
														Build.read('argindex'),
														Build.primitive(1)
													),
													Build.read('argindex')
												),
											]
										),
										Build.read('argindex'),
										serial
									)
								: trap.argument(
										string === 'length'
											? Build.apply(
													Build.builtin(
														'Reflect.get'
													),
													Build.primitive(void 0),
													[
														Build.read('arguments'),
														Build.primitive(
															'length'
														),
													]
												)
											: Build.read(string),
										Build.primitive(string),
										serial
									);

						exports.sequence = (
							{ 1: expression1, 2: expression2, 3: serial },
							trap
						) =>
							Build.sequence(
								trap.drop(
									Visit.expression(expression1, trap),
									serial
								),
								Visit.expression(expression2, trap)
							);

						exports.apply = (
							{
								1: expression1,
								2: expression2,
								3: expressions,
								4: serial,
							},
							trap
						) =>
							trap.apply(
								Visit.expression(expression1, trap),
								Visit.expression(expression2, trap),
								ArrayLite.map(expressions, (expression) =>
									Visit.expression(expression, trap)
								),
								serial
							);

						exports.construct = (
							{ 1: expression, 2: expressions, 3: serial },
							trap
						) =>
							trap.construct(
								Visit.expression(expression, trap),
								ArrayLite.map(expressions, (expression) =>
									Visit.expression(expression, trap)
								),
								serial
							);

						exports.builtin = ({ 1: string, 2: serial }, trap) =>
							trap.builtin(
								Build.builtin(string),
								Build.primitive(string),
								serial
							);

						exports.primitive = ({ 1: value, 2: serial }, trap) =>
							trap.primitive(Build.primitive(value), serial);

						exports.read = ({ 1: identifier, 2: serial }, trap) =>
							trap.read(
								Build.read(Escape(identifier)),
								Build.primitive(identifier),
								serial
							);

						exports.write = (
							{
								1: identifier,
								2: expression1,
								3: expression2,
								4: serial,
							},
							trap
						) =>
							Build.write(
								Escape(identifier),
								trap.write(
									Visit.expression(expression1, trap),
									Build.primitive(identifier),
									serial
								),
								Visit.expression(expression2, trap)
							);

						exports.eval = ({ 1: expression, 2: serial }, trap) =>
							Build.eval(
								trap.eval(
									Visit.expression(expression, trap),
									serial
								)
							);

						exports.conditional = (
							{
								1: expression1,
								2: expression2,
								3: expression3,
								4: serial,
							},
							trap
						) =>
							Build.conditional(
								trap.test(
									Visit.expression(expression1, trap),
									serial
								),
								Visit.expression(expression2, trap),
								Visit.expression(expression3, trap)
							);

						exports.unary = (
							{ 1: operator, 2: expression, 3: serial },
							trap
						) =>
							trap.unary(
								operator,
								Visit.expression(expression, trap),
								serial
							);

						exports.binary = (
							{
								1: operator,
								2: expression1,
								3: expression2,
								4: serial,
							},
							trap
						) =>
							trap.binary(
								operator,
								Visit.expression(expression1, trap),
								Visit.expression(expression2, trap),
								serial
							);
					}).call(this);
				}).call(
					this,
					typeof global !== 'undefined'
						? global
						: typeof self !== 'undefined'
							? self
							: typeof window !== 'undefined'
								? window
								: {}
				);
			},
			{
				'../build': 11,
				'./escape': 3,
				'./visit.js': 8,
				'array-lite': 35,
			},
		],
		5: [
			function (require, module, exports) {
				const Trap = require('./trap.js');
				const Visit = require('./visit.js');

				const Reflect_getOwnPropertyDescriptor =
					Reflect.getOwnPropertyDescriptor;

				module.exports = (block, pointcut, nodes) =>
					Visit.BLOCK(
						block,
						Trap(pointcut, nodes),
						Reflect_getOwnPropertyDescriptor(
							nodes[block[3]],
							'AranCounter'
						)
							? 'program'
							: 'eval',
						[]
					);
			},
			{ './trap.js': 7, './visit.js': 8 },
		],
		6: [
			function (require, module, exports) {
				const ArrayLite = require('array-lite');
				const Escape = require('./escape');
				const Build = require('../build');
				const Visit = require('./visit.js');

				exports.Expression = ({ 1: expression, 2: serial }, trap) =>
					Build.Expression(
						trap.drop(Visit.expression(expression, trap), serial)
					);

				exports.Write = (
					{ 1: identifier, 2: expression, 3: serial },
					trap
				) =>
					Build.Write(
						Escape(identifier),
						trap.write(
							Visit.expression(expression, trap),
							Build.primitive(identifier),
							serial
						)
					);

				exports.Break = ({ 1: label, 2: serial }, trap) =>
					ArrayLite.concat(
						trap.Break(Build.primitive(label), serial),
						Build.Break(label)
					);

				exports.Continue = ({ 1: label, 2: serial }, trap) =>
					ArrayLite.concat(
						trap.Continue(Build.primitive(label), serial),
						Build.Continue(label)
					);

				exports.Debugger = ({ 1: serial }, trap) =>
					ArrayLite.concat(trap.Debugger(serial), Build.Debugger());

				exports.Return = ({ 1: expression, 2: serial }, trap) =>
					Build.Return(
						trap.return(Visit.expression(expression, trap), serial)
					);

				exports.Throw = ({ 1: expression, 2: serial }, trap) =>
					Build.Throw(
						trap.throw(Visit.expression(expression, trap), serial)
					);

				exports.Block = ({ 1: labels, 2: block, 3: serial }, trap) =>
					Build.Block(
						labels,
						Visit.BLOCK(block, trap, 'block', labels)
					);

				exports.If = (
					{
						1: labels,
						2: expression,
						3: block1,
						4: block2,
						5: serial,
					},
					trap
				) =>
					Build.If(
						labels,
						trap.test(Visit.expression(expression, trap), serial),
						Visit.BLOCK(block1, trap, 'then', labels),
						Visit.BLOCK(block2, trap, 'else', labels)
					);

				exports.Try = (
					{ 1: labels, 2: block1, 3: block2, 4: block3, 5: serial },
					trap
				) =>
					Build.Try(
						labels,
						Visit.BLOCK(block1, trap, 'try', labels),
						Visit.BLOCK(block2, trap, 'catch', labels),
						Visit.BLOCK(block3, trap, 'finally', labels, trap)
					);

				exports.While = (
					{ 1: labels, 2: expression, 3: block, 4: serial },
					trap
				) =>
					Build.While(
						labels,
						trap.test(Visit.expression(expression, trap), serial),
						Visit.BLOCK(block, trap, 'loop', labels)
					);

				exports.Case = ({ 1: expression, 2: serial }, trap) =>
					Build.Case(
						expression
							? trap.test(
									Visit.expression(expression, trap),
									serial
								)
							: null
					);

				exports.Switch = ({ 1: labels, 2: block, 3: serial }, trap) =>
					Build.Switch(
						labels,
						Visit.BLOCK(block, trap, 'switch', labels)
					);
			},
			{
				'../build': 11,
				'./escape': 3,
				'./visit.js': 8,
				'array-lite': 35,
			},
		],
		7: [
			function (require, module, exports) {
				const ArrayLite = require('array-lite');
				const Enumeration = require('../enumeration.js');
				const Build = require('../build');

				const Reflect_apply = Reflect.apply;
				const String_prototype_toUpperCase =
					String.prototype.toUpperCase;
				const String_prototype_substring = String.prototype.substring;

				module.exports = (pointcut, nodes) => {
					const trap = {};

					ArrayLite.forEach(Enumeration.ModifierTrap, (name) => {
						trap[name] = function () {
							const serial = arguments[arguments.length - 1];
							if (!pointcut(name, nodes[serial]))
								return arguments[0];
							const expressions = ArrayLite.slice(
								arguments,
								0,
								arguments.length - 1
							);
							return Build.trap(name, expressions, serial);
						};
					});

					ArrayLite.forEach(Enumeration.InformerTrap, (name) => {
						const char = Reflect_apply(
							String_prototype_toUpperCase,
							name[0],
							[]
						);
						trap[
							char +
								Reflect_apply(
									String_prototype_substring,
									name,
									[1]
								)
						] = function () {
							const serial = arguments[arguments.length - 1];
							if (!pointcut(name, nodes[serial])) return [];
							const expressions = ArrayLite.slice(
								arguments,
								0,
								arguments.length - 1
							);
							return Build.Expression(
								Build.trap(name, expressions, serial)
							);
						};
					});

					trap.unary = (operator, expression, serial) =>
						pointcut('unary', nodes[serial])
							? Build.trap(
									'unary',
									[Build.primitive(operator), expression],
									serial
								)
							: Build.unary(operator, expression);

					trap.binary = (
						operator,
						expression1,
						expression2,
						serial
					) =>
						pointcut('binary', nodes[serial])
							? Build.trap(
									'binary',
									[
										Build.primitive(operator),
										expression1,
										expression2,
									],
									serial
								)
							: Build.binary(operator, expression1, expression2);

					trap.apply = (
						expression1,
						expression2,
						expressions,
						serial
					) =>
						pointcut('apply', nodes[serial])
							? Build.trap(
									'apply',
									[
										expression1,
										expression2,
										Build.apply(
											Build.builtin('Array.of'),
											Build.primitive(void 0),
											expressions
										),
									],
									serial
								)
							: Build.apply(
									expression1,
									expression2,
									expressions
								);

					trap.construct = (expression, expressions, serial) =>
						pointcut('construct', nodes[serial])
							? Build.trap(
									'construct',
									[
										expression,
										Build.apply(
											Build.builtin('Array.of'),
											Build.primitive(void 0),
											expressions
										),
									],
									serial
								)
							: Build.construct(expression, expressions);

					return trap;
				};
			},
			{ '../build': 11, '../enumeration.js': 12, 'array-lite': 35 },
		],
		8: [
			function (require, module, exports) {
				const Expression = require('./expression.js');
				const Statement = require('./statement.js');
				const Block = require('./block.js');

				exports.expression = (array, trap) =>
					Expression[array[0]](array, trap);
				exports.Statement = (array, trap) =>
					Statement[array[0]](array, trap);
				exports.BLOCK = (array, trap, tag, labels) =>
					Block[array[0]](array, trap, tag, labels);
			},
			{ './block.js': 2, './expression.js': 4, './statement.js': 6 },
		],
		9: [
			function (require, module, exports) {
				const ArrayLite = require('array-lite');
				const Grammar = require('./grammar.js');
				const Illegal = require('../illegal.js');
				const Enumeration = require('../enumeration.js');

				const Array_isArray = Array.isArray;
				const Math_round = Math.round;

				const grammar = (kind) => (value) => {
					if (!Array_isArray(value)) throw 'not-an-array';
					if (typeof value[0] !== 'string') throw 'tag-not-a-string';
					if (!(value[0] in Grammar[kind])) throw 'tag-unrecognized';
					return value;
				};

				const enumeration = (values) => (value) => {
					if (!ArrayLite.includes(values, value))
						throw 'unrecognized';
					return value;
				};

				exports.block = grammar('block');

				exports.statement = grammar('statement');

				exports.expression = grammar('expression');

				exports['nullable-expression'] = (value) =>
					value === null || grammar('expression')(value);

				exports.primitive = (value) => {
					if (value !== null && typeof value === 'object')
						throw 'non-null-object';
					if (typeof value === 'function') throw 'function';
					if (typeof value === 'symbol') throw 'symbol';
					return value;
				};

				exports.serial = (value) => {
					if (typeof value !== 'number') throw 'not-a-number';
					if (value !== value) throw 'NaN';
					if (value < 0) throw 'negative-number';
					if (Math_round(value) !== value) throw 'fractional-number';
					return value;
				};

				exports['nullable-label'] = (value) => {
					if (value !== null && Illegal(value))
						throw 'not-null-and-illegal';
					return value;
				};

				exports.label = (value) => {
					if (Illegal(value)) throw 'illegal';
					return value;
				};

				exports.identifier = (value) => {
					if (typeof value === 'number') {
						if (value !== value) throw 'NaN';
						if (value < 0) throw 'negative-number';
						if (Math_round(value) !== value)
							throw 'fractional-number';
					} else if (
						value !== 'this' &&
						value !== 'new.target' &&
						Illegal(value)
					) {
						throw 'not-a-number-and-illegal';
					}
					return value;
				};

				exports['unary-operator'] = enumeration(
					Enumeration.UnaryOperator
				);

				exports['binary-operator'] = enumeration(
					Enumeration.BinaryOperator
				);

				exports['argument-name'] = enumeration([
					'new.target',
					'this',
					'length',
					'next',
				]);

				exports['trap-name'] = enumeration(
					ArrayLite.concat(
						Enumeration.InformerTrap,
						Enumeration.ModifierTrap,
						Enumeration.CombinerTrap
					)
				);

				exports['builtin-name'] = enumeration(Enumeration.Builtin);
			},
			{
				'../enumeration.js': 12,
				'../illegal.js': 20,
				'./grammar.js': 10,
				'array-lite': 35,
			},
		],
		10: [
			function (require, module, exports) {
				exports.block = {
					BLOCK: [['identifier'], ['statement']],
				};
				exports.statement = {
					Write: ['identifier', 'expression'],
					Expression: ['expression'],
					Break: ['nullable-label'],
					Continue: ['nullable-label'],
					Return: ['expression'],
					Throw: ['expression'],
					Debugger: [],
					If: [['label'], 'expression', 'block', 'block'],
					Try: [['label'], 'block', 'block', 'block'],
					Block: [['label'], 'block'],
					While: [['label'], 'expression', 'block'],
					Switch: [['label'], 'block'],
					Case: ['nullable-expression'],
				};
				exports.expression = {
					closure: ['block'],
					write: ['identifier', 'expression', 'expression'],
					error: [],
					argument: ['argument-name'],
					read: ['identifier'],
					primitive: ['primitive'],
					builtin: ['builtin-name'],
					sequence: ['expression', 'expression'],
					eval: ['expression'],
					conditional: ['expression', 'expression', 'expression'],
					apply: ['expression', 'expression', ['expression']],
					construct: ['expression', ['expression']],
					unary: ['unary-operator', 'expression'],
					binary: ['binary-operator', 'expression', 'expression'],
					trap: ['trap-name', ['expression'], 'serial'],
				};
			},
			{},
		],
		11: [
			function (require, module, exports) {
				const ArrayLite = require('array-lite');
				const Grammar = require('./grammar.js');
				const Check = require('./check.js');

				const Object_keys = Object.keys;
				const Array_isArray = Array.isArray;
				const Array_from = Array.from;
				const JSON_stringify = JSON.stringify;

				const duck = (path, type, value) => {
					if (Array_isArray(type)) {
						if (!Array_isArray(value))
							throw new Error(
								path + ': not-an-array >> ' + print(value)
							);
						if (type.length === 1) {
							for (let index = 0; index < value.length; index++)
								duck(path + '[0]', type[0], value[index]);
						} else {
							if (type.length !== value.length) {
								throw new Error(
									path +
										': length-mismatch >> ' +
										print(value)
								);
							}
							for (let index = 0; index < type.length; index++)
								duck(
									path + '[' + index + ']',
									type[index],
									value[index]
								);
						}
					} else {
						try {
							Check[type](value);
						} catch (message) {
							throw new Error(
								path +
									' (' +
									type +
									'): ' +
									message +
									' >> ' +
									print(value)
							);
						}
					}
				};

				const print = (value) => {
					if (typeof value === 'string') return JSON_stringify(value);
					if (Array_isArray(value)) return '[array]';
					if (typeof value === 'function') return '[function]';
					if (value && typeof value === 'object') return '[object]';
					return String(value);
				};

				ArrayLite.forEach(
					['block', 'statement', 'expression'],
					(kind) => {
						ArrayLite.forEach(
							Object_keys(Grammar[kind]),
							(type) => {
								exports[type] = function () {
									// Comments the line below to disable runtime build checks
									duck(
										type,
										Grammar[kind][type],
										Array_from(arguments)
									);
									const array = ArrayLite.concat(
										[type],
										arguments
									);
									return kind === 'statement'
										? [array]
										: array;
								};
							}
						);
					}
				);
			},
			{ './check.js': 9, './grammar.js': 10, 'array-lite': 35 },
		],
		12: [
			function (require, module, exports) {
				exports.Builtin = [
					'global',
					'eval',
					'RegExp',
					'ReferenceError',
					'TypeError',
					'Reflect.get',
					'Reflect.set',
					'Reflect.has',
					'Reflect.construct',
					'Reflect.apply',
					'Reflect.deleteProperty',
					'Reflect.setPrototypeOf',
					'Reflect.getPrototypeOf',
					'Reflect.defineProperty',
					'Reflect.getOwnPropertyDescriptor',
					'Symbol.unscopables',
					'Symbol.iterator',
					'Object',
					'Object.freeze',
					'Object.keys',
					'Object.create',
					'Object.prototype',
					'Array.of',
					'Array.prototype.concat',
					'Array.prototype.values',
					'Array.prototype.includes',
					'Array.prototype.push',
					"Reflect.getOwnPropertyDescriptor(Function.prototype,'arguments').get",
					"Reflect.getOwnPropertyDescriptor(Function.prototype,'arguments').set",
				];

				exports.UnaryOperator = [
					'-',
					'+',
					'!',
					'~',
					'typeof',
					'void',
					'delete',
				];

				exports.BinaryOperator = [
					'==',
					'!=',
					'===',
					'!==',
					'<',
					'<=',
					'>',
					'>=',
					'<<',
					'>>',
					'>>>',
					'+',
					'-',
					'*',
					'/',
					'%',
					'|',
					'^',
					'&',
					'in',
					'instanceof',
				];

				exports.CombinerTrap = [
					'apply',
					'construct',
					'unary',
					'binary',
				];

				exports.InformerTrap = [
					'program',
					'arrival',
					'enter',
					'leave',
					'continue',
					'break',
					'debugger',
				];

				exports.ModifierTrap = [
					// Bystanders //
					'abrupt',
					'failure',
					// Producers //
					'closure',
					'builtin',
					'primitive',
					'read',
					'argument',
					'error',
					// Consumer //
					'drop',
					'eval',
					'test',
					'write',
					'return',
					'success',
					'throw',
				];
			},
			{},
		],
		13: [
			function (require, module, exports) {
				const ArrayLite = require('array-lite');
				const Sanitize = require('../sanitize.js');
				const Visit = require('./index.js');

				exports.BLOCK = (
					{ 1: identifiers, 2: statements },
					namespace,
					tag
				) => {
					const array1 = identifiers.length
						? [
								{
									type: 'VariableDeclaration',
									kind: 'let',
									declarations: ArrayLite.map(
										identifiers,
										(identifier) => ({
											type: 'VariableDeclarator',
											id: {
												type: 'Identifier',
												name: Sanitize(identifier),
											},
											init: null,
										})
									),
								},
							]
						: [];
					if (tag === 'block') {
						return {
							type: 'BlockStatement',
							body: ArrayLite.concat(
								array1,
								ArrayLite.map(statements, (statement) => {
									return Visit.statement(
										statement,
										namespace
									);
								})
							),
						};
					}
					if (tag === 'program') {
						return {
							type: 'Program',
							body: ArrayLite.concat(
								[
									{
										type: 'ExpressionStatement',
										expression: {
											type: 'Literal',
											value: 'use strict',
										},
									},
								],
								array1,
								ArrayLite.map(statements, (statement) => {
									return Visit.statement(
										statement,
										namespace
									);
								})
							),
						};
					}
					const array2 = [];
					const array3 = [];
					let index = 0;
					while (statements[index][0] !== 'Case') {
						array2[array2.length] = Visit.statement(
							statements[index],
							namespace
						);
						index++;
					}
					while (index < statements.length) {
						if (statements[index][0] === 'Case') {
							array3[array3.length] = Visit.statement(
								statements[index],
								namespace
							);
						} else {
							const array4 = array3[array3.length - 1].consequent;
							array4[array4.length] = Visit.statement(
								statements[index],
								namespace
							);
						}
						index++;
					}
					return {
						type: 'BlockStatement',
						body: ArrayLite.concat(array1, array2, [
							{
								type: 'SwitchStatement',
								discriminant: {
									type: 'Literal',
									value: true,
								},
								cases: array3,
							},
						]),
					};
				};
			},
			{ '../sanitize.js': 18, './index.js': 15, 'array-lite': 35 },
		],
		14: [
			function (require, module, exports) {
				(function (global) {
					(function () {
						const ArrayLite = require('array-lite');
						const Sanitize = require('../sanitize.js');
						const Visit = require('./index.js');

						const Error = global.Error;

						ArrayLite.forEach(['error', 'argument'], (key) => {
							exports[key] = () => {
								throw new Error(
									key + ' should not appear here'
								);
							};
						});

						exports.closure = ({ 1: block }, namespace) => ({
							type: 'FunctionExpression',
							id: {
								type: 'Identifier',
								name: 'callee',
							},
							params: [],
							body: Visit.block(block, namespace, 'block'),
							generator: false,
							expression: false,
							async: false,
						});

						exports.builtin = ({ 1: name }, namespace) => ({
							type: 'MemberExpression',
							computed: true,
							object: {
								type: 'MemberExpression',
								computed: false,
								object: {
									type: 'Identifier',
									name: namespace,
								},
								property: {
									type: 'Identifier',
									name: 'builtins',
								},
							},
							property: {
								type: 'Literal',
								value: name,
							},
						});

						exports.primitive = ({ 1: value }, namespace) =>
							value === void 0
								? {
										type: 'UnaryExpression',
										prefix: true,
										operator: 'void',
										argument: {
											type: 'Literal',
											value: 0,
										},
									}
								: value !== value ||
									  value === 1 / 0 ||
									  value === -1 / 0
									? {
											type: 'BinaryExpression',
											operator: '/',
											left: {
												type: 'Literal',
												value:
													value === 1 / 0
														? 1
														: value === -1 / 0
															? -1
															: 0,
											},
											right: {
												type: 'Literal',
												value: 0,
											},
										}
									: {
											type: 'Literal',
											value: value,
										};

						exports.read = ({ 1: identifier }, namespace) =>
							identifier === 'this'
								? {
										type: 'ThisExpression',
									}
								: identifier === 'new.target'
									? {
											type: 'MetaProperty',
											meta: {
												type: 'Identifier',
												name: 'new',
											},
											property: {
												type: 'Identifier',
												name: 'target',
											},
										}
									: {
											type: 'Identifier',
											name: Sanitize(identifier),
										};

						exports.unary = (
							{ 1: operator, 2: expression },
							namespace
						) => ({
							type: 'UnaryExpression',
							operator: operator,
							prefix: true,
							argument: Visit.expression(expression, namespace),
						});

						exports.binary = (
							{ 1: operator, 2: expression1, 3: expression2 },
							namespace
						) => ({
							type: 'BinaryExpression',
							operator: operator,
							left: Visit.expression(expression1, namespace),
							right: Visit.expression(expression2, namespace),
						});

						exports.write = (
							{ 1: identifier, 2: expression1, 3: expression2 },
							namespace
						) => ({
							type: 'SequenceExpression',
							expressions: [
								{
									type: 'AssignmentExpression',
									operator: '=',
									left: {
										type: 'Identifier',
										name: Sanitize(identifier),
									},
									right: Visit.expression(
										expression1,
										namespace
									),
								},
								Visit.expression(expression2, namespace),
							],
						});

						exports.conditional = (
							{ 1: expression1, 2: expression2, 3: expression3 },
							namespace
						) => ({
							type: 'ConditionalExpression',
							test: Visit.expression(expression1, namespace),
							consequent: Visit.expression(
								expression2,
								namespace
							),
							alternate: Visit.expression(expression3, namespace),
						});

						exports.sequence = (
							{ 1: expression1, 2: expression2 },
							namespace
						) => ({
							type: 'SequenceExpression',
							expressions: [
								Visit.expression(expression1, namespace),
								Visit.expression(expression2, namespace),
							],
						});

						exports.eval = ({ 1: expression }, namespace) => ({
							type: 'CallExpression',
							callee: {
								type: 'Identifier',
								name: 'eval',
							},
							arguments: [
								Visit.expression(expression, namespace),
							],
						});

						exports.construct = (
							{ 1: expression, 2: expressions },
							namespace
						) =>
							expression[0] === 'builtin' &&
							expression[1] === 'RegExp' &&
							expressions.length === 2 &&
							expressions[0][0] === 'primitive' &&
							typeof expressions[0][1] === 'string' &&
							expressions[1][0] === 'primitive' &&
							typeof expressions[1][1] === 'string' &&
							ArrayLite.every(
								expressions[1][1],
								(character, index, string) =>
									ArrayLite.includes('gimuy', character) &&
									ArrayLite.lastIndexOf(string, character) ===
										index
							)
								? {
										type: 'Literal',
										regex: {
											pattern: expressions[0][1],
											flags: expressions[1][1],
										},
									}
								: {
										type: 'NewExpression',
										callee: Visit.expression(
											expression,
											namespace
										),
										arguments: ArrayLite.map(
											expressions,
											(expression) =>
												Visit.expression(
													expression,
													namespace
												)
										),
									};

						exports.apply = (
							{ 1: expression1, 2: expression2, 3: expressions },
							namespace
						) => {
							if (
								expression2[0] === 'primitive' &&
								expression2[1] === void 0
							) {
								if (
									expression1[0] === 'builtin' &&
									expression1[1] === 'Array.of'
								) {
									return {
										type: 'ArrayExpression',
										elements: ArrayLite.map(
											expressions,
											(expression) => {
												return Visit.expression(
													expression,
													namespace
												);
											}
										),
									};
								}
								if (
									expression1[0] === 'builtin' &&
									expression1[1] === 'Object.fromEntries' &&
									expressions.length === 1
								) {
									const node = Visit.expression(
										expressions[0],
										namespace
									);
									if (
										node.type === 'ArrayExpression' &&
										ArrayLite.every(
											node.elements,
											(node) =>
												node.type ===
													'ArrayExpression' &&
												node.elements.length === 2
										)
									) {
										return {
											type: 'ObjectExpression',
											properties: ArrayLite.map(
												node.elements,
												(node) => ({
													type: 'Property',
													kind: 'init',
													computed: true,
													key: node.elements[0],
													value: node.elements[1],
												})
											),
										};
									}
								}
								if (
									expression1[0] === 'builtin' &&
									expression1[1] === 'Reflect.get' &&
									expressions.length === 2
								) {
									return {
										type: 'MemberExpression',
										computed: true,
										object: Visit.expression(
											expressions[0],
											namespace
										),
										property: Visit.expression(
											expressions[1],
											namespace
										),
									};
								}
								let node = Visit.expression(
									expression1,
									namespace
								);
								if (node.type === 'MemberExpression') {
									node = {
										type: 'SequenceExpression',
										expressions: [
											{
												type: 'Literal',
												value: null,
											},
											node,
										],
									};
								}
								return {
									type: 'CallExpression',
									callee: node,
									arguments: ArrayLite.map(
										expressions,
										(expression) => {
											return Visit.expression(
												expression,
												namespace
											);
										}
									),
								};
							}
							const node = Visit.expression(
								expression1,
								namespace
							);
							if (
								expression2[0] === 'read' &&
								typeof expression2[1] === 'number'
							) {
								if (
									node.type === 'MemberExpression' &&
									node.object.type === 'read' &&
									node.object.name ===
										Sanitize(expression2[1])
								) {
									return {
										type: 'CallExpression',
										callee: node,
										arguments: ArrayLite.map(
											expressions,
											(expression) => {
												return Visit.expression(
													expression,
													namespace
												);
											}
										),
									};
								}
							}
							return {
								type: 'CallExpression',
								callee: {
									type: 'MemberExpression',
									computed: true,
									object: {
										type: 'MemberExpression',
										computed: false,
										object: {
											type: 'Identifier',
											name: namespace,
										},
										property: {
											type: 'Identifier',
											name: 'builtins',
										},
									},
									property: {
										type: 'Literal',
										value: 'Reflect.apply',
									},
								},
								arguments: [
									node,
									Visit.expression(expression2),
									{
										type: 'ArrayExpression',
										elements: ArrayLite.map(
											expressions,
											(expression) => {
												return Visit.expression(
													expression,
													namespace
												);
											}
										),
									},
								],
							};
						};

						exports.trap = (
							{ 1: name, 2: expressions, 3: serial },
							namespace
						) => ({
							type: 'CallExpression',
							callee: {
								type: 'MemberExpression',
								computed: false,
								object: {
									type: 'Identifier',
									name: namespace,
								},
								property: {
									type: 'Identifier',
									name: name,
								},
							},
							arguments: ArrayLite.concat(
								ArrayLite.map(expressions, (expression) => {
									return Visit.expression(
										expression,
										namespace
									);
								}),
								[{ type: 'Literal', value: serial }]
							),
						});
					}).call(this);
				}).call(
					this,
					typeof global !== 'undefined'
						? global
						: typeof self !== 'undefined'
							? self
							: typeof window !== 'undefined'
								? window
								: {}
				);
			},
			{ '../sanitize.js': 18, './index.js': 15, 'array-lite': 35 },
		],
		15: [
			function (require, module, exports) {
				const Expression = require('./expression.js');
				const Statement = require('./statement.js');
				const Block = require('./block.js');

				exports.expression = (array, namespace) =>
					Expression[array[0]](array, namespace);
				exports.statement = (array, namespace) =>
					Statement[array[0]](array, namespace);
				exports.block = (array, namespace, tag) =>
					Block[array[0]](array, namespace, tag);
			},
			{ './block.js': 13, './expression.js': 14, './statement.js': 16 },
		],
		16: [
			function (require, module, exports) {
				const ArrayLite = require('array-lite');
				const Sanitize = require('../sanitize.js');
				const Visit = require('./index.js');

				const labelize = (labels, node) =>
					ArrayLite.reduce(
						labels,
						(node, label) => ({
							type: 'LabeledStatement',
							label: {
								type: 'Identifier',
								name: label,
							},
							body: node,
						}),
						node
					);

				exports.Write = (
					{ 1: identifier, 2: expression },
					namespace
				) => ({
					type: 'ExpressionStatement',
					expression: {
						type: 'AssignmentExpression',
						operator: '=',
						left: {
							type: 'Identifier',
							name: Sanitize(identifier),
						},
						right: Visit.expression(expression, namespace),
					},
				});

				exports.Debugger = ({}, namespace) => ({
					type: 'DebuggerStatement',
				});

				exports.Break = ({ 1: label }, namespace) => ({
					type: 'BreakStatement',
					label: label
						? {
								type: 'Identifier',
								name: label,
							}
						: null,
				});

				exports.Continue = ({ 1: label }, namespace) => ({
					type: 'ContinueStatement',
					label: label
						? {
								type: 'Identifier',
								name: label,
							}
						: null,
				});

				exports.Expression = ({ 1: expression }, namespace) => ({
					type: 'ExpressionStatement',
					expression: Visit.expression(expression, namespace),
				});

				exports.Return = ({ 1: expression }, namespace) => ({
					type: 'ReturnStatement',
					argument: Visit.expression(expression, namespace),
				});

				exports.Throw = ({ 1: expression }, namespace) => ({
					type: 'ThrowStatement',
					argument: Visit.expression(expression, namespace),
				});

				exports.If = (
					{ 1: labels, 2: expression, 3: block1, 4: block2 },
					namespace
				) =>
					labelize(labels, {
						type: 'IfStatement',
						test: Visit.expression(expression, namespace),
						consequent: Visit.block(block1, namespace, 'block'),
						alternate: Visit.block(block2, namespace, 'block'),
					});

				exports.Block = ({ 1: labels, 2: block }, namespace) =>
					labelize(labels, Visit.block(block, namespace, 'block'));

				exports.Try = (
					{ 1: labels, 2: block1, 3: block2, 4: block3 },
					namespace
				) =>
					labelize(
						labels,
						(block2[1].length === 0,
						block2[2].length === 1 &&
							block2[2][0][0] === 'Throw' &&
							block2[2][0][1][0] === 'read' &&
							block2[2][0][1][1] === 'error' &&
							block3[1].length === 0 &&
							block3[2].length === 0)
							? Visit.block(block1, namespace, 'block')
							: {
									type: 'TryStatement',
									block: Visit.block(
										block1,
										namespace,
										'block'
									),
									handler: {
										type: 'CatchClause',
										param: {
											type: 'Identifier',
											name: 'error',
										},
										body: Visit.block(
											block2,
											namespace,
											'block'
										),
									},
									finalizer: Visit.block(
										block3,
										namespace,
										'block'
									),
								}
					);

				exports.While = (
					{ 1: labels, 2: expression, 3: block },
					namespace
				) =>
					labelize(labels, {
						type: 'WhileStatement',
						test: Visit.expression(expression, namespace),
						body: Visit.block(block, namespace, 'block'),
					});

				exports.Case = ({ 1: expression }, namespace) => ({
					type: 'SwitchCase',
					test: expression
						? Visit.expression(expression, namespace)
						: null,
					consequent: [],
				});

				exports.Switch = ({ 1: labels, 2: block }, namespace) =>
					labelize(labels, Visit.block(block, namespace, 'switch'));
			},
			{ '../sanitize.js': 18, './index.js': 15, 'array-lite': 35 },
		],
		17: [
			function (require, module, exports) {
				const Estree = require('./estree');
				const Script = require('./script.js');

				module.exports = (block, namespace, type) =>
					type === 'script'
						? Script(block, namespace, type)
						: Estree.block(block, namespace, 'program');
			},
			{ './estree': 15, './script.js': 19 },
		],
		18: [
			function (require, module, exports) {
				module.exports = (identifier) => identifier;
			},
			{},
		],
		19: [
			function (require, module, exports) {
				const ArrayLite = require('array-lite');
				const Sanitize = require('./sanitize.js');

				const JSON_stringify = JSON.stringify;
				const Reflect_apply = Reflect.apply;
				const String_prototype_repeat = String.prototype.repeat;

				let namespace;
				let indent;

				module.exports = (block, identifier) => {
					indent = 0;
					namespace = identifier;
					return '"use strict";' + visit0(block);
				};

				const mapjoin = (array, closure, string) =>
					ArrayLite.join(ArrayLite.map(array, closure), string);

				const labelize = (labels) =>
					ArrayLite.join(
						ArrayLite.map(labels, (label) => label + ': '),
						''
					);

				const newline = () =>
					'\n' +
					Reflect_apply(String_prototype_repeat, '  ', [indent]);

				const visit0 = (array) => visitors[array[0]](array);

				const visit1 = (array) => {
					indent++;
					const result = visitors[array[0]](array);
					indent--;
					return result;
				};

				const visitors = {};

				////////////////
				// Expression //
				////////////////

				visitors.closure = ({ 1: block }) =>
					'(function callee () {' + visit0(block) + newline() + '})';

				visitors.primitive = ({ 1: primitive }) =>
					primitive === void 0
						? '(void 0)'
						: typeof primitive === 'string'
							? JSON_stringify(primitive)
							: primitive !== primitive
								? '(0/0)'
								: primitive === 1 / 0
									? '(1/0)'
									: primitive === -1 / 0
										? '(-1/0)'
										: String(primitive);

				visitors.write = ({
					1: identifier,
					2: expression1,
					3: expression2,
				}) =>
					'(' +
					newline() +
					Sanitize(identifier) +
					' = ' +
					visit1(expression1) +
					',' +
					newline() +
					visit1(expression2) +
					')';

				visitors.read = ({ 1: identifier }) => Sanitize(identifier);

				visitors.builtin = ({ 1: string }) =>
					namespace + '.builtins[' + JSON_stringify(string) + ']';

				visitors.sequence = ({ 1: expression1, 2: expression2 }) =>
					'(' +
					newline() +
					visit1(expression1) +
					',' +
					newline() +
					visit1(expression2) +
					')';

				visitors.eval = ({ 1: expression }) =>
					'eval(' + visit0(expression) + ')';

				visitors.conditional = ({
					1: expression1,
					2: expression2,
					3: expression3,
				}) =>
					'(' +
					newline() +
					visit1(expression1) +
					' ?' +
					newline() +
					visit1(expression2) +
					' :' +
					newline() +
					visit1(expression3) +
					')';

				visitors.unary = ({ 1: operator, 2: expression }) =>
					'(' + operator + ' ' + visit0(expression) + ')';

				visitors.binary = ({
					1: operator,
					2: expression1,
					3: expression2,
				}) =>
					'(' +
					newline() +
					visit1(expression1) +
					' ' +
					operator +
					newline() +
					visit1(expression2) +
					')';

				visitors.apply = ({
					1: expression1,
					2: expression2,
					3: expressions,
				}) =>
					expression2[0] === 'primitive' && expression2[1] === void 0
						? expression1[0] === 'builtin' &&
							expression1[1] === 'Array.of'
							? '[' +
								(expressions.length ? newline() : '') +
								mapjoin(expressions, visit1, ',' + newline()) +
								']'
							: expression1[0] === 'builtin' &&
								  expression1[1] === 'Object.fromEntries' &&
								  expressions.length === 1 &&
								  expressions[0][0] === 'apply' &&
								  expressions[0][1][0] === 'builtin' &&
								  expressions[0][1][1] === 'Array.of' &&
								  expressions[0][2][0] === 'primitive' &&
								  expressions[0][2][1] === void 0 &&
								  ArrayLite.every(
										expressions[0][3],
										({
											0: tag,
											1: expression1,
											2: expression2,
											3: expressions,
										}) =>
											tag === 'apply' &&
											expression1[0] === 'builtin' &&
											expression1[1] === 'Array.of' &&
											expression2[0] === 'primitive' &&
											expression2[1] === void 0 &&
											expressions.length === 2
								  )
								? expressions.length === 0
									? '{}'
									: '{' +
										(expressions[0][3].length
											? newline()
											: '') +
										mapjoin(
											expressions[0][3],
											({ 3: expressions }) =>
												visit1(expressions[0]) +
												':' +
												newline() +
												visit1(expressions[1]),
											',' + newline()
										) +
										'}'
								: expression1[0] === 'builtin' &&
									  expression1[1] === 'Reflect.get' &&
									  expressions.length === 2
									? '(' +
										newline() +
										visit1(expressions[0]) +
										'[' +
										newline() +
										visit1(expressions[1]) +
										'])'
									: '(null,' +
										newline() +
										visit1(expression1) +
										'(' +
										(expressions.length ? newline() : '') +
										mapjoin(
											expressions,
											visit1,
											',' + newline()
										) +
										'))'
						: expression1[0] === 'apply' &&
							  expression1[1][0] === 'builtin' &&
							  expression1[1][1] === 'Reflect.get' &&
							  expression1[2][0] === 'primitive' &&
							  expression1[2][1] === void 0 &&
							  expression1[3].length === 2 &&
							  expression1[3][0] === 'read' &&
							  expression2[0] === 'read' &&
							  expression2[3][1] === expression2[1]
							? '(' +
								newline() +
								visit1(expression1[3][0]) +
								'[' +
								newline() +
								visit1(expression1[3][1]) +
								'](' +
								(expressions.length ? newline() : '') +
								mapjoin(expressions, visit1, ',' + newline()) +
								'))'
							: namespace +
								'.builtins["Reflect.apply"](' +
								newline() +
								visit1(expression1) +
								',' +
								newline() +
								visit1(expression2) +
								',[' +
								(expressions.length ? newline() : '') +
								mapjoin(expressions, visit1, ',' + newline()) +
								'])';

				visitors.construct = ({ 1: expression, 2: expressions }) =>
					expression[0] === 'builtin' &&
					expression[1] === 'RegExp' &&
					expressions.length === 2 &&
					expressions[0][0] === 'primitive' &&
					typeof expressions[0][1] === 'string' &&
					expressions[1][0] === 'primitive' &&
					typeof expressions[1][1] === 'string' &&
					ArrayLite.every(
						expressions[1][1],
						(character, index, string) =>
							ArrayLite.includes('gimuy', character) &&
							ArrayLite.lastIndexOf(string, character) === index
					)
						? '/' + expressions[0][1] + '/' + expressions[1][1]
						: '(new ' +
							newline() +
							visit1(expression) +
							'(' +
							(expressions.length ? newline() : '') +
							mapjoin(expressions, visit1, ',' + newline()) +
							'))';

				visitors.trap = ({ 1: string, 2: expressions, 3: serial }) =>
					string === 'unary' ||
					string === 'binary' ||
					string === 'apply' ||
					string === 'construct'
						? namespace +
							'.' +
							string +
							'(' +
							newline() +
							mapjoin(expressions, visit1, ',' + newline()) +
							', ' +
							serial +
							')'
						: expressions.length
							? namespace +
								'.' +
								string +
								'(' +
								mapjoin(expressions, visit0, ', ') +
								', ' +
								serial +
								')'
							: namespace + '.' + string + '(' + serial + ')';

				///////////
				// Block //
				///////////

				visitors.BLOCK = ({ 1: identifiers, 2: statements }) =>
					(identifiers.length
						? newline() +
							'let ' +
							mapjoin(identifiers, Sanitize, ', ') +
							';'
						: '') +
					(statements.length ? newline() : '') +
					mapjoin(statements, visit0, newline());

				///////////////
				// Statement //
				///////////////

				visitors.Write = ({ 1: identifier, 2: expression }) =>
					Sanitize(identifier) + ' = ' + visit1(expression) + ';';

				visitors.Expression = ({ 1: expression }) =>
					visit1(expression) + ';';

				visitors.Debugger = ({}) => 'debugger;';

				visitors.Return = ({ 1: expression }) =>
					'return ' + visit1(expression) + ';';

				visitors.Throw = ({ 1: expression }) =>
					'throw ' + visit1(expression) + ';';

				visitors.Break = ({ 1: label }) =>
					'break' + (label ? ' ' + label : '') + ';';

				visitors.Continue = ({ 1: label }) =>
					'break' + (label ? ' ' + label : '') + ';';

				visitors.Block = ({ 1: labels, 2: block }) =>
					labelize(labels) + '{' + visit1(block) + newline() + '}';

				visitors.If = ({
					1: labels,
					2: expression,
					3: block1,
					4: block2,
				}) =>
					labelize(labels) +
					'if (' +
					visit1(expression) +
					newline() +
					') {' +
					visit1(block1) +
					newline() +
					'} else {' +
					visit1(block2) +
					newline() +
					'}';

				visitors.While = ({ 1: labels, 2: expression, 3: block }) =>
					labelize(labels) +
					'while (' +
					visit1(expression) +
					')' +
					newline() +
					'{' +
					visit1(block) +
					newline() +
					'}';

				visitors.Try = ({
					1: labels,
					2: block1,
					3: block2,
					4: block3,
				}) =>
					block2[1].length === 0 &&
					block2[2].length === 1 &&
					block2[2][0][0] === 'Throw' &&
					block2[2][0][1][0] === 'read' &&
					block2[2][0][1][1] === 'error' &&
					block3[1].length === 0 &&
					block3[2].length === 0
						? labelize(labels) +
							'{' +
							visit1(block1) +
							newline() +
							'}'
						: labelize(labels) +
							'try {' +
							visit1(block1) +
							newline() +
							'} catch (error) {' +
							visit1(block2) +
							newline() +
							'} finally {' +
							visit1(block3) +
							newline() +
							'}';

				visitors.Switch = ({ 1: labels, 2: block }) =>
					((index) =>
						'{' +
						visit0([
							block[0],
							block[1],
							ArrayLite.slice(block[2], 0, index),
						]) +
						newline() +
						labelize(labels) +
						'switch (true) {' +
						newline() +
						ArrayLite.join(
							ArrayLite.map(
								ArrayLite.slice(
									block[2],
									index,
									block[2].length
								),
								visit0
							),
							newline()
						) +
						newline() +
						'}}')(
						ArrayLite.findIndex(
							block[2],
							(statement) => statement[0] === 'Case'
						)
					);

				visitors.Case = ({ 1: expression }) =>
					expression
						? 'case ' + visit1(expression) + ':'
						: 'default:';
			},
			{ './sanitize.js': 18, 'array-lite': 35 },
		],
		20: [
			function (require, module, exports) {
				(function (global) {
					(function () {
						const Reflect_apply = Reflect.apply;
						const Function = global.Function;
						const String_prototype_trim = String.prototype.trim;

						// Credit: https://github.com/shinnn/is-var-name //

						module.exports = (identifier) => {
							if (typeof identifier !== 'string') return true;
							if (
								Reflect_apply(
									String_prototype_trim,
									identifier,
									[]
								) !== identifier
							)
								return true;
							try {
								new Function(identifier, 'var ' + identifier);
							} catch (error) {
								return true;
							}
							return false;
						};
					}).call(this);
				}).call(
					this,
					typeof global !== 'undefined'
						? global
						: typeof self !== 'undefined'
							? self
							: typeof window !== 'undefined'
								? window
								: {}
				);
			},
			{},
		],
		21: [
			function (require, module, exports) {
				(function (global) {
					(function () {
						const ArrayLite = require('array-lite');
						const Normalise = require('./normalise');
						const Ambush = require('./ambush');
						const Generate = require('./generate');
						const Setup = require('./setup.js');
						const Illegal = require('./illegal.js');

						const Error = global.Error;
						const Reflect_apply = Reflect.apply;
						const RegExp_prototype_test = RegExp.prototype.test;
						const Object_defineProperty = Object.defineProperty;
						const Array_isArray = Array.isArray;
						const Array_from = Array.from;

						function normalise(root, serial) {
							if (serial === void 0) serial = null;
							if (typeof serial === 'number') {
								if (!this.nodes[serial]) {
									throw new Error(
										'serial is not in the node database: ' +
											serial
									);
								}
							} else if (serial !== null) {
								throw new Error(
									'serial should either be null/undefined (global code), or a serial number (direct eval code)'
								);
							}
							this.roots[this.roots.length] = root;
							return Normalise(root, serial, this.nodes);
						}

						function ambush(block, pointcut) {
							if (Array_isArray(pointcut)) {
								let array = pointcut;
								pointcut = (name) =>
									ArrayLite.includes(array, name);
							} else if (typeof pointcut !== 'function') {
								throw new Error(
									'pointcut should either be an array or a function'
								);
							}
							return Ambush(block, pointcut, this.nodes);
						}
						function generate(block) {
							return Generate(block, this.namespace, this.format);
						}

						function weave(root, pointcut, serial) {
							return this.generate(
								this.ambush(
									this.normalise(root, serial),
									pointcut
								)
							);
						}

						function setup() {
							return Setup[this.format](this.namespace);
						}

						const blacklist = [
							'eval',
							'arguments',
							'callee',
							'error',
						];

						const cache = (roots) => {
							const nodes = [0];
							const objects = Array_from(roots);
							let length = objects.length;
							while (length) {
								const object = objects[--length];
								if (
									Reflect_getOwnPropertyDescriptor(
										object,
										'AranSerial'
									)
								)
									nodes[object.AranSerial] = object;
								const keys = Reflect_ownKeys(object);
								for (
									let index = 0;
									index < keys.length;
									index++
								) {
									const value = object[keys[index]];
									if (
										typeof value === 'object' &&
										value !== null
									) {
										objects[length++] = value;
									}
								}
							}
							return nodes;
						};

						const unary = (operator, argument) => {
							switch (operator) {
								case '-':
									return -argument;
								case '+':
									return +argument;
								case '!':
									return !argument;
								case '~':
									return ~argument;
								case 'typeof':
									return typeof argument;
								case 'void':
									return void argument;
								case 'delete':
									return delete argument;
							}
							throw new Error(
								'Invalid unary operator: ' + operator
							);
						};

						const binary = (operator, left, right) => {
							switch (operator) {
								case '==':
									return left == right;
								case '!=':
									return left != right;
								case '===':
									return left === right;
								case '!==':
									return left !== right;
								case '<':
									return left < right;
								case '<=':
									return left <= right;
								case '>':
									return left > right;
								case '>=':
									return left >= right;
								case '<<':
									return left << right;
								case '>>':
									return left >> right;
								case '>>>':
									return left >>> right;
								case '+':
									return left + right;
								case '-':
									return left - right;
								case '*':
									return left * right;
								case '/':
									return left / right;
								case '%':
									return left % right;
								case '|':
									return left | right;
								case '^':
									return left ^ right;
								case '&':
									return left & right;
								case 'in':
									return left in right;
								case 'instanceof':
									return left instanceof right;
							}
							throw new Error(
								'Invalid binary operator: ' + operator
							);
						};

						module.exports = (options = {}) => {
							options.namespace = options.namespace || '_';
							options.roots = options.roots || [];
							options.format = options.format || 'estree';
							if (typeof options.namespace !== 'string')
								throw new Error(
									'options.namespace should be a string'
								);
							if (Illegal(options.namespace))
								throw new Error(
									'options.namespace should be a legal JavaScript identifier'
								);
							if (options.namespace[0] === '$')
								throw new Error(
									'options.namespace should not start with a dollar sign'
								);
							if (
								ArrayLite.includes(blacklist, options.namespace)
							)
								throw new Error(
									'options.namespace should not be one of: ' +
										JSON.stringify(blacklist)
								);
							if (!Array_isArray(options.roots))
								throw new Error(
									'options.roots should be an array'
								);
							if (
								options.format !== 'estree' &&
								options.format !== 'script'
							)
								throw new Error(
									"options.format should either be 'script' or 'estree'"
								);
							const aran = {
								setup,
								normalise,
								ambush,
								generate,
								weave,
								setup,
								unary,
								binary,
							};
							Object_defineProperty(aran, 'namespace', {
								value: options.namespace,
								configurable: false,
								enumerable: true,
								writable: false,
							});
							Object_defineProperty(aran, 'format', {
								value: options.format,
								configurable: false,
								enumerable: true,
								writable: false,
							});
							Object_defineProperty(aran, 'roots', {
								value: options.roots,
								configurable: false,
								enumerable: true,
								writable: false,
							});
							Object_defineProperty(aran, 'nodes', {
								value: cache(options.roots),
								configurable: false,
								enumerable: false,
								writable: false,
							});
							return aran;
						};
					}).call(this);
				}).call(
					this,
					typeof global !== 'undefined'
						? global
						: typeof self !== 'undefined'
							? self
							: typeof window !== 'undefined'
								? window
								: {}
				);
			},
			{
				'./ambush': 5,
				'./generate': 17,
				'./illegal.js': 20,
				'./normalise': 23,
				'./setup.js': 33,
				'array-lite': 35,
			},
		],
		22: [
			function (require, module, exports) {
				(function (global) {
					(function () {
						const ArrayLite = require('array-lite');
						const Build = require('../build');

						const Error = global.Error;
						const Object_keys = Object.keys;
						const Reflect_apply = Reflect.apply;
						const Object_defineProperty = Object.defineProperty;
						const RegExp_prototype_test = RegExp.prototype.test;

						const sourcemap = (array) => {
							array[array.length] = ARAN.serial;
							return array;
						};

						ArrayLite.forEach(Object_keys(Build), (key) => {
							if (
								Reflect_apply(
									RegExp_prototype_test,
									/^[A-Z][a-z]+$/,
									[key]
								)
							) {
								exports[key] = function () {
									return ArrayLite.map(
										Reflect_apply(
											Build[key],
											null,
											arguments
										),
										sourcemap
									);
								};
							} else {
								exports[key] = function () {
									return sourcemap(
										Reflect_apply(
											Build[key],
											null,
											arguments
										)
									);
								};
							}
						});

						exports._BLOCK = exports.BLOCK;
						exports._eval = exports.eval;
						exports._read = exports.read;
						exports._Write = exports.Write;
						exports._write = exports.write;

						exports.trap = () => {
							throw new Error(
								'lib/dismantle should never build trap expressions'
							);
						};

						ArrayLite.forEach(
							['BLOCK', 'eval', 'read', 'Write', 'write'],
							(string) => {
								exports[string] = () => {
									throw new Error(
										'Only lib/dismantle/scope/identifier.js may build: ' +
											string
									);
								};
							}
						);
					}).call(this);
				}).call(
					this,
					typeof global !== 'undefined'
						? global
						: typeof self !== 'undefined'
							? self
							: typeof window !== 'undefined'
								? window
								: {}
				);
			},
			{ '../build': 11, 'array-lite': 35 },
		],
		23: [
			function (require, module, exports) {
				(function (global) {
					(function () {
						const Visit = require('./visit');

						const Error = global.Error;
						const JSON_parse = JSON.parse;
						const Reflect_getOwnPropertyDescriptor =
							Reflect.getOwnPropertyDescriptor;
						const Reflect_defineProperty = Reflect.defineProperty;

						module.exports = (node, serial, nodes) => {
							const descriptor = Reflect_getOwnPropertyDescriptor(
								global,
								'ARAN'
							);
							if (descriptor && !descriptor.configurable)
								throw new Error(
									'ARAN must be a configurable property of the global object'
								);
							if (!serial) node.AranCounter = 0;
							Reflect_defineProperty(global, 'ARAN', {
								configurable: true,
								value: {
									nodes,
									serial: serial,
									root: serial
										? nodes[nodes[serial].AranRootSerial]
										: node,
								},
							});
							const result = Visit.NODE(
								node,
								serial && JSON_parse(nodes[serial].AranScope),
								false
							);
							if (descriptor)
								Reflect_defineProperty(
									global,
									'ARAN',
									descriptor
								);
							else delete global.ARAN;
							return result;
						};
					}).call(this);
				}).call(
					this,
					typeof global !== 'undefined'
						? global
						: typeof self !== 'undefined'
							? self
							: typeof window !== 'undefined'
								? window
								: {}
				);
			},
			{ './visit': 31 },
		],
		24: [
			function (require, module, exports) {
				(function (global) {
					(function () {
						const ArrayLite = require('array-lite');
						const Array_from = Array.from;

						const Error = global.Error;

						///////////
						// Names //
						///////////

						const pnames = (pattern) => {
							const patterns = [pattern];
							let length = patterns.length;
							const names = [];
							while (length) {
								const pattern = patterns[--length];
								switch (pattern.type) {
									case 'Identifier':
										names[names.length] = pattern.name;
										break;
									case 'Property':
										patterns[length++] = pattern.value;
										break;
									case 'RestElement':
										patterns[length++] = pattern.argument;
										break;
									case 'AssignmentPattern':
										patterns[length++] = pattern.left;
										break;
									case 'ObjectPattern':
										for (
											let index = 0;
											index < pattern.properties.length;
											index++
										)
											patterns[length++] =
												pattern.properties[index];
										break;
									case 'ArrayPattern':
										for (
											let index = 0;
											index < pattern.elements.length;
											index++
										)
											patterns[length++] =
												pattern.elements[index];
										break;
									default:
										throw new Error(
											'Unknown pattern type: ' +
												pattern.type
										);
								}
							}
							return names;
						};

						const dnames = (declaration) => pnames(declaration.id);

						const vnames = (nodes) => {
							nodes = Array_from(nodes);
							let length = nodes.length;
							const names = [];
							while (length) {
								const node = nodes[--length];
								if (node.type === 'IfStatement') {
									nodes[length++] = node.consequent;
									if (node.alternate) {
										nodes[length++] = node.alternate;
									}
								} else if (node.type === 'LabeledStatement') {
									nodes[length++] = node.body;
								} else if (
									node.type === 'WhileStatement' ||
									node.type === 'DoWhileStatement'
								) {
									nodes[length++] = node.body;
								} else if (node.type === 'ForStatement') {
									nodes[length++] = node.body;
									if (
										node.init &&
										node.init.type === 'VariableDeclaration'
									) {
										nodes[length++] = node.init;
									}
								} else if (
									node.type === 'ForOfStatement' ||
									node.type === 'ForInStatement'
								) {
									nodes[length++] = node.body;
									if (
										node.left.type === 'VariableDeclaration'
									) {
										nodes[length++] = node.left;
									}
								} else if (node.type === 'BlockStatement') {
									for (
										let index = node.body.length - 1;
										index >= 0;
										index--
									) {
										nodes[length++] = node.body[index];
									}
								} else if (node.type === 'TryStatement') {
									nodes[length++] = node.block;
									if (node.handler) {
										nodes[length++] = node.handler.body;
									}
									if (node.finalizer) {
										nodes[length++] = node.finalizer;
									}
								} else if (node.type === 'SwitchStatement') {
									ArrayLite.forEach(
										ArrayLite.flatMap(
											node.cases,
											(object) => object.consequent
										),
										(node) => {
											nodes[length++] = node;
										}
									);
								} else if (
									node.type === 'VariableDeclaration'
								) {
									if (node.kind === 'var') {
										ArrayLite.forEach(
											ArrayLite.flatMap(
												node.declarations,
												dnames
											),
											(name) => {
												if (
													!ArrayLite.includes(
														names,
														name
													)
												) {
													names[names.length] = name;
												}
											}
										);
									}
								} else if (
									node.type === 'FunctionDeclaration'
								) {
									if (
										!ArrayLite.includes(names, node.id.name)
									) {
										names[names.length] = node.id.name;
									}
								}
							}
							return names;
						};

						exports.DeclarationNames = dnames;

						exports.PatternNames = pnames;

						exports.BodyNames = (node, kind) =>
							kind === 'var'
								? vnames(node.body)
								: ArrayLite.flatMap(node.body, (node) =>
										node.type === 'VariableDeclaration' &&
										node.kind === kind
											? ArrayLite.flatMap(
													node.declarations,
													dnames
												)
											: []
									);

						////////////////
						// Completion //
						////////////////

						const loop = (node, nodes) => {
							// Duplicate //
							if (node.type === 'IfStatement') {
								return ArrayLite.concat(
									loop(node.consequent, []),
									node.alternate
										? loop(node.alternate, [])
										: []
								);
							}
							if (node.type === 'TryStatement') {
								return ArrayLite.concat(
									loop(node.block, []),
									node.handler
										? loop(node.handler.body, [])
										: [],
									[{ label: null, nodes: [node] }]
								);
							}
							if (node.type === 'WithStatement') {
								return loop(node.body, []);
							}
							// Labels Catch //
							if (node.type === 'LabeledStatement') {
								return ArrayLite.map(
									loop(node.body, nodes),
									({ label, nodes }) => ({
										label:
											label === node.label.name
												? null
												: label,
										nodes: nodes,
									})
								);
							}
							if (
								node.type === 'WhileStatement' ||
								node.type === 'DoWhileStatement' ||
								node.type === 'ForStatement' ||
								node.type === 'ForInStatement' ||
								node.type === 'ForOfStatement'
							) {
								return ArrayLite.map(
									loop(node.body, []),
									({ label, nodes }) => ({
										label:
											label === '@break' ||
											label === '@continue'
												? null
												: label,
										nodes: nodes,
									})
								);
							}
							if (node.type === 'SwitchStatement') {
								return ArrayLite.map(
									loop(
										{
											type: 'BlockStatement',
											body: ArrayLite.flatMap(
												node.cases,
												({ consequent: nodes }) => nodes
											),
										},
										[]
									),
									({ label, nodes }) => ({
										label:
											label === '@break' ? null : label,
										nodes: nodes,
									})
								);
							}
							// Chain //
							if (
								node.type === 'BlockStatement' ||
								node.type === 'Program'
							) {
								const completions = [];
								ArrayLite.forEach(node.body, (node) => {
									nodes = ArrayLite.flatMap(
										loop(node, nodes),
										({ label, nodes }) => {
											if (label === null) return nodes;
											completions[completions.length] = {
												label,
												nodes,
											};
											return [];
										}
									);
								});
								completions[completions.length] = {
									label: null,
									nodes: nodes,
								};
								return completions;
							}
							// Stop //
							if (node.type === 'ExpressionStatement') {
								return [
									{
										label: null,
										nodes: [node],
									},
								];
							}
							if (
								node.type === 'VariableDeclaration' ||
								node.type === 'DebuggerStatement' ||
								node.type === 'FunctionDeclaration' ||
								node.type === 'EmptyStatement'
							) {
								return [
									{
										label: null,
										nodes,
									},
								];
							}
							if (node.type === 'ContinueStatement') {
								return [
									{
										label: node.label
											? node.label.name
											: '@continue',
										nodes,
									},
								];
							}
							if (node.type === 'BreakStatement') {
								return [
									{
										label: node.label
											? node.label.name
											: '@break',
										nodes,
									},
								];
							}
							if (node.type === 'ThrowStatement') {
								return [];
							}
							if (node.type === 'ReturnStatement') {
								throw new Error(
									'Return statement should not appear here'
								);
							}
							throw new Error(
								'Unrecognized statement type: ' + node.type
							);
						};

						exports.CompletionStatements = (node) =>
							ArrayLite.flatMap(
								loop(node, []),
								({ label, nodes }) => {
									if (label !== null)
										throw new Error(
											'Label escape: ' + label
										);
									return nodes;
								}
							);

						////////////
						// Mixbag //
						////////////

						exports.IsArgumentsFree = (objects) => {
							objects = Array_from(objects);
							let length = objects.length;
							while (length) {
								const object = objects[--length];
								if (
									object.type !== 'FunctionExpression' ||
									object.type !== 'FunctionDeclaration'
								) {
									if (
										object.type === 'Identifier' &&
										object.name === 'arguments'
									)
										return false;
									if (
										object.type === 'CallExpression' &&
										object.callee.type === 'Identifier' &&
										object.callee.name === 'eval'
									)
										return false;
									for (let key in object) {
										if (
											object[key] &&
											typeof object[key] === 'object'
										) {
											objects[length++] = object[key];
										}
									}
								}
							}
							return true;
						};
					}).call(this);
				}).call(
					this,
					typeof global !== 'undefined'
						? global
						: typeof self !== 'undefined'
							? self
							: typeof window !== 'undefined'
								? window
								: {}
				);
			},
			{ 'array-lite': 35 },
		],
		25: [
			function (require, module, exports) {
				(function (global) {
					(function () {
						const ArrayLite = require('array-lite');

						const Error = global.Error;
						const Number = global.Number;
						const Reflect_getOwnPropertyDescriptor =
							Reflect.getOwnPropertyDescriptor;
						const Reflect_ownKeys = Reflect.ownKeys;

						////////////
						// Extend //
						////////////

						exports.ExtendStrict = (scope) => ({
							tag: 'strict',
							parent: scope,
						});

						exports.ExtendFunction = (scope) => ({
							tag: 'closure',
							arrow: false,
							parent: scope,
						});

						exports.ExtendArrow = (scope) => ({
							tag: 'closure',
							arrow: true,
							parent: scope,
						});

						exports.ExtendToken = (scope, name, token) => ({
							tag: 'token',
							name: name,
							token: token,
							parent: scope,
						});

						exports.ExtendBlock = (scope) => ({
							tag: 'block',
							bindings: {},
							parent: scope,
						});

						exports.ExtendLabel = (scope, label) => ({
							tag: 'label',
							label: label,
							parent: scope,
						});

						/////////
						// Get //
						/////////

						exports.GetStrict = (scope) => {
							while (scope) {
								if (scope.tag === 'strict') return true;
								scope = scope.parent;
							}
							return false;
						};

						exports.GetCallee = (scope) => {
							while (scope) {
								if (scope.tag === 'closure')
									return scope.arrow ? 'arrow' : 'function';
								scope = scope.parent;
							}
							return null;
						};

						exports.GetToken = (scope, name) => {
							while (scope.tag !== 'token' || scope.name !== name)
								scope = scope.parent;
							return scope.token;
						};

						exports.GetLabels = (scope) => {
							const labels = [];
							while (scope) {
								if (scope.tag === 'label') {
									if (scope.label === null) return labels;
									labels[labels.length] = scope.label;
								}
								scope = scope.parent;
							}
							return labels;
						};

						exports.GetLookup = (scope, identifier, closures) => {
							while (scope) {
								if (
									scope.tag === 'block' &&
									Reflect_getOwnPropertyDescriptor(
										scope.bindings,
										identifier
									)
								)
									return {
										tag: 'hit',
										binding: scope.bindings[identifier],
									};
								if (
									scope.tag === 'token' &&
									scope.name === 'With'
								)
									return {
										tag: 'with',
										token: scope.token,
										parent: scope.parent,
									};
								if (scope.tag === 'closure')
									return {
										tag: 'closure',
										parent: scope.parent,
									};
								scope = scope.parent;
							}
							return { tag: 'miss' };
						};

						exports.GetIdentifiers = (scope) => {
							while (scope.tag !== 'block') scope = scope.parent;
							return ArrayLite.map(
								Reflect_ownKeys(scope.bindings),
								(identifier) => {
									return Number(identifier) || identifier;
								}
							);
						};

						////////////////////////
						// Set (side-effect!) //
						////////////////////////

						exports.EachBinding = (scope, closure) => {
							while (scope) {
								if (scope.tag === 'block') {
									const keys = Reflect_ownKeys(
										scope.bindings
									);
									for (
										let index = 0;
										index < keys.length;
										index++
									) {
										closure(scope.bindings[keys[index]]);
									}
								}
								scope = scope.parent;
							}
						};

						exports.SetBinding = (scope, identifier, binding) => {
							while (scope.tag !== 'block') scope = scope.parent;
							if (
								Reflect_getOwnPropertyDescriptor(
									scope.bindings,
									identifier
								)
							)
								throw new Error(
									'Duplicate binding: ' + identifier
								);
							scope.bindings[identifier] = binding;
						};
					}).call(this);
				}).call(
					this,
					typeof global !== 'undefined'
						? global
						: typeof self !== 'undefined'
							? self
							: typeof window !== 'undefined'
								? window
								: {}
				);
			},
			{ 'array-lite': 35 },
		],
		26: [
			function (require, module, exports) {
				(function (global) {
					(function () {
						const ArrayLite = require('array-lite');
						let Build = require('../build.js');
						const Data = require('./data.js');

						const Error = global.Error;

						Build = Object.assign({}, Build, {
							eval: Build._eval,
							read: Build._read,
							write: Build._write,
							Write: Build._Write,
							BLOCK: Build._BLOCK,
						});

						const special = (identifier) =>
							typeof identifier === 'number' ||
							identifier === 'this' ||
							identifier === 'new.target';

						const lookup = (
							scope,
							identifier,
							internal,
							closures
						) => {
							const { tag, binding, token, parent } =
								Data.GetLookup(scope, identifier);
							if (tag === 'closure')
								return lookup(
									parent,
									identifier,
									false,
									closures
								);
							if (tag === 'miss') {
								if (special(identifier))
									throw new Error(
										'Miss of hidden variable or this/new.target: ' +
											identifier
									);
								return closures.miss();
							}
							if (tag === 'with') {
								if (special(identifier))
									return lookup(
										parent,
										identifier,
										internal,
										closures
									);
								return Build.conditional(
									Build.conditional(
										Build.apply(
											Build.builtin('Reflect.has'),
											Build.primitive(void 0),
											[
												Build.read(token),
												Build.primitive(identifier),
											]
										),
										Build.conditional(
											Build.apply(
												Build.builtin('Reflect.get'),
												Build.primitive(void 0),
												[
													Build.read(token),
													Build.builtin(
														'Symbol.unscopables'
													),
												]
											),
											Build.apply(
												Build.builtin('Reflect.get'),
												Build.primitive(void 0),
												[
													Build.apply(
														Build.builtin(
															'Reflect.get'
														),
														Build.primitive(void 0),
														[
															Build.read(token),
															Build.builtin(
																'Symbol.unscopables'
															),
														]
													),
													Build.primitive(identifier),
												]
											),
											Build.primitive(false)
										),
										Build.primitive(true)
									),
									lookup(
										parent,
										identifier,
										internal,
										closures
									),
									closures.with(token)
								);
							}
							if (tag !== 'hit')
								throw new Error('Unknown tag: ' + tag);
							if (binding.initialized)
								return closures.hit(binding.writable);
							if (special(identifier))
								throw new Error(
									'Special identifier should always be initialized: ' +
										identifier
								);
							if (internal)
								return Build.apply(
									Build.read(
										Data.GetToken(
											scope,
											'HelperThrowReferenceError'
										)
									),
									Build.primitive(void 0),
									[
										Build.primitive(
											identifier + ' is not defined'
										),
									]
								);
							if (!binding.sticker)
								binding.sticker = ++ARAN.root.AranCounter;
							return Build.conditional(
								Build.read(binding.sticker),
								closures.hit(binding.writable),
								Build.apply(
									Build.read(
										Data.GetToken(
											scope,
											'HelperThrowReferenceError'
										)
									),
									Build.primitive(void 0),
									[
										Build.primitive(
											identifier + ' is not defined'
										),
									]
								)
							);
						};

						exports.token = (scope, expression, closure) => {
							const token = ++ARAN.root.AranCounter;
							Data.SetBinding(scope, token, {
								initialized: true,
								writable: true,
								sticker: null,
							});
							return Build.write(
								token,
								expression,
								closure(token)
							);
						};

						exports.Token = (scope, expression, closure) => {
							const token = ++ARAN.root.AranCounter;
							Data.SetBinding(scope, token, {
								initialized: true,
								writable: true,
								sticker: null,
							});
							return ArrayLite.concat(
								Build.Write(token, expression),
								closure(token)
							);
						};

						exports.BLOCK = (
							scope,
							identifiers1,
							identifiers2,
							closure
						) => {
							scope = Data.ExtendBlock(scope);
							ArrayLite.forEach(identifiers1, (identifier) => {
								Data.SetBinding(scope, identifier, {
									initialized: false,
									writable: true,
									sticker: null,
								});
							});
							ArrayLite.forEach(identifiers2, (identifier) => {
								Data.SetBinding(scope, identifier, {
									initialized: false,
									writable: false,
									sticker: null,
								});
							});
							const statements = closure(scope);
							const identifiers3 = Data.GetIdentifiers(scope);
							const identifiers4 = ArrayLite.filter(
								ArrayLite.map(
									identifiers3,
									(identifier) =>
										Data.GetLookup(scope, identifier)
											.binding.sticker
								),
								(sticker) => sticker
							);
							return Build.BLOCK(
								ArrayLite.concat(identifiers3, identifiers4),
								ArrayLite.concat(
									ArrayLite.flatMap(
										identifiers4,
										(identifier) =>
											Build.Write(
												identifier,
												Build.primitive(false)
											)
									),
									statements
								)
							);
						};

						exports.initialize = (
							scope,
							identifier,
							expression1,
							expression2
						) => {
							const { tag, binding } = Data.GetLookup(
								scope,
								identifier
							);
							if (tag !== 'hit')
								throw new Error(
									'Out of bound initialization: ' + identifier
								);
							if (binding.initialized)
								throw new Error(
									'Duplicate initialization: ' + identifier
								);
							binding.initialized = true;
							if (!binding.sticker)
								return Build.write(
									identifier,
									expression1,
									expression2
								);
							return Build.write(
								identifier,
								expression1,
								Build.write(
									binding.sticker,
									Build.primitive(true),
									expression2
								)
							);
						};

						exports.Initialize = (
							scope,
							identifier,
							expression
						) => {
							const { tag, binding } = Data.GetLookup(
								scope,
								identifier
							);
							if (tag !== 'hit')
								throw new Error(
									'Out of bound initialization: ' + identifier
								);
							if (binding.initialized)
								throw new Error(
									'Duplicate initialization: ' + identifier
								);
							binding.initialized = true;
							if (!binding.sticker)
								return Build.Write(identifier, expression);
							return ArrayLite.concat(
								Build.Write(identifier, expression),
								Build.Write(
									binding.sticker,
									Build.primitive(true)
								)
							);
						};

						exports.eval = (scope1, expression) => {
							Data.EachBinding((binding) => {
								if (!binding.sticker && !binding.initialized) {
									binding.sticker = ++ARAN.root.AranCounter;
								}
							});
							return Build.eval(expression);
						};

						exports.read = (scope, identifier) =>
							lookup(scope, identifier, true, {
								with: (token) =>
									Build.apply(
										Build.builtin('Reflect.get'),
										Build.primitive(void 0),
										[
											Build.read(token),
											Build.primitive(identifier),
										]
									),
								hit: (writable) => Build.read(identifier),
								miss: () =>
									Build.conditional(
										Build.apply(
											Build.read(
												Data.GetToken(
													scope,
													'HelperIsGlobal'
												)
											),
											Build.primitive(void 0),
											[Build.primitive(identifier)]
										),
										Build.apply(
											Build.builtin('Reflect.get'),
											Build.primitive(void 0),
											[
												Build.builtin('global'),
												Build.primitive(identifier),
											]
										),
										Build.apply(
											Build.read(
												Data.GetToken(
													scope,
													'HelperThrowReferenceError'
												)
											),
											Build.primitive(void 0),
											[
												Build.primitive(
													identifier +
														' is not defined'
												),
											]
										)
									),
							});

						exports.typeof = (scope, identifier) =>
							lookup(scope, identifier, true, {
								with: (token) =>
									Build.unary(
										'typeof',
										Build.apply(
											Build.builtin('Reflect.get'),
											Build.primitive(void 0),
											[
												Build.read(token),
												Build.primitive(identifier),
											]
										)
									),
								hit: (writable) =>
									Build.unary(
										'typeof',
										Build.read(identifier)
									),
								miss: () =>
									Build.unary(
										'typeof',
										Build.apply(
											Build.builtin('Reflect.get'),
											Build.primitive(void 0),
											[
												Build.builtin('global'),
												Build.primitive(identifier),
											]
										)
									),
							});

						exports.delete = (scope, identifier) =>
							lookup(scope, identifier, true, {
								with: (token) =>
									Build.apply(
										Build.builtin('Reflect.deleteProperty'),
										Build.primitive(void 0),
										[
											Build.read(token),
											Build.primitive(identifier),
										]
									),
								hit: (writabel) => Build.primitive(false),
								miss: () =>
									Build.apply(
										Build.builtin('Reflect.deleteProperty'),
										Build.primitive(void 0),
										[
											Build.builtin('global'),
											Build.primitive(identifier),
										]
									),
							});

						exports.Write = (scope, identifier, expression) => {
							const { tag, binding } = Data.GetLookup(
								scope,
								identifier
							);
							return tag === 'hit'
								? binding.writable
									? Build.Write(identifier, expression)
									: Build.Expression(
											Build.apply(
												Build.read(
													Data.GetToken(
														scope,
														'HelperThrowTypeError'
													)
												),
												Build.primitive(void 0),
												[
													Build.primitive(
														'cannot assign constant variable: ' +
															identifier
													),
												]
											)
										)
								: Build.Expression(
										exports.write(
											scope,
											identifier,
											expression,
											Build.primitive(void 0)
										)
									);
						};

						exports.write = (
							scope,
							identifier,
							expression1,
							expression2
						) => {
							const hit = (writable, expression1, expression2) =>
								writable
									? Build.write(
											identifier,
											expression1,
											expression2
										)
									: Build.apply(
											Build.read(
												Data.GetToken(
													scope,
													'HelperThrowTypeError'
												)
											),
											Build.primitive(void 0),
											[
												Build.primitive(
													'Assignment to a constant variable'
												),
											]
										);
							const miss = (expression1, expression2) =>
								Data.GetStrict(scope)
									? Build.conditional(
											Build.apply(
												Build.read(
													Data.GetToken(
														scope,
														'HelperIsGlobal'
													)
												),
												Build.primitive(void 0),
												[Build.primitive(identifier)]
											),
											Build.conditional(
												Build.apply(
													Build.builtin(
														'Reflect.set'
													),
													Build.primitive(void 0),
													[
														Build.builtin('global'),
														Build.primitive(
															identifier
														),
														expression1,
													]
												),
												expression2,
												Build.apply(
													Build.read(
														Data.GetToken(
															scope,
															'HelperThrowTypeError'
														)
													),
													Build.primitive(void 0),
													[
														Build.primitive(
															'Cannot assign object property'
														),
													]
												)
											),
											Build.apply(
												Build.read(
													Data.GetToken(
														scope,
														'HelperThrowReferenceError'
													)
												),
												Build.primitive(void 0),
												[
													Build.primitive(
														identifier +
															' is node defined'
													),
												]
											)
										)
									: Build.sequence(
											Build.apply(
												Build.builtin('Reflect.set'),
												Build.primitive(void 0),
												[
													Build.builtin('global'),
													Build.primitive(identifier),
													expression1,
												]
											),
											expression2
										);
							const { tag, binding } = Data.GetLookup(
								scope,
								identifier
							);
							if (tag === 'hit')
								return hit(
									binding.writable,
									expression1,
									expression2
								);
							if (tag === 'miss')
								return miss(expression1, expression2);
							const token1 = ++ARAN.root.AranCounter;
							Data.SetBinding(scope, token1, {
								initialized: true,
								writabel: true,
								token: null,
							});
							return Build.write(
								token1,
								expression1,
								Build.sequence(
									lookup(scope, identifier, true, {
										with: (token2) =>
											Data.GetStrict(scope)
												? Build.conditional(
														Build.apply(
															Build.builtin(
																'Reflect.set'
															),
															Build.primitive(
																void 0
															),
															[
																Build.read(
																	token2
																),
																Build.primitive(
																	identifier
																),
																Build.read(
																	token1
																),
															]
														),
														Build.primitive(void 0),
														Build.apply(
															Build.read(
																Data.GetToken(
																	scope,
																	'HelperThrowTypeError'
																)
															),
															Build.primitive(
																void 0
															),
															[
																Build.primitive(
																	'Cannot assign object property'
																),
															]
														)
													)
												: Build.apply(
														Build.builtin(
															'Reflect.set'
														),
														Build.primitive(void 0),
														[
															Build.read(token2),
															Build.primitive(
																identifier
															),
															Build.read(token1),
														]
													),
										hit: (writable) =>
											hit(
												writable,
												Build.read(token1),
												Build.primitive(void 0)
											),
										miss: () =>
											miss(
												Build.read(token1),
												Build.primitive(void 0)
											),
									}),
									expression2
								)
							);
						};
					}).call(this);
				}).call(
					this,
					typeof global !== 'undefined'
						? global
						: typeof self !== 'undefined'
							? self
							: typeof window !== 'undefined'
								? window
								: {}
				);
			},
			{ '../build.js': 22, './data.js': 25, 'array-lite': 35 },
		],
		27: [
			function (require, module, exports) {
				const Data = require('./data.js');
				const Identifier = require('./identifier.js');
				const Pattern = require('./pattern.js');

				exports.ExtendStrict = Data.ExtendStrict;
				exports.ExtendFunction = Data.ExtendFunction;
				exports.ExtendArrow = Data.ExtendArrow;
				exports.ExtendToken = Data.ExtendToken;
				exports.ExtendLabel = Data.ExtendLabel;

				exports.GetStrict = Data.GetStrict;
				exports.GetCallee = Data.GetCallee;
				exports.GetToken = Data.GetToken;
				exports.GetLabels = Data.GetLabels;

				exports.BLOCK = Identifier.BLOCK;
				exports.token = Identifier.token;
				exports.Token = Identifier.Token;
				exports.initialize = Identifier.initialize;
				exports.Initialize = Identifier.Initialize;
				exports.eval = Identifier.eval;
				exports.read = Identifier.read;
				exports.write = Identifier.write;
				exports.Write = Identifier.Write;
				exports.delete = Identifier.delete;
				exports.typeof = Identifier.typeof;

				exports.assign = Pattern.assign;
				exports.Assign = Pattern.Assign;
				exports.update = Pattern.update;
				exports.Update = Pattern.Update;
			},
			{ './data.js': 25, './identifier.js': 26, './pattern.js': 28 },
		],
		28: [
			function (require, module, exports) {
				const ArrayLite = require('array-lite');
				const Build = require('../build.js');
				const Visit = require('../visit');
				const Scope = require('./index.js');

				const objectify = (scope, token) =>
					Build.conditional(
						Build.binary(
							'===',
							Build.unary('typeof', Scope.read(scope, token)),
							Build.primitive('object')
						),
						Scope.read(scope, token),
						Build.conditional(
							Build.binary(
								'===',
								Scope.read(scope, token),
								Build.primitive(void 0)
							),
							Scope.read(scope, token),
							Build.apply(
								Build.builtin('Object'),
								Build.primitive(void 0),
								[Scope.read(scope, token)]
							)
						)
					);

				const set = (scope, token, expression1, expression2) =>
					Scope.GetStrict(scope)
						? Build.conditional(
								Build.apply(
									Build.builtin('Reflect.set'),
									Build.primitive(void 0),
									[
										Scope.read(scope, token),
										expression1,
										expression2,
									]
								),
								Build.primitive(true),
								Build.apply(
									Scope.read(
										scope,
										Scope.GetToken(
											scope,
											'HelperThrowTypeError'
										)
									),
									Build.primitive(void 0),
									[
										Build.primitive(
											'Cannot assign object property'
										),
									]
								)
							)
						: Build.apply(
								Build.builtin('Reflect.set'),
								Build.primitive(void 0),
								[
									objectify(scope, token),
									expression1,
									expression2,
								]
							);

				const get = (scope, token, expression) =>
					Build.apply(
						Build.builtin('Reflect.get'),
						Build.primitive(void 0),
						[objectify(scope, token), expression]
					);

				const visitors = {};

				const visit = (
					scope,
					boolean,
					pattern,
					expression1,
					expression2
				) =>
					visitors[pattern.type](
						scope,
						boolean,
						pattern,
						expression1,
						expression2
					);

				visitors.MemberExpression = (
					scope,
					boolean,
					pattern,
					expression1,
					expression2
				) =>
					boolean
						? () => {
								throw new Error(
									'Cannot have member expression in initialization context'
								);
							}
						: Scope.token(
								scope,
								Visit.node(pattern.object, scope, ''),
								(token) =>
									Build.sequence(
										set(
											scope,
											token,
											pattern.computed
												? Visit.node(
														pattern.property,
														scope,
														''
													)
												: Build.primitive(
														pattern.property.name
													),
											expression1
										),
										expression2
									)
							);

				visitors.Identifier = (
					scope,
					boolean,
					pattern,
					expression1,
					expression2
				) =>
					Scope[boolean ? 'initialize' : 'write'](
						scope,
						pattern.name,
						expression1,
						expression2
					);

				visitors.AssignmentPattern = (
					scope,
					boolean,
					pattern,
					expression1,
					expression2
				) =>
					Scope.token(scope, expression1, (token) =>
						visit(
							scope,
							boolean,
							pattern.left,
							Build.conditional(
								Build.binary(
									'===',
									Scope.read(scope, token),
									Build.primitive(void 0)
								),
								Visit.node(pattern.right, scope, ''),
								Scope.read(scope, token)
							),
							expression2
						)
					);

				visitors.ObjectPattern = (
					scope,
					boolean,
					pattern,
					expression1,
					expression2
				) =>
					Scope.token(scope, expression1, (token1) =>
						pattern.properties.length &&
						pattern.properties[pattern.properties.length - 1]
							.type === 'RestElement'
							? Scope.token(
									scope,
									Build.apply(
										Build.builtin('Array.of'),
										Build.primitive(void 0),
										[]
									),
									(token2) =>
										ArrayLite.reduceRight(
											pattern.properties,
											(expression3, pattern) =>
												pattern.type === 'RestElement'
													? visit(
															scope,
															boolean,
															pattern.argument,
															Build.apply(
																Scope.read(
																	scope,
																	Scope.GetToken(
																		scope,
																		'HelperObjectRest'
																	)
																),
																Build.primitive(
																	void 0
																),
																[
																	objectify(
																		scope,
																		Scope.read(
																			scope,
																			token1
																		)
																	),
																	Scope.read(
																		scope,
																		token2
																	),
																]
															),
															expression3
														)
													: Scope.token(
															scope,
															pattern.computed
																? Visit.node(
																		pattern.key,
																		scope,
																		''
																	)
																: Build.primitive(
																		pattern
																			.key
																			.name ||
																			pattern
																				.key
																				.value
																	),
															(token3) =>
																Build.sequence(
																	Build.apply(
																		Build.builtin(
																			'Array.prototype.push'
																		),
																		Scope.read(
																			token2
																		),
																		[
																			Scope.read(
																				scope,
																				token3
																			),
																		]
																	),
																	visit(
																		scope,
																		boolean,
																		pattern.value,
																		get(
																			scope,
																			token1,
																			Scope.read(
																				scope,
																				token3
																			)
																		),
																		expression3
																	)
																)
														),
											expression2
										)
								)
							: ArrayLite.reduceRight(
									pattern.properties,
									(expression3, pattern) =>
										visit(
											scope,
											boolean,
											pattern.value,
											get(
												scope,
												token1,
												pattern.computed
													? Visit.node(
															pattern.key,
															scope,
															''
														)
													: Build.primitive(
															pattern.key.name ||
																pattern.key
																	.value
														)
											),
											expression3
										),
									expression2
								)
					);

				visitors.ArrayPattern = (
					scope,
					boolean,
					pattern,
					expression1,
					expression2
				) =>
					Scope.token(scope, expression1, (token) =>
						Scope.token(
							scope,
							Build.apply(
								get(
									scope,
									token,
									Build.builtin('Symbol.iterator')
								),
								Scope.read(scope, token),
								[]
							),
							(token) =>
								ArrayLite.reduceRight(
									pattern.elements,
									(expression3, pattern) =>
										visit(
											scope,
											boolean,
											pattern.type === 'RestElement'
												? pattern.argument
												: pattern,
											pattern.type === 'RestElement'
												? Build.apply(
														Scope.read(
															scope,
															Scope.GetToken(
																scope,
																'HelperIteratorRest'
															)
														),
														Build.primitive(void 0),
														[
															Scope.read(
																scope,
																token
															),
														]
													)
												: Build.apply(
														Build.builtin(
															'Reflect.get'
														),
														Build.primitive(void 0),
														[
															Build.apply(
																Build.apply(
																	Build.builtin(
																		'Reflect.get'
																	),
																	Build.primitive(
																		void 0
																	),
																	[
																		Scope.read(
																			scope,
																			token
																		),
																		Build.primitive(
																			'next'
																		),
																	]
																),
																Scope.read(
																	scope,
																	token
																),
																[]
															),
															Build.primitive(
																'value'
															),
														]
													),
											expression3
										),
									expression2
								)
						)
					);

				exports.Update = (scope, operator, pattern, expression) =>
					pattern.type === 'MemberExpression'
						? Scope.Token(
								scope,
								Visit.node(pattern.object, scope, ''),
								(token1) =>
									Scope.Token(
										scope,
										pattern.computed
											? Visit.node(
													pattern.property,
													scope,
													''
												)
											: Build.primitive(
													pattern.property.name
												),
										(token2) =>
											Build.Expression(
												set(
													scope,
													token1,
													Scope.read(scope, token2),
													Build.binary(
														operator,
														get(
															scope,
															token1,
															Scope.read(
																scope,
																token2
															)
														),
														expression
													)
												)
											)
									)
							)
						: pattern.type === 'Identifier'
							? Scope.Write(
									scope,
									pattern.name,
									Build.binary(
										operator,
										Scope.read(scope, pattern.name),
										expression
									)
								)
							: () => {
									throw new Error(
										'Pattern cannot be updated'
									);
								};

				exports.Assign = (scope, boolean, pattern, expression) =>
					pattern.type === 'MemberExpression'
						? boolean
							? () => {
									throw new Error(
										'Cannot have member expression in initialization'
									);
								}
							: Scope.Token(
									scope,
									Visit.node(pattern.object, scope, ''),
									(token) =>
										Build.Expression(
											set(
												scope,
												token,
												pattern.computed
													? Visit.node(
															pattern.property,
															scope,
															''
														)
													: Build.primitive(
															pattern.property
																.name
														),
												expression
											)
										)
								)
						: pattern.type === 'Identifier'
							? Scope[boolean ? 'Initialize' : 'Write'](
									scope,
									pattern.name,
									expression
								)
							: Build.Expression(
									visit(
										scope,
										boolean,
										pattern,
										expression,
										Build.primitive(void 0)
									)
								);

				exports.update = (
					scope,
					prefix,
					operator,
					pattern,
					expression
				) =>
					pattern.type === 'MemberExpression'
						? Scope.token(
								scope,
								Visit.node(pattern.object, scope, ''),
								(token1) =>
									Scope.token(
										scope,
										pattern.computed
											? Visit.node(
													pattern.property,
													scope,
													''
												)
											: Build.primitive(
													pattern.property.name
												),
										(token2) =>
											Scope.token(
												scope,
												prefix
													? Build.binary(
															'+',
															get(
																scope,
																token1,
																Scope.read(
																	scope,
																	token2
																)
															),
															expression
														)
													: get(
															scope,
															token1,
															Scope.read(
																scope,
																token2
															)
														),
												(token3) =>
													Build.sequence(
														set(
															scope,
															token1,
															Scope.read(
																scope,
																token2
															),
															prefix
																? Scope.read(
																		scope,
																		token3
																	)
																: Build.binary(
																		operator,
																		Scope.read(
																			scope,
																			token3
																		),
																		expression
																	)
														),
														Scope.read(
															scope,
															token3
														)
													)
											)
									)
							)
						: pattern.type === 'Identifier'
							? Scope.token(
									scope,
									prefix
										? Build.binary(
												operator,
												Scope.read(scope, pattern.name),
												expression
											)
										: Scope.read(scope, pattern.name),
									(token) =>
										Scope.write(
											scope,
											pattern.name,
											prefix
												? Scope.read(scope, token)
												: Build.binary(
														operator,
														Scope.read(
															scope,
															token
														),
														expression
													),
											Scope.read(scope, token)
										)
								)
							: () => {
									throw new Error(
										'Pattern cannot be updated'
									);
								};

				exports.assign = (scope, boolean, pattern, expression) =>
					pattern.type === 'MemberExpression'
						? boolean
							? () => {
									throw new Error(
										'Cannot have member expression in initialization'
									);
								}
							: pattern.computed
								? Scope.token(
										scope,
										Visit.node(pattern.object, scope, ''),
										(token1) =>
											Scope.token(
												scope,
												Visit.node(
													pattern.property,
													scope,
													''
												),
												(token2) =>
													Scope.token(
														scope,
														expression,
														(token3) =>
															Build.sequence(
																set(
																	scope,
																	token1,
																	Scope.read(
																		scope,
																		token2
																	),
																	Scope.read(
																		scope,
																		token3
																	)
																),
																Scope.read(
																	scope,
																	token3
																)
															)
													)
											)
									)
								: Scope.token(
										scope,
										Visit.node(pattern.object, scope, ''),
										(token1) =>
											Scope.token(
												scope,
												expression,
												(token2) =>
													Build.sequence(
														set(
															scope,
															token1,
															Build.primitive(
																pattern.property
																	.name
															),
															Scope.read(
																scope,
																token2
															)
														),
														Scope.read(
															scope,
															token2
														)
													)
											)
									)
						: Scope.token(scope, expression, (token) =>
								visit(
									scope,
									boolean,
									pattern,
									Scope.read(scope, token),
									Scope.read(scope, token)
								)
							);
			},
			{
				'../build.js': 22,
				'../visit': 31,
				'./index.js': 27,
				'array-lite': 35,
			},
		],
		29: [
			function (require, module, exports) {
				const ArrayLite = require('array-lite');
				const Build = require('../build.js');
				const Scope = require('../scope');
				const Query = require('../query.js');
				const Visit = require('./index.js');

				const Object_create = Object.create;

				const common = (scope, nodes) =>
					ArrayLite.concat(
						ArrayLite.flatMap(
							ArrayLite.filter(
								nodes,
								(node) => node.type === 'FunctionDeclaration'
							),
							(node) =>
								Scope.Write(
									scope,
									node.id.name,
									Visit.node(node, scope, '')
								)
						),
						ArrayLite.flatMap(
							ArrayLite.filter(
								nodes,
								(node) => node.type !== 'FunctionDeclaration'
							),
							(node) => Visit.Node(node, scope)
						)
					);

				const helpers = Object_create(null);

				// function AranThrowTypeError () {
				//   const message = arguments[0];
				//   throw new TypeError(message);
				// }
				helpers['HelperThrowTypeError'] = (scope) =>
					Build.closure(
						Scope.BLOCK(scope, [], ['message'], (scope) =>
							ArrayLite.concat(
								Build.Expression(
									Build.conditional(
										Build.argument('new.target'),
										Build.primitive(null),
										Build.argument('this')
									)
								),
								Build.Expression(Build.argument('length')),
								Scope.Initialize(
									scope,
									'message',
									Build.argument('next')
								),
								Build.Throw(
									Build.construct(
										Build.builtin('TypeError'),
										[Scope.read(scope, 'message')]
									)
								)
							)
						)
					);

				// function AranThrowReferenceError () {
				//   const message = arguments[0];
				//   throw new ReferenceError(message);
				// }
				helpers['HelperThrowReferenceError'] = (scope) =>
					Build.closure(
						Scope.BLOCK(scope, [], ['message'], (scope) =>
							ArrayLite.concat(
								Build.Expression(
									Build.conditional(
										Build.argument('new.target'),
										Build.primitive(null),
										Build.argument('this')
									)
								),
								Build.Expression(Build.argument('length')),
								Scope.Initialize(
									scope,
									'message',
									Build.argument('next')
								),
								Build.Throw(
									Build.construct(
										Build.builtin('ReferenceError'),
										[Scope.read(scope, 'message')]
									)
								)
							)
						)
					);

				// function AranIsGlobal () {
				//   let object = global;
				//   const key = arguments[0];
				//   while (object) {
				//     if (Reflect.getOwnPropertyDescriptor(object, key)) {
				//       return true;
				//     } else {
				//       object = Reflect.getPrototypeOf(object);
				//     }
				//   }
				//   return false;
				// };
				helpers['HelperIsGlobal'] = (scope) =>
					Build.closure(
						Scope.BLOCK(scope, ['object'], ['key'], (scope) =>
							ArrayLite.concat(
								Build.Expression(
									Build.conditional(
										Build.argument('new.target'),
										Build.primitive(null),
										Build.argument('this')
									)
								),
								Build.Expression(Build.argument('length')),
								Scope.Initialize(
									scope,
									'key',
									Build.argument('next')
								),
								Scope.Initialize(
									scope,
									'object',
									Build.builtin('global')
								),
								Build.While(
									[],
									Scope.read(scope, 'object'),
									Scope.BLOCK(scope, [], [], (scope) =>
										Build.If(
											[],
											Build.apply(
												Build.builtin(
													'Reflect.getOwnPropertyDescriptor'
												),
												Build.primitive(void 0),
												[
													Scope.read(scope, 'object'),
													Scope.read(scope, 'key'),
												]
											),
											Scope.BLOCK(
												scope,
												[],
												[],
												(scope) =>
													Build.Return(
														Build.primitive(true)
													)
											),
											Scope.BLOCK(
												scope,
												[],
												[],
												(scope) =>
													Scope.Write(
														scope,
														'object',
														Build.apply(
															Build.builtin(
																'Reflect.getPrototypeOf'
															),
															Build.primitive(
																void 0
															),
															[
																Scope.read(
																	scope,
																	'object'
																),
															]
														)
													)
											)
										)
									)
								),
								Build.Return(Build.primitive(false))
							)
						)
					);

				// function AranIteratorRest () {
				//   const iterator = arguments[0];
				//   const array = Array.of();
				//   let step;
				//   while ((step = Reflect.get(iterator, "next").call(iterator), !Reflect.get(step, "done"))) {
				//     Array.prototype.push.call(array, Reflect.get(step, "value"));
				//   }
				//   return array;
				// }
				helpers['HelperIteratorRest'] = (scope) =>
					Build.closure(
						Scope.BLOCK(
							scope,
							['step'],
							['iterator', 'array'],
							(scope) =>
								ArrayLite.concat(
									Build.Expression(
										Build.conditional(
											Build.argument('new.target'),
											Build.primitive(null),
											Build.argument('this')
										)
									),
									Build.Expression(Build.argument('length')),
									Scope.Initialize(
										scope,
										'iterator',
										Build.argument('next')
									),
									Scope.Initialize(
										scope,
										'array',
										Build.apply(
											Build.builtin('Array.of'),
											Build.primitive(void 0),
											[]
										)
									),
									Scope.Initialize(
										scope,
										'step',
										Build.primitive(void 0)
									),
									Build.While(
										[],
										Scope.write(
											scope,
											'step',
											Build.apply(
												Build.apply(
													Build.builtin(
														'Reflect.get'
													),
													Build.primitive(void 0),
													[
														Scope.read(
															scope,
															'iterator'
														),
														Build.primitive('next'),
													]
												),
												Scope.read(scope, 'iterator'),
												[]
											),
											Build.unary(
												'!',
												Build.apply(
													Build.builtin(
														'Reflect.get'
													),
													Build.primitive(void 0),
													[
														Scope.read(
															scope,
															'step'
														),
														Build.primitive('done'),
													]
												)
											)
										),
										Scope.BLOCK(scope, [], [], (scope) =>
											Build.Expression(
												Build.apply(
													Build.builtin(
														'Array.prototype.push'
													),
													Scope.read(scope, 'array'),
													[
														Build.apply(
															Build.builtin(
																'Reflect.get'
															),
															Build.primitive(
																void 0
															),
															[
																Scope.read(
																	scope,
																	'step'
																),
																Build.primitive(
																	'value'
																),
															]
														),
													]
												)
											)
										)
									),
									Build.Return(Scope.read(scope, 'array'))
								)
						)
					);

				// function AranObjectSpread () {
				//   const target = arguments[0];
				//   const source = arguments[1];
				//   const keys = Object.keys();
				//   const length = Reflect.get(keys, "length");
				//   let index = 0;
				//   while (index < length) {
				//     const descriptor = Object.create(null);
				//     Reflect.set(descriptor, "value", Reflect.get(source, Reflect.get(keys, index)));
				//     Reflect.set(descriptor, "writable", true);
				//     Reflect.set(descriptor, "enumerable", true);
				//     Reflect.set(descriptor, "configurable", true);
				//     Object.defineProperty(target, Reflect.get(keys, index), descriptor);
				//     index = index + 1;
				//   }
				//   return target;
				// }
				helpers['HelperObjectSpread'] = (scope) =>
					Build.closure(
						Scope.BLOCK(
							scope,
							['index'],
							['target', 'source', 'keys', 'length'],
							(scope) =>
								ArrayLite.concat(
									Build.Expression(
										Build.conditional(
											Build.argument('new.target'),
											Build.primitive(null),
											Build.argument('this')
										)
									),
									Build.Expression(Build.argument('length')),
									Scope.Initialize(
										scope,
										'target',
										Build.argument('next')
									),
									Scope.Initialize(
										scope,
										'source',
										Build.argument('next')
									),
									Scope.Initialize(
										scope,
										'keys',
										Build.apply(
											Build.builtin('Object.keys'),
											Build.primitive(void 0),
											[Scope.read(scope, 'source')]
										)
									),
									Scope.Initialize(
										scope,
										'index',
										Build.primitive(0)
									),
									Scope.Initialize(
										scope,
										'length',
										Build.apply(
											Build.builtin('Reflect.get'),
											Build.primitive(void 0),
											[
												Scope.read(scope, 'keys'),
												Build.primitive('length'),
											]
										)
									),
									Build.While(
										[],
										Build.binary(
											'<',
											Scope.read(scope, 'index'),
											Scope.read(scope, 'length')
										),
										Scope.BLOCK(
											scope,
											[],
											['descriptor'],
											(scope) =>
												ArrayLite.concat(
													Scope.Initialize(
														scope,
														'descriptor',
														Build.apply(
															Build.builtin(
																'Object.create'
															),
															Build.primitive(
																void 0
															),
															[
																Build.primitive(
																	null
																),
															]
														)
													),
													Build.Expression(
														Build.apply(
															Build.builtin(
																'Reflect.set'
															),
															Build.primitive(
																void 0
															),
															[
																Scope.read(
																	scope,
																	'descriptor'
																),
																Build.primitive(
																	'value'
																),
																Build.apply(
																	Build.builtin(
																		'Reflect.get'
																	),
																	Build.primitive(
																		void 0
																	),
																	[
																		Scope.read(
																			scope,
																			'source'
																		),
																		Build.apply(
																			Build.builtin(
																				'Reflect.get'
																			),
																			Build.primitive(
																				void 0
																			),
																			[
																				Scope.read(
																					scope,
																					'keys'
																				),
																				Scope.read(
																					scope,
																					'index'
																				),
																			]
																		),
																	]
																),
															]
														)
													),
													Build.Expression(
														Build.apply(
															Build.builtin(
																'Reflect.set'
															),
															Build.primitive(
																void 0
															),
															[
																Scope.read(
																	scope,
																	'descriptor'
																),
																Build.primitive(
																	'writable'
																),
																Build.primitive(
																	true
																),
															]
														)
													),
													Build.Expression(
														Build.apply(
															Build.builtin(
																'Reflect.set'
															),
															Build.primitive(
																void 0
															),
															[
																Scope.read(
																	scope,
																	'descriptor'
																),
																Build.primitive(
																	'enumerable'
																),
																Build.primitive(
																	true
																),
															]
														)
													),
													Build.Expression(
														Build.apply(
															Build.builtin(
																'Reflect.set'
															),
															Build.primitive(
																void 0
															),
															[
																Scope.read(
																	scope,
																	'descriptor'
																),
																Build.primitive(
																	'configurable'
																),
																Build.primitive(
																	true
																),
															]
														)
													),
													Build.Expression(
														Build.apply(
															Build.builtin(
																'Reflect.defineProperty'
															),
															Build.primitive(
																void 0
															),
															[
																Scope.read(
																	scope,
																	'target'
																),
																Build.apply(
																	Build.builtin(
																		'Reflect.get'
																	),
																	Build.primitive(
																		void 0
																	),
																	[
																		Scope.read(
																			scope,
																			'keys'
																		),
																		Scope.read(
																			scope,
																			'index'
																		),
																	]
																),
																Scope.read(
																	scope,
																	'descriptor'
																),
															]
														)
													),
													Scope.Write(
														scope,
														'index',
														Build.binary(
															'+',
															Scope.read(
																scope,
																'index'
															),
															Build.primitive(1)
														)
													)
												)
										)
									),
									Build.Return(Scope.read(scope, 'target'))
								)
						)
					);

				// function AranObjectRest () => {
				//   const source = arguments[0];
				//   const blacklist = arguments[1];
				//   const keys = Object.keys(source);
				//   const target = Object.create(Object.prototype);
				//   const length2 = Reflect.get(keys, "length");
				//   let index2 = 0;
				//   while (index2 < length2) {
				//     const key2 = Reflect.get(keys2, index2);
				//     if (Array.prototype.includes.call(keys1, key2)) {
				//     } else {
				//       Reflect.set(target, key2, Reflect.get(source, key2));
				//     }
				//     index = index + 1;
				//   }
				// };
				helpers['HelperObjectRest'] = (scope) =>
					Build.closure(
						Scope.BLOCK(
							scope,
							['index'],
							['source', 'blacklist', 'keys', 'target', 'length'],
							(scope) =>
								ArrayLite.concat(
									Build.Expression(
										Build.conditional(
											Build.argument('new.target'),
											Build.primitive(null),
											Build.argument('this')
										)
									),
									Build.Expression(Build.argument('length')),
									Scope.Initialize(
										scope,
										'source',
										Build.argument('next')
									),
									Scope.Initialize(
										scope,
										'blacklist',
										Build.argument('next')
									),
									Scope.Initialize(
										scope,
										'target',
										Build.apply(
											Build.builtin('Object.create'),
											Build.primitive(void 0),
											[Build.primitive(void 0)]
										)
									),
									Scope.Initialize(
										scope,
										'keys',
										Build.apply(
											Build.builtin('Object.keys'),
											Build.primitive(void 0),
											[Scope.read(scope, 'source')]
										)
									),
									Scope.Initialize(
										scope,
										'length',
										Build.apply(
											Build.builtin('Reflect.get'),
											Build.primitive(void 0),
											[
												Scope.read(scope, 'keys'),
												Build.primitive('length'),
											]
										)
									),
									Scope.Initialize(
										scope,
										'index',
										Build.primitive(0)
									),
									Build.While(
										[],
										Build.binary(
											'<',
											Scope.read(scope, 'index'),
											Scope.read(scope, 'length')
										),
										Scope.BLOCK(
											scope,
											[],
											['key'],
											(scope) =>
												ArrayLite.concat(
													Scope.Initialize(
														scope,
														'key',
														Build.apply(
															Build.builtin(
																'Reflect.get'
															),
															Build.primitive(
																void 0
															),
															[
																Scope.read(
																	scope,
																	'keys'
																),
																Scope.read(
																	scope,
																	'index'
																),
															]
														)
													),
													Build.If(
														[],
														Build.apply(
															Build.builtin(
																'Array.prototype.includes'
															),
															Scope.read(
																scope,
																'blacklist'
															),
															[
																Scope.read(
																	scope,
																	'key'
																),
															]
														),
														Scope.BLOCK(
															scope,
															[],
															[],
															(scope) => []
														),
														Scope.BLOCK(
															scope,
															[],
															[],
															(scope) =>
																Build.Expression(
																	Build.apply(
																		Build.builtin(
																			'Reflect.set'
																		),
																		Build.primitive(
																			void 0
																		),
																		[
																			Scope.read(
																				scope,
																				'target'
																			),
																			Scope.read(
																				scope,
																				'key'
																			),
																			Build.apply(
																				Build.builtin(
																					'Reflect.get'
																				),
																				Build.primitive(
																					void 0
																				),
																				[
																					Scope.read(
																						scope,
																						'source'
																					),
																					Scope.read(
																						scope,
																						'key'
																					),
																				]
																			),
																		]
																	)
																)
														)
													),
													Scope.Write(
														scope,
														'index',
														Build.binary(
															'+',
															Scope.read(
																scope,
																'index'
															),
															Build.primitive(1)
														)
													)
												)
										)
									),
									Build.Expression(
										Build.apply(
											Build.builtin(
												'Reflect.setPrototypeOf'
											),
											Build.primitive(void 0),
											[
												Scope.read(scope, 'target'),
												Build.builtin(
													'Object.prototype'
												),
											]
										)
									),
									Build.Return(Scope.read(scope, 'target'))
								)
						)
					);

				exports.Program = (node, scope1, boolean) =>
					Scope.BLOCK(
						!Scope.GetStrict(scope1) &&
							node.body.length > 0 &&
							node.body[0].type === 'ExpressionStatement' &&
							node.body[0].expression.type === 'Literal' &&
							node.body[0].expression.value === 'use strict'
							? Scope.ExtendStrict(scope1)
							: scope1,
						ArrayLite.concat(
							scope1 ||
								(node.body.length > 0 &&
									node.body[0].type ===
										'ExpressionStatement' &&
									node.body[0].expression.type ===
										'Literal' &&
									node.body[0].expression.value ===
										'use strict')
								? Query.BodyNames(node, 'var')
								: [],
							Query.BodyNames(node, 'let')
						),
						ArrayLite.concat(
							scope1 ? [] : ['this'],
							Query.BodyNames(node, 'const')
						),
						(scope2) =>
							ArrayLite.concat(
								scope1
									? []
									: ArrayLite.reduce(
											[
												'HelperThrowTypeError',
												'HelperThrowReferenceError',
												'HelperIsGlobal',
												'HelperIteratorRest',
												'HelperObjectSpread',
												'HelperObjectRest',
											],
											(statements, name) =>
												Scope.Token(
													scope2,
													helpers[name](scope2),
													(token) => (
														(scope2 =
															Scope.ExtendToken(
																scope2,
																name,
																token
															)),
														statements
													)
												),
											[]
										),
								scope1
									? []
									: Scope.Initialize(
											scope2,
											'this',
											Build.builtin('global')
										),
								scope1 || Scope.GetStrict(scope2)
									? ArrayLite.flatMap(
											Query.BodyNames(node, 'var'),
											(name) =>
												Scope.Initialize(
													scope2,
													name,
													Build.primitive(void 0)
												)
										)
									: ArrayLite.flatMap(
											Query.BodyNames(node, 'var'),
											(name) =>
												Scope.Token(
													scope2,
													Build.apply(
														Build.builtin(
															'Object.create'
														),
														Build.primitive(void 0),
														[Build.primitive(null)]
													),
													(token) =>
														ArrayLite.concat(
															Build.Expression(
																Build.apply(
																	Build.builtin(
																		'Reflect.set'
																	),
																	Build.primitive(
																		void 0
																	),
																	[
																		Scope.read(
																			scope2,
																			token
																		),
																		Build.primitive(
																			'value'
																		),
																		Build.apply(
																			Build.builtin(
																				'Reflect.get'
																			),
																			Build.primitive(
																				void 0
																			),
																			[
																				Build.builtin(
																					'global'
																				),
																				Build.primitive(
																					name
																				),
																			]
																		),
																	]
																)
															),
															Build.Expression(
																Build.apply(
																	Build.builtin(
																		'Reflect.set'
																	),
																	Build.primitive(
																		void 0
																	),
																	[
																		Scope.read(
																			scope2,
																			token
																		),
																		Build.primitive(
																			'writable'
																		),
																		Build.primitive(
																			true
																		),
																	]
																)
															),
															Build.Expression(
																Build.apply(
																	Build.builtin(
																		'Reflect.set'
																	),
																	Build.primitive(
																		void 0
																	),
																	[
																		Scope.read(
																			scope2,
																			token
																		),
																		Build.primitive(
																			'enumerable'
																		),
																		Build.primitive(
																			true
																		),
																	]
																)
															),
															Build.Expression(
																Build.apply(
																	Build.builtin(
																		'Reflect.set'
																	),
																	Build.primitive(
																		void 0
																	),
																	[
																		Scope.read(
																			scope2,
																			token
																		),
																		Build.primitive(
																			'configurable'
																		),
																		Build.primitive(
																			false
																		),
																	]
																)
															),
															Build.Expression(
																Build.apply(
																	Build.builtin(
																		'Reflect.defineProperty'
																	),
																	Build.primitive(
																		void 0
																	),
																	[
																		Build.builtin(
																			'global'
																		),
																		Build.primitive(
																			name
																		),
																		Scope.read(
																			scope2,
																			token
																		),
																	]
																)
															)
														)
												)
										),
								Scope.Token(
									scope2,
									Build.primitive(void 0),
									(token) =>
										ArrayLite.concat(
											common(
												Scope.ExtendToken(
													scope2,
													'Completion',
													token
												),
												node.body
											),
											Build.Expression(
												Scope.read(scope2, token)
											)
										)
								)
							)
					);

				exports.BlockStatement = (node, scope, boolean) =>
					boolean
						? Scope.BLOCK(
								!Scope.GetStrict(scope) &&
									node.body.length > 0 &&
									node.body[0].type ===
										'ExpressionStatement' &&
									node.body[0].expression.type ===
										'Literal' &&
									node.body[0].expression.value ===
										'use strict'
									? Scope.ExtendStrict(scope)
									: scope,
								ArrayLite.concat(
									Query.BodyNames(node, 'var'),
									Query.BodyNames(node, 'let')
								),
								Query.BodyNames(node, 'const'),
								(scope) =>
									ArrayLite.concat(
										ArrayLite.flatMap(
											Query.BodyNames(node, 'var'),
											(name) =>
												Scope.Initialize(
													scope,
													name,
													Build.primitive(void 0)
												)
										),
										common(scope, node.body)
									)
							)
						: Scope.BLOCK(
								scope,
								Query.BodyNames(node, 'let'),
								Query.BodyNames(node, 'const'),
								(scope) => common(scope, node.body)
							);

				ArrayLite.forEach(
					['ForStatement', 'ForOfStatement', 'ForInStatement'],
					(type) => {
						const key = type === 'ForStatement' ? 'init' : 'left';
						exports[type] = (node1, scope, boolean) => {
							if (
								node1[key].type !== 'VariableDeclaration' ||
								node1[key].kind === 'var'
							)
								return Scope.BLOCK(scope, [], [], (scope) =>
									Visit.Node(node1, scope)
								);
							const node2 = node1[key];
							node1[key] = null;
							const block = Scope.BLOCK(
								scope,
								node2.kind === 'let'
									? ArrayLite.flatMap(
											node2.declarations,
											Query.DeclarationNames
										)
									: [],
								node2.kind === 'const'
									? ArrayLite.flatMap(
											node2.declarations,
											Query.DeclarationNames
										)
									: [],
								(scope) =>
									ArrayLite.concat(
										Visit.Node(node2, scope),
										Visit.Node(node1, scope)
									)
							);
							node1[key] = node2;
							return block;
						};
					}
				);

				ArrayLite.forEach(
					[
						'EmptyStatement',
						'LabeledStatement',
						'ExpressionStatement',
						'FunctionDeclaration',
						'DebuggerStatement',
						'BreakStatement',
						'ContinueStatement',
						'ReturnStatement',
						'ThrowStatement',
						'TryStatement',
						'WithStatement',
						'IfStatement',
						'WhileStatement',
						'DoWileStatement',
						'SwitchStatement',
					],
					(type) => {
						exports[type] = (node, scope, boolean) => {
							return Scope.BLOCK(scope, [], [], (scope) =>
								Visit.Node(node, scope)
							);
						};
					}
				);
			},
			{
				'../build.js': 22,
				'../query.js': 24,
				'../scope': 27,
				'./index.js': 31,
				'array-lite': 35,
			},
		],
		30: [
			function (require, module, exports) {
				(function (global) {
					(function () {
						const ArrayLite = require('array-lite');
						const Build = require('../build.js');
						const Scope = require('../scope');
						const Query = require('../query.js');
						const Visit = require('./index.js');

						const Reflect_apply = global.Reflect.apply;
						const String_prototype_substring =
							String.prototype.substring;

						exports.ThisExpression = (node, scope, name) =>
							Scope.read(scope, 'this');

						exports.ArrayExpression = (node, scope, name) =>
							ArrayLite.some(
								node.elements,
								(node) => node && node.type === 'SpreadElement'
							)
								? Build.apply(
										Build.builtin('Array.prototype.concat'),
										Build.primitive(void 0),
										ArrayLite.map(node.elements, (node) =>
											node
												? node.type === 'SpreadElement'
													? Visit.node(
															node.argument,
															scope,
															''
														)
													: Build.apply(
															Build.builtin(
																'Array.of'
															),
															Build.primitive(
																void 0
															),
															[
																Visit.node(
																	node,
																	scope,
																	''
																),
															]
														)
												: Build.primitive(void 0)
										)
									)
								: Build.apply(
										Build.builtin('Array.of'),
										Build.primitive(void 0),
										ArrayLite.map(node.elements, (node) =>
											node
												? Visit.node(node, scope, '')
												: Build.primitive(void 0)
										)
									);

						exports.ObjectExpression = (node, scope, name) =>
							Scope.token(
								scope,
								Build.apply(
									Build.builtin('Object.create'),
									Build.primitive(void 0),
									[Build.primitive(null)]
								),
								(token1) =>
									Scope.token(
										scope,
										Build.builtin('Object.prototype'),
										(token2) =>
											Build.sequence(
												Build.apply(
													Build.builtin(
														'Reflect.setPrototypeOf'
													),
													Build.primitive(void 0),
													[
														ArrayLite.reduceRight(
															node.properties,
															(
																expression,
																property1,
																index1
															) =>
																Build.sequence(
																	property1.type ===
																		'SpreadElement'
																		? Build.apply(
																				Scope.read(
																					scope,
																					Scope.GetToken(
																						scope,
																						'HelperObjectSpread'
																					)
																				),
																				Build.primitive(
																					void 0
																				),
																				[
																					Scope.read(
																						scope,
																						token1
																					),
																					Visit.node(
																						property1.argument,
																						scope,
																						''
																					),
																				]
																			)
																		: (
																					property1.computed
																						? property1
																								.key
																								.type ===
																								'Literal' &&
																							property1
																								.key
																								.value ===
																								'__proto__'
																						: property1
																								.key
																								.name ===
																								'__proto__' ||
																							property1
																								.key
																								.value ===
																								'__proto__'
																			  )
																			? Scope.write(
																					scope,
																					token2,
																					Visit.node(
																						property1.value,
																						scope,
																						'__proto__'
																					)
																				)
																			: property1.kind ===
																				  'init'
																				? ArrayLite.every(
																						node.properties,
																						(
																							property2,
																							index2
																						) =>
																							index2 >=
																								index1 ||
																							property2.kind !==
																								'set' ||
																							(!property1.computed &&
																								!property2.computed &&
																								(property1
																									.key
																									.name ||
																									property1
																										.key
																										.value) !==
																									(property2
																										.key
																										.name ||
																										property2
																											.key
																											.value))
																					)
																					? Build.apply(
																							Build.builtin(
																								'Reflect.set'
																							),
																							Build.primitive(
																								void 0
																							),
																							[
																								Scope.read(
																									scope,
																									token1
																								),
																								property1.computed
																									? Visit.node(
																											property1.key,
																											scope,
																											''
																										)
																									: Build.primitive(
																											property1
																												.key
																												.name ||
																												property1
																													.key
																													.value
																										),
																								Visit.node(
																									property1.value,
																									scope,
																									property1.computed
																										? property1
																												.key
																												.type ===
																											'Literal'
																											? String(
																													property1
																														.key
																														.value
																												)
																											: ''
																										: property1
																												.key
																												.name ||
																												property1
																													.key
																													.value
																								),
																							]
																						)
																					: Build.apply(
																							Build.builtin(
																								'Reflect.defineProperty'
																							),
																							Build.primitive(
																								void 0
																							),
																							[
																								Scope.read(
																									scope,
																									token1
																								),
																								property1.computed
																									? Visit.node(
																											property1.key,
																											scope,
																											''
																										)
																									: Build.primitive(
																											property1
																												.key
																												.name ||
																												property1
																													.key
																													.value
																										),
																								Scope.token(
																									scope,
																									Build.apply(
																										Build.builtin(
																											'Object.create'
																										),
																										Build.primitive(
																											void 0
																										),
																										[
																											Build.primitive(
																												null
																											),
																										]
																									),
																									(
																										token
																									) =>
																										Build.sequence(
																											Build.apply(
																												Build.builtin(
																													'Reflect.set'
																												),
																												Build.primitive(
																													void 0
																												),
																												[
																													Scope.read(
																														scope,
																														token
																													),
																													Build.primitive(
																														'value'
																													),
																													Visit.node(
																														property1.value,
																														scope,
																														property1.computed
																															? property1
																																	.key
																																	.type ===
																																'Literal'
																																? String(
																																		property1
																																			.key
																																			.value
																																	)
																																: ''
																															: property1
																																	.key
																																	.name ||
																																	property1
																																		.key
																																		.value
																													),
																												]
																											),
																											Build.sequence(
																												Build.apply(
																													Build.builtin(
																														'Reflect.set'
																													),
																													Build.primitive(
																														void 0
																													),
																													[
																														Scope.read(
																															scope,
																															token
																														),
																														Build.primitive(
																															'writable'
																														),
																														Build.primitive(
																															true
																														),
																													]
																												),
																												Build.sequence(
																													Build.apply(
																														Build.builtin(
																															'Reflect.set'
																														),
																														Build.primitive(
																															void 0
																														),
																														[
																															Scope.read(
																																scope,
																																token
																															),
																															Build.primitive(
																																'enumerable'
																															),
																															Build.primitive(
																																true
																															),
																														]
																													),
																													Build.sequence(
																														Build.apply(
																															Build.builtin(
																																'Reflect.set'
																															),
																															Build.primitive(
																																void 0
																															),
																															[
																																Scope.read(
																																	scope,
																																	token
																																),
																																Build.primitive(
																																	'configurable'
																																),
																																Build.primitive(
																																	true
																																),
																															]
																														),
																														Scope.read(
																															scope,
																															token
																														)
																													)
																												)
																											)
																										)
																								),
																							]
																						)
																				: Build.apply(
																						Build.builtin(
																							'Reflect.defineProperty'
																						),
																						Build.primitive(
																							void 0
																						),
																						[
																							Scope.read(
																								scope,
																								token1
																							),
																							property1.computed
																								? Visit.node(
																										property1.key,
																										scope,
																										''
																									)
																								: Build.primitive(
																										property1
																											.key
																											.name ||
																											property1
																												.key
																												.value
																									),
																							Scope.token(
																								scope,
																								Build.apply(
																									Build.builtin(
																										'Object.create'
																									),
																									Build.primitive(
																										void 0
																									),
																									[
																										Build.primitive(
																											null
																										),
																									]
																								),
																								(
																									token
																								) =>
																									Build.sequence(
																										Build.apply(
																											Build.builtin(
																												'Reflect.set'
																											),
																											Build.primitive(
																												void 0
																											),
																											[
																												Scope.read(
																													scope,
																													token
																												),
																												Build.primitive(
																													property1.kind
																												),
																												Visit.node(
																													property1.value,
																													scope,
																													property1.computed
																														? property1
																																.key
																																.type ===
																															'Literal'
																															? property1.kind +
																																' ' +
																																String(
																																	property1
																																		.key
																																		.value
																																)
																															: property1.kind
																														: property1.kind +
																																' ' +
																																(property1
																																	.key
																																	.name ||
																																	property1
																																		.key
																																		.value)
																												),
																											]
																										),
																										Build.sequence(
																											Build.apply(
																												Build.builtin(
																													'Reflect.set'
																												),
																												Build.primitive(
																													void 0
																												),
																												[
																													Scope.read(
																														scope,
																														token
																													),
																													Build.primitive(
																														'enumerable'
																													),
																													Build.primitive(
																														true
																													),
																												]
																											),
																											Build.sequence(
																												Build.apply(
																													Build.builtin(
																														'Reflect.set'
																													),
																													Build.primitive(
																														void 0
																													),
																													[
																														Scope.read(
																															scope,
																															token
																														),
																														Build.primitive(
																															'configurable'
																														),
																														Build.primitive(
																															true
																														),
																													]
																												),
																												Scope.read(
																													scope,
																													token
																												)
																											)
																										)
																									)
																							),
																						]
																					),
																	expression
																),
															Scope.read(
																scope,
																token1
															)
														),
														Scope.read(
															scope,
															token2
														),
													]
												),
												Scope.read(scope, token1)
											)
									)
							);

						exports.SequenceExpression = (node, scope, name) =>
							ArrayLite.reduceRight(
								node.expressions,
								(expression, node) =>
									expression
										? Build.sequence(
												Visit.node(node, scope, ''),
												expression
											)
										: Visit.node(node, scope, ''),
								null
							);

						exports.UnaryExpression = (node, scope, name) =>
							node.operator === 'typeof' &&
							node.argument.type === 'Identifier'
								? Scope.typeof(scope, node.argument.name)
								: node.operator === 'delete'
									? node.argument.type === 'MemberExpression'
										? Build.conditional(
												Build.apply(
													Build.builtin(
														'Reflect.deleteProperty'
													),
													Build.primitive(void 0),
													[
														Scope.token(
															scope,
															Visit.node(
																node.argument
																	.object,
																scope,
																''
															),
															(token) =>
																Build.conditional(
																	Build.binary(
																		'===',
																		Build.unary(
																			'typeof',
																			Scope.read(
																				scope,
																				token
																			)
																		),
																		Build.primitive(
																			'object'
																		)
																	),
																	Scope.read(
																		scope,
																		token
																	),
																	Build.conditional(
																		Build.binary(
																			'===',
																			Scope.read(
																				scope,
																				token
																			),
																			Build.primitive(
																				void 0
																			)
																		),
																		Build.primitive(
																			token
																		),
																		Build.apply(
																			Build.builtin(
																				'Object'
																			),
																			Build.primitive(
																				void 0
																			),
																			[
																				Scope.read(
																					scope,
																					token
																				),
																			]
																		)
																	)
																)
														),
														node.argument.computed
															? Visit.node(
																	node
																		.argument
																		.property,
																	scope,
																	''
																)
															: Build.primitive(
																	node
																		.argument
																		.property
																		.name
																),
													]
												),
												Build.primitive(true),
												node.AranStrict
													? Build.apply(
															Scope.read(
																scope,
																Scope.GetToken(
																	scope,
																	'ThrowTypeError'
																)
															),
															Build.primitive(
																void 0
															),
															[
																Build.primitive(
																	'Cannot delete object property'
																),
															]
														)
													: Build.primitive(false)
											)
										: node.argument.type === 'Identifier'
											? Scope.delete(
													scope,
													node.argument.name
												)
											: Build.sequence(
													Visit.node(
														node.argument,
														scope,
														''
													),
													Build.primitive(true)
												)
									: Build.unary(
											node.operator,
											Visit.node(node.argument, scope, '')
										);

						exports.BinaryExpression = (node, scope, name) =>
							Build.binary(
								node.operator,
								Visit.node(node.left, scope, ''),
								Visit.node(node.right, scope, '')
							);

						exports.AssignmentExpression = (node, scope, name) =>
							node.operator === '='
								? Scope.assign(
										scope,
										false,
										node.left,
										Visit.node(
											node.right,
											scope,
											node.left.type === 'Identifier'
												? node.left.name
												: ''
										)
									)
								: Scope.update(
										scope,
										true,
										Reflect_apply(
											String_prototype_substring,
											node.operator,
											[0, node.operator.length - 1]
										),
										node.left,
										Visit.node(node.right, scope, '')
									);

						exports.UpdateExpression = (node, scope, name) =>
							Scope.update(
								scope,
								node.prefix,
								node.operator[0],
								node.argument,
								Build.primitive(1)
							);

						exports.LogicalExpression = (node, scope, name) =>
							Scope.token(
								scope,
								Visit.node(node.left, scope, ''),
								(token) =>
									Build.conditional(
										Scope.read(scope, token),
										node.operator === '&&'
											? Visit.node(node.right, scope, '')
											: Scope.read(scope, token),
										node.operator === '||'
											? Visit.node(node.right, scope, '')
											: Scope.read(scope, token)
									)
							);

						exports.ConditionalExpression = (node, scope, name) =>
							Build.conditional(
								Visit.node(node.test, scope, ''),
								Visit.node(node.consequent, scope, ''),
								Visit.node(node.alternate, scope, '')
							);

						exports.NewExpression = (node, scope, name) =>
							ArrayLite.every(
								node.arguments,
								(node) => node.type !== 'SpreadElement'
							)
								? Build.construct(
										Visit.node(node.callee, scope, ''),
										ArrayLite.map(node.arguments, (node) =>
											Visit.node(node, scope, '')
										)
									)
								: Build.apply(
										Build.builtin('Reflect.construct'),
										Build.primitive(void 0),
										[
											Visit.node(node.callee, scope, ''),
											Build.apply(
												Build.builtin(
													'Array.prototype.concat'
												),
												Build.apply(
													Build.builtin('Array.of'),
													Build.primitive(void 0),
													[]
												),
												ArrrayLite.map(
													node.arguments,
													(node) =>
														node.type ===
														'SpreadElement'
															? Visit.node(
																	node.argument,
																	scope,
																	''
																)
															: Build.apply(
																	Build.builtin(
																		'Array.of'
																	),
																	Build.primitive(
																		void 0
																	),
																	[
																		Visit.node(
																			node,
																			scope,
																			''
																		),
																	]
																)
												)
											),
										]
									);

						exports.CallExpression = (node, scope) =>
							ArrayLite.some(
								node.arguments,
								(node) => node.type === 'SpreadElement'
							)
								? Scope.token(
										scope,
										node.callee.type === 'MemberExpression'
											? Visit.node(
													node.callee.object,
													scope,
													''
												)
											: Build.primitive(void 0),
										(token) =>
											Build.apply(
												Build.builtin('Reflect.apply'),
												Build.primitive(void 0),
												[
													node.callee.type ===
													'MemberExpression'
														? Build.apply(
																Build.builtin(
																	'Reflect.get'
																),
																Build.primitive(
																	void 0
																),
																[
																	Build.conditional(
																		Build.binary(
																			'===',
																			Build.unary(
																				'typeof',
																				Scope.read(
																					scope,
																					token
																				)
																			),
																			Build.primitive(
																				'object'
																			)
																		),
																		Scope.read(
																			scope,
																			token
																		),
																		Build.conditional(
																			Build.binary(
																				'===',
																				Scope.read(
																					scope,
																					token
																				),
																				Build.primitive(
																					void 0
																				)
																			),
																			Scope.read(
																				scope,
																				token
																			),
																			Build.apply(
																				Build.builtin(
																					'Object'
																				),
																				Build.primitive(
																					void 0
																				),
																				[
																					Scope.read(
																						scope,
																						token
																					),
																				]
																			)
																		)
																	),
																	node.callee
																		.computed
																		? Visit.node(
																				node
																					.callee
																					.property,
																				scope,
																				''
																			)
																		: Build.primitive(
																				node
																					.callee
																					.property
																					.name
																			),
																	Scope.read(
																		scope,
																		token
																	),
																]
															)
														: Visit.node(
																node.callee,
																scope,
																''
															),
													Scope.read(scope, token),
													Build.apply(
														Build.builtin(
															'Array.prototype.concat'
														),
														Build.apply(
															Build.builtin(
																'Array.of'
															),
															Build.primitive(
																void 0
															),
															[]
														),
														ArrayLite.map(
															node.arguments,
															(node) =>
																node.type ===
																'SpreadElement'
																	? Visit.node(
																			node.argument,
																			scope,
																			''
																		)
																	: Build.apply(
																			Build.builtin(
																				'Array.of'
																			),
																			Build.primitive(
																				void 0
																			),
																			[
																				Visit.node(
																					node,
																					scope,
																					''
																				),
																			]
																		)
														)
													),
												]
											)
									)
								: node.callee.type === 'Identifier' &&
									  node.callee.name === 'eval' &&
									  node.arguments.length
									? Scope.token(
											scope,
											Scope.read(scope, 'eval'),
											(token1) =>
												(function loop(tokens) {
													return tokens.length <
														node.arguments.length
														? Scope.token(
																scope,
																Visit.node(
																	node
																		.arguments[
																		tokens
																			.length
																	],
																	scope,
																	''
																),
																(token2) =>
																	loop(
																		ArrayLite.concat(
																			tokens,
																			[
																				token2,
																			]
																		)
																	)
															)
														: Build.conditional(
																Build.binary(
																	'===',
																	Scope.read(
																		scope,
																		token1
																	),
																	Build.builtin(
																		'eval'
																	)
																),
																Scope.eval(
																	scope,
																	Scope.read(
																		scope,
																		tokens[0]
																	)
																),
																Build.apply(
																	Scope.read(
																		scope,
																		token1
																	),
																	Build.primitive(
																		void 0
																	),
																	ArrayLite.map(
																		tokens,
																		(
																			token
																		) =>
																			Scope.read(
																				scope,
																				token
																			)
																	)
																)
															);
												})([])
										)
									: node.callee.type === 'MemberExpression'
										? Scope.token(
												scope,
												Visit.node(
													node.callee.object,
													scope,
													''
												),
												(token) =>
													Build.apply(
														Build.apply(
															Build.builtin(
																'Reflect.get'
															),
															Build.primitive(
																void 0
															),
															[
																Build.conditional(
																	Build.binary(
																		'===',
																		Build.unary(
																			'typeof',
																			Scope.read(
																				scope,
																				token
																			)
																		),
																		Build.primitive(
																			'object'
																		)
																	),
																	Scope.read(
																		scope,
																		token
																	),
																	Build.conditional(
																		Build.binary(
																			'===',
																			Scope.read(
																				scope,
																				token
																			),
																			Build.primitive(
																				void 0
																			)
																		),
																		Scope.read(
																			scope,
																			token
																		),
																		Build.apply(
																			Build.builtin(
																				'Object'
																			),
																			Build.primitive(
																				void 0
																			),
																			[
																				Scope.read(
																					scope,
																					token
																				),
																			]
																		)
																	)
																),
																node.callee
																	.computed
																	? Visit.node(
																			node
																				.callee
																				.property,
																			scope,
																			''
																		)
																	: Build.primitive(
																			node
																				.callee
																				.property
																				.name
																		),
																Scope.read(
																	scope,
																	token
																),
															]
														),
														Scope.read(
															scope,
															token
														),
														ArrayLite.map(
															node.arguments,
															(node) =>
																Visit.node(
																	node,
																	scope,
																	''
																)
														)
													)
											)
										: Build.apply(
												Visit.node(
													node.callee,
													scope,
													''
												),
												Build.primitive(void 0),
												ArrayLite.map(
													node.arguments,
													(node) =>
														Visit.node(
															node,
															scope,
															''
														)
												)
											);

						exports.MemberExpression = (node, scope, name) =>
							Scope.token(
								scope,
								Visit.node(node.object, scope),
								(token) =>
									Build.apply(
										Build.builtin('Reflect.get'),
										Build.primitive(void 0),
										[
											Build.conditional(
												Build.binary(
													'===',
													Build.unary(
														'typeof',
														Scope.read(scope, token)
													),
													Build.primitive('object')
												),
												Scope.read(scope, token),
												Build.conditional(
													Build.binary(
														'===',
														Scope.read(
															scope,
															token
														),
														Build.primitive(void 0)
													),
													Scope.read(scope, token),
													Build.apply(
														Build.builtin('Object'),
														Build.primitive(void 0),
														[
															Scope.read(
																scope,
																token
															),
														]
													)
												)
											),
											node.computed
												? Visit.node(
														node.property,
														scope,
														''
													)
												: Build.primitive(
														node.property.name
													),
											Scope.read(scope, token),
										]
									)
							);

						exports.MetaProperty = (node, scope, name) =>
							Scope.read(scope, 'new.target');

						exports.Identifier = (node, scope, name) =>
							Scope.read(scope, node.name);

						exports.Literal = (node, scope, name) =>
							node.regex
								? Build.construct(Build.builtin('RegExp'), [
										Build.primitive(node.regex.pattern),
										Build.primitive(node.regex.flags),
									])
								: Build.primitive(node.value);

						exports.TemplateLiteral = (node, scope, name) =>
							ArrayLite.reduce(
								node.quasis,
								(expression, element, index) =>
									element.tail
										? Build.binary(
												'+',
												expression,
												Build.primitive(
													element.value.cooked
												)
											)
										: Build.binary(
												'+',
												expression,
												Build.binary(
													'+',
													Build.primitive(
														element.value.cooked
													),
													Visit.node(
														node.expressions[index],
														scope,
														''
													)
												)
											),
								Build.primitive('')
							);

						exports.TaggedTemplateExpression = (
							node,
							scope,
							name
						) =>
							Build.apply(
								Visit.node(node.tag, scope, ''),
								Build.primitive(void 0),
								ArrayLite.concat(
									[
										Build.apply(
											Build.builtin('Object.freeze'),
											Build.primitive(void 0),
											[
												Scope.token(
													scope,
													Build.apply(
														Build.builtin(
															'Array.of'
														),
														Build.primitive(void 0),
														ArrayLite.map(
															node.quasi.quasis,
															(element) =>
																Build.primitive(
																	element
																		.value
																		.cooked
																)
														)
													),
													(token1) =>
														Build.sequence(
															Scope.token(
																scope,
																Build.apply(
																	Build.builtin(
																		'Object.create'
																	),
																	Build.primitive(
																		void 0
																	),
																	[
																		Build.primitive(
																			null
																		),
																	]
																),
																(token2) =>
																	Build.sequence(
																		Build.apply(
																			Build.builtin(
																				'Reflect.set'
																			),
																			Build.primitive(
																				void 0
																			),
																			[
																				Scope.read(
																					scope,
																					token2
																				),
																				Build.primitive(
																					'value'
																				),
																				Build.apply(
																					Build.builtin(
																						'Object.freeze'
																					),
																					Build.primitive(
																						void 0
																					),
																					[
																						Build.apply(
																							Build.builtin(
																								'Array.of'
																							),
																							Build.primitive(
																								void 0
																							),
																							ArrayLite.map(
																								node
																									.quasi
																									.quasis,
																								(
																									element
																								) =>
																									Build.primitive(
																										element
																											.value
																											.raw
																									)
																							)
																						),
																					]
																				),
																			]
																		),
																		Build.apply(
																			Build.builtin(
																				'Reflect.defineProperty'
																			),
																			Build.primitive(
																				void 0
																			),
																			[
																				Scope.read(
																					scope,
																					token1
																				),
																				Build.primitive(
																					'raw'
																				),
																				Scope.read(
																					scope,
																					token2
																				),
																			]
																		)
																	)
															),
															Scope.read(
																scope,
																token1
															)
														)
												),
											]
										),
									],
									ArrayLite.map(
										node.quasi.expressions,
										(node) => Visit.node(node, scope, '')
									)
								)
							);

						exports.ArrowFunctionExpression = (node, scope, name) =>
							Scope.token(
								scope,
								Build.closure(
									Scope.BLOCK(
										Scope.ExtendArrow(scope),
										ArrayLite.flatMap(
											node.params,
											Query.PatternNames
										),
										[],
										(scope) =>
											ArrayLite.concat(
												Build.Expression(
													Build.conditional(
														Build.argument(
															'new.target'
														),
														Build.apply(
															Scope.read(
																scope,
																Scope.GetToken(
																	scope,
																	'HelperThrowTypeError'
																)
															),
															Build.primitive(
																void 0
															),
															[
																Build.primitive(
																	name +
																		' is not a constructor'
																),
															]
														),
														Build.argument('this')
													)
												),
												Scope.Token(
													scope,
													Build.argument('length'),
													(token2) =>
														ArrayLite.concat(
															ArrayLite.flatMap(
																node.params
																	.length &&
																	node.params[
																		node
																			.params
																			.length -
																			1
																	].type ===
																		'RestElement'
																	? ArrayLite.slice(
																			node.params,
																			0,
																			node
																				.params
																				.length -
																				1
																		)
																	: node.params,
																(
																	pattern,
																	index
																) =>
																	Scope.Assign(
																		scope,
																		true,
																		pattern,
																		Build.conditional(
																			Build.binary(
																				'<',
																				Build.primitive(
																					index
																				),
																				Scope.read(
																					scope,
																					token2
																				)
																			),
																			Build.argument(
																				'next'
																			),
																			Build.primitive(
																				void 0
																			)
																		)
																	)
															),
															node.params
																.length &&
																node.params[
																	node.params
																		.length -
																		1
																].type ===
																	'RestElement'
																? Scope.Token(
																		scope,
																		Build.apply(
																			Build.builtin(
																				'Array.of'
																			),
																			Build.primitive(
																				void 0
																			),
																			[]
																		),
																		(
																			token3
																		) =>
																			ArrayLite.concat(
																				Scope.Token(
																					Build.primitive(
																						node
																							.params
																							.length -
																							1
																					),
																					(
																						token4
																					) =>
																						Build.While(
																							[],
																							Build.binary(
																								'<',
																								Scope.read(
																									scope,
																									token4
																								),
																								Scope.read(
																									scope,
																									token2
																								)
																							),
																							Scope.BLOCK(
																								scope,
																								[],
																								[],
																								(
																									scope
																								) =>
																									ArrayLite.concat(
																										Build.Token(
																											Build.argument(
																												'next'
																											),
																											(
																												token5
																											) =>
																												Build.Expression(
																													Build.apply(
																														Build.builtin(
																															'Array.prototype.push'
																														),
																														Scope.read(
																															scope,
																															token3
																														),
																														[
																															Scope.read(
																																scope,
																																token5
																															),
																														]
																													)
																												),
																											scope
																										),
																										Scope.Write(
																											scope,
																											token4,
																											Build.binary(
																												'+',
																												Scope.read(
																													scope,
																													token4
																												),
																												Build.primitive(
																													1
																												)
																											)
																										)
																									)
																							)
																						)
																				),
																				Scope.Assign(
																					scope,
																					true,
																					pattern.argument,
																					Scope.read(
																						scope,
																						token3
																					)
																				)
																			)
																	)
																: Scope.Token(
																		scope,
																		Build.primitive(
																			node
																				.params
																				.length
																		),
																		(
																			token3
																		) =>
																			Build.While(
																				[],
																				Build.binary(
																					'<',
																					Scope.read(
																						scope,
																						token3
																					),
																					Scope.read(
																						scope,
																						token2
																					)
																				),
																				Scope.BLOCK(
																					scope,
																					[],
																					[],
																					(
																						scope
																					) =>
																						ArrayLite.concat(
																							Build.Expression(
																								Build.argument(
																									'next'
																								)
																							),
																							Scope.Write(
																								scope,
																								token3,
																								Build.binary(
																									'+',
																									Scope.read(
																										scope,
																										token3
																									),
																									Build.primitive(
																										1
																									)
																								)
																							)
																						)
																				)
																			)
																	)
														)
												),
												node.expression
													? Build.Return(
															Visit.node(
																node.body,
																scope,
																''
															)
														)
													: ArrayLite.concat(
															Build.Block(
																[],
																Visit.NODE(
																	node.body,
																	Scope.ExtendLabel(
																		scope,
																		null
																	),
																	true
																)
															),
															Build.Return(
																Build.primitive(
																	void 0
																)
															)
														)
											)
									)
								),
								// https://tc39.github.io/ecma262/#sec-function-instances
								(token1) =>
									Build.sequence(
										Scope.token(
											scope,
											Build.apply(
												Build.builtin('Object.create'),
												Build.primitive(void 0),
												[Build.primitive(null)]
											),
											(token2) =>
												Build.sequence(
													Build.apply(
														Build.builtin(
															'Reflect.set'
														),
														Build.primitive(void 0),
														[
															Scope.read(
																scope,
																token2
															),
															Build.primitive(
																'value'
															),
															Build.primitive(
																node.params
																	.length &&
																	node.params[
																		node
																			.params
																			.length -
																			1
																	].type ===
																		'RestElement'
																	? node
																			.params
																			.length -
																			1
																	: node
																			.params
																			.length
															),
														]
													),
													Build.sequence(
														Build.apply(
															Build.builtin(
																'Reflect.set'
															),
															Build.primitive(
																void 0
															),
															[
																Scope.read(
																	scope,
																	token2
																),
																Build.primitive(
																	'configurable'
																),
																Build.primitive(
																	true
																),
															]
														),
														Build.apply(
															Build.builtin(
																'Reflect.defineProperty'
															),
															Build.primitive(
																void 0
															),
															[
																Scope.read(
																	scope,
																	token1
																),
																Build.primitive(
																	'length'
																),
																Scope.read(
																	scope,
																	token2
																),
															]
														)
													)
												)
										),
										Build.sequence(
											Scope.token(
												scope,
												Build.apply(
													Build.builtin(
														'Object.create'
													),
													Build.primitive(void 0),
													[Build.primitive(null)]
												),
												(token2) =>
													Build.sequence(
														Build.apply(
															Build.builtin(
																'Reflect.set'
															),
															Build.primitive(
																void 0
															),
															[
																Scope.read(
																	scope,
																	token2
																),
																Build.primitive(
																	'value'
																),
																Build.primitive(
																	name
																),
															]
														),
														Build.sequence(
															Build.apply(
																Build.builtin(
																	'Reflect.set'
																),
																Build.primitive(
																	void 0
																),
																[
																	Scope.read(
																		scope,
																		token2
																	),
																	Build.primitive(
																		'configurable'
																	),
																	Build.primitive(
																		true
																	),
																]
															),
															Build.apply(
																Build.builtin(
																	'Reflect.defineProperty'
																),
																Build.primitive(
																	void 0
																),
																[
																	Scope.read(
																		scope,
																		token1
																	),
																	Build.primitive(
																		'name'
																	),
																	Scope.read(
																		scope,
																		token2
																	),
																]
															)
														)
													)
											),
											Build.sequence(
												Scope.token(
													scope,
													Build.apply(
														Build.builtin(
															'Object.create'
														),
														Build.primitive(void 0),
														[Build.primitive(null)]
													),
													(token2) =>
														Build.sequence(
															Build.apply(
																Build.builtin(
																	'Reflect.set'
																),
																Build.primitive(
																	void 0
																),
																[
																	Scope.read(
																		scope,
																		token2
																	),
																	Build.primitive(
																		'value'
																	),
																	Build.primitive(
																		void 0
																	),
																]
															),
															Build.sequence(
																Build.apply(
																	Build.builtin(
																		'Reflect.set'
																	),
																	Build.primitive(
																		void 0
																	),
																	[
																		Scope.read(
																			scope,
																			token2
																		),
																		Build.primitive(
																			'writable'
																		),
																		Build.primitive(
																			true
																		),
																	]
																),
																Build.apply(
																	Build.builtin(
																		'Reflect.defineProperty'
																	),
																	Build.primitive(
																		void 0
																	),
																	[
																		Scope.read(
																			scope,
																			token1
																		),
																		Build.primitive(
																			'prototype'
																		),
																		Scope.read(
																			scope,
																			token2
																		),
																	]
																)
															)
														)
												),
												Scope.read(scope, token1)
											)
										)
									)
							);

						exports.FunctionExpression = (node, scope, name) =>
							Scope.token(
								scope,
								Build.primitive(void 0),
								(token1) =>
									Scope.write(
										scope,
										token1,
										Build.closure(
											Scope.BLOCK(
												Scope.ExtendFunction(scope),
												ArrayLite.concat(
													node.id &&
														!ArrayLite.includes(
															ArrayLite.flatMap(
																node.params,
																Query.PatternNames
															),
															node.id.name
														)
														? [node.id.name]
														: [],
													!ArrayLite.includes(
														ArrayLite.flatMap(
															node.params,
															Query.PatternNames
														),
														'arguments'
													)
														? ['arguments']
														: [],
													Scope.GetStrict(scope) ||
														ArrayLite.some(
															node.params,
															(pattern) =>
																pattern.type !==
																'Identifier'
														)
														? ArrayLite.flatMap(
																node.params,
																Query.PatternNames
															)
														: ArrayLite.filter(
																ArrayLite.map(
																	node.params,
																	(pattern) =>
																		pattern.name
																),
																(
																	name,
																	index,
																	array
																) =>
																	ArrayLite.lastIndexOf(
																		array,
																		name
																	) === index
															)
												),
												['new.target', 'this'],
												(scope) =>
													ArrayLite.concat(
														node.id &&
															!ArrayLite.includes(
																ArrayLite.flatMap(
																	node.params,
																	Query.PatternNames
																),
																node.id.name
															)
															? Scope.Initialize(
																	scope,
																	node.id
																		.name,
																	Scope.read(
																		scope,
																		token1
																	)
																)
															: [],
														Scope.Initialize(
															scope,
															'new.target',
															Build.argument(
																'new.target'
															)
														),
														Scope.Initialize(
															scope,
															'this',
															Build.conditional(
																Scope.read(
																	scope,
																	'new.target'
																),
																Build.sequence(
																	Build.argument(
																		'this'
																	),
																	Build.apply(
																		Build.builtin(
																			'Object.create'
																		),
																		Build.primitive(
																			void 0
																		),
																		[
																			Scope.token(
																				scope,
																				Build.apply(
																					Build.builtin(
																						'Reflect.get'
																					),
																					Build.primitive(
																						void 0
																					),
																					[
																						Scope.read(
																							scope,
																							'new.target'
																						),
																						Build.primitive(
																							'prototype'
																						),
																					]
																				),
																				(
																					token
																				) =>
																					Build.conditional(
																						Build.binary(
																							'===',
																							Build.unary(
																								'typeof',
																								Scope.read(
																									scope,
																									token
																								)
																							),
																							Build.primitive(
																								'object'
																							)
																						),
																						Build.conditional(
																							Scope.read(
																								scope,
																								token
																							),
																							Scope.read(
																								scope,
																								token
																							),
																							Build.builtin(
																								'Object.prototype'
																							)
																						),
																						Build.conditional(
																							Build.binary(
																								'===',
																								Build.unary(
																									'typeof',
																									Scope.read(
																										scope,
																										token
																									)
																								),
																								Build.primitive(
																									'function'
																								)
																							),
																							Scope.read(
																								scope,
																								token
																							),
																							Build.builtin(
																								'Object.prototype'
																							)
																						)
																					)
																			),
																		]
																	)
																),
																Build.argument(
																	'this'
																)
															)
														),
														Scope.Token(
															scope,
															Build.argument(
																'length'
															),
															(token2) =>
																ArrayLite.includes(
																	ArrayLite.flatMap(
																		node.params,
																		Query.PatternNames
																	),
																	'arguments'
																) ||
																Query.IsArgumentsFree(
																	ArrayLite.concat(
																		node.params,
																		[node]
																	)
																)
																	? ArrayLite.concat(
																			ArrayLite.flatMap(
																				node
																					.params
																					.length &&
																					node
																						.params[
																						node
																							.params
																							.length -
																							1
																					]
																						.type ===
																						'RestElement'
																					? ArrayLite.slice(
																							node.params,
																							0,
																							node
																								.params
																								.length -
																								1
																						)
																					: node.params,
																				(
																					pattern,
																					index1
																				) =>
																					Scope.Assign(
																						scope,
																						Scope.GetStrict(
																							scope
																						) ||
																							ArrayLite.some(
																								node.params,
																								(
																									pattern
																								) =>
																									pattern.type !==
																									'Identifier'
																							) ||
																							ArrayLite.every(
																								node.params,
																								(
																									pattern,
																									index2
																								) =>
																									index1 <=
																										index2 ||
																									pattern.name !==
																										node
																											.params[
																											index1
																										]
																											.name
																							),
																						pattern,
																						Build.conditional(
																							Build.binary(
																								'<',
																								Build.primitive(
																									index1
																								),
																								Scope.read(
																									scope,
																									token2
																								)
																							),
																							Build.argument(
																								'next'
																							),
																							Build.primitive(
																								void 0
																							)
																						)
																					)
																			),
																			node
																				.params
																				.length &&
																				node
																					.params[
																					node
																						.params
																						.length -
																						1
																				]
																					.type ===
																					'RestElement'
																				? Scope.Token(
																						scope,
																						Build.apply(
																							Build.builtin(
																								'Array.of'
																							),
																							Build.primitive(
																								void 0
																							),
																							[]
																						),
																						(
																							token3
																						) =>
																							ArrayLite.concat(
																								Scope.Token(
																									scope,
																									Build.primitive(
																										node
																											.params
																											.length -
																											1
																									),
																									(
																										token4
																									) =>
																										Build.While(
																											[],
																											Build.binary(
																												'<',
																												Scope.read(
																													scope,
																													token4
																												),
																												Scope.read(
																													scope,
																													token2
																												)
																											),
																											Scope.BLOCK(
																												scope,
																												[],
																												[],
																												(
																													scope
																												) =>
																													ArrayLite.concat(
																														Scope.Token(
																															scope,
																															Build.argument(
																																'next'
																															),
																															(
																																token5
																															) =>
																																Build.Expression(
																																	Build.apply(
																																		Build.builtin(
																																			'Array.prototype.push'
																																		),
																																		Scope.read(
																																			scope,
																																			token3
																																		),
																																		[
																																			Scope.read(
																																				scope,
																																				token5
																																			),
																																		]
																																	)
																																),
																															scope
																														),
																														Scope.Write(
																															scope,
																															token4,
																															Build.binary(
																																'+',
																																Scope.read(
																																	scope,
																																	token4
																																),
																																Build.primitive(
																																	1
																																)
																															)
																														)
																													)
																											)
																										)
																								),
																								Scope.Assign(
																									scope,
																									true,
																									node
																										.params[
																										node
																											.params
																											.length -
																											1
																									]
																										.argument,
																									Scope.read(
																										scope,
																										token3
																									)
																								)
																							)
																					)
																				: Scope.Token(
																						scope,
																						Build.primitive(
																							node
																								.params
																								.length
																						),
																						(
																							token3
																						) =>
																							Build.While(
																								[],
																								Build.binary(
																									'<',
																									Scope.read(
																										scope,
																										token3
																									),
																									Scope.read(
																										scope,
																										token2
																									)
																								),
																								Scope.BLOCK(
																									scope,
																									[],
																									[],
																									(
																										scope
																									) =>
																										ArrayLite.concat(
																											Build.Expression(
																												Build.argument(
																													'next'
																												)
																											),
																											Scope.Write(
																												scope,
																												token3,
																												Build.binary(
																													'+',
																													Scope.read(
																														scope,
																														token3
																													),
																													Build.primitive(
																														1
																													)
																												)
																											)
																										)
																								)
																							)
																					)
																		)
																	: ArrayLite.concat(
																			Scope.Initialize(
																				scope,
																				'arguments',
																				Build.apply(
																					Build.builtin(
																						'Object.create'
																					),
																					Build.primitive(
																						void 0
																					),
																					[
																						Build.primitive(
																							null
																						),
																					]
																				)
																			),
																			ArrayLite.flatMap(
																				node
																					.params
																					.length &&
																					node
																						.params[
																						node
																							.params
																							.length -
																							1
																					]
																						.type ===
																						'RestElement'
																					? ArrayLite.slice(
																							node.params,
																							0,
																							node
																								.params
																								.length -
																								1
																						)
																					: node.params,
																				(
																					pattern,
																					index1
																				) =>
																					Scope.Token(
																						scope,
																						Build.conditional(
																							Build.binary(
																								'<',
																								Build.primitive(
																									index1
																								),
																								Scope.read(
																									scope,
																									token2
																								)
																							),
																							Build.argument(
																								'next'
																							),
																							Build.primitive(
																								void 0
																							)
																						),
																						(
																							token3
																						) =>
																							ArrayLite.concat(
																								Scope.Assign(
																									scope,
																									Scope.GetStrict(
																										scope
																									) ||
																										ArrayLite.some(
																											node.params,
																											(
																												pattern
																											) =>
																												pattern.type !==
																												'Identifier'
																										) ||
																										ArrayLite.every(
																											node.params,
																											(
																												pattern,
																												index2
																											) =>
																												index1 <=
																													index2 ||
																												pattern.name !==
																													node
																														.params[
																														index1
																													]
																														.name
																										),
																									pattern,
																									Scope.read(
																										scope,
																										token3
																									)
																								),
																								Build.If(
																									[],
																									Build.binary(
																										'<',
																										Build.primitive(
																											index1
																										),
																										Scope.read(
																											scope,
																											token2
																										)
																									),
																									Scope.BLOCK(
																										scope,
																										[],
																										[],
																										(
																											scope
																										) =>
																											Build.Expression(
																												Build.apply(
																													Build.builtin(
																														'Reflect.set'
																													),
																													Build.primitive(
																														void 0
																													),
																													[
																														Scope.read(
																															scope,
																															'arguments'
																														),
																														Build.primitive(
																															index1
																														),
																														Scope.read(
																															scope,
																															token3
																														),
																													]
																												)
																											)
																									),
																									Scope.BLOCK(
																										scope,
																										[],
																										[],
																										(
																											scope
																										) => []
																									)
																								)
																							)
																					)
																			),
																			Scope.Token(
																				scope,
																				node
																					.params
																					.length &&
																					node
																						.params[
																						node
																							.params
																							.length -
																							1
																					]
																						.type ===
																						'RestElement'
																					? Build.primitive(
																							node
																								.params
																								.length -
																								1
																						)
																					: Build.primitive(
																							node
																								.params
																								.length
																						),
																				(
																					token3
																				) =>
																					Build.While(
																						[],
																						Build.binary(
																							'<',
																							Scope.read(
																								scope,
																								token3
																							),
																							Scope.read(
																								scope,
																								token2
																							)
																						),
																						Scope.BLOCK(
																							scope,
																							[],
																							[],
																							(
																								scope
																							) =>
																								ArrayLite.concat(
																									Scope.Token(
																										scope,
																										Build.argument(
																											'next'
																										),
																										(
																											token4
																										) =>
																											Build.Expression(
																												Build.apply(
																													Build.builtin(
																														'Reflect.set'
																													),
																													Build.primitive(
																														void 0
																													),
																													[
																														Scope.read(
																															scope,
																															'arguments'
																														),
																														Scope.read(
																															scope,
																															token3
																														),
																														Scope.read(
																															scope,
																															token4
																														),
																													]
																												)
																											)
																									),
																									Scope.Write(
																										scope,
																										token3,
																										Build.binary(
																											'+',
																											Scope.read(
																												scope,
																												token3
																											),
																											Build.primitive(
																												1
																											)
																										)
																									)
																								)
																						)
																					)
																			),
																			Scope.Token(
																				scope,
																				Build.apply(
																					Build.builtin(
																						'Object.create'
																					),
																					Build.primitive(
																						void 0
																					),
																					[
																						Build.primitive(
																							null
																						),
																					]
																				),
																				(
																					token3
																				) =>
																					ArrayLite.concat(
																						Build.Expression(
																							Build.apply(
																								Build.builtin(
																									'Reflect.set'
																								),
																								Build.primitive(
																									void 0
																								),
																								[
																									Scope.read(
																										scope,
																										token3
																									),
																									Build.primitive(
																										'value'
																									),
																									Scope.read(
																										scope,
																										token2
																									),
																								]
																							)
																						),
																						Build.Expression(
																							Build.apply(
																								Build.builtin(
																									'Reflect.set'
																								),
																								Build.primitive(
																									void 0
																								),
																								[
																									Scope.read(
																										scope,
																										token3
																									),
																									Build.primitive(
																										'writable'
																									),
																									Build.primitive(
																										true
																									),
																								]
																							)
																						),
																						Build.Expression(
																							Build.apply(
																								Build.builtin(
																									'Reflect.set'
																								),
																								Build.primitive(
																									void 0
																								),
																								[
																									Scope.read(
																										scope,
																										token3
																									),
																									Build.primitive(
																										'configurable'
																									),
																									Build.primitive(
																										true
																									),
																								]
																							)
																						),
																						Build.Expression(
																							Build.apply(
																								Build.builtin(
																									'Reflect.defineProperty'
																								),
																								Build.primitive(
																									void 0
																								),
																								[
																									Scope.read(
																										scope,
																										'arguments'
																									),
																									Build.primitive(
																										'length'
																									),
																									Scope.read(
																										scope,
																										token3
																									),
																								]
																							)
																						)
																					)
																			),
																			node
																				.params
																				.length &&
																				node
																					.params[
																					node
																						.params
																						.length -
																						1
																				]
																					.type ===
																					'RestElement'
																				? Scope.Assign(
																						scope,
																						true,
																						node
																							.params[
																							node
																								.params
																								.length -
																								1
																						]
																							.argument,
																						Build.apply(
																							Build.builtin(
																								'Array.prototype.slice'
																							),
																							Scope.read(
																								scope,
																								'arguments'
																							),
																							[
																								Build.primitive(
																									node
																										.params
																										.length -
																										1
																								),
																							]
																						)
																					)
																				: [],
																			Scope.Token(
																				scope,
																				Build.apply(
																					Build.builtin(
																						'Object.create'
																					),
																					Build.primitive(
																						void 0
																					),
																					[
																						Build.primitive(
																							null
																						),
																					]
																				),
																				(
																					token3
																				) =>
																					ArrayLite.concat(
																						Build.Expression(
																							Build.apply(
																								Build.builtin(
																									'Reflect.set'
																								),
																								Build.primitive(
																									void 0
																								),
																								[
																									Scope.read(
																										scope,
																										token3
																									),
																									Scope.GetStrict(
																										scope
																									)
																										? Build.primitive(
																												'get'
																											)
																										: Build.primitive(
																												'value'
																											),
																									Scope.GetStrict(
																										scope
																									)
																										? Build.builtin(
																												"Reflect.getOwnPropertyDescriptor(Function.prototype,'arguments').get"
																											)
																										: Scope.read(
																												scope,
																												token1
																											),
																								]
																							)
																						),
																						Build.Expression(
																							Build.apply(
																								Build.builtin(
																									'Reflect.set'
																								),
																								Build.primitive(
																									void 0
																								),
																								[
																									Scope.read(
																										scope,
																										token3
																									),
																									Scope.GetStrict(
																										scope
																									)
																										? Build.primitive(
																												'set'
																											)
																										: Build.primitive(
																												'writable'
																											),
																									Scope.GetStrict(
																										scope
																									)
																										? Build.builtin(
																												"Reflect.getOwnPropertyDescriptor(Function.prototype,'arguments').set"
																											)
																										: Build.primitive(
																												true
																											),
																								]
																							)
																						),
																						Build.Expression(
																							Build.apply(
																								Build.builtin(
																									'Reflect.set'
																								),
																								Build.primitive(
																									void 0
																								),
																								[
																									Scope.read(
																										scope,
																										token3
																									),
																									Build.primitive(
																										'configurable'
																									),
																									Scope.GetStrict(
																										scope
																									)
																										? Build.primitive(
																												false
																											)
																										: Build.primitive(
																												true
																											),
																								]
																							)
																						),
																						Build.Expression(
																							Build.apply(
																								Build.builtin(
																									'Reflect.defineProperty'
																								),
																								Build.primitive(
																									void 0
																								),
																								[
																									Scope.read(
																										scope,
																										'arguments'
																									),
																									Build.primitive(
																										'callee'
																									),
																									Scope.read(
																										scope,
																										token3
																									),
																								]
																							)
																						)
																					)
																			),
																			Scope.Token(
																				scope,
																				Build.apply(
																					Build.builtin(
																						'Object.create'
																					),
																					Build.primitive(
																						void 0
																					),
																					[
																						Build.primitive(
																							null
																						),
																					]
																				),
																				(
																					token3
																				) =>
																					ArrayLite.concat(
																						Build.Expression(
																							Build.apply(
																								Build.builtin(
																									'Reflect.set'
																								),
																								Build.primitive(
																									void 0
																								),
																								[
																									Scope.read(
																										scope,
																										token3
																									),
																									Build.primitive(
																										'value'
																									),
																									Build.builtin(
																										'Array.prototype.values'
																									),
																								]
																							)
																						),
																						Build.Expression(
																							Build.apply(
																								Build.builtin(
																									'Reflect.set'
																								),
																								Build.primitive(
																									void 0
																								),
																								[
																									Scope.read(
																										scope,
																										token3
																									),
																									Build.primitive(
																										'writable'
																									),
																									Build.primitive(
																										true
																									),
																								]
																							)
																						),
																						Build.Expression(
																							Build.apply(
																								Build.builtin(
																									'Reflect.set'
																								),
																								Build.primitive(
																									void 0
																								),
																								[
																									Scope.read(
																										scope,
																										token3
																									),
																									Build.primitive(
																										'configurable'
																									),
																									Build.primitive(
																										true
																									),
																								]
																							)
																						),
																						Build.Expression(
																							Build.apply(
																								Build.builtin(
																									'Reflect.defineProperty'
																								),
																								Build.primitive(
																									void 0
																								),
																								[
																									Scope.read(
																										scope,
																										'arguments'
																									),
																									Build.builtin(
																										'Symbol.iterator'
																									),
																									Scope.read(
																										scope,
																										token3
																									),
																								]
																							)
																						)
																					)
																			),
																			Build.Expression(
																				Build.apply(
																					Build.builtin(
																						'Reflect.setPrototypeOf'
																					),
																					Build.primitive(
																						void 0
																					),
																					[
																						Scope.read(
																							scope,
																							'arguments'
																						),
																						Build.builtin(
																							'Object.prototype'
																						),
																					]
																				)
																			)
																		)
														),
														Build.Block(
															[],
															Visit.NODE(
																node.body,
																Scope.ExtendLabel(
																	scope,
																	null
																),
																true
															)
														),
														Build.Return(
															Build.conditional(
																Scope.read(
																	scope,
																	'new.target'
																),
																Scope.read(
																	scope,
																	'this'
																),
																Build.primitive(
																	void 0
																)
															)
														)
													)
											)
										),
										// https://tc39.github.io/ecma262/#sec-function-instances
										Build.sequence(
											Scope.token(
												scope,
												Build.apply(
													Build.builtin(
														'Object.create'
													),
													Build.primitive(void 0),
													[Build.primitive(null)]
												),
												(token2) =>
													Build.sequence(
														Build.apply(
															Build.builtin(
																'Reflect.set'
															),
															Build.primitive(
																void 0
															),
															[
																Scope.read(
																	scope,
																	token2
																),
																Build.primitive(
																	'value'
																),
																Build.primitive(
																	node.params
																		.length &&
																		node
																			.params[
																			node
																				.params
																				.length -
																				1
																		]
																			.type ===
																			'RestElement'
																		? node
																				.params
																				.length -
																				1
																		: node
																				.params
																				.length
																),
															]
														),
														Build.sequence(
															Build.apply(
																Build.builtin(
																	'Reflect.set'
																),
																Build.primitive(
																	void 0
																),
																[
																	Scope.read(
																		scope,
																		token2
																	),
																	Build.primitive(
																		'configurable'
																	),
																	Build.primitive(
																		true
																	),
																]
															),
															Build.apply(
																Build.builtin(
																	'Reflect.defineProperty'
																),
																Build.primitive(
																	void 0
																),
																[
																	Scope.read(
																		scope,
																		token1
																	),
																	Build.primitive(
																		'length'
																	),
																	Scope.read(
																		scope,
																		token2
																	),
																]
															)
														)
													)
											),
											Build.sequence(
												Scope.token(
													scope,
													Build.apply(
														Build.builtin(
															'Object.create'
														),
														Build.primitive(void 0),
														[Build.primitive(null)]
													),
													(token2) =>
														Build.sequence(
															Build.apply(
																Build.builtin(
																	'Reflect.set'
																),
																Build.primitive(
																	void 0
																),
																[
																	Scope.read(
																		scope,
																		token2
																	),
																	Build.primitive(
																		'value'
																	),
																	Build.primitive(
																		node.id
																			? node
																					.id
																					.name
																			: name
																	),
																]
															),
															Build.sequence(
																Build.apply(
																	Build.builtin(
																		'Reflect.set'
																	),
																	Build.primitive(
																		void 0
																	),
																	[
																		Scope.read(
																			scope,
																			token2
																		),
																		Build.primitive(
																			'configurable'
																		),
																		Build.primitive(
																			true
																		),
																	]
																),
																Build.apply(
																	Build.builtin(
																		'Reflect.defineProperty'
																	),
																	Build.primitive(
																		void 0
																	),
																	[
																		Scope.read(
																			scope,
																			token1
																		),
																		Build.primitive(
																			'name'
																		),
																		Scope.read(
																			scope,
																			token2
																		),
																	]
																)
															)
														)
												),
												Build.sequence(
													Scope.token(
														scope,
														Build.apply(
															Build.builtin(
																'Object.create'
															),
															Build.primitive(
																void 0
															),
															[
																Build.primitive(
																	null
																),
															]
														),
														(token2) =>
															Build.sequence(
																Build.apply(
																	Build.builtin(
																		'Reflect.set'
																	),
																	Build.primitive(
																		void 0
																	),
																	[
																		Scope.read(
																			scope,
																			token2
																		),
																		Build.primitive(
																			'value'
																		),
																		Scope.token(
																			scope,
																			Build.apply(
																				Build.builtin(
																					'Object.create'
																				),
																				Build.primitive(
																					void 0
																				),
																				[
																					Build.builtin(
																						'Object.prototype'
																					),
																				]
																			),
																			(
																				token3
																			) =>
																				Scope.token(
																					scope,
																					Build.apply(
																						Build.builtin(
																							'Object.create'
																						),
																						Build.primitive(
																							void 0
																						),
																						[
																							Build.primitive(
																								null
																							),
																						]
																					),
																					(
																						token4
																					) =>
																						Build.sequence(
																							Build.apply(
																								Build.builtin(
																									'Reflect.set'
																								),
																								Build.primitive(
																									void 0
																								),
																								[
																									Scope.read(
																										scope,
																										token4
																									),
																									Build.primitive(
																										'value'
																									),
																									Scope.read(
																										scope,
																										token1
																									),
																								]
																							),
																							Build.sequence(
																								Build.apply(
																									Build.builtin(
																										'Reflect.set'
																									),
																									Build.primitive(
																										void 0
																									),
																									[
																										Scope.read(
																											scope,
																											token4
																										),
																										Build.primitive(
																											'writable'
																										),
																										Build.primitive(
																											true
																										),
																									]
																								),
																								Build.sequence(
																									Build.apply(
																										Build.builtin(
																											'Reflect.defineProperty'
																										),
																										Build.primitive(
																											void 0
																										),
																										[
																											Scope.read(
																												scope,
																												token3
																											),
																											Build.primitive(
																												'constructor'
																											),
																											Scope.read(
																												scope,
																												token4
																											),
																										]
																									),
																									Scope.read(
																										scope,
																										token3
																									)
																								)
																							)
																						)
																				)
																		),
																	]
																),
																Build.sequence(
																	Build.apply(
																		Build.builtin(
																			'Reflect.set'
																		),
																		Build.primitive(
																			void 0
																		),
																		[
																			Scope.read(
																				scope,
																				token2
																			),
																			Build.primitive(
																				'writable'
																			),
																			Build.primitive(
																				true
																			),
																		]
																	),
																	Build.apply(
																		Build.builtin(
																			'Reflect.defineProperty'
																		),
																		Build.primitive(
																			void 0
																		),
																		[
																			Scope.read(
																				scope,
																				token1
																			),
																			Build.primitive(
																				'prototype'
																			),
																			Scope.read(
																				scope,
																				token2
																			),
																		]
																	)
																)
															)
													),
													Scope.read(scope, token1)
												)
											)
										)
									)
							);

						exports.FunctionDeclaration =
							exports.FunctionExpression;
					}).call(this);
				}).call(
					this,
					typeof global !== 'undefined'
						? global
						: typeof self !== 'undefined'
							? self
							: typeof window !== 'undefined'
								? window
								: {}
				);
			},
			{
				'../build.js': 22,
				'../query.js': 24,
				'../scope': 27,
				'./index.js': 31,
				'array-lite': 35,
			},
		],
		31: [
			function (require, module, exports) {
				const ArrayLite = require('array-lite');
				const Query = require('../query.js');
				const Expression = require('./expression.js');
				const Statement = require('./statement.js');
				const Block = require('./block.js');

				const Array_isArray = Array.isArray;
				const JSON_stringify = JSON.stringify;

				const common = (visitors, node, scope, context) => {
					node.AranParentSerial = ARAN.serial;
					node.AranSerial = ARAN.nodes.length;
					ARAN.serial = ARAN.nodes.length;
					ARAN.nodes[ARAN.nodes.length] = node;
					const result = visitors[node.type](node, scope, context);
					ARAN.serial = node.AranParentSerial;
					return result;
				};

				exports.NODE = (node, scope, boolean) => {
					if (Array_isArray(node)) {
						return Block['BlockStatement'](
							{
								type: 'BlockStatement',
								body: ArrayLite.flatMap(node, (node) =>
									ArrayLite.concat([node], node.consequent)
								),
							},
							scope,
							boolean
						);
					}
					if (node.type === 'Program') {
						ArrayLite.forEach(
							Query.CompletionStatements(node),
							(node) => {
								node.AranCompletion = null;
							}
						);
					}
					if (
						node.type === 'Program' ||
						node.type === 'BlockStatement'
					)
						return common(Block, node, scope, boolean);
					return Block[node.type](node, scope, boolean);
				};

				exports.Node = (node, scope) => {
					if (node.type === 'BlockStatement')
						return Statement.BlockStatement(node, scope);
					return common(Statement, node, scope);
				};

				exports.node = (node, scope, name) => (
					node.type === 'CallExpression' &&
					node.callee.type === 'Identifier' &&
					node.callee.name === 'eval' &&
					ArrayLite.every(
						node.arguments,
						(node) => node.type !== 'SpreadElements'
					)
						? ((node.AranScope = JSON_stringify(scope)),
							(node.AranRootSerial = ARAN.root.AranSerial))
						: null,
					common(Expression, node, scope, name)
				);
			},
			{
				'../query.js': 24,
				'./block.js': 29,
				'./expression.js': 30,
				'./statement.js': 32,
				'array-lite': 35,
			},
		],
		32: [
			function (require, module, exports) {
				const ArrayLite = require('array-lite');
				const Build = require('../build.js');
				const Scope = require('../scope');
				const Query = require('../query.js');
				const Visit = require('./index.js');

				const Reflect_apply = Reflect.apply;
				const Reflect_getOwnPropertyDescriptor =
					Reflect.getOwnPropertyDescriptor;
				const String_prototype_substring = String.prototype.substring;

				exports.EmptyStatement = (node, scope) => [];

				exports.BlockStatement = (node, scope) =>
					Build.Block(
						Scope.GetLabels(scope),
						Visit.NODE(node, Scope.ExtendLabel(scope, null), false)
					);

				exports.ExpressionStatement = (node, scope) =>
					Reflect_getOwnPropertyDescriptor(node, 'AranCompletion')
						? Scope.Write(
								scope,
								Scope.GetToken(scope, 'Completion'),
								Visit.node(node.expression, scope, '')
							)
						: node.expression.type === 'AssignmentExpression'
							? node.expression.operator === '='
								? Scope.Assign(
										scope,
										false,
										node.expression.left,
										Visit.node(
											node.expression.right,
											scope,
											node.expression.left.type ===
												'Identifier'
												? node.expression.left.name
												: ''
										)
									)
								: Scope.Update(
										scope,
										Reflect_apply(
											String_prototype_substring,
											node.expression.operator,
											[
												0,
												node.expression.operator
													.length - 1,
											]
										),
										node.expression.left,
										Visit.node(
											node.expression.right,
											scope,
											node.expression.left.type ===
												'Identifier'
												? node.expression.left.name
												: ''
										)
									)
							: node.expression.type === 'UpdateExpression'
								? Scope.Update(
										scope,
										node.expression.operator[0],
										node.expression.argument,
										Build.primitive(1)
									)
								: Build.Expression(
										Visit.node(node.expression, scope, '')
									);

				exports.LabeledStatement = (node, scope) =>
					Visit.Node(
						node.body,
						Scope.ExtendLabel(scope, node.label.name)
					);

				exports.SwitchCase = (node, scope) =>
					Build.Case(
						node.test
							? Build.binary(
									'===',
									Scope.read(
										scope,
										Scope.GetToken(scope, 'Switch')
									),
									Visit.node(node.test, scope, '')
								)
							: null
					);

				exports.SwitchStatement = (node, scope) =>
					Scope.Token(
						scope,
						Visit.node(node.discriminant, scope, ''),
						(token) =>
							Build.Switch(
								Scope.GetLabels(scope),
								Visit.NODE(
									node.cases,
									Scope.ExtendLabel(
										Scope.ExtendToken(
											scope,
											'Switch',
											token
										),
										null
									),
									false
								)
							)
					);

				exports.WithStatement = (node, scope) =>
					Scope.Token(
						scope,
						Visit.node(node.object, scope, ''),
						(token) =>
							Scope.Token(
								scope,
								Build.conditional(
									Build.binary(
										'===',
										Build.unary(
											'typeof',
											Scope.read(scope, token)
										),
										Build.primitive('object')
									),
									Build.conditional(
										Scope.read(scope, token),
										Scope.read(scope, token),
										Build.apply(
											Scope.read(
												scope,
												Scope.GetToken(
													scope,
													'HelperThrowTypeError'
												)
											),
											Build.primitive(void 0),
											[
												Build.primitive(
													"Cannot convert 'null' to object"
												),
											]
										)
									),
									Build.conditional(
										Build.binary(
											'===',
											Scope.read(scope, token),
											Build.primitive(void 0)
										),
										Build.apply(
											Scope.read(
												scope,
												Scope.GetToken(
													scope,
													'HelperThrowTypeError'
												)
											),
											Build.primitive(void 0),
											[
												Build.primitive(
													"Cannot convert 'undefined' to object"
												),
											]
										),
										Build.apply(
											Build.builtin('Object'),
											Build.primitive(void 0),
											[Scope.read(scope, token)]
										)
									)
								),
								(token) =>
									Visit.Node(
										node.body,
										Scope.ExtendToken(scope, 'With', token)
									)
							)
					);

				exports.IfStatement = (node, scope) =>
					Build.If(
						Scope.GetLabels(scope),
						Visit.node(node.test, scope, ''),
						Visit.NODE(
							node.consequent,
							Scope.ExtendLabel(scope, null),
							false
						),
						node.alternate
							? Visit.NODE(
									node.alternate,
									Scope.ExtendLabel(scope, null),
									false
								)
							: Scope.BLOCK(scope, [], [], (scope) => [])
					);

				exports.BreakStatement = (node, scope) =>
					node.label &&
					ArrayLite.includes(Scope.GetLabels(scope), node.label.name)
						? []
						: Build.Break(node.label ? node.label.name : null);

				exports.ContinueStatement = (node, scope) =>
					Build.Continue(node.label ? node.label.name : null);

				exports.ReturnStatement = (node, scope) =>
					Build.Return(
						Scope.GetCallee(scope) === 'arrow'
							? node.argument
								? Visit.node(node.argument, scope, '')
								: Build.primitive(void 0)
							: node.argument
								? Scope.token(
										scope,
										Visit.node(node.argument, scope, ''),
										(token) =>
											Build.conditional(
												Scope.read(scope, 'new.target'),
												Build.conditional(
													Build.binary(
														'===',
														Build.unary(
															'typeof',
															Scope.read(
																scope,
																token
															)
														),
														Build.primitive(
															'object'
														)
													),
													Build.conditional(
														Scope.read(
															scope,
															token
														),
														Scope.read(
															scope,
															token
														),
														Scope.read(
															scope,
															'this'
														)
													),
													Build.conditional(
														Build.binary(
															'===',
															Build.unary(
																'typeof',
																Scope.read(
																	scope,
																	token
																)
															),
															Build.primitive(
																'function'
															)
														),
														Scope.read(
															scope,
															token
														),
														Scope.read(
															scope,
															'this'
														)
													)
												),
												Scope.read(scope, token)
											)
									)
								: Build.conditional(
										Scope.read(scope, 'new.target'),
										Scope.read(scope, 'this'),
										Build.primitive(void 0)
									)
					);

				exports.ThrowStatement = (node, scope) =>
					Build.Throw(Visit.node(node.argument, scope, ''));

				exports.TryStatement = (node, scope) =>
					Build.Try(
						Scope.GetLabels(scope),
						Visit.NODE(
							node.block,
							Scope.ExtendLabel(scope, null),
							false
						),
						node.handler
							? Scope.BLOCK(
									Scope.ExtendLabel(scope, null),
									node.handler.param
										? Query.PatternNames(node.handler.param)
										: [],
									[],
									(scope) =>
										ArrayLite.concat(
											Reflect_getOwnPropertyDescriptor(
												node,
												'AranCompletion'
											)
												? Scope.Write(
														scope,
														Scope.GetToken(
															scope,
															'Completion'
														),
														Build.primitive(void 0)
													)
												: [],
											node.handler.param
												? Scope.Assign(
														scope,
														true,
														node.handler.param,
														Build.error()
													)
												: Build.Statement(
														Build.error()
													),
											Build.Block(
												[],
												Visit.NODE(
													node.handler.body,
													scope,
													false
												)
											)
										)
								)
							: Scope.BLOCK(scope, [], [], (scope) => []),
						node.finalizer
							? Visit.NODE(
									node.finalizer,
									Scope.ExtendLabel(scope, null),
									false
								)
							: Scope.BLOCK(scope, [], [], (scope) => [])
					);

				exports.DebuggerStatement = (node, scope) => Build.Debugger();

				exports.VariableDeclaration = (node, scope) =>
					ArrayLite.flatMap(node.declarations, (declaration) =>
						Scope.Assign(
							scope,
							node.kind !== 'var',
							declaration.id,
							declaration.init
								? Visit.node(
										declaration.init,
										scope,
										declaration.id.type === 'Identifier'
											? declaration.id.name
											: ''
									)
								: Build.primitive(void 0)
						)
					);

				exports.WhileStatement = (node, scope) =>
					Build.While(
						Scope.GetLabels(scope),
						Visit.node(node.test, scope, ''),
						Visit.NODE(
							node.body,
							Scope.ExtendLabel(scope, null),
							false
						)
					);

				exports.DoWhileStatement = (node, scope) =>
					Scope.Token(scope, Build.primitive(true), (token) =>
						Build.While(
							Scope.GetLabels(scope),
							Build.conditional(
								Scope.read(scope, token),
								Scope.write(
									scope,
									token,
									Build.primitive(false),
									Build.primitive(true)
								),
								Visit.node(node.test, scope, '')
							),
							Visit.NODE(
								node.body,
								Scope.ExtendLabel(scope),
								false
							)
						)
					);

				exports.ForStatement = (node, scope) =>
					node.init &&
					node.init.type === 'VariableDeclaration' &&
					node.init.kind !== 'var'
						? Build.Block(
								[],
								Scope.BLOCK(
									scope,
									node.init.kind === 'let'
										? ArrayLite.flatMap(
												node.init.declarations,
												Query.DeclarationNames
											)
										: [],
									node.init.kind === 'const'
										? ArrayLite.flatMap(
												node.init.declarations,
												Query.DeclarationNames
											)
										: [],
									(scope) =>
										ArrayLite.concat(
											Visit.Node(node.init, scope),
											Build.While(
												Scope.GetLabels(scope),
												node.test
													? Visit.node(
															node.test,
															scope,
															''
														)
													: Build.primitive(true),
												node.update
													? Scope.BLOCK(
															Scope.ExtendLabel(
																scope,
																null
															),
															[],
															[],
															(scope) =>
																ArrayLite.concat(
																	node.body
																		.type ===
																		'BlockStatement'
																		? Build.Block(
																				[],
																				Visit.NODE(
																					node.body,
																					scope,
																					false
																				)
																			)
																		: Visit.Node(
																				node.body,
																				scope
																			),
																	exports.ExpressionStatement(
																		{
																			expression:
																				node.update,
																		},
																		scope,
																		[]
																	)
																)
														)
													: Visit.NODE(
															node.body,
															Scope.ExtendLabel(
																scope,
																null
															),
															false
														)
											)
										)
								)
							)
						: ArrayLite.concat(
								node.init &&
									node.init.type === 'VariableDeclaration'
									? Visit.Node(node.init, scope)
									: node.init
										? exports.ExpressionStatement(
												{ expression: node.init },
												scope,
												[]
											)
										: [],
								Build.While(
									Scope.GetLabels(scope),
									node.test
										? Visit.node(node.test, scope, '')
										: Build.primitive(true),
									node.update
										? Scope.BLOCK(
												Scope.ExtendLabel(scope, null),
												[],
												[],
												(scope) =>
													ArrayLite.concat(
														node.body.type ===
															'BlockStatement'
															? Build.Block(
																	[],
																	Visit.NODE(
																		node.body,
																		scope,
																		false
																	)
																)
															: Visit.Node(
																	node.body,
																	scope
																),
														exports.ExpressionStatement(
															{
																expression:
																	node.update,
															},
															scope,
															[]
														)
													)
											)
										: Visit.NODE(
												node.body,
												Scope.ExtendLabel(scope, null),
												false
											)
								)
							);

				exports.ForInStatement = (node, scope) =>
					Build.Block(
						[],
						Scope.BLOCK(
							scope,
							node.left.type === 'VariableDeclaration' &&
								node.left.kind === 'let'
								? Query.PatternNames(
										node.left.declarations[0].id
									)
								: [],
							node.left.type === 'VariableDeclaration' &&
								node.left.kind === 'const'
								? Query.PatternNames(
										node.left.declarations[0].id
									)
								: [],
							(scope) =>
								Scope.Token(
									scope,
									Visit.node(node.right, scope, ''),
									(token1) =>
										Scope.Token(
											scope,
											Build.apply(
												Build.builtin('Array.of'),
												Build.primitive(void 0),
												[]
											),
											(token2) =>
												ArrayLite.concat(
													Scope.Write(
														scope,
														token1,
														Build.conditional(
															Build.binary(
																'===',
																Build.unary(
																	'typeof',
																	Scope.read(
																		scope,
																		token1
																	)
																),
																Build.primitive(
																	'object'
																)
															),
															Scope.read(
																scope,
																token1
															),
															Build.conditional(
																Build.binary(
																	'===',
																	Scope.read(
																		scope,
																		token1
																	),
																	Build.primitive(
																		void 0
																	)
																),
																Scope.read(
																	scope,
																	token1
																),
																Build.apply(
																	Build.builtin(
																		'Object'
																	),
																	Build.primitive(
																		void 0
																	),
																	[
																		Scope.read(
																			scope,
																			token1
																		),
																	]
																)
															)
														)
													),
													Build.While(
														[],
														Scope.read(
															scope,
															token1
														),
														Scope.BLOCK(
															scope,
															[],
															[],
															(scope) =>
																ArrayLite.concat(
																	Scope.Write(
																		scope,
																		token2,
																		Build.apply(
																			Build.builtin(
																				'Array.prototype.concat'
																			),
																			Scope.read(
																				scope,
																				token2
																			),
																			[
																				Build.apply(
																					Build.builtin(
																						'Object.keys'
																					),
																					Build.primitive(
																						void 0
																					),
																					[
																						Scope.read(
																							scope,
																							token1
																						),
																					]
																				),
																			]
																		)
																	),
																	Scope.Write(
																		scope,
																		token1,
																		Build.apply(
																			Build.builtin(
																				'Reflect.getPrototypeOf'
																			),
																			Build.primitive(
																				void 0
																			),
																			[
																				Scope.read(
																					scope,
																					token1
																				),
																			]
																		)
																	)
																)
														)
													),
													Scope.Token(
														scope,
														Build.primitive(0),
														(token3) =>
															Scope.Token(
																scope,
																Build.apply(
																	Build.builtin(
																		'Reflect.get'
																	),
																	Build.primitive(
																		void 0
																	),
																	[
																		Scope.read(
																			scope,
																			token2
																		),
																		Build.primitive(
																			'length'
																		),
																	]
																),
																(token4) =>
																	Build.While(
																		Scope.GetLabels(
																			scope
																		),
																		Build.binary(
																			'<',
																			Scope.read(
																				scope,
																				token3
																			),
																			Scope.read(
																				scope,
																				token4
																			)
																		),
																		Scope.BLOCK(
																			Scope.ExtendLabel(
																				scope,
																				null
																			),
																			node
																				.left
																				.type ===
																				'VariableDeclaration' &&
																				node
																					.left
																					.kind ===
																					'let'
																				? Query.PatternNames(
																						node
																							.left
																							.declarations[0]
																							.id
																					)
																				: [],
																			node
																				.left
																				.type ===
																				'VariableDeclaration' &&
																				node
																					.left
																					.kind ===
																					'const'
																				? Query.PatternNames(
																						node
																							.left
																							.declarations[0]
																							.id
																					)
																				: [],
																			(
																				scope
																			) =>
																				ArrayLite.concat(
																					Scope.Assign(
																						scope,
																						node
																							.left
																							.type ===
																							'VariableDeclaration' &&
																							node
																								.left
																								.kind !==
																								'var',
																						node
																							.left
																							.type ===
																							'VariableDeclaration'
																							? node
																									.left
																									.declarations[0]
																									.id
																							: node.left,
																						Build.apply(
																							Build.builtin(
																								'Reflect.get'
																							),
																							Build.primitive(
																								void 0
																							),
																							[
																								Scope.read(
																									scope,
																									token2
																								),
																								Scope.read(
																									scope,
																									token3
																								),
																							]
																						)
																					),
																					Build.Block(
																						[],
																						Visit.NODE(
																							node.body,
																							scope,
																							false
																						)
																					),
																					Scope.Write(
																						scope,
																						token3,
																						Build.binary(
																							'+',
																							Scope.read(
																								scope,
																								token3
																							),
																							Build.primitive(
																								1
																							)
																						)
																					)
																				)
																		)
																	)
															)
													)
												)
										)
								)
						)
					);

				exports.ForOfStatement = (node, scope) =>
					Build.Block(
						[],
						Scope.BLOCK(
							scope,
							node.left.type === 'VariableDeclaration' &&
								node.left.kind === 'let'
								? Query.PatternNames(
										node.left.declarations[0].id
									)
								: [],
							node.left.type === 'VariableDeclaration' &&
								node.left.kind === 'const'
								? Query.PatternNames(
										node.left.declarations[0].id
									)
								: [],
							(scope) =>
								Scope.Token(
									scope,
									Visit.node(node.right, scope, ''),
									(token1) =>
										Scope.Token(
											scope,
											Build.apply(
												Build.apply(
													Build.builtin(
														'Reflect.get'
													),
													Build.primitive(void 0),
													[
														Build.apply(
															Build.builtin(
																'Object'
															),
															Build.primitive(
																void 0
															),
															[
																Scope.read(
																	scope,
																	token1
																),
															]
														),
														Build.builtin(
															'Symbol.iterator'
														),
														Scope.read(
															scope,
															token1
														),
													]
												),
												Scope.read(scope, token1),
												[]
											),
											(token2) =>
												Build.While(
													Scope.GetLabels(scope),
													Scope.write(
														scope,
														token1,
														Build.apply(
															Build.apply(
																Build.builtin(
																	'Reflect.get'
																),
																Build.primitive(
																	void 0
																),
																[
																	Scope.read(
																		scope,
																		token2
																	),
																	Build.primitive(
																		'next'
																	),
																]
															),
															Scope.read(
																scope,
																token2
															),
															[]
														),
														Build.unary(
															'!',
															Build.apply(
																Build.builtin(
																	'Reflect.get'
																),
																Build.primitive(
																	void 0
																),
																[
																	Scope.read(
																		scope,
																		token1
																	),
																	Build.primitive(
																		'done'
																	),
																]
															)
														)
													),
													Scope.BLOCK(
														Scope.ExtendLabel(
															scope,
															null
														),
														node.left.type ===
															'VariableDeclaration' &&
															node.left.kind ===
																'let'
															? Query.PatternNames(
																	node.left
																		.declarations[0]
																		.id
																)
															: [],
														node.left.type ===
															'VariableDeclaration' &&
															node.left.kind ===
																'const'
															? Query.PatternNames(
																	node.left
																		.declarations[0]
																		.id
																)
															: [],
														(scope) =>
															ArrayLite.concat(
																Scope.Assign(
																	scope,
																	node.left
																		.type ===
																		'VariableDeclaration' &&
																		node
																			.left
																			.kind !==
																			'var',
																	node.left
																		.type ===
																		'VariableDeclaration'
																		? node
																				.left
																				.declarations[0]
																				.id
																		: node.left,
																	Build.apply(
																		Build.builtin(
																			'Reflect.get'
																		),
																		Build.primitive(
																			void 0
																		),
																		[
																			Scope.read(
																				scope,
																				token1
																			),
																			Build.primitive(
																				'value'
																			),
																		]
																	)
																),
																Build.Block(
																	[],
																	Visit.NODE(
																		node.body,
																		scope,
																		false
																	)
																)
															)
													)
												)
										)
								)
						)
					);
			},
			{
				'../build.js': 22,
				'../query.js': 24,
				'../scope': 27,
				'./index.js': 31,
				'array-lite': 35,
			},
		],
		33: [
			function (require, module, exports) {
				const ArrayLite = require('array-lite');
				const Enumeration = require('./enumeration.js');

				const Reflect_apply = Reflect.apply;
				const String_prototype_split = String.prototype.split;

				const builtins = Enumeration.Builtin;

				exports.script = (namespace) =>
					`if (${namespace}.builtins) throw new this.Error("Setup has already been done");\n` +
					`${namespace}.builtins = this.Object.create(null);\n` +
					`${namespace}.builtins.global = this;` +
					ArrayLite.join(
						ArrayLite.map(
							ArrayLite.filter(
								builtins,
								(builtin) => builtin !== 'global'
							),
							(name) =>
								`${namespace}.builtins["${name}"] = this.${name};\n`
						),
						''
					);

				const set = (namespace, name, expression) => ({
					type: 'ExpressionStatement',
					expression: {
						type: 'AssignmentExpression',
						operator: '=',
						left: {
							type: 'MemberExpression',
							computed: true,
							object: {
								type: 'MemberExpression',
								computed: false,
								object: {
									type: 'Identifier',
									name: namespace,
								},
								property: {
									type: 'Identifier',
									name: 'builtins',
								},
							},
							property: {
								type: 'Literal',
								value: name,
							},
						},
						right: expression,
					},
				});

				exports.estree = (namespace) => ({
					type: 'Program',
					body: ArrayLite.concat(
						[
							{
								type: 'IfStatement',
								test: {
									type: 'MemberExpression',
									computed: false,
									object: {
										type: 'Identifier',
										name: namespace,
									},
									property: {
										type: 'Identifier',
										name: 'builtins',
									},
								},
								consequent: {
									type: 'ThrowStatement',
									argument: {
										type: 'NewExpression',
										callee: {
											type: 'MemberExpression',
											computed: false,
											object: {
												type: 'ThisExpression',
											},
											property: {
												type: 'Identifier',
												name: 'Error',
											},
										},
										arguments: [
											{
												type: 'Literal',
												value: 'Setup has already been done',
											},
										],
									},
								},
								alternate: null,
							},
							{
								type: 'ExpressionStatement',
								expression: {
									type: 'AssignmentExpression',
									operator: '=',
									left: {
										type: 'MemberExpression',
										computed: false,
										object: {
											type: 'Identifier',
											name: namespace,
										},
										property: {
											type: 'Identifier',
											name: 'builtins',
										},
									},
									right: {
										type: 'CallExpression',
										callee: {
											type: 'MemberExpression',
											computed: false,
											object: {
												type: 'MemberExpression',
												computed: false,
												object: {
													type: 'ThisExpression',
												},
												property: {
													type: 'Identifier',
													name: 'Object',
												},
											},
											property: {
												type: 'Identifier',
												name: 'create',
											},
										},
										arguments: [
											{
												type: 'Literal',
												value: null,
											},
										],
									},
								},
							},
							set(namespace, 'global', {
								type: 'ThisExpression',
							}),
						],
						ArrayLite.map(
							ArrayLite.filter(
								builtins,
								(builtin) =>
									builtin !== 'global' &&
									builtin !==
										"Reflect.getOwnPropertyDescriptor(Function.prototype,'arguments').get" &&
									builtin !==
										"Reflect.getOwnPropertyDescriptor(Function.prototype,'arguments').set"
							),
							(builtin) =>
								set(
									namespace,
									builtin,
									ArrayLite.reduce(
										Reflect_apply(
											String_prototype_split,
											builtin,
											['.']
										),
										(expression, identifier) => ({
											type: 'MemberExpression',
											computed: false,
											object: expression,
											property: {
												type: 'Identifier',
												name: identifier,
											},
										}),
										{
											type: 'ThisExpression',
										}
									)
								)
						),
						ArrayLite.map(['get', 'set'], (string) =>
							set(
								namespace,
								"Reflect.getOwnPropertyDescriptor(Function.prototype,'arguments')." +
									string,
								{
									type: 'MemberExpression',
									computed: false,
									object: {
										type: 'CallExpression',
										callee: {
											type: 'MemberExpression',
											computed: false,
											object: {
												type: 'MemberExpression',
												computed: false,
												object: {
													type: 'ThisExpression',
												},
												property: {
													type: 'Identifier',
													name: 'Object',
												},
											},
											property: {
												type: 'Identifier',
												name: 'getOwnPropertyDescriptor',
											},
										},
										arguments: [
											{
												type: 'MemberExpression',
												computed: false,
												object: {
													type: 'MemberExpression',
													computed: false,
													object: {
														type: 'ThisExpression',
													},
													property: {
														type: 'Identifier',
														name: 'Function',
													},
												},
												property: {
													type: 'Identifier',
													name: 'prototype',
												},
											},
											{
												type: 'Literal',
												value: 'arguments',
											},
										],
									},
									property: {
										type: 'Identifier',
										name: string,
									},
								}
							)
						)
					),
				});
			},
			{ './enumeration.js': 12, 'array-lite': 35 },
		],
		34: [
			function (require, module, exports) {
				(function (global, factory) {
					typeof exports === 'object' && typeof module !== 'undefined'
						? factory(exports)
						: typeof define === 'function' && define.amd
							? define(['exports'], factory)
							: ((global = global || self),
								factory((global.acorn = {})));
				})(this, function (exports) {
					'use strict';

					// Reserved word lists for various dialects of the language

					var reservedWords = {
						3: 'abstract boolean byte char class double enum export extends final float goto implements import int interface long native package private protected public short static super synchronized throws transient volatile',
						5: 'class enum extends super const export import',
						6: 'enum',
						strict: 'implements interface let package private protected public static yield',
						strictBind: 'eval arguments',
					};

					// And the keywords

					var ecma5AndLessKeywords =
						'break case catch continue debugger default do else finally for function if return switch throw try var while with null true false instanceof typeof void delete new in this';

					var keywords = {
						5: ecma5AndLessKeywords,
						'5module': ecma5AndLessKeywords + ' export import',
						6:
							ecma5AndLessKeywords +
							' const class extends export import super',
					};

					var keywordRelationalOperator = /^in(stanceof)?$/;

					// ## Character categories

					// Big ugly regular expressions that match characters in the
					// whitespace, identifier, and identifier-start categories. These
					// are only applied when a character is found to actually have a
					// code point above 128.
					// Generated by `bin/generate-identifier-regex.js`.
					var nonASCIIidentifierStartChars =
						'\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0370-\u0374\u0376\u0377\u037a-\u037d\u037f\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u048a-\u052f\u0531-\u0556\u0559\u0560-\u0588\u05d0-\u05ea\u05ef-\u05f2\u0620-\u064a\u066e\u066f\u0671-\u06d3\u06d5\u06e5\u06e6\u06ee\u06ef\u06fa-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u07a5\u07b1\u07ca-\u07ea\u07f4\u07f5\u07fa\u0800-\u0815\u081a\u0824\u0828\u0840-\u0858\u0860-\u086a\u08a0-\u08b4\u08b6-\u08bd\u0904-\u0939\u093d\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc\u09dd\u09df-\u09e1\u09f0\u09f1\u09fc\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a59-\u0a5c\u0a5e\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0\u0ae1\u0af9\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3d\u0b5c\u0b5d\u0b5f-\u0b61\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bd0\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c39\u0c3d\u0c58-\u0c5a\u0c60\u0c61\u0c80\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cde\u0ce0\u0ce1\u0cf1\u0cf2\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d\u0d4e\u0d54-\u0d56\u0d5f-\u0d61\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32\u0e33\u0e40-\u0e46\u0e81\u0e82\u0e84\u0e86-\u0e8a\u0e8c-\u0ea3\u0ea5\u0ea7-\u0eb0\u0eb2\u0eb3\u0ebd\u0ec0-\u0ec4\u0ec6\u0edc-\u0edf\u0f00\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8c\u1000-\u102a\u103f\u1050-\u1055\u105a-\u105d\u1061\u1065\u1066\u106e-\u1070\u1075-\u1081\u108e\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f5\u13f8-\u13fd\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f8\u1700-\u170c\u170e-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u1820-\u1878\u1880-\u18a8\u18aa\u18b0-\u18f5\u1900-\u191e\u1950-\u196d\u1970-\u1974\u1980-\u19ab\u19b0-\u19c9\u1a00-\u1a16\u1a20-\u1a54\u1aa7\u1b05-\u1b33\u1b45-\u1b4b\u1b83-\u1ba0\u1bae\u1baf\u1bba-\u1be5\u1c00-\u1c23\u1c4d-\u1c4f\u1c5a-\u1c7d\u1c80-\u1c88\u1c90-\u1cba\u1cbd-\u1cbf\u1ce9-\u1cec\u1cee-\u1cf3\u1cf5\u1cf6\u1cfa\u1d00-\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u209c\u2102\u2107\u210a-\u2113\u2115\u2118-\u211d\u2124\u2126\u2128\u212a-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2ce4\u2ceb-\u2cee\u2cf2\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303c\u3041-\u3096\u309b-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312f\u3131-\u318e\u31a0-\u31ba\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fef\ua000-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua61f\ua62a\ua62b\ua640-\ua66e\ua67f-\ua69d\ua6a0-\ua6ef\ua717-\ua71f\ua722-\ua788\ua78b-\ua7bf\ua7c2-\ua7c6\ua7f7-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\ua882-\ua8b3\ua8f2-\ua8f7\ua8fb\ua8fd\ua8fe\ua90a-\ua925\ua930-\ua946\ua960-\ua97c\ua984-\ua9b2\ua9cf\ua9e0-\ua9e4\ua9e6-\ua9ef\ua9fa-\ua9fe\uaa00-\uaa28\uaa40-\uaa42\uaa44-\uaa4b\uaa60-\uaa76\uaa7a\uaa7e-\uaaaf\uaab1\uaab5\uaab6\uaab9-\uaabd\uaac0\uaac2\uaadb-\uaadd\uaae0-\uaaea\uaaf2-\uaaf4\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uab30-\uab5a\uab5c-\uab67\uab70-\uabe2\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc';
					var nonASCIIidentifierChars =
						'\u200c\u200d\xb7\u0300-\u036f\u0387\u0483-\u0487\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7\u0610-\u061a\u064b-\u0669\u0670\u06d6-\u06dc\u06df-\u06e4\u06e7\u06e8\u06ea-\u06ed\u06f0-\u06f9\u0711\u0730-\u074a\u07a6-\u07b0\u07c0-\u07c9\u07eb-\u07f3\u07fd\u0816-\u0819\u081b-\u0823\u0825-\u0827\u0829-\u082d\u0859-\u085b\u08d3-\u08e1\u08e3-\u0903\u093a-\u093c\u093e-\u094f\u0951-\u0957\u0962\u0963\u0966-\u096f\u0981-\u0983\u09bc\u09be-\u09c4\u09c7\u09c8\u09cb-\u09cd\u09d7\u09e2\u09e3\u09e6-\u09ef\u09fe\u0a01-\u0a03\u0a3c\u0a3e-\u0a42\u0a47\u0a48\u0a4b-\u0a4d\u0a51\u0a66-\u0a71\u0a75\u0a81-\u0a83\u0abc\u0abe-\u0ac5\u0ac7-\u0ac9\u0acb-\u0acd\u0ae2\u0ae3\u0ae6-\u0aef\u0afa-\u0aff\u0b01-\u0b03\u0b3c\u0b3e-\u0b44\u0b47\u0b48\u0b4b-\u0b4d\u0b56\u0b57\u0b62\u0b63\u0b66-\u0b6f\u0b82\u0bbe-\u0bc2\u0bc6-\u0bc8\u0bca-\u0bcd\u0bd7\u0be6-\u0bef\u0c00-\u0c04\u0c3e-\u0c44\u0c46-\u0c48\u0c4a-\u0c4d\u0c55\u0c56\u0c62\u0c63\u0c66-\u0c6f\u0c81-\u0c83\u0cbc\u0cbe-\u0cc4\u0cc6-\u0cc8\u0cca-\u0ccd\u0cd5\u0cd6\u0ce2\u0ce3\u0ce6-\u0cef\u0d00-\u0d03\u0d3b\u0d3c\u0d3e-\u0d44\u0d46-\u0d48\u0d4a-\u0d4d\u0d57\u0d62\u0d63\u0d66-\u0d6f\u0d82\u0d83\u0dca\u0dcf-\u0dd4\u0dd6\u0dd8-\u0ddf\u0de6-\u0def\u0df2\u0df3\u0e31\u0e34-\u0e3a\u0e47-\u0e4e\u0e50-\u0e59\u0eb1\u0eb4-\u0ebc\u0ec8-\u0ecd\u0ed0-\u0ed9\u0f18\u0f19\u0f20-\u0f29\u0f35\u0f37\u0f39\u0f3e\u0f3f\u0f71-\u0f84\u0f86\u0f87\u0f8d-\u0f97\u0f99-\u0fbc\u0fc6\u102b-\u103e\u1040-\u1049\u1056-\u1059\u105e-\u1060\u1062-\u1064\u1067-\u106d\u1071-\u1074\u1082-\u108d\u108f-\u109d\u135d-\u135f\u1369-\u1371\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17b4-\u17d3\u17dd\u17e0-\u17e9\u180b-\u180d\u1810-\u1819\u18a9\u1920-\u192b\u1930-\u193b\u1946-\u194f\u19d0-\u19da\u1a17-\u1a1b\u1a55-\u1a5e\u1a60-\u1a7c\u1a7f-\u1a89\u1a90-\u1a99\u1ab0-\u1abd\u1b00-\u1b04\u1b34-\u1b44\u1b50-\u1b59\u1b6b-\u1b73\u1b80-\u1b82\u1ba1-\u1bad\u1bb0-\u1bb9\u1be6-\u1bf3\u1c24-\u1c37\u1c40-\u1c49\u1c50-\u1c59\u1cd0-\u1cd2\u1cd4-\u1ce8\u1ced\u1cf4\u1cf7-\u1cf9\u1dc0-\u1df9\u1dfb-\u1dff\u203f\u2040\u2054\u20d0-\u20dc\u20e1\u20e5-\u20f0\u2cef-\u2cf1\u2d7f\u2de0-\u2dff\u302a-\u302f\u3099\u309a\ua620-\ua629\ua66f\ua674-\ua67d\ua69e\ua69f\ua6f0\ua6f1\ua802\ua806\ua80b\ua823-\ua827\ua880\ua881\ua8b4-\ua8c5\ua8d0-\ua8d9\ua8e0-\ua8f1\ua8ff-\ua909\ua926-\ua92d\ua947-\ua953\ua980-\ua983\ua9b3-\ua9c0\ua9d0-\ua9d9\ua9e5\ua9f0-\ua9f9\uaa29-\uaa36\uaa43\uaa4c\uaa4d\uaa50-\uaa59\uaa7b-\uaa7d\uaab0\uaab2-\uaab4\uaab7\uaab8\uaabe\uaabf\uaac1\uaaeb-\uaaef\uaaf5\uaaf6\uabe3-\uabea\uabec\uabed\uabf0-\uabf9\ufb1e\ufe00-\ufe0f\ufe20-\ufe2f\ufe33\ufe34\ufe4d-\ufe4f\uff10-\uff19\uff3f';

					var nonASCIIidentifierStart = new RegExp(
						'[' + nonASCIIidentifierStartChars + ']'
					);
					var nonASCIIidentifier = new RegExp(
						'[' +
							nonASCIIidentifierStartChars +
							nonASCIIidentifierChars +
							']'
					);

					nonASCIIidentifierStartChars = nonASCIIidentifierChars =
						null;

					// These are a run-length and offset encoded representation of the
					// >0xffff code points that are a valid part of identifiers. The
					// offset starts at 0x10000, and each pair of numbers represents an
					// offset to the next range, and then a size of the range. They were
					// generated by bin/generate-identifier-regex.js

					// eslint-disable-next-line comma-spacing
					var astralIdentifierStartCodes = [
						0, 11, 2, 25, 2, 18, 2, 1, 2, 14, 3, 13, 35, 122, 70,
						52, 268, 28, 4, 48, 48, 31, 14, 29, 6, 37, 11, 29, 3,
						35, 5, 7, 2, 4, 43, 157, 19, 35, 5, 35, 5, 39, 9, 51,
						157, 310, 10, 21, 11, 7, 153, 5, 3, 0, 2, 43, 2, 1, 4,
						0, 3, 22, 11, 22, 10, 30, 66, 18, 2, 1, 11, 21, 11, 25,
						71, 55, 7, 1, 65, 0, 16, 3, 2, 2, 2, 28, 43, 28, 4, 28,
						36, 7, 2, 27, 28, 53, 11, 21, 11, 18, 14, 17, 111, 72,
						56, 50, 14, 50, 14, 35, 477, 28, 11, 0, 9, 21, 155, 22,
						13, 52, 76, 44, 33, 24, 27, 35, 30, 0, 12, 34, 4, 0, 13,
						47, 15, 3, 22, 0, 2, 0, 36, 17, 2, 24, 85, 6, 2, 0, 2,
						3, 2, 14, 2, 9, 8, 46, 39, 7, 3, 1, 3, 21, 2, 6, 2, 1,
						2, 4, 4, 0, 19, 0, 13, 4, 159, 52, 19, 3, 21, 0, 33, 47,
						21, 1, 2, 0, 185, 46, 42, 3, 37, 47, 21, 0, 60, 42, 14,
						0, 72, 26, 230, 43, 117, 63, 32, 0, 161, 7, 3, 38, 17,
						0, 2, 0, 29, 0, 11, 39, 8, 0, 22, 0, 12, 45, 20, 0, 35,
						56, 264, 8, 2, 36, 18, 0, 50, 29, 113, 6, 2, 1, 2, 37,
						22, 0, 26, 5, 2, 1, 2, 31, 15, 0, 328, 18, 270, 921,
						103, 110, 18, 195, 2749, 1070, 4050, 582, 8634, 568, 8,
						30, 114, 29, 19, 47, 17, 3, 32, 20, 6, 18, 689, 63, 129,
						74, 6, 0, 67, 12, 65, 1, 2, 0, 29, 6135, 9, 754, 9486,
						286, 50, 2, 18, 3, 9, 395, 2309, 106, 6, 12, 4, 8, 8, 9,
						5991, 84, 2, 70, 2, 1, 3, 0, 3, 1, 3, 3, 2, 11, 2, 0, 2,
						6, 2, 64, 2, 3, 3, 7, 2, 6, 2, 27, 2, 3, 2, 4, 2, 0, 4,
						6, 2, 339, 3, 24, 2, 24, 2, 30, 2, 24, 2, 30, 2, 24, 2,
						30, 2, 24, 2, 30, 2, 24, 2, 7, 2357, 44, 11, 6, 17, 0,
						370, 43, 1301, 196, 60, 67, 8, 0, 1205, 3, 2, 26, 2, 1,
						2, 0, 3, 0, 2, 9, 2, 3, 2, 0, 2, 0, 7, 0, 5, 0, 2, 0, 2,
						0, 2, 2, 2, 1, 2, 0, 3, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 1,
						2, 0, 3, 3, 2, 6, 2, 3, 2, 3, 2, 0, 2, 9, 2, 16, 6, 2,
						2, 4, 2, 16, 4421, 42710, 42, 4148, 12, 221, 3, 5761,
						15, 7472, 3104, 541,
					];

					// eslint-disable-next-line comma-spacing
					var astralIdentifierCodes = [
						509, 0, 227, 0, 150, 4, 294, 9, 1368, 2, 2, 1, 6, 3, 41,
						2, 5, 0, 166, 1, 574, 3, 9, 9, 525, 10, 176, 2, 54, 14,
						32, 9, 16, 3, 46, 10, 54, 9, 7, 2, 37, 13, 2, 9, 6, 1,
						45, 0, 13, 2, 49, 13, 9, 3, 4, 9, 83, 11, 7, 0, 161, 11,
						6, 9, 7, 3, 56, 1, 2, 6, 3, 1, 3, 2, 10, 0, 11, 1, 3, 6,
						4, 4, 193, 17, 10, 9, 5, 0, 82, 19, 13, 9, 214, 6, 3, 8,
						28, 1, 83, 16, 16, 9, 82, 12, 9, 9, 84, 14, 5, 9, 243,
						14, 166, 9, 232, 6, 3, 6, 4, 0, 29, 9, 41, 6, 2, 3, 9,
						0, 10, 10, 47, 15, 406, 7, 2, 7, 17, 9, 57, 21, 2, 13,
						123, 5, 4, 0, 2, 1, 2, 6, 2, 0, 9, 9, 49, 4, 2, 1, 2, 4,
						9, 9, 330, 3, 19306, 9, 135, 4, 60, 6, 26, 9, 1014, 0,
						2, 54, 8, 3, 19723, 1, 5319, 4, 4, 5, 9, 7, 3, 6, 31, 3,
						149, 2, 1418, 49, 513, 54, 5, 49, 9, 0, 15, 0, 23, 4, 2,
						14, 1361, 6, 2, 16, 3, 6, 2, 1, 2, 4, 262, 6, 10, 9,
						419, 13, 1495, 6, 110, 6, 6, 9, 792487, 239,
					];

					// This has a complexity linear to the value of the code. The
					// assumption is that looking up astral identifier characters is
					// rare.
					function isInAstralSet(code, set) {
						var pos = 0x10000;
						for (var i = 0; i < set.length; i += 2) {
							pos += set[i];
							if (pos > code) {
								return false;
							}
							pos += set[i + 1];
							if (pos >= code) {
								return true;
							}
						}
					}

					// Test whether a given character code starts an identifier.

					function isIdentifierStart(code, astral) {
						if (code < 65) {
							return code === 36;
						}
						if (code < 91) {
							return true;
						}
						if (code < 97) {
							return code === 95;
						}
						if (code < 123) {
							return true;
						}
						if (code <= 0xffff) {
							return (
								code >= 0xaa &&
								nonASCIIidentifierStart.test(
									String.fromCharCode(code)
								)
							);
						}
						if (astral === false) {
							return false;
						}
						return isInAstralSet(code, astralIdentifierStartCodes);
					}

					// Test whether a given character is part of an identifier.

					function isIdentifierChar(code, astral) {
						if (code < 48) {
							return code === 36;
						}
						if (code < 58) {
							return true;
						}
						if (code < 65) {
							return false;
						}
						if (code < 91) {
							return true;
						}
						if (code < 97) {
							return code === 95;
						}
						if (code < 123) {
							return true;
						}
						if (code <= 0xffff) {
							return (
								code >= 0xaa &&
								nonASCIIidentifier.test(
									String.fromCharCode(code)
								)
							);
						}
						if (astral === false) {
							return false;
						}
						return (
							isInAstralSet(code, astralIdentifierStartCodes) ||
							isInAstralSet(code, astralIdentifierCodes)
						);
					}

					// ## Token types

					// The assignment of fine-grained, information-carrying type objects
					// allows the tokenizer to store the information it has about a
					// token in a way that is very cheap for the parser to look up.

					// All token type variables start with an underscore, to make them
					// easy to recognize.

					// The `beforeExpr` property is used to disambiguate between regular
					// expressions and divisions. It is set on all token types that can
					// be followed by an expression (thus, a slash after them would be a
					// regular expression).
					//
					// The `startsExpr` property is used to check if the token ends a
					// `yield` expression. It is set on all token types that either can
					// directly start an expression (like a quotation mark) or can
					// continue an expression (like the body of a string).
					//
					// `isLoop` marks a keyword as starting a loop, which is important
					// to know when parsing a label, in order to allow or disallow
					// continue jumps to that label.

					var TokenType = function TokenType(label, conf) {
						if (conf === void 0) conf = {};

						this.label = label;
						this.keyword = conf.keyword;
						this.beforeExpr = !!conf.beforeExpr;
						this.startsExpr = !!conf.startsExpr;
						this.isLoop = !!conf.isLoop;
						this.isAssign = !!conf.isAssign;
						this.prefix = !!conf.prefix;
						this.postfix = !!conf.postfix;
						this.binop = conf.binop || null;
						this.updateContext = null;
					};

					function binop(name, prec) {
						return new TokenType(name, {
							beforeExpr: true,
							binop: prec,
						});
					}
					var beforeExpr = { beforeExpr: true },
						startsExpr = { startsExpr: true };

					// Map keyword names to token types.

					var keywords$1 = {};

					// Succinct definitions of keyword token types
					function kw(name, options) {
						if (options === void 0) options = {};

						options.keyword = name;
						return (keywords$1[name] = new TokenType(
							name,
							options
						));
					}

					var types = {
						num: new TokenType('num', startsExpr),
						regexp: new TokenType('regexp', startsExpr),
						string: new TokenType('string', startsExpr),
						name: new TokenType('name', startsExpr),
						eof: new TokenType('eof'),

						// Punctuation token types.
						bracketL: new TokenType('[', {
							beforeExpr: true,
							startsExpr: true,
						}),
						bracketR: new TokenType(']'),
						braceL: new TokenType('{', {
							beforeExpr: true,
							startsExpr: true,
						}),
						braceR: new TokenType('}'),
						parenL: new TokenType('(', {
							beforeExpr: true,
							startsExpr: true,
						}),
						parenR: new TokenType(')'),
						comma: new TokenType(',', beforeExpr),
						semi: new TokenType(';', beforeExpr),
						colon: new TokenType(':', beforeExpr),
						dot: new TokenType('.'),
						question: new TokenType('?', beforeExpr),
						arrow: new TokenType('=>', beforeExpr),
						template: new TokenType('template'),
						invalidTemplate: new TokenType('invalidTemplate'),
						ellipsis: new TokenType('...', beforeExpr),
						backQuote: new TokenType('`', startsExpr),
						dollarBraceL: new TokenType('${', {
							beforeExpr: true,
							startsExpr: true,
						}),

						// Operators. These carry several kinds of properties to help the
						// parser use them properly (the presence of these properties is
						// what categorizes them as operators).
						//
						// `binop`, when present, specifies that this operator is a binary
						// operator, and will refer to its precedence.
						//
						// `prefix` and `postfix` mark the operator as a prefix or postfix
						// unary operator.
						//
						// `isAssign` marks all of `=`, `+=`, `-=` etcetera, which act as
						// binary operators with a very low precedence, that should result
						// in AssignmentExpression nodes.

						eq: new TokenType('=', {
							beforeExpr: true,
							isAssign: true,
						}),
						assign: new TokenType('_=', {
							beforeExpr: true,
							isAssign: true,
						}),
						incDec: new TokenType('++/--', {
							prefix: true,
							postfix: true,
							startsExpr: true,
						}),
						prefix: new TokenType('!/~', {
							beforeExpr: true,
							prefix: true,
							startsExpr: true,
						}),
						logicalOR: binop('||', 1),
						logicalAND: binop('&&', 2),
						bitwiseOR: binop('|', 3),
						bitwiseXOR: binop('^', 4),
						bitwiseAND: binop('&', 5),
						equality: binop('==/!=/===/!==', 6),
						relational: binop('</>/<=/>=', 7),
						bitShift: binop('<</>>/>>>', 8),
						plusMin: new TokenType('+/-', {
							beforeExpr: true,
							binop: 9,
							prefix: true,
							startsExpr: true,
						}),
						modulo: binop('%', 10),
						star: binop('*', 10),
						slash: binop('/', 10),
						starstar: new TokenType('**', { beforeExpr: true }),

						// Keyword token types.
						_break: kw('break'),
						_case: kw('case', beforeExpr),
						_catch: kw('catch'),
						_continue: kw('continue'),
						_debugger: kw('debugger'),
						_default: kw('default', beforeExpr),
						_do: kw('do', { isLoop: true, beforeExpr: true }),
						_else: kw('else', beforeExpr),
						_finally: kw('finally'),
						_for: kw('for', { isLoop: true }),
						_function: kw('function', startsExpr),
						_if: kw('if'),
						_return: kw('return', beforeExpr),
						_switch: kw('switch'),
						_throw: kw('throw', beforeExpr),
						_try: kw('try'),
						_var: kw('var'),
						_const: kw('const'),
						_while: kw('while', { isLoop: true }),
						_with: kw('with'),
						_new: kw('new', { beforeExpr: true, startsExpr: true }),
						_this: kw('this', startsExpr),
						_super: kw('super', startsExpr),
						_class: kw('class', startsExpr),
						_extends: kw('extends', beforeExpr),
						_export: kw('export'),
						_import: kw('import', startsExpr),
						_null: kw('null', startsExpr),
						_true: kw('true', startsExpr),
						_false: kw('false', startsExpr),
						_in: kw('in', { beforeExpr: true, binop: 7 }),
						_instanceof: kw('instanceof', {
							beforeExpr: true,
							binop: 7,
						}),
						_typeof: kw('typeof', {
							beforeExpr: true,
							prefix: true,
							startsExpr: true,
						}),
						_void: kw('void', {
							beforeExpr: true,
							prefix: true,
							startsExpr: true,
						}),
						_delete: kw('delete', {
							beforeExpr: true,
							prefix: true,
							startsExpr: true,
						}),
					};

					// Matches a whole line break (where CRLF is considered a single
					// line break). Used to count lines.

					var lineBreak = /\r\n?|\n|\u2028|\u2029/;
					var lineBreakG = new RegExp(lineBreak.source, 'g');

					function isNewLine(code, ecma2019String) {
						return (
							code === 10 ||
							code === 13 ||
							(!ecma2019String &&
								(code === 0x2028 || code === 0x2029))
						);
					}

					var nonASCIIwhitespace =
						/[\u1680\u2000-\u200a\u202f\u205f\u3000\ufeff]/;

					var skipWhiteSpace = /(?:\s|\/\/.*|\/\*[^]*?\*\/)*/g;

					var ref = Object.prototype;
					var hasOwnProperty = ref.hasOwnProperty;
					var toString = ref.toString;

					// Checks if an object has a property.

					function has(obj, propName) {
						return hasOwnProperty.call(obj, propName);
					}

					var isArray =
						Array.isArray ||
						function (obj) {
							return toString.call(obj) === '[object Array]';
						};

					function wordsRegexp(words) {
						return new RegExp(
							'^(?:' + words.replace(/ /g, '|') + ')$'
						);
					}

					// These are used when `options.locations` is on, for the
					// `startLoc` and `endLoc` properties.

					var Position = function Position(line, col) {
						this.line = line;
						this.column = col;
					};

					Position.prototype.offset = function offset(n) {
						return new Position(this.line, this.column + n);
					};

					var SourceLocation = function SourceLocation(
						p,
						start,
						end
					) {
						this.start = start;
						this.end = end;
						if (p.sourceFile !== null) {
							this.source = p.sourceFile;
						}
					};

					// The `getLineInfo` function is mostly useful when the
					// `locations` option is off (for performance reasons) and you
					// want to find the line/column position for a given character
					// offset. `input` should be the code string that the offset refers
					// into.

					function getLineInfo(input, offset) {
						for (var line = 1, cur = 0; ; ) {
							lineBreakG.lastIndex = cur;
							var match = lineBreakG.exec(input);
							if (match && match.index < offset) {
								++line;
								cur = match.index + match[0].length;
							} else {
								return new Position(line, offset - cur);
							}
						}
					}

					// A second optional argument can be given to further configure
					// the parser process. These options are recognized:

					var defaultOptions = {
						// `ecmaVersion` indicates the ECMAScript version to parse. Must be
						// either 3, 5, 6 (2015), 7 (2016), 8 (2017), 9 (2018), or 10
						// (2019). This influences support for strict mode, the set of
						// reserved words, and support for new syntax features. The default
						// is 9.
						ecmaVersion: 9,
						// `sourceType` indicates the mode the code should be parsed in.
						// Can be either `"script"` or `"module"`. This influences global
						// strict mode and parsing of `import` and `export` declarations.
						sourceType: 'script',
						// `onInsertedSemicolon` can be a callback that will be called
						// when a semicolon is automatically inserted. It will be passed
						// the position of the comma as an offset, and if `locations` is
						// enabled, it is given the location as a `{line, column}` object
						// as second argument.
						onInsertedSemicolon: null,
						// `onTrailingComma` is similar to `onInsertedSemicolon`, but for
						// trailing commas.
						onTrailingComma: null,
						// By default, reserved words are only enforced if ecmaVersion >= 5.
						// Set `allowReserved` to a boolean value to explicitly turn this on
						// an off. When this option has the value "never", reserved words
						// and keywords can also not be used as property names.
						allowReserved: null,
						// When enabled, a return at the top level is not considered an
						// error.
						allowReturnOutsideFunction: false,
						// When enabled, import/export statements are not constrained to
						// appearing at the top of the program.
						allowImportExportEverywhere: false,
						// When enabled, await identifiers are allowed to appear at the top-level scope,
						// but they are still not allowed in non-async functions.
						allowAwaitOutsideFunction: false,
						// When enabled, hashbang directive in the beginning of file
						// is allowed and treated as a line comment.
						allowHashBang: false,
						// When `locations` is on, `loc` properties holding objects with
						// `start` and `end` properties in `{line, column}` form (with
						// line being 1-based and column 0-based) will be attached to the
						// nodes.
						locations: false,
						// A function can be passed as `onToken` option, which will
						// cause Acorn to call that function with object in the same
						// format as tokens returned from `tokenizer().getToken()`. Note
						// that you are not allowed to call the parser from the
						// callback—that will corrupt its internal state.
						onToken: null,
						// A function can be passed as `onComment` option, which will
						// cause Acorn to call that function with `(block, text, start,
						// end)` parameters whenever a comment is skipped. `block` is a
						// boolean indicating whether this is a block (`/* */`) comment,
						// `text` is the content of the comment, and `start` and `end` are
						// character offsets that denote the start and end of the comment.
						// When the `locations` option is on, two more parameters are
						// passed, the full `{line, column}` locations of the start and
						// end of the comments. Note that you are not allowed to call the
						// parser from the callback—that will corrupt its internal state.
						onComment: null,
						// Nodes have their start and end characters offsets recorded in
						// `start` and `end` properties (directly on the node, rather than
						// the `loc` object, which holds line/column data. To also add a
						// [semi-standardized][range] `range` property holding a `[start,
						// end]` array with the same numbers, set the `ranges` option to
						// `true`.
						//
						// [range]: https://bugzilla.mozilla.org/show_bug.cgi?id=745678
						ranges: false,
						// It is possible to parse multiple files into a single AST by
						// passing the tree produced by parsing the first file as
						// `program` option in subsequent parses. This will add the
						// toplevel forms of the parsed file to the `Program` (top) node
						// of an existing parse tree.
						program: null,
						// When `locations` is on, you can pass this to record the source
						// file in every node's `loc` object.
						sourceFile: null,
						// This value, if given, is stored in every node, whether
						// `locations` is on or off.
						directSourceFile: null,
						// When enabled, parenthesized expressions are represented by
						// (non-standard) ParenthesizedExpression nodes
						preserveParens: false,
					};

					// Interpret and default an options object

					function getOptions(opts) {
						var options = {};

						for (var opt in defaultOptions) {
							options[opt] =
								opts && has(opts, opt)
									? opts[opt]
									: defaultOptions[opt];
						}

						if (options.ecmaVersion >= 2015) {
							options.ecmaVersion -= 2009;
						}

						if (options.allowReserved == null) {
							options.allowReserved = options.ecmaVersion < 5;
						}

						if (isArray(options.onToken)) {
							var tokens = options.onToken;
							options.onToken = function (token) {
								return tokens.push(token);
							};
						}
						if (isArray(options.onComment)) {
							options.onComment = pushComment(
								options,
								options.onComment
							);
						}

						return options;
					}

					function pushComment(options, array) {
						return function (
							block,
							text,
							start,
							end,
							startLoc,
							endLoc
						) {
							var comment = {
								type: block ? 'Block' : 'Line',
								value: text,
								start: start,
								end: end,
							};
							if (options.locations) {
								comment.loc = new SourceLocation(
									this,
									startLoc,
									endLoc
								);
							}
							if (options.ranges) {
								comment.range = [start, end];
							}
							array.push(comment);
						};
					}

					// Each scope gets a bitset that may contain these flags
					var SCOPE_TOP = 1,
						SCOPE_FUNCTION = 2,
						SCOPE_VAR = SCOPE_TOP | SCOPE_FUNCTION,
						SCOPE_ASYNC = 4,
						SCOPE_GENERATOR = 8,
						SCOPE_ARROW = 16,
						SCOPE_SIMPLE_CATCH = 32,
						SCOPE_SUPER = 64,
						SCOPE_DIRECT_SUPER = 128;

					function functionFlags(async, generator) {
						return (
							SCOPE_FUNCTION |
							(async ? SCOPE_ASYNC : 0) |
							(generator ? SCOPE_GENERATOR : 0)
						);
					}

					// Used in checkLVal and declareName to determine the type of a binding
					var BIND_NONE = 0, // Not a binding
						BIND_VAR = 1, // Var-style binding
						BIND_LEXICAL = 2, // Let- or const-style binding
						BIND_FUNCTION = 3, // Function declaration
						BIND_SIMPLE_CATCH = 4, // Simple (identifier pattern) catch binding
						BIND_OUTSIDE = 5; // Special case for function names as bound inside the function

					var Parser = function Parser(options, input, startPos) {
						this.options = options = getOptions(options);
						this.sourceFile = options.sourceFile;
						this.keywords = wordsRegexp(
							keywords[
								options.ecmaVersion >= 6
									? 6
									: options.sourceType === 'module'
										? '5module'
										: 5
							]
						);
						var reserved = '';
						if (options.allowReserved !== true) {
							for (var v = options.ecmaVersion; ; v--) {
								if ((reserved = reservedWords[v])) {
									break;
								}
							}
							if (options.sourceType === 'module') {
								reserved += ' await';
							}
						}
						this.reservedWords = wordsRegexp(reserved);
						var reservedStrict =
							(reserved ? reserved + ' ' : '') +
							reservedWords.strict;
						this.reservedWordsStrict = wordsRegexp(reservedStrict);
						this.reservedWordsStrictBind = wordsRegexp(
							reservedStrict + ' ' + reservedWords.strictBind
						);
						this.input = String(input);

						// Used to signal to callers of `readWord1` whether the word
						// contained any escape sequences. This is needed because words with
						// escape sequences must not be interpreted as keywords.
						this.containsEsc = false;

						// Set up token state

						// The current position of the tokenizer in the input.
						if (startPos) {
							this.pos = startPos;
							this.lineStart =
								this.input.lastIndexOf('\n', startPos - 1) + 1;
							this.curLine = this.input
								.slice(0, this.lineStart)
								.split(lineBreak).length;
						} else {
							this.pos = this.lineStart = 0;
							this.curLine = 1;
						}

						// Properties of the current token:
						// Its type
						this.type = types.eof;
						// For tokens that include more information than their type, the value
						this.value = null;
						// Its start and end offset
						this.start = this.end = this.pos;
						// And, if locations are used, the {line, column} object
						// corresponding to those offsets
						this.startLoc = this.endLoc = this.curPosition();

						// Position information for the previous token
						this.lastTokEndLoc = this.lastTokStartLoc = null;
						this.lastTokStart = this.lastTokEnd = this.pos;

						// The context stack is used to superficially track syntactic
						// context to predict whether a regular expression is allowed in a
						// given position.
						this.context = this.initialContext();
						this.exprAllowed = true;

						// Figure out if it's a module code.
						this.inModule = options.sourceType === 'module';
						this.strict =
							this.inModule || this.strictDirective(this.pos);

						// Used to signify the start of a potential arrow function
						this.potentialArrowAt = -1;

						// Positions to delayed-check that yield/await does not exist in default parameters.
						this.yieldPos = this.awaitPos = this.awaitIdentPos = 0;
						// Labels in scope.
						this.labels = [];
						// Thus-far undefined exports.
						this.undefinedExports = {};

						// If enabled, skip leading hashbang line.
						if (
							this.pos === 0 &&
							options.allowHashBang &&
							this.input.slice(0, 2) === '#!'
						) {
							this.skipLineComment(2);
						}

						// Scope tracking for duplicate variable names (see scope.js)
						this.scopeStack = [];
						this.enterScope(SCOPE_TOP);

						// For RegExp validation
						this.regexpState = null;
					};

					var prototypeAccessors = {
						inFunction: { configurable: true },
						inGenerator: { configurable: true },
						inAsync: { configurable: true },
						allowSuper: { configurable: true },
						allowDirectSuper: { configurable: true },
						treatFunctionsAsVar: { configurable: true },
					};

					Parser.prototype.parse = function parse() {
						var node = this.options.program || this.startNode();
						this.nextToken();
						return this.parseTopLevel(node);
					};

					prototypeAccessors.inFunction.get = function () {
						return (
							(this.currentVarScope().flags & SCOPE_FUNCTION) > 0
						);
					};
					prototypeAccessors.inGenerator.get = function () {
						return (
							(this.currentVarScope().flags & SCOPE_GENERATOR) > 0
						);
					};
					prototypeAccessors.inAsync.get = function () {
						return (this.currentVarScope().flags & SCOPE_ASYNC) > 0;
					};
					prototypeAccessors.allowSuper.get = function () {
						return (
							(this.currentThisScope().flags & SCOPE_SUPER) > 0
						);
					};
					prototypeAccessors.allowDirectSuper.get = function () {
						return (
							(this.currentThisScope().flags &
								SCOPE_DIRECT_SUPER) >
							0
						);
					};
					prototypeAccessors.treatFunctionsAsVar.get = function () {
						return this.treatFunctionsAsVarInScope(
							this.currentScope()
						);
					};

					// Switch to a getter for 7.0.0.
					Parser.prototype.inNonArrowFunction =
						function inNonArrowFunction() {
							return (
								(this.currentThisScope().flags &
									SCOPE_FUNCTION) >
								0
							);
						};

					Parser.extend = function extend() {
						var plugins = [],
							len = arguments.length;
						while (len--) plugins[len] = arguments[len];

						var cls = this;
						for (var i = 0; i < plugins.length; i++) {
							cls = plugins[i](cls);
						}
						return cls;
					};

					Parser.parse = function parse(input, options) {
						return new this(options, input).parse();
					};

					Parser.parseExpressionAt = function parseExpressionAt(
						input,
						pos,
						options
					) {
						var parser = new this(options, input, pos);
						parser.nextToken();
						return parser.parseExpression();
					};

					Parser.tokenizer = function tokenizer(input, options) {
						return new this(options, input);
					};

					Object.defineProperties(
						Parser.prototype,
						prototypeAccessors
					);

					var pp = Parser.prototype;

					// ## Parser utilities

					var literal =
						/^(?:'((?:\\.|[^'\\])*?)'|"((?:\\.|[^"\\])*?)")/;
					pp.strictDirective = function (start) {
						for (;;) {
							// Try to find string literal.
							skipWhiteSpace.lastIndex = start;
							start += skipWhiteSpace.exec(this.input)[0].length;
							var match = literal.exec(this.input.slice(start));
							if (!match) {
								return false;
							}
							if ((match[1] || match[2]) === 'use strict') {
								return true;
							}
							start += match[0].length;

							// Skip semicolon, if any.
							skipWhiteSpace.lastIndex = start;
							start += skipWhiteSpace.exec(this.input)[0].length;
							if (this.input[start] === ';') {
								start++;
							}
						}
					};

					// Predicate that tests whether the next token is of the given
					// type, and if yes, consumes it as a side effect.

					pp.eat = function (type) {
						if (this.type === type) {
							this.next();
							return true;
						} else {
							return false;
						}
					};

					// Tests whether parsed token is a contextual keyword.

					pp.isContextual = function (name) {
						return (
							this.type === types.name &&
							this.value === name &&
							!this.containsEsc
						);
					};

					// Consumes contextual keyword if possible.

					pp.eatContextual = function (name) {
						if (!this.isContextual(name)) {
							return false;
						}
						this.next();
						return true;
					};

					// Asserts that following token is given contextual keyword.

					pp.expectContextual = function (name) {
						if (!this.eatContextual(name)) {
							this.unexpected();
						}
					};

					// Test whether a semicolon can be inserted at the current position.

					pp.canInsertSemicolon = function () {
						return (
							this.type === types.eof ||
							this.type === types.braceR ||
							lineBreak.test(
								this.input.slice(this.lastTokEnd, this.start)
							)
						);
					};

					pp.insertSemicolon = function () {
						if (this.canInsertSemicolon()) {
							if (this.options.onInsertedSemicolon) {
								this.options.onInsertedSemicolon(
									this.lastTokEnd,
									this.lastTokEndLoc
								);
							}
							return true;
						}
					};

					// Consume a semicolon, or, failing that, see if we are allowed to
					// pretend that there is a semicolon at this position.

					pp.semicolon = function () {
						if (!this.eat(types.semi) && !this.insertSemicolon()) {
							this.unexpected();
						}
					};

					pp.afterTrailingComma = function (tokType, notNext) {
						if (this.type === tokType) {
							if (this.options.onTrailingComma) {
								this.options.onTrailingComma(
									this.lastTokStart,
									this.lastTokStartLoc
								);
							}
							if (!notNext) {
								this.next();
							}
							return true;
						}
					};

					// Expect a token of a given type. If found, consume it, otherwise,
					// raise an unexpected token error.

					pp.expect = function (type) {
						this.eat(type) || this.unexpected();
					};

					// Raise an unexpected token error.

					pp.unexpected = function (pos) {
						this.raise(
							pos != null ? pos : this.start,
							'Unexpected token'
						);
					};

					function DestructuringErrors() {
						this.shorthandAssign =
							this.trailingComma =
							this.parenthesizedAssign =
							this.parenthesizedBind =
							this.doubleProto =
								-1;
					}

					pp.checkPatternErrors = function (
						refDestructuringErrors,
						isAssign
					) {
						if (!refDestructuringErrors) {
							return;
						}
						if (refDestructuringErrors.trailingComma > -1) {
							this.raiseRecoverable(
								refDestructuringErrors.trailingComma,
								'Comma is not permitted after the rest element'
							);
						}
						var parens = isAssign
							? refDestructuringErrors.parenthesizedAssign
							: refDestructuringErrors.parenthesizedBind;
						if (parens > -1) {
							this.raiseRecoverable(
								parens,
								'Parenthesized pattern'
							);
						}
					};

					pp.checkExpressionErrors = function (
						refDestructuringErrors,
						andThrow
					) {
						if (!refDestructuringErrors) {
							return false;
						}
						var shorthandAssign =
							refDestructuringErrors.shorthandAssign;
						var doubleProto = refDestructuringErrors.doubleProto;
						if (!andThrow) {
							return shorthandAssign >= 0 || doubleProto >= 0;
						}
						if (shorthandAssign >= 0) {
							this.raise(
								shorthandAssign,
								'Shorthand property assignments are valid only in destructuring patterns'
							);
						}
						if (doubleProto >= 0) {
							this.raiseRecoverable(
								doubleProto,
								'Redefinition of __proto__ property'
							);
						}
					};

					pp.checkYieldAwaitInDefaultParams = function () {
						if (
							this.yieldPos &&
							(!this.awaitPos || this.yieldPos < this.awaitPos)
						) {
							this.raise(
								this.yieldPos,
								'Yield expression cannot be a default value'
							);
						}
						if (this.awaitPos) {
							this.raise(
								this.awaitPos,
								'Await expression cannot be a default value'
							);
						}
					};

					pp.isSimpleAssignTarget = function (expr) {
						if (expr.type === 'ParenthesizedExpression') {
							return this.isSimpleAssignTarget(expr.expression);
						}
						return (
							expr.type === 'Identifier' ||
							expr.type === 'MemberExpression'
						);
					};

					var pp$1 = Parser.prototype;

					// ### Statement parsing

					// Parse a program. Initializes the parser, reads any number of
					// statements, and wraps them in a Program node.  Optionally takes a
					// `program` argument.  If present, the statements will be appended
					// to its body instead of creating a new node.

					pp$1.parseTopLevel = function (node) {
						var exports = {};
						if (!node.body) {
							node.body = [];
						}
						while (this.type !== types.eof) {
							var stmt = this.parseStatement(null, true, exports);
							node.body.push(stmt);
						}
						if (this.inModule) {
							for (
								var i = 0,
									list = Object.keys(this.undefinedExports);
								i < list.length;
								i += 1
							) {
								var name = list[i];

								this.raiseRecoverable(
									this.undefinedExports[name].start,
									"Export '" + name + "' is not defined"
								);
							}
						}
						this.adaptDirectivePrologue(node.body);
						this.next();
						node.sourceType = this.options.sourceType;
						return this.finishNode(node, 'Program');
					};

					var loopLabel = { kind: 'loop' },
						switchLabel = { kind: 'switch' };

					pp$1.isLet = function (context) {
						if (
							this.options.ecmaVersion < 6 ||
							!this.isContextual('let')
						) {
							return false;
						}
						skipWhiteSpace.lastIndex = this.pos;
						var skip = skipWhiteSpace.exec(this.input);
						var next = this.pos + skip[0].length,
							nextCh = this.input.charCodeAt(next);
						// For ambiguous cases, determine if a LexicalDeclaration (or only a
						// Statement) is allowed here. If context is not empty then only a Statement
						// is allowed. However, `let [` is an explicit negative lookahead for
						// ExpressionStatement, so special-case it first.
						if (nextCh === 91) {
							return true;
						} // '['
						if (context) {
							return false;
						}

						if (nextCh === 123) {
							return true;
						} // '{'
						if (isIdentifierStart(nextCh, true)) {
							var pos = next + 1;
							while (
								isIdentifierChar(
									this.input.charCodeAt(pos),
									true
								)
							) {
								++pos;
							}
							var ident = this.input.slice(next, pos);
							if (!keywordRelationalOperator.test(ident)) {
								return true;
							}
						}
						return false;
					};

					// check 'async [no LineTerminator here] function'
					// - 'async /*foo*/ function' is OK.
					// - 'async /*\n*/ function' is invalid.
					pp$1.isAsyncFunction = function () {
						if (
							this.options.ecmaVersion < 8 ||
							!this.isContextual('async')
						) {
							return false;
						}

						skipWhiteSpace.lastIndex = this.pos;
						var skip = skipWhiteSpace.exec(this.input);
						var next = this.pos + skip[0].length;
						return (
							!lineBreak.test(this.input.slice(this.pos, next)) &&
							this.input.slice(next, next + 8) === 'function' &&
							(next + 8 === this.input.length ||
								!isIdentifierChar(this.input.charAt(next + 8)))
						);
					};

					// Parse a single statement.
					//
					// If expecting a statement and finding a slash operator, parse a
					// regular expression literal. This is to handle cases like
					// `if (foo) /blah/.exec(foo)`, where looking at the previous token
					// does not help.

					pp$1.parseStatement = function (
						context,
						topLevel,
						exports
					) {
						var starttype = this.type,
							node = this.startNode(),
							kind;

						if (this.isLet(context)) {
							starttype = types._var;
							kind = 'let';
						}

						// Most types of statements are recognized by the keyword they
						// start with. Many are trivial to parse, some require a bit of
						// complexity.

						switch (starttype) {
							case types._break:
							case types._continue:
								return this.parseBreakContinueStatement(
									node,
									starttype.keyword
								);
							case types._debugger:
								return this.parseDebuggerStatement(node);
							case types._do:
								return this.parseDoStatement(node);
							case types._for:
								return this.parseForStatement(node);
							case types._function:
								// Function as sole body of either an if statement or a labeled statement
								// works, but not when it is part of a labeled statement that is the sole
								// body of an if statement.
								if (
									context &&
									(this.strict ||
										(context !== 'if' &&
											context !== 'label')) &&
									this.options.ecmaVersion >= 6
								) {
									this.unexpected();
								}
								return this.parseFunctionStatement(
									node,
									false,
									!context
								);
							case types._class:
								if (context) {
									this.unexpected();
								}
								return this.parseClass(node, true);
							case types._if:
								return this.parseIfStatement(node);
							case types._return:
								return this.parseReturnStatement(node);
							case types._switch:
								return this.parseSwitchStatement(node);
							case types._throw:
								return this.parseThrowStatement(node);
							case types._try:
								return this.parseTryStatement(node);
							case types._const:
							case types._var:
								kind = kind || this.value;
								if (context && kind !== 'var') {
									this.unexpected();
								}
								return this.parseVarStatement(node, kind);
							case types._while:
								return this.parseWhileStatement(node);
							case types._with:
								return this.parseWithStatement(node);
							case types.braceL:
								return this.parseBlock(true, node);
							case types.semi:
								return this.parseEmptyStatement(node);
							case types._export:
							case types._import:
								if (
									this.options.ecmaVersion > 10 &&
									starttype === types._import
								) {
									skipWhiteSpace.lastIndex = this.pos;
									var skip = skipWhiteSpace.exec(this.input);
									var next = this.pos + skip[0].length,
										nextCh = this.input.charCodeAt(next);
									if (nextCh === 40) {
										// '('
										return this.parseExpressionStatement(
											node,
											this.parseExpression()
										);
									}
								}

								if (!this.options.allowImportExportEverywhere) {
									if (!topLevel) {
										this.raise(
											this.start,
											"'import' and 'export' may only appear at the top level"
										);
									}
									if (!this.inModule) {
										this.raise(
											this.start,
											"'import' and 'export' may appear only with 'sourceType: module'"
										);
									}
								}
								return starttype === types._import
									? this.parseImport(node)
									: this.parseExport(node, exports);

							// If the statement does not start with a statement keyword or a
							// brace, it's an ExpressionStatement or LabeledStatement. We
							// simply start parsing an expression, and afterwards, if the
							// next token is a colon and the expression was a simple
							// Identifier node, we switch to interpreting it as a label.
							default:
								if (this.isAsyncFunction()) {
									if (context) {
										this.unexpected();
									}
									this.next();
									return this.parseFunctionStatement(
										node,
										true,
										!context
									);
								}

								var maybeName = this.value,
									expr = this.parseExpression();
								if (
									starttype === types.name &&
									expr.type === 'Identifier' &&
									this.eat(types.colon)
								) {
									return this.parseLabeledStatement(
										node,
										maybeName,
										expr,
										context
									);
								} else {
									return this.parseExpressionStatement(
										node,
										expr
									);
								}
						}
					};

					pp$1.parseBreakContinueStatement = function (
						node,
						keyword
					) {
						var isBreak = keyword === 'break';
						this.next();
						if (this.eat(types.semi) || this.insertSemicolon()) {
							node.label = null;
						} else if (this.type !== types.name) {
							this.unexpected();
						} else {
							node.label = this.parseIdent();
							this.semicolon();
						}

						// Verify that there is an actual destination to break or
						// continue to.
						var i = 0;
						for (; i < this.labels.length; ++i) {
							var lab = this.labels[i];
							if (
								node.label == null ||
								lab.name === node.label.name
							) {
								if (
									lab.kind != null &&
									(isBreak || lab.kind === 'loop')
								) {
									break;
								}
								if (node.label && isBreak) {
									break;
								}
							}
						}
						if (i === this.labels.length) {
							this.raise(node.start, 'Unsyntactic ' + keyword);
						}
						return this.finishNode(
							node,
							isBreak ? 'BreakStatement' : 'ContinueStatement'
						);
					};

					pp$1.parseDebuggerStatement = function (node) {
						this.next();
						this.semicolon();
						return this.finishNode(node, 'DebuggerStatement');
					};

					pp$1.parseDoStatement = function (node) {
						this.next();
						this.labels.push(loopLabel);
						node.body = this.parseStatement('do');
						this.labels.pop();
						this.expect(types._while);
						node.test = this.parseParenExpression();
						if (this.options.ecmaVersion >= 6) {
							this.eat(types.semi);
						} else {
							this.semicolon();
						}
						return this.finishNode(node, 'DoWhileStatement');
					};

					// Disambiguating between a `for` and a `for`/`in` or `for`/`of`
					// loop is non-trivial. Basically, we have to parse the init `var`
					// statement or expression, disallowing the `in` operator (see
					// the second parameter to `parseExpression`), and then check
					// whether the next token is `in` or `of`. When there is no init
					// part (semicolon immediately after the opening parenthesis), it
					// is a regular `for` loop.

					pp$1.parseForStatement = function (node) {
						this.next();
						var awaitAt =
							this.options.ecmaVersion >= 9 &&
							(this.inAsync ||
								(!this.inFunction &&
									this.options.allowAwaitOutsideFunction)) &&
							this.eatContextual('await')
								? this.lastTokStart
								: -1;
						this.labels.push(loopLabel);
						this.enterScope(0);
						this.expect(types.parenL);
						if (this.type === types.semi) {
							if (awaitAt > -1) {
								this.unexpected(awaitAt);
							}
							return this.parseFor(node, null);
						}
						var isLet = this.isLet();
						if (
							this.type === types._var ||
							this.type === types._const ||
							isLet
						) {
							var init$1 = this.startNode(),
								kind = isLet ? 'let' : this.value;
							this.next();
							this.parseVar(init$1, true, kind);
							this.finishNode(init$1, 'VariableDeclaration');
							if (
								(this.type === types._in ||
									(this.options.ecmaVersion >= 6 &&
										this.isContextual('of'))) &&
								init$1.declarations.length === 1
							) {
								if (this.options.ecmaVersion >= 9) {
									if (this.type === types._in) {
										if (awaitAt > -1) {
											this.unexpected(awaitAt);
										}
									} else {
										node.await = awaitAt > -1;
									}
								}
								return this.parseForIn(node, init$1);
							}
							if (awaitAt > -1) {
								this.unexpected(awaitAt);
							}
							return this.parseFor(node, init$1);
						}
						var refDestructuringErrors = new DestructuringErrors();
						var init = this.parseExpression(
							true,
							refDestructuringErrors
						);
						if (
							this.type === types._in ||
							(this.options.ecmaVersion >= 6 &&
								this.isContextual('of'))
						) {
							if (this.options.ecmaVersion >= 9) {
								if (this.type === types._in) {
									if (awaitAt > -1) {
										this.unexpected(awaitAt);
									}
								} else {
									node.await = awaitAt > -1;
								}
							}
							this.toAssignable(
								init,
								false,
								refDestructuringErrors
							);
							this.checkLVal(init);
							return this.parseForIn(node, init);
						} else {
							this.checkExpressionErrors(
								refDestructuringErrors,
								true
							);
						}
						if (awaitAt > -1) {
							this.unexpected(awaitAt);
						}
						return this.parseFor(node, init);
					};

					pp$1.parseFunctionStatement = function (
						node,
						isAsync,
						declarationPosition
					) {
						this.next();
						return this.parseFunction(
							node,
							FUNC_STATEMENT |
								(declarationPosition
									? 0
									: FUNC_HANGING_STATEMENT),
							false,
							isAsync
						);
					};

					pp$1.parseIfStatement = function (node) {
						this.next();
						node.test = this.parseParenExpression();
						// allow function declarations in branches, but only in non-strict mode
						node.consequent = this.parseStatement('if');
						node.alternate = this.eat(types._else)
							? this.parseStatement('if')
							: null;
						return this.finishNode(node, 'IfStatement');
					};

					pp$1.parseReturnStatement = function (node) {
						if (
							!this.inFunction &&
							!this.options.allowReturnOutsideFunction
						) {
							this.raise(
								this.start,
								"'return' outside of function"
							);
						}
						this.next();

						// In `return` (and `break`/`continue`), the keywords with
						// optional arguments, we eagerly look for a semicolon or the
						// possibility to insert one.

						if (this.eat(types.semi) || this.insertSemicolon()) {
							node.argument = null;
						} else {
							node.argument = this.parseExpression();
							this.semicolon();
						}
						return this.finishNode(node, 'ReturnStatement');
					};

					pp$1.parseSwitchStatement = function (node) {
						this.next();
						node.discriminant = this.parseParenExpression();
						node.cases = [];
						this.expect(types.braceL);
						this.labels.push(switchLabel);
						this.enterScope(0);

						// Statements under must be grouped (by label) in SwitchCase
						// nodes. `cur` is used to keep the node that we are currently
						// adding statements to.

						var cur;
						for (
							var sawDefault = false;
							this.type !== types.braceR;

						) {
							if (
								this.type === types._case ||
								this.type === types._default
							) {
								var isCase = this.type === types._case;
								if (cur) {
									this.finishNode(cur, 'SwitchCase');
								}
								node.cases.push((cur = this.startNode()));
								cur.consequent = [];
								this.next();
								if (isCase) {
									cur.test = this.parseExpression();
								} else {
									if (sawDefault) {
										this.raiseRecoverable(
											this.lastTokStart,
											'Multiple default clauses'
										);
									}
									sawDefault = true;
									cur.test = null;
								}
								this.expect(types.colon);
							} else {
								if (!cur) {
									this.unexpected();
								}
								cur.consequent.push(this.parseStatement(null));
							}
						}
						this.exitScope();
						if (cur) {
							this.finishNode(cur, 'SwitchCase');
						}
						this.next(); // Closing brace
						this.labels.pop();
						return this.finishNode(node, 'SwitchStatement');
					};

					pp$1.parseThrowStatement = function (node) {
						this.next();
						if (
							lineBreak.test(
								this.input.slice(this.lastTokEnd, this.start)
							)
						) {
							this.raise(
								this.lastTokEnd,
								'Illegal newline after throw'
							);
						}
						node.argument = this.parseExpression();
						this.semicolon();
						return this.finishNode(node, 'ThrowStatement');
					};

					// Reused empty array added for node fields that are always empty.

					var empty = [];

					pp$1.parseTryStatement = function (node) {
						this.next();
						node.block = this.parseBlock();
						node.handler = null;
						if (this.type === types._catch) {
							var clause = this.startNode();
							this.next();
							if (this.eat(types.parenL)) {
								clause.param = this.parseBindingAtom();
								var simple = clause.param.type === 'Identifier';
								this.enterScope(
									simple ? SCOPE_SIMPLE_CATCH : 0
								);
								this.checkLVal(
									clause.param,
									simple ? BIND_SIMPLE_CATCH : BIND_LEXICAL
								);
								this.expect(types.parenR);
							} else {
								if (this.options.ecmaVersion < 10) {
									this.unexpected();
								}
								clause.param = null;
								this.enterScope(0);
							}
							clause.body = this.parseBlock(false);
							this.exitScope();
							node.handler = this.finishNode(
								clause,
								'CatchClause'
							);
						}
						node.finalizer = this.eat(types._finally)
							? this.parseBlock()
							: null;
						if (!node.handler && !node.finalizer) {
							this.raise(
								node.start,
								'Missing catch or finally clause'
							);
						}
						return this.finishNode(node, 'TryStatement');
					};

					pp$1.parseVarStatement = function (node, kind) {
						this.next();
						this.parseVar(node, false, kind);
						this.semicolon();
						return this.finishNode(node, 'VariableDeclaration');
					};

					pp$1.parseWhileStatement = function (node) {
						this.next();
						node.test = this.parseParenExpression();
						this.labels.push(loopLabel);
						node.body = this.parseStatement('while');
						this.labels.pop();
						return this.finishNode(node, 'WhileStatement');
					};

					pp$1.parseWithStatement = function (node) {
						if (this.strict) {
							this.raise(this.start, "'with' in strict mode");
						}
						this.next();
						node.object = this.parseParenExpression();
						node.body = this.parseStatement('with');
						return this.finishNode(node, 'WithStatement');
					};

					pp$1.parseEmptyStatement = function (node) {
						this.next();
						return this.finishNode(node, 'EmptyStatement');
					};

					pp$1.parseLabeledStatement = function (
						node,
						maybeName,
						expr,
						context
					) {
						for (
							var i$1 = 0, list = this.labels;
							i$1 < list.length;
							i$1 += 1
						) {
							var label = list[i$1];

							if (label.name === maybeName) {
								this.raise(
									expr.start,
									"Label '" +
										maybeName +
										"' is already declared"
								);
							}
						}
						var kind = this.type.isLoop
							? 'loop'
							: this.type === types._switch
								? 'switch'
								: null;
						for (var i = this.labels.length - 1; i >= 0; i--) {
							var label$1 = this.labels[i];
							if (label$1.statementStart === node.start) {
								// Update information about previous labels on this node
								label$1.statementStart = this.start;
								label$1.kind = kind;
							} else {
								break;
							}
						}
						this.labels.push({
							name: maybeName,
							kind: kind,
							statementStart: this.start,
						});
						node.body = this.parseStatement(
							context
								? context.indexOf('label') === -1
									? context + 'label'
									: context
								: 'label'
						);
						this.labels.pop();
						node.label = expr;
						return this.finishNode(node, 'LabeledStatement');
					};

					pp$1.parseExpressionStatement = function (node, expr) {
						node.expression = expr;
						this.semicolon();
						return this.finishNode(node, 'ExpressionStatement');
					};

					// Parse a semicolon-enclosed block of statements, handling `"use
					// strict"` declarations when `allowStrict` is true (used for
					// function bodies).

					pp$1.parseBlock = function (createNewLexicalScope, node) {
						if (createNewLexicalScope === void 0)
							createNewLexicalScope = true;
						if (node === void 0) node = this.startNode();

						node.body = [];
						this.expect(types.braceL);
						if (createNewLexicalScope) {
							this.enterScope(0);
						}
						while (!this.eat(types.braceR)) {
							var stmt = this.parseStatement(null);
							node.body.push(stmt);
						}
						if (createNewLexicalScope) {
							this.exitScope();
						}
						return this.finishNode(node, 'BlockStatement');
					};

					// Parse a regular `for` loop. The disambiguation code in
					// `parseStatement` will already have parsed the init statement or
					// expression.

					pp$1.parseFor = function (node, init) {
						node.init = init;
						this.expect(types.semi);
						node.test =
							this.type === types.semi
								? null
								: this.parseExpression();
						this.expect(types.semi);
						node.update =
							this.type === types.parenR
								? null
								: this.parseExpression();
						this.expect(types.parenR);
						node.body = this.parseStatement('for');
						this.exitScope();
						this.labels.pop();
						return this.finishNode(node, 'ForStatement');
					};

					// Parse a `for`/`in` and `for`/`of` loop, which are almost
					// same from parser's perspective.

					pp$1.parseForIn = function (node, init) {
						var isForIn = this.type === types._in;
						this.next();

						if (
							init.type === 'VariableDeclaration' &&
							init.declarations[0].init != null &&
							(!isForIn ||
								this.options.ecmaVersion < 8 ||
								this.strict ||
								init.kind !== 'var' ||
								init.declarations[0].id.type !== 'Identifier')
						) {
							this.raise(
								init.start,
								(isForIn ? 'for-in' : 'for-of') +
									' loop variable declaration may not have an initializer'
							);
						} else if (init.type === 'AssignmentPattern') {
							this.raise(
								init.start,
								'Invalid left-hand side in for-loop'
							);
						}
						node.left = init;
						node.right = isForIn
							? this.parseExpression()
							: this.parseMaybeAssign();
						this.expect(types.parenR);
						node.body = this.parseStatement('for');
						this.exitScope();
						this.labels.pop();
						return this.finishNode(
							node,
							isForIn ? 'ForInStatement' : 'ForOfStatement'
						);
					};

					// Parse a list of variable declarations.

					pp$1.parseVar = function (node, isFor, kind) {
						node.declarations = [];
						node.kind = kind;
						for (;;) {
							var decl = this.startNode();
							this.parseVarId(decl, kind);
							if (this.eat(types.eq)) {
								decl.init = this.parseMaybeAssign(isFor);
							} else if (
								kind === 'const' &&
								!(
									this.type === types._in ||
									(this.options.ecmaVersion >= 6 &&
										this.isContextual('of'))
								)
							) {
								this.unexpected();
							} else if (
								decl.id.type !== 'Identifier' &&
								!(
									isFor &&
									(this.type === types._in ||
										this.isContextual('of'))
								)
							) {
								this.raise(
									this.lastTokEnd,
									'Complex binding patterns require an initialization value'
								);
							} else {
								decl.init = null;
							}
							node.declarations.push(
								this.finishNode(decl, 'VariableDeclarator')
							);
							if (!this.eat(types.comma)) {
								break;
							}
						}
						return node;
					};

					pp$1.parseVarId = function (decl, kind) {
						decl.id = this.parseBindingAtom();
						this.checkLVal(
							decl.id,
							kind === 'var' ? BIND_VAR : BIND_LEXICAL,
							false
						);
					};

					var FUNC_STATEMENT = 1,
						FUNC_HANGING_STATEMENT = 2,
						FUNC_NULLABLE_ID = 4;

					// Parse a function declaration or literal (depending on the
					// `statement & FUNC_STATEMENT`).

					// Remove `allowExpressionBody` for 7.0.0, as it is only called with false
					pp$1.parseFunction = function (
						node,
						statement,
						allowExpressionBody,
						isAsync
					) {
						this.initFunction(node);
						if (
							this.options.ecmaVersion >= 9 ||
							(this.options.ecmaVersion >= 6 && !isAsync)
						) {
							if (
								this.type === types.star &&
								statement & FUNC_HANGING_STATEMENT
							) {
								this.unexpected();
							}
							node.generator = this.eat(types.star);
						}
						if (this.options.ecmaVersion >= 8) {
							node.async = !!isAsync;
						}

						if (statement & FUNC_STATEMENT) {
							node.id =
								statement & FUNC_NULLABLE_ID &&
								this.type !== types.name
									? null
									: this.parseIdent();
							if (
								node.id &&
								!(statement & FUNC_HANGING_STATEMENT)
							) {
								// If it is a regular function declaration in sloppy mode, then it is
								// subject to Annex B semantics (BIND_FUNCTION). Otherwise, the binding
								// mode depends on properties of the current scope (see
								// treatFunctionsAsVar).
								this.checkLVal(
									node.id,
									this.strict || node.generator || node.async
										? this.treatFunctionsAsVar
											? BIND_VAR
											: BIND_LEXICAL
										: BIND_FUNCTION
								);
							}
						}

						var oldYieldPos = this.yieldPos,
							oldAwaitPos = this.awaitPos,
							oldAwaitIdentPos = this.awaitIdentPos;
						this.yieldPos = 0;
						this.awaitPos = 0;
						this.awaitIdentPos = 0;
						this.enterScope(
							functionFlags(node.async, node.generator)
						);

						if (!(statement & FUNC_STATEMENT)) {
							node.id =
								this.type === types.name
									? this.parseIdent()
									: null;
						}

						this.parseFunctionParams(node);
						this.parseFunctionBody(
							node,
							allowExpressionBody,
							false
						);

						this.yieldPos = oldYieldPos;
						this.awaitPos = oldAwaitPos;
						this.awaitIdentPos = oldAwaitIdentPos;
						return this.finishNode(
							node,
							statement & FUNC_STATEMENT
								? 'FunctionDeclaration'
								: 'FunctionExpression'
						);
					};

					pp$1.parseFunctionParams = function (node) {
						this.expect(types.parenL);
						node.params = this.parseBindingList(
							types.parenR,
							false,
							this.options.ecmaVersion >= 8
						);
						this.checkYieldAwaitInDefaultParams();
					};

					// Parse a class declaration or literal (depending on the
					// `isStatement` parameter).

					pp$1.parseClass = function (node, isStatement) {
						this.next();

						// ecma-262 14.6 Class Definitions
						// A class definition is always strict mode code.
						var oldStrict = this.strict;
						this.strict = true;

						this.parseClassId(node, isStatement);
						this.parseClassSuper(node);
						var classBody = this.startNode();
						var hadConstructor = false;
						classBody.body = [];
						this.expect(types.braceL);
						while (!this.eat(types.braceR)) {
							var element = this.parseClassElement(
								node.superClass !== null
							);
							if (element) {
								classBody.body.push(element);
								if (
									element.type === 'MethodDefinition' &&
									element.kind === 'constructor'
								) {
									if (hadConstructor) {
										this.raise(
											element.start,
											'Duplicate constructor in the same class'
										);
									}
									hadConstructor = true;
								}
							}
						}
						node.body = this.finishNode(classBody, 'ClassBody');
						this.strict = oldStrict;
						return this.finishNode(
							node,
							isStatement ? 'ClassDeclaration' : 'ClassExpression'
						);
					};

					pp$1.parseClassElement = function (constructorAllowsSuper) {
						var this$1 = this;

						if (this.eat(types.semi)) {
							return null;
						}

						var method = this.startNode();
						var tryContextual = function (k, noLineBreak) {
							if (noLineBreak === void 0) noLineBreak = false;

							var start = this$1.start,
								startLoc = this$1.startLoc;
							if (!this$1.eatContextual(k)) {
								return false;
							}
							if (
								this$1.type !== types.parenL &&
								(!noLineBreak || !this$1.canInsertSemicolon())
							) {
								return true;
							}
							if (method.key) {
								this$1.unexpected();
							}
							method.computed = false;
							method.key = this$1.startNodeAt(start, startLoc);
							method.key.name = k;
							this$1.finishNode(method.key, 'Identifier');
							return false;
						};

						method.kind = 'method';
						method.static = tryContextual('static');
						var isGenerator = this.eat(types.star);
						var isAsync = false;
						if (!isGenerator) {
							if (
								this.options.ecmaVersion >= 8 &&
								tryContextual('async', true)
							) {
								isAsync = true;
								isGenerator =
									this.options.ecmaVersion >= 9 &&
									this.eat(types.star);
							} else if (tryContextual('get')) {
								method.kind = 'get';
							} else if (tryContextual('set')) {
								method.kind = 'set';
							}
						}
						if (!method.key) {
							this.parsePropertyName(method);
						}
						var key = method.key;
						var allowsDirectSuper = false;
						if (
							!method.computed &&
							!method.static &&
							((key.type === 'Identifier' &&
								key.name === 'constructor') ||
								(key.type === 'Literal' &&
									key.value === 'constructor'))
						) {
							if (method.kind !== 'method') {
								this.raise(
									key.start,
									"Constructor can't have get/set modifier"
								);
							}
							if (isGenerator) {
								this.raise(
									key.start,
									"Constructor can't be a generator"
								);
							}
							if (isAsync) {
								this.raise(
									key.start,
									"Constructor can't be an async method"
								);
							}
							method.kind = 'constructor';
							allowsDirectSuper = constructorAllowsSuper;
						} else if (
							method.static &&
							key.type === 'Identifier' &&
							key.name === 'prototype'
						) {
							this.raise(
								key.start,
								'Classes may not have a static property named prototype'
							);
						}
						this.parseClassMethod(
							method,
							isGenerator,
							isAsync,
							allowsDirectSuper
						);
						if (
							method.kind === 'get' &&
							method.value.params.length !== 0
						) {
							this.raiseRecoverable(
								method.value.start,
								'getter should have no params'
							);
						}
						if (
							method.kind === 'set' &&
							method.value.params.length !== 1
						) {
							this.raiseRecoverable(
								method.value.start,
								'setter should have exactly one param'
							);
						}
						if (
							method.kind === 'set' &&
							method.value.params[0].type === 'RestElement'
						) {
							this.raiseRecoverable(
								method.value.params[0].start,
								'Setter cannot use rest params'
							);
						}
						return method;
					};

					pp$1.parseClassMethod = function (
						method,
						isGenerator,
						isAsync,
						allowsDirectSuper
					) {
						method.value = this.parseMethod(
							isGenerator,
							isAsync,
							allowsDirectSuper
						);
						return this.finishNode(method, 'MethodDefinition');
					};

					pp$1.parseClassId = function (node, isStatement) {
						if (this.type === types.name) {
							node.id = this.parseIdent();
							if (isStatement) {
								this.checkLVal(node.id, BIND_LEXICAL, false);
							}
						} else {
							if (isStatement === true) {
								this.unexpected();
							}
							node.id = null;
						}
					};

					pp$1.parseClassSuper = function (node) {
						node.superClass = this.eat(types._extends)
							? this.parseExprSubscripts()
							: null;
					};

					// Parses module export declaration.

					pp$1.parseExport = function (node, exports) {
						this.next();
						// export * from '...'
						if (this.eat(types.star)) {
							this.expectContextual('from');
							if (this.type !== types.string) {
								this.unexpected();
							}
							node.source = this.parseExprAtom();
							this.semicolon();
							return this.finishNode(
								node,
								'ExportAllDeclaration'
							);
						}
						if (this.eat(types._default)) {
							// export default ...
							this.checkExport(
								exports,
								'default',
								this.lastTokStart
							);
							var isAsync;
							if (
								this.type === types._function ||
								(isAsync = this.isAsyncFunction())
							) {
								var fNode = this.startNode();
								this.next();
								if (isAsync) {
									this.next();
								}
								node.declaration = this.parseFunction(
									fNode,
									FUNC_STATEMENT | FUNC_NULLABLE_ID,
									false,
									isAsync
								);
							} else if (this.type === types._class) {
								var cNode = this.startNode();
								node.declaration = this.parseClass(
									cNode,
									'nullableID'
								);
							} else {
								node.declaration = this.parseMaybeAssign();
								this.semicolon();
							}
							return this.finishNode(
								node,
								'ExportDefaultDeclaration'
							);
						}
						// export var|const|let|function|class ...
						if (this.shouldParseExportStatement()) {
							node.declaration = this.parseStatement(null);
							if (
								node.declaration.type === 'VariableDeclaration'
							) {
								this.checkVariableExport(
									exports,
									node.declaration.declarations
								);
							} else {
								this.checkExport(
									exports,
									node.declaration.id.name,
									node.declaration.id.start
								);
							}
							node.specifiers = [];
							node.source = null;
						} else {
							// export { x, y as z } [from '...']
							node.declaration = null;
							node.specifiers =
								this.parseExportSpecifiers(exports);
							if (this.eatContextual('from')) {
								if (this.type !== types.string) {
									this.unexpected();
								}
								node.source = this.parseExprAtom();
							} else {
								for (
									var i = 0, list = node.specifiers;
									i < list.length;
									i += 1
								) {
									// check for keywords used as local names
									var spec = list[i];

									this.checkUnreserved(spec.local);
									// check if export is defined
									this.checkLocalExport(spec.local);
								}

								node.source = null;
							}
							this.semicolon();
						}
						return this.finishNode(node, 'ExportNamedDeclaration');
					};

					pp$1.checkExport = function (exports, name, pos) {
						if (!exports) {
							return;
						}
						if (has(exports, name)) {
							this.raiseRecoverable(
								pos,
								"Duplicate export '" + name + "'"
							);
						}
						exports[name] = true;
					};

					pp$1.checkPatternExport = function (exports, pat) {
						var type = pat.type;
						if (type === 'Identifier') {
							this.checkExport(exports, pat.name, pat.start);
						} else if (type === 'ObjectPattern') {
							for (
								var i = 0, list = pat.properties;
								i < list.length;
								i += 1
							) {
								var prop = list[i];

								this.checkPatternExport(exports, prop);
							}
						} else if (type === 'ArrayPattern') {
							for (
								var i$1 = 0, list$1 = pat.elements;
								i$1 < list$1.length;
								i$1 += 1
							) {
								var elt = list$1[i$1];

								if (elt) {
									this.checkPatternExport(exports, elt);
								}
							}
						} else if (type === 'Property') {
							this.checkPatternExport(exports, pat.value);
						} else if (type === 'AssignmentPattern') {
							this.checkPatternExport(exports, pat.left);
						} else if (type === 'RestElement') {
							this.checkPatternExport(exports, pat.argument);
						} else if (type === 'ParenthesizedExpression') {
							this.checkPatternExport(exports, pat.expression);
						}
					};

					pp$1.checkVariableExport = function (exports, decls) {
						if (!exports) {
							return;
						}
						for (var i = 0, list = decls; i < list.length; i += 1) {
							var decl = list[i];

							this.checkPatternExport(exports, decl.id);
						}
					};

					pp$1.shouldParseExportStatement = function () {
						return (
							this.type.keyword === 'var' ||
							this.type.keyword === 'const' ||
							this.type.keyword === 'class' ||
							this.type.keyword === 'function' ||
							this.isLet() ||
							this.isAsyncFunction()
						);
					};

					// Parses a comma-separated list of module exports.

					pp$1.parseExportSpecifiers = function (exports) {
						var nodes = [],
							first = true;
						// export { x, y as z } [from '...']
						this.expect(types.braceL);
						while (!this.eat(types.braceR)) {
							if (!first) {
								this.expect(types.comma);
								if (this.afterTrailingComma(types.braceR)) {
									break;
								}
							} else {
								first = false;
							}

							var node = this.startNode();
							node.local = this.parseIdent(true);
							node.exported = this.eatContextual('as')
								? this.parseIdent(true)
								: node.local;
							this.checkExport(
								exports,
								node.exported.name,
								node.exported.start
							);
							nodes.push(
								this.finishNode(node, 'ExportSpecifier')
							);
						}
						return nodes;
					};

					// Parses import declaration.

					pp$1.parseImport = function (node) {
						this.next();
						// import '...'
						if (this.type === types.string) {
							node.specifiers = empty;
							node.source = this.parseExprAtom();
						} else {
							node.specifiers = this.parseImportSpecifiers();
							this.expectContextual('from');
							node.source =
								this.type === types.string
									? this.parseExprAtom()
									: this.unexpected();
						}
						this.semicolon();
						return this.finishNode(node, 'ImportDeclaration');
					};

					// Parses a comma-separated list of module imports.

					pp$1.parseImportSpecifiers = function () {
						var nodes = [],
							first = true;
						if (this.type === types.name) {
							// import defaultObj, { x, y as z } from '...'
							var node = this.startNode();
							node.local = this.parseIdent();
							this.checkLVal(node.local, BIND_LEXICAL);
							nodes.push(
								this.finishNode(node, 'ImportDefaultSpecifier')
							);
							if (!this.eat(types.comma)) {
								return nodes;
							}
						}
						if (this.type === types.star) {
							var node$1 = this.startNode();
							this.next();
							this.expectContextual('as');
							node$1.local = this.parseIdent();
							this.checkLVal(node$1.local, BIND_LEXICAL);
							nodes.push(
								this.finishNode(
									node$1,
									'ImportNamespaceSpecifier'
								)
							);
							return nodes;
						}
						this.expect(types.braceL);
						while (!this.eat(types.braceR)) {
							if (!first) {
								this.expect(types.comma);
								if (this.afterTrailingComma(types.braceR)) {
									break;
								}
							} else {
								first = false;
							}

							var node$2 = this.startNode();
							node$2.imported = this.parseIdent(true);
							if (this.eatContextual('as')) {
								node$2.local = this.parseIdent();
							} else {
								this.checkUnreserved(node$2.imported);
								node$2.local = node$2.imported;
							}
							this.checkLVal(node$2.local, BIND_LEXICAL);
							nodes.push(
								this.finishNode(node$2, 'ImportSpecifier')
							);
						}
						return nodes;
					};

					// Set `ExpressionStatement#directive` property for directive prologues.
					pp$1.adaptDirectivePrologue = function (statements) {
						for (
							var i = 0;
							i < statements.length &&
							this.isDirectiveCandidate(statements[i]);
							++i
						) {
							statements[i].directive = statements[
								i
							].expression.raw.slice(1, -1);
						}
					};
					pp$1.isDirectiveCandidate = function (statement) {
						return (
							statement.type === 'ExpressionStatement' &&
							statement.expression.type === 'Literal' &&
							typeof statement.expression.value === 'string' &&
							// Reject parenthesized strings.
							(this.input[statement.start] === '"' ||
								this.input[statement.start] === "'")
						);
					};

					var pp$2 = Parser.prototype;

					// Convert existing expression atom to assignable pattern
					// if possible.

					pp$2.toAssignable = function (
						node,
						isBinding,
						refDestructuringErrors
					) {
						if (this.options.ecmaVersion >= 6 && node) {
							switch (node.type) {
								case 'Identifier':
									if (this.inAsync && node.name === 'await') {
										this.raise(
											node.start,
											"Cannot use 'await' as identifier inside an async function"
										);
									}
									break;

								case 'ObjectPattern':
								case 'ArrayPattern':
								case 'RestElement':
									break;

								case 'ObjectExpression':
									node.type = 'ObjectPattern';
									if (refDestructuringErrors) {
										this.checkPatternErrors(
											refDestructuringErrors,
											true
										);
									}
									for (
										var i = 0, list = node.properties;
										i < list.length;
										i += 1
									) {
										var prop = list[i];

										this.toAssignable(prop, isBinding);
										// Early error:
										//   AssignmentRestProperty[Yield, Await] :
										//     `...` DestructuringAssignmentTarget[Yield, Await]
										//
										//   It is a Syntax Error if |DestructuringAssignmentTarget| is an |ArrayLiteral| or an |ObjectLiteral|.
										if (
											prop.type === 'RestElement' &&
											(prop.argument.type ===
												'ArrayPattern' ||
												prop.argument.type ===
													'ObjectPattern')
										) {
											this.raise(
												prop.argument.start,
												'Unexpected token'
											);
										}
									}
									break;

								case 'Property':
									// AssignmentProperty has type === "Property"
									if (node.kind !== 'init') {
										this.raise(
											node.key.start,
											"Object pattern can't contain getter or setter"
										);
									}
									this.toAssignable(node.value, isBinding);
									break;

								case 'ArrayExpression':
									node.type = 'ArrayPattern';
									if (refDestructuringErrors) {
										this.checkPatternErrors(
											refDestructuringErrors,
											true
										);
									}
									this.toAssignableList(
										node.elements,
										isBinding
									);
									break;

								case 'SpreadElement':
									node.type = 'RestElement';
									this.toAssignable(node.argument, isBinding);
									if (
										node.argument.type ===
										'AssignmentPattern'
									) {
										this.raise(
											node.argument.start,
											'Rest elements cannot have a default value'
										);
									}
									break;

								case 'AssignmentExpression':
									if (node.operator !== '=') {
										this.raise(
											node.left.end,
											"Only '=' operator can be used for specifying default value."
										);
									}
									node.type = 'AssignmentPattern';
									delete node.operator;
									this.toAssignable(node.left, isBinding);
								// falls through to AssignmentPattern

								case 'AssignmentPattern':
									break;

								case 'ParenthesizedExpression':
									this.toAssignable(
										node.expression,
										isBinding,
										refDestructuringErrors
									);
									break;

								case 'MemberExpression':
									if (!isBinding) {
										break;
									}

								default:
									this.raise(
										node.start,
										'Assigning to rvalue'
									);
							}
						} else if (refDestructuringErrors) {
							this.checkPatternErrors(
								refDestructuringErrors,
								true
							);
						}
						return node;
					};

					// Convert list of expression atoms to binding list.

					pp$2.toAssignableList = function (exprList, isBinding) {
						var end = exprList.length;
						for (var i = 0; i < end; i++) {
							var elt = exprList[i];
							if (elt) {
								this.toAssignable(elt, isBinding);
							}
						}
						if (end) {
							var last = exprList[end - 1];
							if (
								this.options.ecmaVersion === 6 &&
								isBinding &&
								last &&
								last.type === 'RestElement' &&
								last.argument.type !== 'Identifier'
							) {
								this.unexpected(last.argument.start);
							}
						}
						return exprList;
					};

					// Parses spread element.

					pp$2.parseSpread = function (refDestructuringErrors) {
						var node = this.startNode();
						this.next();
						node.argument = this.parseMaybeAssign(
							false,
							refDestructuringErrors
						);
						return this.finishNode(node, 'SpreadElement');
					};

					pp$2.parseRestBinding = function () {
						var node = this.startNode();
						this.next();

						// RestElement inside of a function parameter must be an identifier
						if (
							this.options.ecmaVersion === 6 &&
							this.type !== types.name
						) {
							this.unexpected();
						}

						node.argument = this.parseBindingAtom();

						return this.finishNode(node, 'RestElement');
					};

					// Parses lvalue (assignable) atom.

					pp$2.parseBindingAtom = function () {
						if (this.options.ecmaVersion >= 6) {
							switch (this.type) {
								case types.bracketL:
									var node = this.startNode();
									this.next();
									node.elements = this.parseBindingList(
										types.bracketR,
										true,
										true
									);
									return this.finishNode(
										node,
										'ArrayPattern'
									);

								case types.braceL:
									return this.parseObj(true);
							}
						}
						return this.parseIdent();
					};

					pp$2.parseBindingList = function (
						close,
						allowEmpty,
						allowTrailingComma
					) {
						var elts = [],
							first = true;
						while (!this.eat(close)) {
							if (first) {
								first = false;
							} else {
								this.expect(types.comma);
							}
							if (allowEmpty && this.type === types.comma) {
								elts.push(null);
							} else if (
								allowTrailingComma &&
								this.afterTrailingComma(close)
							) {
								break;
							} else if (this.type === types.ellipsis) {
								var rest = this.parseRestBinding();
								this.parseBindingListItem(rest);
								elts.push(rest);
								if (this.type === types.comma) {
									this.raise(
										this.start,
										'Comma is not permitted after the rest element'
									);
								}
								this.expect(close);
								break;
							} else {
								var elem = this.parseMaybeDefault(
									this.start,
									this.startLoc
								);
								this.parseBindingListItem(elem);
								elts.push(elem);
							}
						}
						return elts;
					};

					pp$2.parseBindingListItem = function (param) {
						return param;
					};

					// Parses assignment pattern around given atom if possible.

					pp$2.parseMaybeDefault = function (
						startPos,
						startLoc,
						left
					) {
						left = left || this.parseBindingAtom();
						if (
							this.options.ecmaVersion < 6 ||
							!this.eat(types.eq)
						) {
							return left;
						}
						var node = this.startNodeAt(startPos, startLoc);
						node.left = left;
						node.right = this.parseMaybeAssign();
						return this.finishNode(node, 'AssignmentPattern');
					};

					// Verify that a node is an lval — something that can be assigned
					// to.
					// bindingType can be either:
					// 'var' indicating that the lval creates a 'var' binding
					// 'let' indicating that the lval creates a lexical ('let' or 'const') binding
					// 'none' indicating that the binding should be checked for illegal identifiers, but not for duplicate references

					pp$2.checkLVal = function (
						expr,
						bindingType,
						checkClashes
					) {
						if (bindingType === void 0) bindingType = BIND_NONE;

						switch (expr.type) {
							case 'Identifier':
								if (
									bindingType === BIND_LEXICAL &&
									expr.name === 'let'
								) {
									this.raiseRecoverable(
										expr.start,
										'let is disallowed as a lexically bound name'
									);
								}
								if (
									this.strict &&
									this.reservedWordsStrictBind.test(expr.name)
								) {
									this.raiseRecoverable(
										expr.start,
										(bindingType
											? 'Binding '
											: 'Assigning to ') +
											expr.name +
											' in strict mode'
									);
								}
								if (checkClashes) {
									if (has(checkClashes, expr.name)) {
										this.raiseRecoverable(
											expr.start,
											'Argument name clash'
										);
									}
									checkClashes[expr.name] = true;
								}
								if (
									bindingType !== BIND_NONE &&
									bindingType !== BIND_OUTSIDE
								) {
									this.declareName(
										expr.name,
										bindingType,
										expr.start
									);
								}
								break;

							case 'MemberExpression':
								if (bindingType) {
									this.raiseRecoverable(
										expr.start,
										'Binding member expression'
									);
								}
								break;

							case 'ObjectPattern':
								for (
									var i = 0, list = expr.properties;
									i < list.length;
									i += 1
								) {
									var prop = list[i];

									this.checkLVal(
										prop,
										bindingType,
										checkClashes
									);
								}
								break;

							case 'Property':
								// AssignmentProperty has type === "Property"
								this.checkLVal(
									expr.value,
									bindingType,
									checkClashes
								);
								break;

							case 'ArrayPattern':
								for (
									var i$1 = 0, list$1 = expr.elements;
									i$1 < list$1.length;
									i$1 += 1
								) {
									var elem = list$1[i$1];

									if (elem) {
										this.checkLVal(
											elem,
											bindingType,
											checkClashes
										);
									}
								}
								break;

							case 'AssignmentPattern':
								this.checkLVal(
									expr.left,
									bindingType,
									checkClashes
								);
								break;

							case 'RestElement':
								this.checkLVal(
									expr.argument,
									bindingType,
									checkClashes
								);
								break;

							case 'ParenthesizedExpression':
								this.checkLVal(
									expr.expression,
									bindingType,
									checkClashes
								);
								break;

							default:
								this.raise(
									expr.start,
									(bindingType ? 'Binding' : 'Assigning to') +
										' rvalue'
								);
						}
					};

					// A recursive descent parser operates by defining functions for all

					var pp$3 = Parser.prototype;

					// Check if property name clashes with already added.
					// Object/class getters and setters are not allowed to clash —
					// either with each other or with an init property — and in
					// strict mode, init properties are also not allowed to be repeated.

					pp$3.checkPropClash = function (
						prop,
						propHash,
						refDestructuringErrors
					) {
						if (
							this.options.ecmaVersion >= 9 &&
							prop.type === 'SpreadElement'
						) {
							return;
						}
						if (
							this.options.ecmaVersion >= 6 &&
							(prop.computed || prop.method || prop.shorthand)
						) {
							return;
						}
						var key = prop.key;
						var name;
						switch (key.type) {
							case 'Identifier':
								name = key.name;
								break;
							case 'Literal':
								name = String(key.value);
								break;
							default:
								return;
						}
						var kind = prop.kind;
						if (this.options.ecmaVersion >= 6) {
							if (name === '__proto__' && kind === 'init') {
								if (propHash.proto) {
									if (
										refDestructuringErrors &&
										refDestructuringErrors.doubleProto < 0
									) {
										refDestructuringErrors.doubleProto =
											key.start;
									}
									// Backwards-compat kludge. Can be removed in version 6.0
									else {
										this.raiseRecoverable(
											key.start,
											'Redefinition of __proto__ property'
										);
									}
								}
								propHash.proto = true;
							}
							return;
						}
						name = '$' + name;
						var other = propHash[name];
						if (other) {
							var redefinition;
							if (kind === 'init') {
								redefinition =
									(this.strict && other.init) ||
									other.get ||
									other.set;
							} else {
								redefinition = other.init || other[kind];
							}
							if (redefinition) {
								this.raiseRecoverable(
									key.start,
									'Redefinition of property'
								);
							}
						} else {
							other = propHash[name] = {
								init: false,
								get: false,
								set: false,
							};
						}
						other[kind] = true;
					};

					// ### Expression parsing

					// These nest, from the most general expression type at the top to
					// 'atomic', nondivisible expression types at the bottom. Most of
					// the functions will simply let the function(s) below them parse,
					// and, *if* the syntactic construct they handle is present, wrap
					// the AST node that the inner parser gave them in another node.

					// Parse a full expression. The optional arguments are used to
					// forbid the `in` operator (in for loops initalization expressions)
					// and provide reference for storing '=' operator inside shorthand
					// property assignment in contexts where both object expression
					// and object pattern might appear (so it's possible to raise
					// delayed syntax error at correct position).

					pp$3.parseExpression = function (
						noIn,
						refDestructuringErrors
					) {
						var startPos = this.start,
							startLoc = this.startLoc;
						var expr = this.parseMaybeAssign(
							noIn,
							refDestructuringErrors
						);
						if (this.type === types.comma) {
							var node = this.startNodeAt(startPos, startLoc);
							node.expressions = [expr];
							while (this.eat(types.comma)) {
								node.expressions.push(
									this.parseMaybeAssign(
										noIn,
										refDestructuringErrors
									)
								);
							}
							return this.finishNode(node, 'SequenceExpression');
						}
						return expr;
					};

					// Parse an assignment expression. This includes applications of
					// operators like `+=`.

					pp$3.parseMaybeAssign = function (
						noIn,
						refDestructuringErrors,
						afterLeftParse
					) {
						if (this.isContextual('yield')) {
							if (this.inGenerator) {
								return this.parseYield(noIn);
							}
							// The tokenizer will assume an expression is allowed after
							// `yield`, but this isn't that kind of yield
							else {
								this.exprAllowed = false;
							}
						}

						var ownDestructuringErrors = false,
							oldParenAssign = -1,
							oldTrailingComma = -1,
							oldShorthandAssign = -1;
						if (refDestructuringErrors) {
							oldParenAssign =
								refDestructuringErrors.parenthesizedAssign;
							oldTrailingComma =
								refDestructuringErrors.trailingComma;
							oldShorthandAssign =
								refDestructuringErrors.shorthandAssign;
							refDestructuringErrors.parenthesizedAssign =
								refDestructuringErrors.trailingComma =
								refDestructuringErrors.shorthandAssign =
									-1;
						} else {
							refDestructuringErrors = new DestructuringErrors();
							ownDestructuringErrors = true;
						}

						var startPos = this.start,
							startLoc = this.startLoc;
						if (
							this.type === types.parenL ||
							this.type === types.name
						) {
							this.potentialArrowAt = this.start;
						}
						var left = this.parseMaybeConditional(
							noIn,
							refDestructuringErrors
						);
						if (afterLeftParse) {
							left = afterLeftParse.call(
								this,
								left,
								startPos,
								startLoc
							);
						}
						if (this.type.isAssign) {
							var node = this.startNodeAt(startPos, startLoc);
							node.operator = this.value;
							node.left =
								this.type === types.eq
									? this.toAssignable(
											left,
											false,
											refDestructuringErrors
										)
									: left;
							if (!ownDestructuringErrors) {
								DestructuringErrors.call(
									refDestructuringErrors
								);
							}
							refDestructuringErrors.shorthandAssign = -1; // reset because shorthand default was used correctly
							this.checkLVal(left);
							this.next();
							node.right = this.parseMaybeAssign(noIn);
							return this.finishNode(
								node,
								'AssignmentExpression'
							);
						} else {
							if (ownDestructuringErrors) {
								this.checkExpressionErrors(
									refDestructuringErrors,
									true
								);
							}
						}
						if (oldParenAssign > -1) {
							refDestructuringErrors.parenthesizedAssign =
								oldParenAssign;
						}
						if (oldTrailingComma > -1) {
							refDestructuringErrors.trailingComma =
								oldTrailingComma;
						}
						if (oldShorthandAssign > -1) {
							refDestructuringErrors.shorthandAssign =
								oldShorthandAssign;
						}
						return left;
					};

					// Parse a ternary conditional (`?:`) operator.

					pp$3.parseMaybeConditional = function (
						noIn,
						refDestructuringErrors
					) {
						var startPos = this.start,
							startLoc = this.startLoc;
						var expr = this.parseExprOps(
							noIn,
							refDestructuringErrors
						);
						if (
							this.checkExpressionErrors(refDestructuringErrors)
						) {
							return expr;
						}
						if (this.eat(types.question)) {
							var node = this.startNodeAt(startPos, startLoc);
							node.test = expr;
							node.consequent = this.parseMaybeAssign();
							this.expect(types.colon);
							node.alternate = this.parseMaybeAssign(noIn);
							return this.finishNode(
								node,
								'ConditionalExpression'
							);
						}
						return expr;
					};

					// Start the precedence parser.

					pp$3.parseExprOps = function (
						noIn,
						refDestructuringErrors
					) {
						var startPos = this.start,
							startLoc = this.startLoc;
						var expr = this.parseMaybeUnary(
							refDestructuringErrors,
							false
						);
						if (
							this.checkExpressionErrors(refDestructuringErrors)
						) {
							return expr;
						}
						return expr.start === startPos &&
							expr.type === 'ArrowFunctionExpression'
							? expr
							: this.parseExprOp(
									expr,
									startPos,
									startLoc,
									-1,
									noIn
								);
					};

					// Parse binary operators with the operator precedence parsing
					// algorithm. `left` is the left-hand side of the operator.
					// `minPrec` provides context that allows the function to stop and
					// defer further parser to one of its callers when it encounters an
					// operator that has a lower precedence than the set it is parsing.

					pp$3.parseExprOp = function (
						left,
						leftStartPos,
						leftStartLoc,
						minPrec,
						noIn
					) {
						var prec = this.type.binop;
						if (
							prec != null &&
							(!noIn || this.type !== types._in)
						) {
							if (prec > minPrec) {
								var logical =
									this.type === types.logicalOR ||
									this.type === types.logicalAND;
								var op = this.value;
								this.next();
								var startPos = this.start,
									startLoc = this.startLoc;
								var right = this.parseExprOp(
									this.parseMaybeUnary(null, false),
									startPos,
									startLoc,
									prec,
									noIn
								);
								var node = this.buildBinary(
									leftStartPos,
									leftStartLoc,
									left,
									right,
									op,
									logical
								);
								return this.parseExprOp(
									node,
									leftStartPos,
									leftStartLoc,
									minPrec,
									noIn
								);
							}
						}
						return left;
					};

					pp$3.buildBinary = function (
						startPos,
						startLoc,
						left,
						right,
						op,
						logical
					) {
						var node = this.startNodeAt(startPos, startLoc);
						node.left = left;
						node.operator = op;
						node.right = right;
						return this.finishNode(
							node,
							logical ? 'LogicalExpression' : 'BinaryExpression'
						);
					};

					// Parse unary operators, both prefix and postfix.

					pp$3.parseMaybeUnary = function (
						refDestructuringErrors,
						sawUnary
					) {
						var startPos = this.start,
							startLoc = this.startLoc,
							expr;
						if (
							this.isContextual('await') &&
							(this.inAsync ||
								(!this.inFunction &&
									this.options.allowAwaitOutsideFunction))
						) {
							expr = this.parseAwait();
							sawUnary = true;
						} else if (this.type.prefix) {
							var node = this.startNode(),
								update = this.type === types.incDec;
							node.operator = this.value;
							node.prefix = true;
							this.next();
							node.argument = this.parseMaybeUnary(null, true);
							this.checkExpressionErrors(
								refDestructuringErrors,
								true
							);
							if (update) {
								this.checkLVal(node.argument);
							} else if (
								this.strict &&
								node.operator === 'delete' &&
								node.argument.type === 'Identifier'
							) {
								this.raiseRecoverable(
									node.start,
									'Deleting local variable in strict mode'
								);
							} else {
								sawUnary = true;
							}
							expr = this.finishNode(
								node,
								update ? 'UpdateExpression' : 'UnaryExpression'
							);
						} else {
							expr = this.parseExprSubscripts(
								refDestructuringErrors
							);
							if (
								this.checkExpressionErrors(
									refDestructuringErrors
								)
							) {
								return expr;
							}
							while (
								this.type.postfix &&
								!this.canInsertSemicolon()
							) {
								var node$1 = this.startNodeAt(
									startPos,
									startLoc
								);
								node$1.operator = this.value;
								node$1.prefix = false;
								node$1.argument = expr;
								this.checkLVal(expr);
								this.next();
								expr = this.finishNode(
									node$1,
									'UpdateExpression'
								);
							}
						}

						if (!sawUnary && this.eat(types.starstar)) {
							return this.buildBinary(
								startPos,
								startLoc,
								expr,
								this.parseMaybeUnary(null, false),
								'**',
								false
							);
						} else {
							return expr;
						}
					};

					// Parse call, dot, and `[]`-subscript expressions.

					pp$3.parseExprSubscripts = function (
						refDestructuringErrors
					) {
						var startPos = this.start,
							startLoc = this.startLoc;
						var expr = this.parseExprAtom(refDestructuringErrors);
						var skipArrowSubscripts =
							expr.type === 'ArrowFunctionExpression' &&
							this.input.slice(
								this.lastTokStart,
								this.lastTokEnd
							) !== ')';
						if (
							this.checkExpressionErrors(
								refDestructuringErrors
							) ||
							skipArrowSubscripts
						) {
							return expr;
						}
						var result = this.parseSubscripts(
							expr,
							startPos,
							startLoc
						);
						if (
							refDestructuringErrors &&
							result.type === 'MemberExpression'
						) {
							if (
								refDestructuringErrors.parenthesizedAssign >=
								result.start
							) {
								refDestructuringErrors.parenthesizedAssign = -1;
							}
							if (
								refDestructuringErrors.parenthesizedBind >=
								result.start
							) {
								refDestructuringErrors.parenthesizedBind = -1;
							}
						}
						return result;
					};

					pp$3.parseSubscripts = function (
						base,
						startPos,
						startLoc,
						noCalls
					) {
						var maybeAsyncArrow =
							this.options.ecmaVersion >= 8 &&
							base.type === 'Identifier' &&
							base.name === 'async' &&
							this.lastTokEnd === base.end &&
							!this.canInsertSemicolon() &&
							this.input.slice(base.start, base.end) === 'async';
						while (true) {
							var element = this.parseSubscript(
								base,
								startPos,
								startLoc,
								noCalls,
								maybeAsyncArrow
							);
							if (
								element === base ||
								element.type === 'ArrowFunctionExpression'
							) {
								return element;
							}
							base = element;
						}
					};

					pp$3.parseSubscript = function (
						base,
						startPos,
						startLoc,
						noCalls,
						maybeAsyncArrow
					) {
						var computed = this.eat(types.bracketL);
						if (computed || this.eat(types.dot)) {
							var node = this.startNodeAt(startPos, startLoc);
							node.object = base;
							node.property = computed
								? this.parseExpression()
								: this.parseIdent(
										this.options.allowReserved !== 'never'
									);
							node.computed = !!computed;
							if (computed) {
								this.expect(types.bracketR);
							}
							base = this.finishNode(node, 'MemberExpression');
						} else if (!noCalls && this.eat(types.parenL)) {
							var refDestructuringErrors =
									new DestructuringErrors(),
								oldYieldPos = this.yieldPos,
								oldAwaitPos = this.awaitPos,
								oldAwaitIdentPos = this.awaitIdentPos;
							this.yieldPos = 0;
							this.awaitPos = 0;
							this.awaitIdentPos = 0;
							var exprList = this.parseExprList(
								types.parenR,
								this.options.ecmaVersion >= 8 &&
									base.type !== 'Import',
								false,
								refDestructuringErrors
							);
							if (
								maybeAsyncArrow &&
								!this.canInsertSemicolon() &&
								this.eat(types.arrow)
							) {
								this.checkPatternErrors(
									refDestructuringErrors,
									false
								);
								this.checkYieldAwaitInDefaultParams();
								if (this.awaitIdentPos > 0) {
									this.raise(
										this.awaitIdentPos,
										"Cannot use 'await' as identifier inside an async function"
									);
								}
								this.yieldPos = oldYieldPos;
								this.awaitPos = oldAwaitPos;
								this.awaitIdentPos = oldAwaitIdentPos;
								return this.parseArrowExpression(
									this.startNodeAt(startPos, startLoc),
									exprList,
									true
								);
							}
							this.checkExpressionErrors(
								refDestructuringErrors,
								true
							);
							this.yieldPos = oldYieldPos || this.yieldPos;
							this.awaitPos = oldAwaitPos || this.awaitPos;
							this.awaitIdentPos =
								oldAwaitIdentPos || this.awaitIdentPos;
							var node$1 = this.startNodeAt(startPos, startLoc);
							node$1.callee = base;
							node$1.arguments = exprList;
							if (node$1.callee.type === 'Import') {
								if (node$1.arguments.length !== 1) {
									this.raise(
										node$1.start,
										'import() requires exactly one argument'
									);
								}

								var importArg = node$1.arguments[0];
								if (
									importArg &&
									importArg.type === 'SpreadElement'
								) {
									this.raise(
										importArg.start,
										'... is not allowed in import()'
									);
								}
							}
							base = this.finishNode(node$1, 'CallExpression');
						} else if (this.type === types.backQuote) {
							var node$2 = this.startNodeAt(startPos, startLoc);
							node$2.tag = base;
							node$2.quasi = this.parseTemplate({
								isTagged: true,
							});
							base = this.finishNode(
								node$2,
								'TaggedTemplateExpression'
							);
						}
						return base;
					};

					// Parse an atomic expression — either a single token that is an
					// expression, an expression started by a keyword like `function` or
					// `new`, or an expression wrapped in punctuation like `()`, `[]`,
					// or `{}`.

					pp$3.parseExprAtom = function (refDestructuringErrors) {
						// If a division operator appears in an expression position, the
						// tokenizer got confused, and we force it to read a regexp instead.
						if (this.type === types.slash) {
							this.readRegexp();
						}

						var node,
							canBeArrow = this.potentialArrowAt === this.start;
						switch (this.type) {
							case types._super:
								if (!this.allowSuper) {
									this.raise(
										this.start,
										"'super' keyword outside a method"
									);
								}
								node = this.startNode();
								this.next();
								if (
									this.type === types.parenL &&
									!this.allowDirectSuper
								) {
									this.raise(
										node.start,
										'super() call outside constructor of a subclass'
									);
								}
								// The `super` keyword can appear at below:
								// SuperProperty:
								//     super [ Expression ]
								//     super . IdentifierName
								// SuperCall:
								//     super Arguments
								if (
									this.type !== types.dot &&
									this.type !== types.bracketL &&
									this.type !== types.parenL
								) {
									this.unexpected();
								}
								return this.finishNode(node, 'Super');

							case types._this:
								node = this.startNode();
								this.next();
								return this.finishNode(node, 'ThisExpression');

							case types.name:
								var startPos = this.start,
									startLoc = this.startLoc,
									containsEsc = this.containsEsc;
								var id = this.parseIdent(false);
								if (
									this.options.ecmaVersion >= 8 &&
									!containsEsc &&
									id.name === 'async' &&
									!this.canInsertSemicolon() &&
									this.eat(types._function)
								) {
									return this.parseFunction(
										this.startNodeAt(startPos, startLoc),
										0,
										false,
										true
									);
								}
								if (canBeArrow && !this.canInsertSemicolon()) {
									if (this.eat(types.arrow)) {
										return this.parseArrowExpression(
											this.startNodeAt(
												startPos,
												startLoc
											),
											[id],
											false
										);
									}
									if (
										this.options.ecmaVersion >= 8 &&
										id.name === 'async' &&
										this.type === types.name &&
										!containsEsc
									) {
										id = this.parseIdent(false);
										if (
											this.canInsertSemicolon() ||
											!this.eat(types.arrow)
										) {
											this.unexpected();
										}
										return this.parseArrowExpression(
											this.startNodeAt(
												startPos,
												startLoc
											),
											[id],
											true
										);
									}
								}
								return id;

							case types.regexp:
								var value = this.value;
								node = this.parseLiteral(value.value);
								node.regex = {
									pattern: value.pattern,
									flags: value.flags,
								};
								return node;

							case types.num:
							case types.string:
								return this.parseLiteral(this.value);

							case types._null:
							case types._true:
							case types._false:
								node = this.startNode();
								node.value =
									this.type === types._null
										? null
										: this.type === types._true;
								node.raw = this.type.keyword;
								this.next();
								return this.finishNode(node, 'Literal');

							case types.parenL:
								var start = this.start,
									expr =
										this.parseParenAndDistinguishExpression(
											canBeArrow
										);
								if (refDestructuringErrors) {
									if (
										refDestructuringErrors.parenthesizedAssign <
											0 &&
										!this.isSimpleAssignTarget(expr)
									) {
										refDestructuringErrors.parenthesizedAssign =
											start;
									}
									if (
										refDestructuringErrors.parenthesizedBind <
										0
									) {
										refDestructuringErrors.parenthesizedBind =
											start;
									}
								}
								return expr;

							case types.bracketL:
								node = this.startNode();
								this.next();
								node.elements = this.parseExprList(
									types.bracketR,
									true,
									true,
									refDestructuringErrors
								);
								return this.finishNode(node, 'ArrayExpression');

							case types.braceL:
								return this.parseObj(
									false,
									refDestructuringErrors
								);

							case types._function:
								node = this.startNode();
								this.next();
								return this.parseFunction(node, 0);

							case types._class:
								return this.parseClass(this.startNode(), false);

							case types._new:
								return this.parseNew();

							case types.backQuote:
								return this.parseTemplate();

							case types._import:
								if (this.options.ecmaVersion > 10) {
									return this.parseDynamicImport();
								} else {
									return this.unexpected();
								}

							default:
								this.unexpected();
						}
					};

					pp$3.parseDynamicImport = function () {
						var node = this.startNode();
						this.next();
						if (this.type !== types.parenL) {
							this.unexpected();
						}
						return this.finishNode(node, 'Import');
					};

					pp$3.parseLiteral = function (value) {
						var node = this.startNode();
						node.value = value;
						node.raw = this.input.slice(this.start, this.end);
						if (node.raw.charCodeAt(node.raw.length - 1) === 110) {
							node.bigint = node.raw.slice(0, -1);
						}
						this.next();
						return this.finishNode(node, 'Literal');
					};

					pp$3.parseParenExpression = function () {
						this.expect(types.parenL);
						var val = this.parseExpression();
						this.expect(types.parenR);
						return val;
					};

					pp$3.parseParenAndDistinguishExpression = function (
						canBeArrow
					) {
						var startPos = this.start,
							startLoc = this.startLoc,
							val,
							allowTrailingComma = this.options.ecmaVersion >= 8;
						if (this.options.ecmaVersion >= 6) {
							this.next();

							var innerStartPos = this.start,
								innerStartLoc = this.startLoc;
							var exprList = [],
								first = true,
								lastIsComma = false;
							var refDestructuringErrors =
									new DestructuringErrors(),
								oldYieldPos = this.yieldPos,
								oldAwaitPos = this.awaitPos,
								spreadStart;
							this.yieldPos = 0;
							this.awaitPos = 0;
							// Do not save awaitIdentPos to allow checking awaits nested in parameters
							while (this.type !== types.parenR) {
								first
									? (first = false)
									: this.expect(types.comma);
								if (
									allowTrailingComma &&
									this.afterTrailingComma(types.parenR, true)
								) {
									lastIsComma = true;
									break;
								} else if (this.type === types.ellipsis) {
									spreadStart = this.start;
									exprList.push(
										this.parseParenItem(
											this.parseRestBinding()
										)
									);
									if (this.type === types.comma) {
										this.raise(
											this.start,
											'Comma is not permitted after the rest element'
										);
									}
									break;
								} else {
									exprList.push(
										this.parseMaybeAssign(
											false,
											refDestructuringErrors,
											this.parseParenItem
										)
									);
								}
							}
							var innerEndPos = this.start,
								innerEndLoc = this.startLoc;
							this.expect(types.parenR);

							if (
								canBeArrow &&
								!this.canInsertSemicolon() &&
								this.eat(types.arrow)
							) {
								this.checkPatternErrors(
									refDestructuringErrors,
									false
								);
								this.checkYieldAwaitInDefaultParams();
								this.yieldPos = oldYieldPos;
								this.awaitPos = oldAwaitPos;
								return this.parseParenArrowList(
									startPos,
									startLoc,
									exprList
								);
							}

							if (!exprList.length || lastIsComma) {
								this.unexpected(this.lastTokStart);
							}
							if (spreadStart) {
								this.unexpected(spreadStart);
							}
							this.checkExpressionErrors(
								refDestructuringErrors,
								true
							);
							this.yieldPos = oldYieldPos || this.yieldPos;
							this.awaitPos = oldAwaitPos || this.awaitPos;

							if (exprList.length > 1) {
								val = this.startNodeAt(
									innerStartPos,
									innerStartLoc
								);
								val.expressions = exprList;
								this.finishNodeAt(
									val,
									'SequenceExpression',
									innerEndPos,
									innerEndLoc
								);
							} else {
								val = exprList[0];
							}
						} else {
							val = this.parseParenExpression();
						}

						if (this.options.preserveParens) {
							var par = this.startNodeAt(startPos, startLoc);
							par.expression = val;
							return this.finishNode(
								par,
								'ParenthesizedExpression'
							);
						} else {
							return val;
						}
					};

					pp$3.parseParenItem = function (item) {
						return item;
					};

					pp$3.parseParenArrowList = function (
						startPos,
						startLoc,
						exprList
					) {
						return this.parseArrowExpression(
							this.startNodeAt(startPos, startLoc),
							exprList
						);
					};

					// New's precedence is slightly tricky. It must allow its argument to
					// be a `[]` or dot subscript expression, but not a call — at least,
					// not without wrapping it in parentheses. Thus, it uses the noCalls
					// argument to parseSubscripts to prevent it from consuming the
					// argument list.

					var empty$1 = [];

					pp$3.parseNew = function () {
						var node = this.startNode();
						var meta = this.parseIdent(true);
						if (
							this.options.ecmaVersion >= 6 &&
							this.eat(types.dot)
						) {
							node.meta = meta;
							var containsEsc = this.containsEsc;
							node.property = this.parseIdent(true);
							if (
								node.property.name !== 'target' ||
								containsEsc
							) {
								this.raiseRecoverable(
									node.property.start,
									'The only valid meta property for new is new.target'
								);
							}
							if (!this.inNonArrowFunction()) {
								this.raiseRecoverable(
									node.start,
									'new.target can only be used in functions'
								);
							}
							return this.finishNode(node, 'MetaProperty');
						}
						var startPos = this.start,
							startLoc = this.startLoc;
						node.callee = this.parseSubscripts(
							this.parseExprAtom(),
							startPos,
							startLoc,
							true
						);
						if (
							this.options.ecmaVersion > 10 &&
							node.callee.type === 'Import'
						) {
							this.raise(
								node.callee.start,
								'Cannot use new with import(...)'
							);
						}
						if (this.eat(types.parenL)) {
							node.arguments = this.parseExprList(
								types.parenR,
								this.options.ecmaVersion >= 8 &&
									node.callee.type !== 'Import',
								false
							);
						} else {
							node.arguments = empty$1;
						}
						return this.finishNode(node, 'NewExpression');
					};

					// Parse template expression.

					pp$3.parseTemplateElement = function (ref) {
						var isTagged = ref.isTagged;

						var elem = this.startNode();
						if (this.type === types.invalidTemplate) {
							if (!isTagged) {
								this.raiseRecoverable(
									this.start,
									'Bad escape sequence in untagged template literal'
								);
							}
							elem.value = {
								raw: this.value,
								cooked: null,
							};
						} else {
							elem.value = {
								raw: this.input
									.slice(this.start, this.end)
									.replace(/\r\n?/g, '\n'),
								cooked: this.value,
							};
						}
						this.next();
						elem.tail = this.type === types.backQuote;
						return this.finishNode(elem, 'TemplateElement');
					};

					pp$3.parseTemplate = function (ref) {
						if (ref === void 0) ref = {};
						var isTagged = ref.isTagged;
						if (isTagged === void 0) isTagged = false;

						var node = this.startNode();
						this.next();
						node.expressions = [];
						var curElt = this.parseTemplateElement({
							isTagged: isTagged,
						});
						node.quasis = [curElt];
						while (!curElt.tail) {
							if (this.type === types.eof) {
								this.raise(
									this.pos,
									'Unterminated template literal'
								);
							}
							this.expect(types.dollarBraceL);
							node.expressions.push(this.parseExpression());
							this.expect(types.braceR);
							node.quasis.push(
								(curElt = this.parseTemplateElement({
									isTagged: isTagged,
								}))
							);
						}
						this.next();
						return this.finishNode(node, 'TemplateLiteral');
					};

					pp$3.isAsyncProp = function (prop) {
						return (
							!prop.computed &&
							prop.key.type === 'Identifier' &&
							prop.key.name === 'async' &&
							(this.type === types.name ||
								this.type === types.num ||
								this.type === types.string ||
								this.type === types.bracketL ||
								this.type.keyword ||
								(this.options.ecmaVersion >= 9 &&
									this.type === types.star)) &&
							!lineBreak.test(
								this.input.slice(this.lastTokEnd, this.start)
							)
						);
					};

					// Parse an object literal or binding pattern.

					pp$3.parseObj = function (
						isPattern,
						refDestructuringErrors
					) {
						var node = this.startNode(),
							first = true,
							propHash = {};
						node.properties = [];
						this.next();
						while (!this.eat(types.braceR)) {
							if (!first) {
								this.expect(types.comma);
								if (this.afterTrailingComma(types.braceR)) {
									break;
								}
							} else {
								first = false;
							}

							var prop = this.parseProperty(
								isPattern,
								refDestructuringErrors
							);
							if (!isPattern) {
								this.checkPropClash(
									prop,
									propHash,
									refDestructuringErrors
								);
							}
							node.properties.push(prop);
						}
						return this.finishNode(
							node,
							isPattern ? 'ObjectPattern' : 'ObjectExpression'
						);
					};

					pp$3.parseProperty = function (
						isPattern,
						refDestructuringErrors
					) {
						var prop = this.startNode(),
							isGenerator,
							isAsync,
							startPos,
							startLoc;
						if (
							this.options.ecmaVersion >= 9 &&
							this.eat(types.ellipsis)
						) {
							if (isPattern) {
								prop.argument = this.parseIdent(false);
								if (this.type === types.comma) {
									this.raise(
										this.start,
										'Comma is not permitted after the rest element'
									);
								}
								return this.finishNode(prop, 'RestElement');
							}
							// To disallow parenthesized identifier via `this.toAssignable()`.
							if (
								this.type === types.parenL &&
								refDestructuringErrors
							) {
								if (
									refDestructuringErrors.parenthesizedAssign <
									0
								) {
									refDestructuringErrors.parenthesizedAssign =
										this.start;
								}
								if (
									refDestructuringErrors.parenthesizedBind < 0
								) {
									refDestructuringErrors.parenthesizedBind =
										this.start;
								}
							}
							// Parse argument.
							prop.argument = this.parseMaybeAssign(
								false,
								refDestructuringErrors
							);
							// To disallow trailing comma via `this.toAssignable()`.
							if (
								this.type === types.comma &&
								refDestructuringErrors &&
								refDestructuringErrors.trailingComma < 0
							) {
								refDestructuringErrors.trailingComma =
									this.start;
							}
							// Finish
							return this.finishNode(prop, 'SpreadElement');
						}
						if (this.options.ecmaVersion >= 6) {
							prop.method = false;
							prop.shorthand = false;
							if (isPattern || refDestructuringErrors) {
								startPos = this.start;
								startLoc = this.startLoc;
							}
							if (!isPattern) {
								isGenerator = this.eat(types.star);
							}
						}
						var containsEsc = this.containsEsc;
						this.parsePropertyName(prop);
						if (
							!isPattern &&
							!containsEsc &&
							this.options.ecmaVersion >= 8 &&
							!isGenerator &&
							this.isAsyncProp(prop)
						) {
							isAsync = true;
							isGenerator =
								this.options.ecmaVersion >= 9 &&
								this.eat(types.star);
							this.parsePropertyName(
								prop,
								refDestructuringErrors
							);
						} else {
							isAsync = false;
						}
						this.parsePropertyValue(
							prop,
							isPattern,
							isGenerator,
							isAsync,
							startPos,
							startLoc,
							refDestructuringErrors,
							containsEsc
						);
						return this.finishNode(prop, 'Property');
					};

					pp$3.parsePropertyValue = function (
						prop,
						isPattern,
						isGenerator,
						isAsync,
						startPos,
						startLoc,
						refDestructuringErrors,
						containsEsc
					) {
						if (
							(isGenerator || isAsync) &&
							this.type === types.colon
						) {
							this.unexpected();
						}

						if (this.eat(types.colon)) {
							prop.value = isPattern
								? this.parseMaybeDefault(
										this.start,
										this.startLoc
									)
								: this.parseMaybeAssign(
										false,
										refDestructuringErrors
									);
							prop.kind = 'init';
						} else if (
							this.options.ecmaVersion >= 6 &&
							this.type === types.parenL
						) {
							if (isPattern) {
								this.unexpected();
							}
							prop.kind = 'init';
							prop.method = true;
							prop.value = this.parseMethod(isGenerator, isAsync);
						} else if (
							!isPattern &&
							!containsEsc &&
							this.options.ecmaVersion >= 5 &&
							!prop.computed &&
							prop.key.type === 'Identifier' &&
							(prop.key.name === 'get' ||
								prop.key.name === 'set') &&
							this.type !== types.comma &&
							this.type !== types.braceR
						) {
							if (isGenerator || isAsync) {
								this.unexpected();
							}
							prop.kind = prop.key.name;
							this.parsePropertyName(prop);
							prop.value = this.parseMethod(false);
							var paramCount = prop.kind === 'get' ? 0 : 1;
							if (prop.value.params.length !== paramCount) {
								var start = prop.value.start;
								if (prop.kind === 'get') {
									this.raiseRecoverable(
										start,
										'getter should have no params'
									);
								} else {
									this.raiseRecoverable(
										start,
										'setter should have exactly one param'
									);
								}
							} else {
								if (
									prop.kind === 'set' &&
									prop.value.params[0].type === 'RestElement'
								) {
									this.raiseRecoverable(
										prop.value.params[0].start,
										'Setter cannot use rest params'
									);
								}
							}
						} else if (
							this.options.ecmaVersion >= 6 &&
							!prop.computed &&
							prop.key.type === 'Identifier'
						) {
							if (isGenerator || isAsync) {
								this.unexpected();
							}
							this.checkUnreserved(prop.key);
							if (
								prop.key.name === 'await' &&
								!this.awaitIdentPos
							) {
								this.awaitIdentPos = startPos;
							}
							prop.kind = 'init';
							if (isPattern) {
								prop.value = this.parseMaybeDefault(
									startPos,
									startLoc,
									prop.key
								);
							} else if (
								this.type === types.eq &&
								refDestructuringErrors
							) {
								if (
									refDestructuringErrors.shorthandAssign < 0
								) {
									refDestructuringErrors.shorthandAssign =
										this.start;
								}
								prop.value = this.parseMaybeDefault(
									startPos,
									startLoc,
									prop.key
								);
							} else {
								prop.value = prop.key;
							}
							prop.shorthand = true;
						} else {
							this.unexpected();
						}
					};

					pp$3.parsePropertyName = function (prop) {
						if (this.options.ecmaVersion >= 6) {
							if (this.eat(types.bracketL)) {
								prop.computed = true;
								prop.key = this.parseMaybeAssign();
								this.expect(types.bracketR);
								return prop.key;
							} else {
								prop.computed = false;
							}
						}
						return (prop.key =
							this.type === types.num ||
							this.type === types.string
								? this.parseExprAtom()
								: this.parseIdent(
										this.options.allowReserved !== 'never'
									));
					};

					// Initialize empty function node.

					pp$3.initFunction = function (node) {
						node.id = null;
						if (this.options.ecmaVersion >= 6) {
							node.generator = node.expression = false;
						}
						if (this.options.ecmaVersion >= 8) {
							node.async = false;
						}
					};

					// Parse object or class method.

					pp$3.parseMethod = function (
						isGenerator,
						isAsync,
						allowDirectSuper
					) {
						var node = this.startNode(),
							oldYieldPos = this.yieldPos,
							oldAwaitPos = this.awaitPos,
							oldAwaitIdentPos = this.awaitIdentPos;

						this.initFunction(node);
						if (this.options.ecmaVersion >= 6) {
							node.generator = isGenerator;
						}
						if (this.options.ecmaVersion >= 8) {
							node.async = !!isAsync;
						}

						this.yieldPos = 0;
						this.awaitPos = 0;
						this.awaitIdentPos = 0;
						this.enterScope(
							functionFlags(isAsync, node.generator) |
								SCOPE_SUPER |
								(allowDirectSuper ? SCOPE_DIRECT_SUPER : 0)
						);

						this.expect(types.parenL);
						node.params = this.parseBindingList(
							types.parenR,
							false,
							this.options.ecmaVersion >= 8
						);
						this.checkYieldAwaitInDefaultParams();
						this.parseFunctionBody(node, false, true);

						this.yieldPos = oldYieldPos;
						this.awaitPos = oldAwaitPos;
						this.awaitIdentPos = oldAwaitIdentPos;
						return this.finishNode(node, 'FunctionExpression');
					};

					// Parse arrow function expression with given parameters.

					pp$3.parseArrowExpression = function (
						node,
						params,
						isAsync
					) {
						var oldYieldPos = this.yieldPos,
							oldAwaitPos = this.awaitPos,
							oldAwaitIdentPos = this.awaitIdentPos;

						this.enterScope(
							functionFlags(isAsync, false) | SCOPE_ARROW
						);
						this.initFunction(node);
						if (this.options.ecmaVersion >= 8) {
							node.async = !!isAsync;
						}

						this.yieldPos = 0;
						this.awaitPos = 0;
						this.awaitIdentPos = 0;

						node.params = this.toAssignableList(params, true);
						this.parseFunctionBody(node, true, false);

						this.yieldPos = oldYieldPos;
						this.awaitPos = oldAwaitPos;
						this.awaitIdentPos = oldAwaitIdentPos;
						return this.finishNode(node, 'ArrowFunctionExpression');
					};

					// Parse function body and check parameters.

					pp$3.parseFunctionBody = function (
						node,
						isArrowFunction,
						isMethod
					) {
						var isExpression =
							isArrowFunction && this.type !== types.braceL;
						var oldStrict = this.strict,
							useStrict = false;

						if (isExpression) {
							node.body = this.parseMaybeAssign();
							node.expression = true;
							this.checkParams(node, false);
						} else {
							var nonSimple =
								this.options.ecmaVersion >= 7 &&
								!this.isSimpleParamList(node.params);
							if (!oldStrict || nonSimple) {
								useStrict = this.strictDirective(this.end);
								// If this is a strict mode function, verify that argument names
								// are not repeated, and it does not try to bind the words `eval`
								// or `arguments`.
								if (useStrict && nonSimple) {
									this.raiseRecoverable(
										node.start,
										"Illegal 'use strict' directive in function with non-simple parameter list"
									);
								}
							}
							// Start a new scope with regard to labels and the `inFunction`
							// flag (restore them to their old value afterwards).
							var oldLabels = this.labels;
							this.labels = [];
							if (useStrict) {
								this.strict = true;
							}

							// Add the params to varDeclaredNames to ensure that an error is thrown
							// if a let/const declaration in the function clashes with one of the params.
							this.checkParams(
								node,
								!oldStrict &&
									!useStrict &&
									!isArrowFunction &&
									!isMethod &&
									this.isSimpleParamList(node.params)
							);
							node.body = this.parseBlock(false);
							node.expression = false;
							this.adaptDirectivePrologue(node.body.body);
							this.labels = oldLabels;
						}
						this.exitScope();

						// Ensure the function name isn't a forbidden identifier in strict mode, e.g. 'eval'
						if (this.strict && node.id) {
							this.checkLVal(node.id, BIND_OUTSIDE);
						}
						this.strict = oldStrict;
					};

					pp$3.isSimpleParamList = function (params) {
						for (
							var i = 0, list = params;
							i < list.length;
							i += 1
						) {
							var param = list[i];

							if (param.type !== 'Identifier') {
								return false;
							}
						}
						return true;
					};

					// Checks function params for various disallowed patterns such as using "eval"
					// or "arguments" and duplicate parameters.

					pp$3.checkParams = function (node, allowDuplicates) {
						var nameHash = {};
						for (
							var i = 0, list = node.params;
							i < list.length;
							i += 1
						) {
							var param = list[i];

							this.checkLVal(
								param,
								BIND_VAR,
								allowDuplicates ? null : nameHash
							);
						}
					};

					// Parses a comma-separated list of expressions, and returns them as
					// an array. `close` is the token type that ends the list, and
					// `allowEmpty` can be turned on to allow subsequent commas with
					// nothing in between them to be parsed as `null` (which is needed
					// for array literals).

					pp$3.parseExprList = function (
						close,
						allowTrailingComma,
						allowEmpty,
						refDestructuringErrors
					) {
						var elts = [],
							first = true;
						while (!this.eat(close)) {
							if (!first) {
								this.expect(types.comma);
								if (
									allowTrailingComma &&
									this.afterTrailingComma(close)
								) {
									break;
								}
							} else {
								first = false;
							}

							var elt = void 0;
							if (allowEmpty && this.type === types.comma) {
								elt = null;
							} else if (this.type === types.ellipsis) {
								elt = this.parseSpread(refDestructuringErrors);
								if (
									refDestructuringErrors &&
									this.type === types.comma &&
									refDestructuringErrors.trailingComma < 0
								) {
									refDestructuringErrors.trailingComma =
										this.start;
								}
							} else {
								elt = this.parseMaybeAssign(
									false,
									refDestructuringErrors
								);
							}
							elts.push(elt);
						}
						return elts;
					};

					pp$3.checkUnreserved = function (ref) {
						var start = ref.start;
						var end = ref.end;
						var name = ref.name;

						if (this.inGenerator && name === 'yield') {
							this.raiseRecoverable(
								start,
								"Cannot use 'yield' as identifier inside a generator"
							);
						}
						if (this.inAsync && name === 'await') {
							this.raiseRecoverable(
								start,
								"Cannot use 'await' as identifier inside an async function"
							);
						}
						if (this.keywords.test(name)) {
							this.raise(
								start,
								"Unexpected keyword '" + name + "'"
							);
						}
						if (
							this.options.ecmaVersion < 6 &&
							this.input.slice(start, end).indexOf('\\') !== -1
						) {
							return;
						}
						var re = this.strict
							? this.reservedWordsStrict
							: this.reservedWords;
						if (re.test(name)) {
							if (!this.inAsync && name === 'await') {
								this.raiseRecoverable(
									start,
									"Cannot use keyword 'await' outside an async function"
								);
							}
							this.raiseRecoverable(
								start,
								"The keyword '" + name + "' is reserved"
							);
						}
					};

					// Parse the next token as an identifier. If `liberal` is true (used
					// when parsing properties), it will also convert keywords into
					// identifiers.

					pp$3.parseIdent = function (liberal, isBinding) {
						var node = this.startNode();
						if (this.type === types.name) {
							node.name = this.value;
						} else if (this.type.keyword) {
							node.name = this.type.keyword;

							// To fix https://github.com/acornjs/acorn/issues/575
							// `class` and `function` keywords push new context into this.context.
							// But there is no chance to pop the context if the keyword is consumed as an identifier such as a property name.
							// If the previous token is a dot, this does not apply because the context-managing code already ignored the keyword
							if (
								(node.name === 'class' ||
									node.name === 'function') &&
								(this.lastTokEnd !== this.lastTokStart + 1 ||
									this.input.charCodeAt(this.lastTokStart) !==
										46)
							) {
								this.context.pop();
							}
						} else {
							this.unexpected();
						}
						this.next();
						this.finishNode(node, 'Identifier');
						if (!liberal) {
							this.checkUnreserved(node);
							if (node.name === 'await' && !this.awaitIdentPos) {
								this.awaitIdentPos = node.start;
							}
						}
						return node;
					};

					// Parses yield expression inside generator.

					pp$3.parseYield = function (noIn) {
						if (!this.yieldPos) {
							this.yieldPos = this.start;
						}

						var node = this.startNode();
						this.next();
						if (
							this.type === types.semi ||
							this.canInsertSemicolon() ||
							(this.type !== types.star && !this.type.startsExpr)
						) {
							node.delegate = false;
							node.argument = null;
						} else {
							node.delegate = this.eat(types.star);
							node.argument = this.parseMaybeAssign(noIn);
						}
						return this.finishNode(node, 'YieldExpression');
					};

					pp$3.parseAwait = function () {
						if (!this.awaitPos) {
							this.awaitPos = this.start;
						}

						var node = this.startNode();
						this.next();
						node.argument = this.parseMaybeUnary(null, true);
						return this.finishNode(node, 'AwaitExpression');
					};

					var pp$4 = Parser.prototype;

					// This function is used to raise exceptions on parse errors. It
					// takes an offset integer (into the current `input`) to indicate
					// the location of the error, attaches the position to the end
					// of the error message, and then raises a `SyntaxError` with that
					// message.

					pp$4.raise = function (pos, message) {
						var loc = getLineInfo(this.input, pos);
						message += ' (' + loc.line + ':' + loc.column + ')';
						var err = new SyntaxError(message);
						err.pos = pos;
						err.loc = loc;
						err.raisedAt = this.pos;
						throw err;
					};

					pp$4.raiseRecoverable = pp$4.raise;

					pp$4.curPosition = function () {
						if (this.options.locations) {
							return new Position(
								this.curLine,
								this.pos - this.lineStart
							);
						}
					};

					var pp$5 = Parser.prototype;

					var Scope = function Scope(flags) {
						this.flags = flags;
						// A list of var-declared names in the current lexical scope
						this.var = [];
						// A list of lexically-declared names in the current lexical scope
						this.lexical = [];
						// A list of lexically-declared FunctionDeclaration names in the current lexical scope
						this.functions = [];
					};

					// The functions in this module keep track of declared variables in the current scope in order to detect duplicate variable names.

					pp$5.enterScope = function (flags) {
						this.scopeStack.push(new Scope(flags));
					};

					pp$5.exitScope = function () {
						this.scopeStack.pop();
					};

					// The spec says:
					// > At the top level of a function, or script, function declarations are
					// > treated like var declarations rather than like lexical declarations.
					pp$5.treatFunctionsAsVarInScope = function (scope) {
						return (
							scope.flags & SCOPE_FUNCTION ||
							(!this.inModule && scope.flags & SCOPE_TOP)
						);
					};

					pp$5.declareName = function (name, bindingType, pos) {
						var redeclared = false;
						if (bindingType === BIND_LEXICAL) {
							var scope = this.currentScope();
							redeclared =
								scope.lexical.indexOf(name) > -1 ||
								scope.functions.indexOf(name) > -1 ||
								scope.var.indexOf(name) > -1;
							scope.lexical.push(name);
							if (this.inModule && scope.flags & SCOPE_TOP) {
								delete this.undefinedExports[name];
							}
						} else if (bindingType === BIND_SIMPLE_CATCH) {
							var scope$1 = this.currentScope();
							scope$1.lexical.push(name);
						} else if (bindingType === BIND_FUNCTION) {
							var scope$2 = this.currentScope();
							if (this.treatFunctionsAsVar) {
								redeclared = scope$2.lexical.indexOf(name) > -1;
							} else {
								redeclared =
									scope$2.lexical.indexOf(name) > -1 ||
									scope$2.var.indexOf(name) > -1;
							}
							scope$2.functions.push(name);
						} else {
							for (
								var i = this.scopeStack.length - 1;
								i >= 0;
								--i
							) {
								var scope$3 = this.scopeStack[i];
								if (
									(scope$3.lexical.indexOf(name) > -1 &&
										!(
											scope$3.flags &
												SCOPE_SIMPLE_CATCH &&
											scope$3.lexical[0] === name
										)) ||
									(!this.treatFunctionsAsVarInScope(
										scope$3
									) &&
										scope$3.functions.indexOf(name) > -1)
								) {
									redeclared = true;
									break;
								}
								scope$3.var.push(name);
								if (
									this.inModule &&
									scope$3.flags & SCOPE_TOP
								) {
									delete this.undefinedExports[name];
								}
								if (scope$3.flags & SCOPE_VAR) {
									break;
								}
							}
						}
						if (redeclared) {
							this.raiseRecoverable(
								pos,
								"Identifier '" +
									name +
									"' has already been declared"
							);
						}
					};

					pp$5.checkLocalExport = function (id) {
						// scope.functions must be empty as Module code is always strict.
						if (
							this.scopeStack[0].lexical.indexOf(id.name) ===
								-1 &&
							this.scopeStack[0].var.indexOf(id.name) === -1
						) {
							this.undefinedExports[id.name] = id;
						}
					};

					pp$5.currentScope = function () {
						return this.scopeStack[this.scopeStack.length - 1];
					};

					pp$5.currentVarScope = function () {
						for (var i = this.scopeStack.length - 1; ; i--) {
							var scope = this.scopeStack[i];
							if (scope.flags & SCOPE_VAR) {
								return scope;
							}
						}
					};

					// Could be useful for `this`, `new.target`, `super()`, `super.property`, and `super[property]`.
					pp$5.currentThisScope = function () {
						for (var i = this.scopeStack.length - 1; ; i--) {
							var scope = this.scopeStack[i];
							if (
								scope.flags & SCOPE_VAR &&
								!(scope.flags & SCOPE_ARROW)
							) {
								return scope;
							}
						}
					};

					var Node = function Node(parser, pos, loc) {
						this.type = '';
						this.start = pos;
						this.end = 0;
						if (parser.options.locations) {
							this.loc = new SourceLocation(parser, loc);
						}
						if (parser.options.directSourceFile) {
							this.sourceFile = parser.options.directSourceFile;
						}
						if (parser.options.ranges) {
							this.range = [pos, 0];
						}
					};

					// Start an AST node, attaching a start offset.

					var pp$6 = Parser.prototype;

					pp$6.startNode = function () {
						return new Node(this, this.start, this.startLoc);
					};

					pp$6.startNodeAt = function (pos, loc) {
						return new Node(this, pos, loc);
					};

					// Finish an AST node, adding `type` and `end` properties.

					function finishNodeAt(node, type, pos, loc) {
						node.type = type;
						node.end = pos;
						if (this.options.locations) {
							node.loc.end = loc;
						}
						if (this.options.ranges) {
							node.range[1] = pos;
						}
						return node;
					}

					pp$6.finishNode = function (node, type) {
						return finishNodeAt.call(
							this,
							node,
							type,
							this.lastTokEnd,
							this.lastTokEndLoc
						);
					};

					// Finish node at given position

					pp$6.finishNodeAt = function (node, type, pos, loc) {
						return finishNodeAt.call(this, node, type, pos, loc);
					};

					// The algorithm used to determine whether a regexp can appear at a

					var TokContext = function TokContext(
						token,
						isExpr,
						preserveSpace,
						override,
						generator
					) {
						this.token = token;
						this.isExpr = !!isExpr;
						this.preserveSpace = !!preserveSpace;
						this.override = override;
						this.generator = !!generator;
					};

					var types$1 = {
						b_stat: new TokContext('{', false),
						b_expr: new TokContext('{', true),
						b_tmpl: new TokContext('${', false),
						p_stat: new TokContext('(', false),
						p_expr: new TokContext('(', true),
						q_tmpl: new TokContext('`', true, true, function (p) {
							return p.tryReadTemplateToken();
						}),
						f_stat: new TokContext('function', false),
						f_expr: new TokContext('function', true),
						f_expr_gen: new TokContext(
							'function',
							true,
							false,
							null,
							true
						),
						f_gen: new TokContext(
							'function',
							false,
							false,
							null,
							true
						),
					};

					var pp$7 = Parser.prototype;

					pp$7.initialContext = function () {
						return [types$1.b_stat];
					};

					pp$7.braceIsBlock = function (prevType) {
						var parent = this.curContext();
						if (
							parent === types$1.f_expr ||
							parent === types$1.f_stat
						) {
							return true;
						}
						if (
							prevType === types.colon &&
							(parent === types$1.b_stat ||
								parent === types$1.b_expr)
						) {
							return !parent.isExpr;
						}

						// The check for `tt.name && exprAllowed` detects whether we are
						// after a `yield` or `of` construct. See the `updateContext` for
						// `tt.name`.
						if (
							prevType === types._return ||
							(prevType === types.name && this.exprAllowed)
						) {
							return lineBreak.test(
								this.input.slice(this.lastTokEnd, this.start)
							);
						}
						if (
							prevType === types._else ||
							prevType === types.semi ||
							prevType === types.eof ||
							prevType === types.parenR ||
							prevType === types.arrow
						) {
							return true;
						}
						if (prevType === types.braceL) {
							return parent === types$1.b_stat;
						}
						if (
							prevType === types._var ||
							prevType === types._const ||
							prevType === types.name
						) {
							return false;
						}
						return !this.exprAllowed;
					};

					pp$7.inGeneratorContext = function () {
						for (var i = this.context.length - 1; i >= 1; i--) {
							var context = this.context[i];
							if (context.token === 'function') {
								return context.generator;
							}
						}
						return false;
					};

					pp$7.updateContext = function (prevType) {
						var update,
							type = this.type;
						if (type.keyword && prevType === types.dot) {
							this.exprAllowed = false;
						} else if ((update = type.updateContext)) {
							update.call(this, prevType);
						} else {
							this.exprAllowed = type.beforeExpr;
						}
					};

					// Token-specific context update code

					types.parenR.updateContext = types.braceR.updateContext =
						function () {
							if (this.context.length === 1) {
								this.exprAllowed = true;
								return;
							}
							var out = this.context.pop();
							if (
								out === types$1.b_stat &&
								this.curContext().token === 'function'
							) {
								out = this.context.pop();
							}
							this.exprAllowed = !out.isExpr;
						};

					types.braceL.updateContext = function (prevType) {
						this.context.push(
							this.braceIsBlock(prevType)
								? types$1.b_stat
								: types$1.b_expr
						);
						this.exprAllowed = true;
					};

					types.dollarBraceL.updateContext = function () {
						this.context.push(types$1.b_tmpl);
						this.exprAllowed = true;
					};

					types.parenL.updateContext = function (prevType) {
						var statementParens =
							prevType === types._if ||
							prevType === types._for ||
							prevType === types._with ||
							prevType === types._while;
						this.context.push(
							statementParens ? types$1.p_stat : types$1.p_expr
						);
						this.exprAllowed = true;
					};

					types.incDec.updateContext = function () {
						// tokExprAllowed stays unchanged
					};

					types._function.updateContext = types._class.updateContext =
						function (prevType) {
							if (
								prevType.beforeExpr &&
								prevType !== types.semi &&
								prevType !== types._else &&
								!(
									prevType === types._return &&
									lineBreak.test(
										this.input.slice(
											this.lastTokEnd,
											this.start
										)
									)
								) &&
								!(
									(prevType === types.colon ||
										prevType === types.braceL) &&
									this.curContext() === types$1.b_stat
								)
							) {
								this.context.push(types$1.f_expr);
							} else {
								this.context.push(types$1.f_stat);
							}
							this.exprAllowed = false;
						};

					types.backQuote.updateContext = function () {
						if (this.curContext() === types$1.q_tmpl) {
							this.context.pop();
						} else {
							this.context.push(types$1.q_tmpl);
						}
						this.exprAllowed = false;
					};

					types.star.updateContext = function (prevType) {
						if (prevType === types._function) {
							var index = this.context.length - 1;
							if (this.context[index] === types$1.f_expr) {
								this.context[index] = types$1.f_expr_gen;
							} else {
								this.context[index] = types$1.f_gen;
							}
						}
						this.exprAllowed = true;
					};

					types.name.updateContext = function (prevType) {
						var allowed = false;
						if (
							this.options.ecmaVersion >= 6 &&
							prevType !== types.dot
						) {
							if (
								(this.value === 'of' && !this.exprAllowed) ||
								(this.value === 'yield' &&
									this.inGeneratorContext())
							) {
								allowed = true;
							}
						}
						this.exprAllowed = allowed;
					};

					// This file contains Unicode properties extracted from the ECMAScript
					// specification. The lists are extracted like so:
					// $$('#table-binary-unicode-properties > figure > table > tbody > tr > td:nth-child(1) code').map(el => el.innerText)

					// #table-binary-unicode-properties
					var ecma9BinaryProperties =
						'ASCII ASCII_Hex_Digit AHex Alphabetic Alpha Any Assigned Bidi_Control Bidi_C Bidi_Mirrored Bidi_M Case_Ignorable CI Cased Changes_When_Casefolded CWCF Changes_When_Casemapped CWCM Changes_When_Lowercased CWL Changes_When_NFKC_Casefolded CWKCF Changes_When_Titlecased CWT Changes_When_Uppercased CWU Dash Default_Ignorable_Code_Point DI Deprecated Dep Diacritic Dia Emoji Emoji_Component Emoji_Modifier Emoji_Modifier_Base Emoji_Presentation Extender Ext Grapheme_Base Gr_Base Grapheme_Extend Gr_Ext Hex_Digit Hex IDS_Binary_Operator IDSB IDS_Trinary_Operator IDST ID_Continue IDC ID_Start IDS Ideographic Ideo Join_Control Join_C Logical_Order_Exception LOE Lowercase Lower Math Noncharacter_Code_Point NChar Pattern_Syntax Pat_Syn Pattern_White_Space Pat_WS Quotation_Mark QMark Radical Regional_Indicator RI Sentence_Terminal STerm Soft_Dotted SD Terminal_Punctuation Term Unified_Ideograph UIdeo Uppercase Upper Variation_Selector VS White_Space space XID_Continue XIDC XID_Start XIDS';
					var ecma10BinaryProperties =
						ecma9BinaryProperties + ' Extended_Pictographic';
					var ecma11BinaryProperties = ecma10BinaryProperties;
					var unicodeBinaryProperties = {
						9: ecma9BinaryProperties,
						10: ecma10BinaryProperties,
						11: ecma11BinaryProperties,
					};

					// #table-unicode-general-category-values
					var unicodeGeneralCategoryValues =
						'Cased_Letter LC Close_Punctuation Pe Connector_Punctuation Pc Control Cc cntrl Currency_Symbol Sc Dash_Punctuation Pd Decimal_Number Nd digit Enclosing_Mark Me Final_Punctuation Pf Format Cf Initial_Punctuation Pi Letter L Letter_Number Nl Line_Separator Zl Lowercase_Letter Ll Mark M Combining_Mark Math_Symbol Sm Modifier_Letter Lm Modifier_Symbol Sk Nonspacing_Mark Mn Number N Open_Punctuation Ps Other C Other_Letter Lo Other_Number No Other_Punctuation Po Other_Symbol So Paragraph_Separator Zp Private_Use Co Punctuation P punct Separator Z Space_Separator Zs Spacing_Mark Mc Surrogate Cs Symbol S Titlecase_Letter Lt Unassigned Cn Uppercase_Letter Lu';

					// #table-unicode-script-values
					var ecma9ScriptValues =
						'Adlam Adlm Ahom Ahom Anatolian_Hieroglyphs Hluw Arabic Arab Armenian Armn Avestan Avst Balinese Bali Bamum Bamu Bassa_Vah Bass Batak Batk Bengali Beng Bhaiksuki Bhks Bopomofo Bopo Brahmi Brah Braille Brai Buginese Bugi Buhid Buhd Canadian_Aboriginal Cans Carian Cari Caucasian_Albanian Aghb Chakma Cakm Cham Cham Cherokee Cher Common Zyyy Coptic Copt Qaac Cuneiform Xsux Cypriot Cprt Cyrillic Cyrl Deseret Dsrt Devanagari Deva Duployan Dupl Egyptian_Hieroglyphs Egyp Elbasan Elba Ethiopic Ethi Georgian Geor Glagolitic Glag Gothic Goth Grantha Gran Greek Grek Gujarati Gujr Gurmukhi Guru Han Hani Hangul Hang Hanunoo Hano Hatran Hatr Hebrew Hebr Hiragana Hira Imperial_Aramaic Armi Inherited Zinh Qaai Inscriptional_Pahlavi Phli Inscriptional_Parthian Prti Javanese Java Kaithi Kthi Kannada Knda Katakana Kana Kayah_Li Kali Kharoshthi Khar Khmer Khmr Khojki Khoj Khudawadi Sind Lao Laoo Latin Latn Lepcha Lepc Limbu Limb Linear_A Lina Linear_B Linb Lisu Lisu Lycian Lyci Lydian Lydi Mahajani Mahj Malayalam Mlym Mandaic Mand Manichaean Mani Marchen Marc Masaram_Gondi Gonm Meetei_Mayek Mtei Mende_Kikakui Mend Meroitic_Cursive Merc Meroitic_Hieroglyphs Mero Miao Plrd Modi Modi Mongolian Mong Mro Mroo Multani Mult Myanmar Mymr Nabataean Nbat New_Tai_Lue Talu Newa Newa Nko Nkoo Nushu Nshu Ogham Ogam Ol_Chiki Olck Old_Hungarian Hung Old_Italic Ital Old_North_Arabian Narb Old_Permic Perm Old_Persian Xpeo Old_South_Arabian Sarb Old_Turkic Orkh Oriya Orya Osage Osge Osmanya Osma Pahawh_Hmong Hmng Palmyrene Palm Pau_Cin_Hau Pauc Phags_Pa Phag Phoenician Phnx Psalter_Pahlavi Phlp Rejang Rjng Runic Runr Samaritan Samr Saurashtra Saur Sharada Shrd Shavian Shaw Siddham Sidd SignWriting Sgnw Sinhala Sinh Sora_Sompeng Sora Soyombo Soyo Sundanese Sund Syloti_Nagri Sylo Syriac Syrc Tagalog Tglg Tagbanwa Tagb Tai_Le Tale Tai_Tham Lana Tai_Viet Tavt Takri Takr Tamil Taml Tangut Tang Telugu Telu Thaana Thaa Thai Thai Tibetan Tibt Tifinagh Tfng Tirhuta Tirh Ugaritic Ugar Vai Vaii Warang_Citi Wara Yi Yiii Zanabazar_Square Zanb';
					var ecma10ScriptValues =
						ecma9ScriptValues +
						' Dogra Dogr Gunjala_Gondi Gong Hanifi_Rohingya Rohg Makasar Maka Medefaidrin Medf Old_Sogdian Sogo Sogdian Sogd';
					var ecma11ScriptValues =
						ecma10ScriptValues +
						' Elymaic Elym Nandinagari Nand Nyiakeng_Puachue_Hmong Hmnp Wancho Wcho';
					var unicodeScriptValues = {
						9: ecma9ScriptValues,
						10: ecma10ScriptValues,
						11: ecma11ScriptValues,
					};

					var data = {};
					function buildUnicodeData(ecmaVersion) {
						var d = (data[ecmaVersion] = {
							binary: wordsRegexp(
								unicodeBinaryProperties[ecmaVersion] +
									' ' +
									unicodeGeneralCategoryValues
							),
							nonBinary: {
								General_Category: wordsRegexp(
									unicodeGeneralCategoryValues
								),
								Script: wordsRegexp(
									unicodeScriptValues[ecmaVersion]
								),
							},
						});
						d.nonBinary.Script_Extensions = d.nonBinary.Script;

						d.nonBinary.gc = d.nonBinary.General_Category;
						d.nonBinary.sc = d.nonBinary.Script;
						d.nonBinary.scx = d.nonBinary.Script_Extensions;
					}
					buildUnicodeData(9);
					buildUnicodeData(10);
					buildUnicodeData(11);

					var pp$8 = Parser.prototype;

					var RegExpValidationState = function RegExpValidationState(
						parser
					) {
						this.parser = parser;
						this.validFlags =
							'gim' +
							(parser.options.ecmaVersion >= 6 ? 'uy' : '') +
							(parser.options.ecmaVersion >= 9 ? 's' : '');
						this.unicodeProperties =
							data[
								parser.options.ecmaVersion >= 11
									? 11
									: parser.options.ecmaVersion
							];
						this.source = '';
						this.flags = '';
						this.start = 0;
						this.switchU = false;
						this.switchN = false;
						this.pos = 0;
						this.lastIntValue = 0;
						this.lastStringValue = '';
						this.lastAssertionIsQuantifiable = false;
						this.numCapturingParens = 0;
						this.maxBackReference = 0;
						this.groupNames = [];
						this.backReferenceNames = [];
					};

					RegExpValidationState.prototype.reset = function reset(
						start,
						pattern,
						flags
					) {
						var unicode = flags.indexOf('u') !== -1;
						this.start = start | 0;
						this.source = pattern + '';
						this.flags = flags;
						this.switchU =
							unicode && this.parser.options.ecmaVersion >= 6;
						this.switchN =
							unicode && this.parser.options.ecmaVersion >= 9;
					};

					RegExpValidationState.prototype.raise = function raise(
						message
					) {
						this.parser.raiseRecoverable(
							this.start,
							'Invalid regular expression: /' +
								this.source +
								'/: ' +
								message
						);
					};

					// If u flag is given, this returns the code point at the index (it combines a surrogate pair).
					// Otherwise, this returns the code unit of the index (can be a part of a surrogate pair).
					RegExpValidationState.prototype.at = function at(i) {
						var s = this.source;
						var l = s.length;
						if (i >= l) {
							return -1;
						}
						var c = s.charCodeAt(i);
						if (
							!this.switchU ||
							c <= 0xd7ff ||
							c >= 0xe000 ||
							i + 1 >= l
						) {
							return c;
						}
						var next = s.charCodeAt(i + 1);
						return next >= 0xdc00 && next <= 0xdfff
							? (c << 10) + next - 0x35fdc00
							: c;
					};

					RegExpValidationState.prototype.nextIndex =
						function nextIndex(i) {
							var s = this.source;
							var l = s.length;
							if (i >= l) {
								return l;
							}
							var c = s.charCodeAt(i),
								next;
							if (
								!this.switchU ||
								c <= 0xd7ff ||
								c >= 0xe000 ||
								i + 1 >= l ||
								(next = s.charCodeAt(i + 1)) < 0xdc00 ||
								next > 0xdfff
							) {
								return i + 1;
							}
							return i + 2;
						};

					RegExpValidationState.prototype.current =
						function current() {
							return this.at(this.pos);
						};

					RegExpValidationState.prototype.lookahead =
						function lookahead() {
							return this.at(this.nextIndex(this.pos));
						};

					RegExpValidationState.prototype.advance =
						function advance() {
							this.pos = this.nextIndex(this.pos);
						};

					RegExpValidationState.prototype.eat = function eat(ch) {
						if (this.current() === ch) {
							this.advance();
							return true;
						}
						return false;
					};

					function codePointToString(ch) {
						if (ch <= 0xffff) {
							return String.fromCharCode(ch);
						}
						ch -= 0x10000;
						return String.fromCharCode(
							(ch >> 10) + 0xd800,
							(ch & 0x03ff) + 0xdc00
						);
					}

					/**
					 * Validate the flags part of a given RegExpLiteral.
					 *
					 * @param {RegExpValidationState} state The state to validate RegExp.
					 * @returns {void}
					 */
					pp$8.validateRegExpFlags = function (state) {
						var validFlags = state.validFlags;
						var flags = state.flags;

						for (var i = 0; i < flags.length; i++) {
							var flag = flags.charAt(i);
							if (validFlags.indexOf(flag) === -1) {
								this.raise(
									state.start,
									'Invalid regular expression flag'
								);
							}
							if (flags.indexOf(flag, i + 1) > -1) {
								this.raise(
									state.start,
									'Duplicate regular expression flag'
								);
							}
						}
					};

					/**
					 * Validate the pattern part of a given RegExpLiteral.
					 *
					 * @param {RegExpValidationState} state The state to validate RegExp.
					 * @returns {void}
					 */
					pp$8.validateRegExpPattern = function (state) {
						this.regexp_pattern(state);

						// The goal symbol for the parse is |Pattern[~U, ~N]|. If the result of
						// parsing contains a |GroupName|, reparse with the goal symbol
						// |Pattern[~U, +N]| and use this result instead. Throw a *SyntaxError*
						// exception if _P_ did not conform to the grammar, if any elements of _P_
						// were not matched by the parse, or if any Early Error conditions exist.
						if (
							!state.switchN &&
							this.options.ecmaVersion >= 9 &&
							state.groupNames.length > 0
						) {
							state.switchN = true;
							this.regexp_pattern(state);
						}
					};

					// https://www.ecma-international.org/ecma-262/8.0/#prod-Pattern
					pp$8.regexp_pattern = function (state) {
						state.pos = 0;
						state.lastIntValue = 0;
						state.lastStringValue = '';
						state.lastAssertionIsQuantifiable = false;
						state.numCapturingParens = 0;
						state.maxBackReference = 0;
						state.groupNames.length = 0;
						state.backReferenceNames.length = 0;

						this.regexp_disjunction(state);

						if (state.pos !== state.source.length) {
							// Make the same messages as V8.
							if (state.eat(0x29 /* ) */)) {
								state.raise("Unmatched ')'");
							}
							if (
								state.eat(0x5d /* [ */) ||
								state.eat(0x7d /* } */)
							) {
								state.raise('Lone quantifier brackets');
							}
						}
						if (state.maxBackReference > state.numCapturingParens) {
							state.raise('Invalid escape');
						}
						for (
							var i = 0, list = state.backReferenceNames;
							i < list.length;
							i += 1
						) {
							var name = list[i];

							if (state.groupNames.indexOf(name) === -1) {
								state.raise('Invalid named capture referenced');
							}
						}
					};

					// https://www.ecma-international.org/ecma-262/8.0/#prod-Disjunction
					pp$8.regexp_disjunction = function (state) {
						this.regexp_alternative(state);
						while (state.eat(0x7c /* | */)) {
							this.regexp_alternative(state);
						}

						// Make the same message as V8.
						if (this.regexp_eatQuantifier(state, true)) {
							state.raise('Nothing to repeat');
						}
						if (state.eat(0x7b /* { */)) {
							state.raise('Lone quantifier brackets');
						}
					};

					// https://www.ecma-international.org/ecma-262/8.0/#prod-Alternative
					pp$8.regexp_alternative = function (state) {
						while (
							state.pos < state.source.length &&
							this.regexp_eatTerm(state)
						) {}
					};

					// https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-Term
					pp$8.regexp_eatTerm = function (state) {
						if (this.regexp_eatAssertion(state)) {
							// Handle `QuantifiableAssertion Quantifier` alternative.
							// `state.lastAssertionIsQuantifiable` is true if the last eaten Assertion
							// is a QuantifiableAssertion.
							if (
								state.lastAssertionIsQuantifiable &&
								this.regexp_eatQuantifier(state)
							) {
								// Make the same message as V8.
								if (state.switchU) {
									state.raise('Invalid quantifier');
								}
							}
							return true;
						}

						if (
							state.switchU
								? this.regexp_eatAtom(state)
								: this.regexp_eatExtendedAtom(state)
						) {
							this.regexp_eatQuantifier(state);
							return true;
						}

						return false;
					};

					// https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-Assertion
					pp$8.regexp_eatAssertion = function (state) {
						var start = state.pos;
						state.lastAssertionIsQuantifiable = false;

						// ^, $
						if (
							state.eat(0x5e /* ^ */) ||
							state.eat(0x24 /* $ */)
						) {
							return true;
						}

						// \b \B
						if (state.eat(0x5c /* \ */)) {
							if (
								state.eat(0x42 /* B */) ||
								state.eat(0x62 /* b */)
							) {
								return true;
							}
							state.pos = start;
						}

						// Lookahead / Lookbehind
						if (
							state.eat(0x28 /* ( */) &&
							state.eat(0x3f /* ? */)
						) {
							var lookbehind = false;
							if (this.options.ecmaVersion >= 9) {
								lookbehind = state.eat(0x3c /* < */);
							}
							if (
								state.eat(0x3d /* = */) ||
								state.eat(0x21 /* ! */)
							) {
								this.regexp_disjunction(state);
								if (!state.eat(0x29 /* ) */)) {
									state.raise('Unterminated group');
								}
								state.lastAssertionIsQuantifiable = !lookbehind;
								return true;
							}
						}

						state.pos = start;
						return false;
					};

					// https://www.ecma-international.org/ecma-262/8.0/#prod-Quantifier
					pp$8.regexp_eatQuantifier = function (state, noError) {
						if (noError === void 0) noError = false;

						if (this.regexp_eatQuantifierPrefix(state, noError)) {
							state.eat(0x3f /* ? */);
							return true;
						}
						return false;
					};

					// https://www.ecma-international.org/ecma-262/8.0/#prod-QuantifierPrefix
					pp$8.regexp_eatQuantifierPrefix = function (
						state,
						noError
					) {
						return (
							state.eat(0x2a /* * */) ||
							state.eat(0x2b /* + */) ||
							state.eat(0x3f /* ? */) ||
							this.regexp_eatBracedQuantifier(state, noError)
						);
					};
					pp$8.regexp_eatBracedQuantifier = function (
						state,
						noError
					) {
						var start = state.pos;
						if (state.eat(0x7b /* { */)) {
							var min = 0,
								max = -1;
							if (this.regexp_eatDecimalDigits(state)) {
								min = state.lastIntValue;
								if (
									state.eat(0x2c /* , */) &&
									this.regexp_eatDecimalDigits(state)
								) {
									max = state.lastIntValue;
								}
								if (state.eat(0x7d /* } */)) {
									// SyntaxError in https://www.ecma-international.org/ecma-262/8.0/#sec-term
									if (max !== -1 && max < min && !noError) {
										state.raise(
											'numbers out of order in {} quantifier'
										);
									}
									return true;
								}
							}
							if (state.switchU && !noError) {
								state.raise('Incomplete quantifier');
							}
							state.pos = start;
						}
						return false;
					};

					// https://www.ecma-international.org/ecma-262/8.0/#prod-Atom
					pp$8.regexp_eatAtom = function (state) {
						return (
							this.regexp_eatPatternCharacters(state) ||
							state.eat(0x2e /* . */) ||
							this.regexp_eatReverseSolidusAtomEscape(state) ||
							this.regexp_eatCharacterClass(state) ||
							this.regexp_eatUncapturingGroup(state) ||
							this.regexp_eatCapturingGroup(state)
						);
					};
					pp$8.regexp_eatReverseSolidusAtomEscape = function (state) {
						var start = state.pos;
						if (state.eat(0x5c /* \ */)) {
							if (this.regexp_eatAtomEscape(state)) {
								return true;
							}
							state.pos = start;
						}
						return false;
					};
					pp$8.regexp_eatUncapturingGroup = function (state) {
						var start = state.pos;
						if (state.eat(0x28 /* ( */)) {
							if (
								state.eat(0x3f /* ? */) &&
								state.eat(0x3a /* : */)
							) {
								this.regexp_disjunction(state);
								if (state.eat(0x29 /* ) */)) {
									return true;
								}
								state.raise('Unterminated group');
							}
							state.pos = start;
						}
						return false;
					};
					pp$8.regexp_eatCapturingGroup = function (state) {
						if (state.eat(0x28 /* ( */)) {
							if (this.options.ecmaVersion >= 9) {
								this.regexp_groupSpecifier(state);
							} else if (state.current() === 0x3f /* ? */) {
								state.raise('Invalid group');
							}
							this.regexp_disjunction(state);
							if (state.eat(0x29 /* ) */)) {
								state.numCapturingParens += 1;
								return true;
							}
							state.raise('Unterminated group');
						}
						return false;
					};

					// https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-ExtendedAtom
					pp$8.regexp_eatExtendedAtom = function (state) {
						return (
							state.eat(0x2e /* . */) ||
							this.regexp_eatReverseSolidusAtomEscape(state) ||
							this.regexp_eatCharacterClass(state) ||
							this.regexp_eatUncapturingGroup(state) ||
							this.regexp_eatCapturingGroup(state) ||
							this.regexp_eatInvalidBracedQuantifier(state) ||
							this.regexp_eatExtendedPatternCharacter(state)
						);
					};

					// https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-InvalidBracedQuantifier
					pp$8.regexp_eatInvalidBracedQuantifier = function (state) {
						if (this.regexp_eatBracedQuantifier(state, true)) {
							state.raise('Nothing to repeat');
						}
						return false;
					};

					// https://www.ecma-international.org/ecma-262/8.0/#prod-SyntaxCharacter
					pp$8.regexp_eatSyntaxCharacter = function (state) {
						var ch = state.current();
						if (isSyntaxCharacter(ch)) {
							state.lastIntValue = ch;
							state.advance();
							return true;
						}
						return false;
					};
					function isSyntaxCharacter(ch) {
						return (
							ch === 0x24 /* $ */ ||
							(ch >= 0x28 /* ( */ && ch <= 0x2b) /* + */ ||
							ch === 0x2e /* . */ ||
							ch === 0x3f /* ? */ ||
							(ch >= 0x5b /* [ */ && ch <= 0x5e) /* ^ */ ||
							(ch >= 0x7b /* { */ && ch <= 0x7d) /* } */
						);
					}

					// https://www.ecma-international.org/ecma-262/8.0/#prod-PatternCharacter
					// But eat eager.
					pp$8.regexp_eatPatternCharacters = function (state) {
						var start = state.pos;
						var ch = 0;
						while (
							(ch = state.current()) !== -1 &&
							!isSyntaxCharacter(ch)
						) {
							state.advance();
						}
						return state.pos !== start;
					};

					// https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-ExtendedPatternCharacter
					pp$8.regexp_eatExtendedPatternCharacter = function (state) {
						var ch = state.current();
						if (
							ch !== -1 &&
							ch !== 0x24 /* $ */ &&
							!((ch >= 0x28 /* ( */ && ch <= 0x2b) /* + */) &&
							ch !== 0x2e /* . */ &&
							ch !== 0x3f /* ? */ &&
							ch !== 0x5b /* [ */ &&
							ch !== 0x5e /* ^ */ &&
							ch !== 0x7c /* | */
						) {
							state.advance();
							return true;
						}
						return false;
					};

					// GroupSpecifier[U] ::
					//   [empty]
					//   `?` GroupName[?U]
					pp$8.regexp_groupSpecifier = function (state) {
						if (state.eat(0x3f /* ? */)) {
							if (this.regexp_eatGroupName(state)) {
								if (
									state.groupNames.indexOf(
										state.lastStringValue
									) !== -1
								) {
									state.raise('Duplicate capture group name');
								}
								state.groupNames.push(state.lastStringValue);
								return;
							}
							state.raise('Invalid group');
						}
					};

					// GroupName[U] ::
					//   `<` RegExpIdentifierName[?U] `>`
					// Note: this updates `state.lastStringValue` property with the eaten name.
					pp$8.regexp_eatGroupName = function (state) {
						state.lastStringValue = '';
						if (state.eat(0x3c /* < */)) {
							if (
								this.regexp_eatRegExpIdentifierName(state) &&
								state.eat(0x3e /* > */)
							) {
								return true;
							}
							state.raise('Invalid capture group name');
						}
						return false;
					};

					// RegExpIdentifierName[U] ::
					//   RegExpIdentifierStart[?U]
					//   RegExpIdentifierName[?U] RegExpIdentifierPart[?U]
					// Note: this updates `state.lastStringValue` property with the eaten name.
					pp$8.regexp_eatRegExpIdentifierName = function (state) {
						state.lastStringValue = '';
						if (this.regexp_eatRegExpIdentifierStart(state)) {
							state.lastStringValue += codePointToString(
								state.lastIntValue
							);
							while (this.regexp_eatRegExpIdentifierPart(state)) {
								state.lastStringValue += codePointToString(
									state.lastIntValue
								);
							}
							return true;
						}
						return false;
					};

					// RegExpIdentifierStart[U] ::
					//   UnicodeIDStart
					//   `$`
					//   `_`
					//   `\` RegExpUnicodeEscapeSequence[?U]
					pp$8.regexp_eatRegExpIdentifierStart = function (state) {
						var start = state.pos;
						var ch = state.current();
						state.advance();

						if (
							ch === 0x5c /* \ */ &&
							this.regexp_eatRegExpUnicodeEscapeSequence(state)
						) {
							ch = state.lastIntValue;
						}
						if (isRegExpIdentifierStart(ch)) {
							state.lastIntValue = ch;
							return true;
						}

						state.pos = start;
						return false;
					};
					function isRegExpIdentifierStart(ch) {
						return (
							isIdentifierStart(ch, true) ||
							ch === 0x24 /* $ */ ||
							ch === 0x5f
						); /* _ */
					}

					// RegExpIdentifierPart[U] ::
					//   UnicodeIDContinue
					//   `$`
					//   `_`
					//   `\` RegExpUnicodeEscapeSequence[?U]
					//   <ZWNJ>
					//   <ZWJ>
					pp$8.regexp_eatRegExpIdentifierPart = function (state) {
						var start = state.pos;
						var ch = state.current();
						state.advance();

						if (
							ch === 0x5c /* \ */ &&
							this.regexp_eatRegExpUnicodeEscapeSequence(state)
						) {
							ch = state.lastIntValue;
						}
						if (isRegExpIdentifierPart(ch)) {
							state.lastIntValue = ch;
							return true;
						}

						state.pos = start;
						return false;
					};
					function isRegExpIdentifierPart(ch) {
						return (
							isIdentifierChar(ch, true) ||
							ch === 0x24 /* $ */ ||
							ch === 0x5f /* _ */ ||
							ch === 0x200c /* <ZWNJ> */ ||
							ch === 0x200d
						); /* <ZWJ> */
					}

					// https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-AtomEscape
					pp$8.regexp_eatAtomEscape = function (state) {
						if (
							this.regexp_eatBackReference(state) ||
							this.regexp_eatCharacterClassEscape(state) ||
							this.regexp_eatCharacterEscape(state) ||
							(state.switchN && this.regexp_eatKGroupName(state))
						) {
							return true;
						}
						if (state.switchU) {
							// Make the same message as V8.
							if (state.current() === 0x63 /* c */) {
								state.raise('Invalid unicode escape');
							}
							state.raise('Invalid escape');
						}
						return false;
					};
					pp$8.regexp_eatBackReference = function (state) {
						var start = state.pos;
						if (this.regexp_eatDecimalEscape(state)) {
							var n = state.lastIntValue;
							if (state.switchU) {
								// For SyntaxError in https://www.ecma-international.org/ecma-262/8.0/#sec-atomescape
								if (n > state.maxBackReference) {
									state.maxBackReference = n;
								}
								return true;
							}
							if (n <= state.numCapturingParens) {
								return true;
							}
							state.pos = start;
						}
						return false;
					};
					pp$8.regexp_eatKGroupName = function (state) {
						if (state.eat(0x6b /* k */)) {
							if (this.regexp_eatGroupName(state)) {
								state.backReferenceNames.push(
									state.lastStringValue
								);
								return true;
							}
							state.raise('Invalid named reference');
						}
						return false;
					};

					// https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-CharacterEscape
					pp$8.regexp_eatCharacterEscape = function (state) {
						return (
							this.regexp_eatControlEscape(state) ||
							this.regexp_eatCControlLetter(state) ||
							this.regexp_eatZero(state) ||
							this.regexp_eatHexEscapeSequence(state) ||
							this.regexp_eatRegExpUnicodeEscapeSequence(state) ||
							(!state.switchU &&
								this.regexp_eatLegacyOctalEscapeSequence(
									state
								)) ||
							this.regexp_eatIdentityEscape(state)
						);
					};
					pp$8.regexp_eatCControlLetter = function (state) {
						var start = state.pos;
						if (state.eat(0x63 /* c */)) {
							if (this.regexp_eatControlLetter(state)) {
								return true;
							}
							state.pos = start;
						}
						return false;
					};
					pp$8.regexp_eatZero = function (state) {
						if (
							state.current() === 0x30 /* 0 */ &&
							!isDecimalDigit(state.lookahead())
						) {
							state.lastIntValue = 0;
							state.advance();
							return true;
						}
						return false;
					};

					// https://www.ecma-international.org/ecma-262/8.0/#prod-ControlEscape
					pp$8.regexp_eatControlEscape = function (state) {
						var ch = state.current();
						if (ch === 0x74 /* t */) {
							state.lastIntValue = 0x09; /* \t */
							state.advance();
							return true;
						}
						if (ch === 0x6e /* n */) {
							state.lastIntValue = 0x0a; /* \n */
							state.advance();
							return true;
						}
						if (ch === 0x76 /* v */) {
							state.lastIntValue = 0x0b; /* \v */
							state.advance();
							return true;
						}
						if (ch === 0x66 /* f */) {
							state.lastIntValue = 0x0c; /* \f */
							state.advance();
							return true;
						}
						if (ch === 0x72 /* r */) {
							state.lastIntValue = 0x0d; /* \r */
							state.advance();
							return true;
						}
						return false;
					};

					// https://www.ecma-international.org/ecma-262/8.0/#prod-ControlLetter
					pp$8.regexp_eatControlLetter = function (state) {
						var ch = state.current();
						if (isControlLetter(ch)) {
							state.lastIntValue = ch % 0x20;
							state.advance();
							return true;
						}
						return false;
					};
					function isControlLetter(ch) {
						return (
							(ch >= 0x41 /* A */ && ch <= 0x5a) /* Z */ ||
							(ch >= 0x61 /* a */ && ch <= 0x7a) /* z */
						);
					}

					// https://www.ecma-international.org/ecma-262/8.0/#prod-RegExpUnicodeEscapeSequence
					pp$8.regexp_eatRegExpUnicodeEscapeSequence = function (
						state
					) {
						var start = state.pos;

						if (state.eat(0x75 /* u */)) {
							if (this.regexp_eatFixedHexDigits(state, 4)) {
								var lead = state.lastIntValue;
								if (
									state.switchU &&
									lead >= 0xd800 &&
									lead <= 0xdbff
								) {
									var leadSurrogateEnd = state.pos;
									if (
										state.eat(0x5c /* \ */) &&
										state.eat(0x75 /* u */) &&
										this.regexp_eatFixedHexDigits(state, 4)
									) {
										var trail = state.lastIntValue;
										if (
											trail >= 0xdc00 &&
											trail <= 0xdfff
										) {
											state.lastIntValue =
												(lead - 0xd800) * 0x400 +
												(trail - 0xdc00) +
												0x10000;
											return true;
										}
									}
									state.pos = leadSurrogateEnd;
									state.lastIntValue = lead;
								}
								return true;
							}
							if (
								state.switchU &&
								state.eat(0x7b /* { */) &&
								this.regexp_eatHexDigits(state) &&
								state.eat(0x7d /* } */) &&
								isValidUnicode(state.lastIntValue)
							) {
								return true;
							}
							if (state.switchU) {
								state.raise('Invalid unicode escape');
							}
							state.pos = start;
						}

						return false;
					};
					function isValidUnicode(ch) {
						return ch >= 0 && ch <= 0x10ffff;
					}

					// https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-IdentityEscape
					pp$8.regexp_eatIdentityEscape = function (state) {
						if (state.switchU) {
							if (this.regexp_eatSyntaxCharacter(state)) {
								return true;
							}
							if (state.eat(0x2f /* / */)) {
								state.lastIntValue = 0x2f; /* / */
								return true;
							}
							return false;
						}

						var ch = state.current();
						if (
							ch !== 0x63 /* c */ &&
							(!state.switchN || ch !== 0x6b) /* k */
						) {
							state.lastIntValue = ch;
							state.advance();
							return true;
						}

						return false;
					};

					// https://www.ecma-international.org/ecma-262/8.0/#prod-DecimalEscape
					pp$8.regexp_eatDecimalEscape = function (state) {
						state.lastIntValue = 0;
						var ch = state.current();
						if (ch >= 0x31 /* 1 */ && ch <= 0x39 /* 9 */) {
							do {
								state.lastIntValue =
									10 * state.lastIntValue +
									(ch - 0x30) /* 0 */;
								state.advance();
							} while (
								(ch = state.current()) >= 0x30 /* 0 */ &&
								ch <= 0x39 /* 9 */
							);
							return true;
						}
						return false;
					};

					// https://www.ecma-international.org/ecma-262/8.0/#prod-CharacterClassEscape
					pp$8.regexp_eatCharacterClassEscape = function (state) {
						var ch = state.current();

						if (isCharacterClassEscape(ch)) {
							state.lastIntValue = -1;
							state.advance();
							return true;
						}

						if (
							state.switchU &&
							this.options.ecmaVersion >= 9 &&
							(ch === 0x50 /* P */ || ch === 0x70) /* p */
						) {
							state.lastIntValue = -1;
							state.advance();
							if (
								state.eat(0x7b /* { */) &&
								this.regexp_eatUnicodePropertyValueExpression(
									state
								) &&
								state.eat(0x7d /* } */)
							) {
								return true;
							}
							state.raise('Invalid property name');
						}

						return false;
					};
					function isCharacterClassEscape(ch) {
						return (
							ch === 0x64 /* d */ ||
							ch === 0x44 /* D */ ||
							ch === 0x73 /* s */ ||
							ch === 0x53 /* S */ ||
							ch === 0x77 /* w */ ||
							ch === 0x57 /* W */
						);
					}

					// UnicodePropertyValueExpression ::
					//   UnicodePropertyName `=` UnicodePropertyValue
					//   LoneUnicodePropertyNameOrValue
					pp$8.regexp_eatUnicodePropertyValueExpression = function (
						state
					) {
						var start = state.pos;

						// UnicodePropertyName `=` UnicodePropertyValue
						if (
							this.regexp_eatUnicodePropertyName(state) &&
							state.eat(0x3d /* = */)
						) {
							var name = state.lastStringValue;
							if (this.regexp_eatUnicodePropertyValue(state)) {
								var value = state.lastStringValue;
								this.regexp_validateUnicodePropertyNameAndValue(
									state,
									name,
									value
								);
								return true;
							}
						}
						state.pos = start;

						// LoneUnicodePropertyNameOrValue
						if (
							this.regexp_eatLoneUnicodePropertyNameOrValue(state)
						) {
							var nameOrValue = state.lastStringValue;
							this.regexp_validateUnicodePropertyNameOrValue(
								state,
								nameOrValue
							);
							return true;
						}
						return false;
					};
					pp$8.regexp_validateUnicodePropertyNameAndValue = function (
						state,
						name,
						value
					) {
						if (!has(state.unicodeProperties.nonBinary, name)) {
							state.raise('Invalid property name');
						}
						if (
							!state.unicodeProperties.nonBinary[name].test(value)
						) {
							state.raise('Invalid property value');
						}
					};
					pp$8.regexp_validateUnicodePropertyNameOrValue = function (
						state,
						nameOrValue
					) {
						if (!state.unicodeProperties.binary.test(nameOrValue)) {
							state.raise('Invalid property name');
						}
					};

					// UnicodePropertyName ::
					//   UnicodePropertyNameCharacters
					pp$8.regexp_eatUnicodePropertyName = function (state) {
						var ch = 0;
						state.lastStringValue = '';
						while (
							isUnicodePropertyNameCharacter(
								(ch = state.current())
							)
						) {
							state.lastStringValue += codePointToString(ch);
							state.advance();
						}
						return state.lastStringValue !== '';
					};
					function isUnicodePropertyNameCharacter(ch) {
						return isControlLetter(ch) || ch === 0x5f; /* _ */
					}

					// UnicodePropertyValue ::
					//   UnicodePropertyValueCharacters
					pp$8.regexp_eatUnicodePropertyValue = function (state) {
						var ch = 0;
						state.lastStringValue = '';
						while (
							isUnicodePropertyValueCharacter(
								(ch = state.current())
							)
						) {
							state.lastStringValue += codePointToString(ch);
							state.advance();
						}
						return state.lastStringValue !== '';
					};
					function isUnicodePropertyValueCharacter(ch) {
						return (
							isUnicodePropertyNameCharacter(ch) ||
							isDecimalDigit(ch)
						);
					}

					// LoneUnicodePropertyNameOrValue ::
					//   UnicodePropertyValueCharacters
					pp$8.regexp_eatLoneUnicodePropertyNameOrValue = function (
						state
					) {
						return this.regexp_eatUnicodePropertyValue(state);
					};

					// https://www.ecma-international.org/ecma-262/8.0/#prod-CharacterClass
					pp$8.regexp_eatCharacterClass = function (state) {
						if (state.eat(0x5b /* [ */)) {
							state.eat(0x5e /* ^ */);
							this.regexp_classRanges(state);
							if (state.eat(0x5d /* [ */)) {
								return true;
							}
							// Unreachable since it threw "unterminated regular expression" error before.
							state.raise('Unterminated character class');
						}
						return false;
					};

					// https://www.ecma-international.org/ecma-262/8.0/#prod-ClassRanges
					// https://www.ecma-international.org/ecma-262/8.0/#prod-NonemptyClassRanges
					// https://www.ecma-international.org/ecma-262/8.0/#prod-NonemptyClassRangesNoDash
					pp$8.regexp_classRanges = function (state) {
						while (this.regexp_eatClassAtom(state)) {
							var left = state.lastIntValue;
							if (
								state.eat(0x2d /* - */) &&
								this.regexp_eatClassAtom(state)
							) {
								var right = state.lastIntValue;
								if (
									state.switchU &&
									(left === -1 || right === -1)
								) {
									state.raise('Invalid character class');
								}
								if (
									left !== -1 &&
									right !== -1 &&
									left > right
								) {
									state.raise(
										'Range out of order in character class'
									);
								}
							}
						}
					};

					// https://www.ecma-international.org/ecma-262/8.0/#prod-ClassAtom
					// https://www.ecma-international.org/ecma-262/8.0/#prod-ClassAtomNoDash
					pp$8.regexp_eatClassAtom = function (state) {
						var start = state.pos;

						if (state.eat(0x5c /* \ */)) {
							if (this.regexp_eatClassEscape(state)) {
								return true;
							}
							if (state.switchU) {
								// Make the same message as V8.
								var ch$1 = state.current();
								if (
									ch$1 === 0x63 /* c */ ||
									isOctalDigit(ch$1)
								) {
									state.raise('Invalid class escape');
								}
								state.raise('Invalid escape');
							}
							state.pos = start;
						}

						var ch = state.current();
						if (ch !== 0x5d /* [ */) {
							state.lastIntValue = ch;
							state.advance();
							return true;
						}

						return false;
					};

					// https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-ClassEscape
					pp$8.regexp_eatClassEscape = function (state) {
						var start = state.pos;

						if (state.eat(0x62 /* b */)) {
							state.lastIntValue = 0x08; /* <BS> */
							return true;
						}

						if (state.switchU && state.eat(0x2d /* - */)) {
							state.lastIntValue = 0x2d; /* - */
							return true;
						}

						if (!state.switchU && state.eat(0x63 /* c */)) {
							if (this.regexp_eatClassControlLetter(state)) {
								return true;
							}
							state.pos = start;
						}

						return (
							this.regexp_eatCharacterClassEscape(state) ||
							this.regexp_eatCharacterEscape(state)
						);
					};

					// https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-ClassControlLetter
					pp$8.regexp_eatClassControlLetter = function (state) {
						var ch = state.current();
						if (isDecimalDigit(ch) || ch === 0x5f /* _ */) {
							state.lastIntValue = ch % 0x20;
							state.advance();
							return true;
						}
						return false;
					};

					// https://www.ecma-international.org/ecma-262/8.0/#prod-HexEscapeSequence
					pp$8.regexp_eatHexEscapeSequence = function (state) {
						var start = state.pos;
						if (state.eat(0x78 /* x */)) {
							if (this.regexp_eatFixedHexDigits(state, 2)) {
								return true;
							}
							if (state.switchU) {
								state.raise('Invalid escape');
							}
							state.pos = start;
						}
						return false;
					};

					// https://www.ecma-international.org/ecma-262/8.0/#prod-DecimalDigits
					pp$8.regexp_eatDecimalDigits = function (state) {
						var start = state.pos;
						var ch = 0;
						state.lastIntValue = 0;
						while (isDecimalDigit((ch = state.current()))) {
							state.lastIntValue =
								10 * state.lastIntValue + (ch - 0x30) /* 0 */;
							state.advance();
						}
						return state.pos !== start;
					};
					function isDecimalDigit(ch) {
						return ch >= 0x30 /* 0 */ && ch <= 0x39; /* 9 */
					}

					// https://www.ecma-international.org/ecma-262/8.0/#prod-HexDigits
					pp$8.regexp_eatHexDigits = function (state) {
						var start = state.pos;
						var ch = 0;
						state.lastIntValue = 0;
						while (isHexDigit((ch = state.current()))) {
							state.lastIntValue =
								16 * state.lastIntValue + hexToInt(ch);
							state.advance();
						}
						return state.pos !== start;
					};
					function isHexDigit(ch) {
						return (
							(ch >= 0x30 /* 0 */ && ch <= 0x39) /* 9 */ ||
							(ch >= 0x41 /* A */ && ch <= 0x46) /* F */ ||
							(ch >= 0x61 /* a */ && ch <= 0x66) /* f */
						);
					}
					function hexToInt(ch) {
						if (ch >= 0x41 /* A */ && ch <= 0x46 /* F */) {
							return 10 + (ch - 0x41) /* A */;
						}
						if (ch >= 0x61 /* a */ && ch <= 0x66 /* f */) {
							return 10 + (ch - 0x61) /* a */;
						}
						return ch - 0x30; /* 0 */
					}

					// https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-LegacyOctalEscapeSequence
					// Allows only 0-377(octal) i.e. 0-255(decimal).
					pp$8.regexp_eatLegacyOctalEscapeSequence = function (
						state
					) {
						if (this.regexp_eatOctalDigit(state)) {
							var n1 = state.lastIntValue;
							if (this.regexp_eatOctalDigit(state)) {
								var n2 = state.lastIntValue;
								if (
									n1 <= 3 &&
									this.regexp_eatOctalDigit(state)
								) {
									state.lastIntValue =
										n1 * 64 + n2 * 8 + state.lastIntValue;
								} else {
									state.lastIntValue = n1 * 8 + n2;
								}
							} else {
								state.lastIntValue = n1;
							}
							return true;
						}
						return false;
					};

					// https://www.ecma-international.org/ecma-262/8.0/#prod-OctalDigit
					pp$8.regexp_eatOctalDigit = function (state) {
						var ch = state.current();
						if (isOctalDigit(ch)) {
							state.lastIntValue = ch - 0x30; /* 0 */
							state.advance();
							return true;
						}
						state.lastIntValue = 0;
						return false;
					};
					function isOctalDigit(ch) {
						return ch >= 0x30 /* 0 */ && ch <= 0x37; /* 7 */
					}

					// https://www.ecma-international.org/ecma-262/8.0/#prod-Hex4Digits
					// https://www.ecma-international.org/ecma-262/8.0/#prod-HexDigit
					// And HexDigit HexDigit in https://www.ecma-international.org/ecma-262/8.0/#prod-HexEscapeSequence
					pp$8.regexp_eatFixedHexDigits = function (state, length) {
						var start = state.pos;
						state.lastIntValue = 0;
						for (var i = 0; i < length; ++i) {
							var ch = state.current();
							if (!isHexDigit(ch)) {
								state.pos = start;
								return false;
							}
							state.lastIntValue =
								16 * state.lastIntValue + hexToInt(ch);
							state.advance();
						}
						return true;
					};

					// Object type used to represent tokens. Note that normally, tokens
					// simply exist as properties on the parser object. This is only
					// used for the onToken callback and the external tokenizer.

					var Token = function Token(p) {
						this.type = p.type;
						this.value = p.value;
						this.start = p.start;
						this.end = p.end;
						if (p.options.locations) {
							this.loc = new SourceLocation(
								p,
								p.startLoc,
								p.endLoc
							);
						}
						if (p.options.ranges) {
							this.range = [p.start, p.end];
						}
					};

					// ## Tokenizer

					var pp$9 = Parser.prototype;

					// Move to the next token

					pp$9.next = function () {
						if (this.options.onToken) {
							this.options.onToken(new Token(this));
						}

						this.lastTokEnd = this.end;
						this.lastTokStart = this.start;
						this.lastTokEndLoc = this.endLoc;
						this.lastTokStartLoc = this.startLoc;
						this.nextToken();
					};

					pp$9.getToken = function () {
						this.next();
						return new Token(this);
					};

					// If we're in an ES6 environment, make parsers iterable
					if (typeof Symbol !== 'undefined') {
						pp$9[Symbol.iterator] = function () {
							var this$1 = this;

							return {
								next: function () {
									var token = this$1.getToken();
									return {
										done: token.type === types.eof,
										value: token,
									};
								},
							};
						};
					}

					// Toggle strict mode. Re-reads the next number or string to please
					// pedantic tests (` 010;` should fail).

					pp$9.curContext = function () {
						return this.context[this.context.length - 1];
					};

					// Read a single token, updating the parser object's token-related
					// properties.

					pp$9.nextToken = function () {
						var curContext = this.curContext();
						if (!curContext || !curContext.preserveSpace) {
							this.skipSpace();
						}

						this.start = this.pos;
						if (this.options.locations) {
							this.startLoc = this.curPosition();
						}
						if (this.pos >= this.input.length) {
							return this.finishToken(types.eof);
						}

						if (curContext.override) {
							return curContext.override(this);
						} else {
							this.readToken(this.fullCharCodeAtPos());
						}
					};

					pp$9.readToken = function (code) {
						// Identifier or keyword. '\uXXXX' sequences are allowed in
						// identifiers, so '\' also dispatches to that.
						if (
							isIdentifierStart(
								code,
								this.options.ecmaVersion >= 6
							) ||
							code === 92 /* '\' */
						) {
							return this.readWord();
						}

						return this.getTokenFromCode(code);
					};

					pp$9.fullCharCodeAtPos = function () {
						var code = this.input.charCodeAt(this.pos);
						if (code <= 0xd7ff || code >= 0xe000) {
							return code;
						}
						var next = this.input.charCodeAt(this.pos + 1);
						return (code << 10) + next - 0x35fdc00;
					};

					pp$9.skipBlockComment = function () {
						var startLoc =
							this.options.onComment && this.curPosition();
						var start = this.pos,
							end = this.input.indexOf('*/', (this.pos += 2));
						if (end === -1) {
							this.raise(this.pos - 2, 'Unterminated comment');
						}
						this.pos = end + 2;
						if (this.options.locations) {
							lineBreakG.lastIndex = start;
							var match;
							while (
								(match = lineBreakG.exec(this.input)) &&
								match.index < this.pos
							) {
								++this.curLine;
								this.lineStart = match.index + match[0].length;
							}
						}
						if (this.options.onComment) {
							this.options.onComment(
								true,
								this.input.slice(start + 2, end),
								start,
								this.pos,
								startLoc,
								this.curPosition()
							);
						}
					};

					pp$9.skipLineComment = function (startSkip) {
						var start = this.pos;
						var startLoc =
							this.options.onComment && this.curPosition();
						var ch = this.input.charCodeAt((this.pos += startSkip));
						while (this.pos < this.input.length && !isNewLine(ch)) {
							ch = this.input.charCodeAt(++this.pos);
						}
						if (this.options.onComment) {
							this.options.onComment(
								false,
								this.input.slice(start + startSkip, this.pos),
								start,
								this.pos,
								startLoc,
								this.curPosition()
							);
						}
					};

					// Called at the start of the parse and after every token. Skips
					// whitespace and comments, and.

					pp$9.skipSpace = function () {
						loop: while (this.pos < this.input.length) {
							var ch = this.input.charCodeAt(this.pos);
							switch (ch) {
								case 32:
								case 160: // ' '
									++this.pos;
									break;
								case 13:
									if (
										this.input.charCodeAt(this.pos + 1) ===
										10
									) {
										++this.pos;
									}
								case 10:
								case 8232:
								case 8233:
									++this.pos;
									if (this.options.locations) {
										++this.curLine;
										this.lineStart = this.pos;
									}
									break;
								case 47: // '/'
									switch (
										this.input.charCodeAt(this.pos + 1)
									) {
										case 42: // '*'
											this.skipBlockComment();
											break;
										case 47:
											this.skipLineComment(2);
											break;
										default:
											break loop;
									}
									break;
								default:
									if (
										(ch > 8 && ch < 14) ||
										(ch >= 5760 &&
											nonASCIIwhitespace.test(
												String.fromCharCode(ch)
											))
									) {
										++this.pos;
									} else {
										break loop;
									}
							}
						}
					};

					// Called at the end of every token. Sets `end`, `val`, and
					// maintains `context` and `exprAllowed`, and skips the space after
					// the token, so that the next one's `start` will point at the
					// right position.

					pp$9.finishToken = function (type, val) {
						this.end = this.pos;
						if (this.options.locations) {
							this.endLoc = this.curPosition();
						}
						var prevType = this.type;
						this.type = type;
						this.value = val;

						this.updateContext(prevType);
					};

					// ### Token reading

					// This is the function that is called to fetch the next token. It
					// is somewhat obscure, because it works in character codes rather
					// than characters, and because operator parsing has been inlined
					// into it.
					//
					// All in the name of speed.
					//
					pp$9.readToken_dot = function () {
						var next = this.input.charCodeAt(this.pos + 1);
						if (next >= 48 && next <= 57) {
							return this.readNumber(true);
						}
						var next2 = this.input.charCodeAt(this.pos + 2);
						if (
							this.options.ecmaVersion >= 6 &&
							next === 46 &&
							next2 === 46
						) {
							// 46 = dot '.'
							this.pos += 3;
							return this.finishToken(types.ellipsis);
						} else {
							++this.pos;
							return this.finishToken(types.dot);
						}
					};

					pp$9.readToken_slash = function () {
						// '/'
						var next = this.input.charCodeAt(this.pos + 1);
						if (this.exprAllowed) {
							++this.pos;
							return this.readRegexp();
						}
						if (next === 61) {
							return this.finishOp(types.assign, 2);
						}
						return this.finishOp(types.slash, 1);
					};

					pp$9.readToken_mult_modulo_exp = function (code) {
						// '%*'
						var next = this.input.charCodeAt(this.pos + 1);
						var size = 1;
						var tokentype = code === 42 ? types.star : types.modulo;

						// exponentiation operator ** and **=
						if (
							this.options.ecmaVersion >= 7 &&
							code === 42 &&
							next === 42
						) {
							++size;
							tokentype = types.starstar;
							next = this.input.charCodeAt(this.pos + 2);
						}

						if (next === 61) {
							return this.finishOp(types.assign, size + 1);
						}
						return this.finishOp(tokentype, size);
					};

					pp$9.readToken_pipe_amp = function (code) {
						// '|&'
						var next = this.input.charCodeAt(this.pos + 1);
						if (next === code) {
							return this.finishOp(
								code === 124
									? types.logicalOR
									: types.logicalAND,
								2
							);
						}
						if (next === 61) {
							return this.finishOp(types.assign, 2);
						}
						return this.finishOp(
							code === 124 ? types.bitwiseOR : types.bitwiseAND,
							1
						);
					};

					pp$9.readToken_caret = function () {
						// '^'
						var next = this.input.charCodeAt(this.pos + 1);
						if (next === 61) {
							return this.finishOp(types.assign, 2);
						}
						return this.finishOp(types.bitwiseXOR, 1);
					};

					pp$9.readToken_plus_min = function (code) {
						// '+-'
						var next = this.input.charCodeAt(this.pos + 1);
						if (next === code) {
							if (
								next === 45 &&
								!this.inModule &&
								this.input.charCodeAt(this.pos + 2) === 62 &&
								(this.lastTokEnd === 0 ||
									lineBreak.test(
										this.input.slice(
											this.lastTokEnd,
											this.pos
										)
									))
							) {
								// A `-->` line comment
								this.skipLineComment(3);
								this.skipSpace();
								return this.nextToken();
							}
							return this.finishOp(types.incDec, 2);
						}
						if (next === 61) {
							return this.finishOp(types.assign, 2);
						}
						return this.finishOp(types.plusMin, 1);
					};

					pp$9.readToken_lt_gt = function (code) {
						// '<>'
						var next = this.input.charCodeAt(this.pos + 1);
						var size = 1;
						if (next === code) {
							size =
								code === 62 &&
								this.input.charCodeAt(this.pos + 2) === 62
									? 3
									: 2;
							if (this.input.charCodeAt(this.pos + size) === 61) {
								return this.finishOp(types.assign, size + 1);
							}
							return this.finishOp(types.bitShift, size);
						}
						if (
							next === 33 &&
							code === 60 &&
							!this.inModule &&
							this.input.charCodeAt(this.pos + 2) === 45 &&
							this.input.charCodeAt(this.pos + 3) === 45
						) {
							// `<!--`, an XML-style comment that should be interpreted as a line comment
							this.skipLineComment(4);
							this.skipSpace();
							return this.nextToken();
						}
						if (next === 61) {
							size = 2;
						}
						return this.finishOp(types.relational, size);
					};

					pp$9.readToken_eq_excl = function (code) {
						// '=!'
						var next = this.input.charCodeAt(this.pos + 1);
						if (next === 61) {
							return this.finishOp(
								types.equality,
								this.input.charCodeAt(this.pos + 2) === 61
									? 3
									: 2
							);
						}
						if (
							code === 61 &&
							next === 62 &&
							this.options.ecmaVersion >= 6
						) {
							// '=>'
							this.pos += 2;
							return this.finishToken(types.arrow);
						}
						return this.finishOp(
							code === 61 ? types.eq : types.prefix,
							1
						);
					};

					pp$9.getTokenFromCode = function (code) {
						switch (code) {
							// The interpretation of a dot depends on whether it is followed
							// by a digit or another two dots.
							case 46: // '.'
								return this.readToken_dot();

							// Punctuation tokens.
							case 40:
								++this.pos;
								return this.finishToken(types.parenL);
							case 41:
								++this.pos;
								return this.finishToken(types.parenR);
							case 59:
								++this.pos;
								return this.finishToken(types.semi);
							case 44:
								++this.pos;
								return this.finishToken(types.comma);
							case 91:
								++this.pos;
								return this.finishToken(types.bracketL);
							case 93:
								++this.pos;
								return this.finishToken(types.bracketR);
							case 123:
								++this.pos;
								return this.finishToken(types.braceL);
							case 125:
								++this.pos;
								return this.finishToken(types.braceR);
							case 58:
								++this.pos;
								return this.finishToken(types.colon);
							case 63:
								++this.pos;
								return this.finishToken(types.question);

							case 96: // '`'
								if (this.options.ecmaVersion < 6) {
									break;
								}
								++this.pos;
								return this.finishToken(types.backQuote);

							case 48: // '0'
								var next = this.input.charCodeAt(this.pos + 1);
								if (next === 120 || next === 88) {
									return this.readRadixNumber(16);
								} // '0x', '0X' - hex number
								if (this.options.ecmaVersion >= 6) {
									if (next === 111 || next === 79) {
										return this.readRadixNumber(8);
									} // '0o', '0O' - octal number
									if (next === 98 || next === 66) {
										return this.readRadixNumber(2);
									} // '0b', '0B' - binary number
								}

							// Anything else beginning with a digit is an integer, octal
							// number, or float.
							case 49:
							case 50:
							case 51:
							case 52:
							case 53:
							case 54:
							case 55:
							case 56:
							case 57: // 1-9
								return this.readNumber(false);

							// Quotes produce strings.
							case 34:
							case 39: // '"', "'"
								return this.readString(code);

							// Operators are parsed inline in tiny state machines. '=' (61) is
							// often referred to. `finishOp` simply skips the amount of
							// characters it is given as second argument, and returns a token
							// of the type given by its first argument.

							case 47: // '/'
								return this.readToken_slash();

							case 37:
							case 42: // '%*'
								return this.readToken_mult_modulo_exp(code);

							case 124:
							case 38: // '|&'
								return this.readToken_pipe_amp(code);

							case 94: // '^'
								return this.readToken_caret();

							case 43:
							case 45: // '+-'
								return this.readToken_plus_min(code);

							case 60:
							case 62: // '<>'
								return this.readToken_lt_gt(code);

							case 61:
							case 33: // '=!'
								return this.readToken_eq_excl(code);

							case 126: // '~'
								return this.finishOp(types.prefix, 1);
						}

						this.raise(
							this.pos,
							"Unexpected character '" +
								codePointToString$1(code) +
								"'"
						);
					};

					pp$9.finishOp = function (type, size) {
						var str = this.input.slice(this.pos, this.pos + size);
						this.pos += size;
						return this.finishToken(type, str);
					};

					pp$9.readRegexp = function () {
						var escaped,
							inClass,
							start = this.pos;
						for (;;) {
							if (this.pos >= this.input.length) {
								this.raise(
									start,
									'Unterminated regular expression'
								);
							}
							var ch = this.input.charAt(this.pos);
							if (lineBreak.test(ch)) {
								this.raise(
									start,
									'Unterminated regular expression'
								);
							}
							if (!escaped) {
								if (ch === '[') {
									inClass = true;
								} else if (ch === ']' && inClass) {
									inClass = false;
								} else if (ch === '/' && !inClass) {
									break;
								}
								escaped = ch === '\\';
							} else {
								escaped = false;
							}
							++this.pos;
						}
						var pattern = this.input.slice(start, this.pos);
						++this.pos;
						var flagsStart = this.pos;
						var flags = this.readWord1();
						if (this.containsEsc) {
							this.unexpected(flagsStart);
						}

						// Validate pattern
						var state =
							this.regexpState ||
							(this.regexpState = new RegExpValidationState(
								this
							));
						state.reset(start, pattern, flags);
						this.validateRegExpFlags(state);
						this.validateRegExpPattern(state);

						// Create Literal#value property value.
						var value = null;
						try {
							value = new RegExp(pattern, flags);
						} catch (e) {
							// ESTree requires null if it failed to instantiate RegExp object.
							// https://github.com/estree/estree/blob/a27003adf4fd7bfad44de9cef372a2eacd527b1c/es5.md#regexpliteral
						}

						return this.finishToken(types.regexp, {
							pattern: pattern,
							flags: flags,
							value: value,
						});
					};

					// Read an integer in the given radix. Return null if zero digits
					// were read, the integer value otherwise. When `len` is given, this
					// will return `null` unless the integer has exactly `len` digits.

					pp$9.readInt = function (radix, len) {
						var start = this.pos,
							total = 0;
						for (
							var i = 0, e = len == null ? Infinity : len;
							i < e;
							++i
						) {
							var code = this.input.charCodeAt(this.pos),
								val = void 0;
							if (code >= 97) {
								val = code - 97 + 10;
							} // a
							else if (code >= 65) {
								val = code - 65 + 10;
							} // A
							else if (code >= 48 && code <= 57) {
								val = code - 48;
							} // 0-9
							else {
								val = Infinity;
							}
							if (val >= radix) {
								break;
							}
							++this.pos;
							total = total * radix + val;
						}
						if (
							this.pos === start ||
							(len != null && this.pos - start !== len)
						) {
							return null;
						}

						return total;
					};

					pp$9.readRadixNumber = function (radix) {
						var start = this.pos;
						this.pos += 2; // 0x
						var val = this.readInt(radix);
						if (val == null) {
							this.raise(
								this.start + 2,
								'Expected number in radix ' + radix
							);
						}
						if (
							this.options.ecmaVersion >= 11 &&
							this.input.charCodeAt(this.pos) === 110
						) {
							val =
								typeof BigInt !== 'undefined'
									? BigInt(this.input.slice(start, this.pos))
									: null;
							++this.pos;
						} else if (
							isIdentifierStart(this.fullCharCodeAtPos())
						) {
							this.raise(
								this.pos,
								'Identifier directly after number'
							);
						}
						return this.finishToken(types.num, val);
					};

					// Read an integer, octal integer, or floating-point number.

					pp$9.readNumber = function (startsWithDot) {
						var start = this.pos;
						if (!startsWithDot && this.readInt(10) === null) {
							this.raise(start, 'Invalid number');
						}
						var octal =
							this.pos - start >= 2 &&
							this.input.charCodeAt(start) === 48;
						if (octal && this.strict) {
							this.raise(start, 'Invalid number');
						}
						if (
							octal &&
							/[89]/.test(this.input.slice(start, this.pos))
						) {
							octal = false;
						}
						var next = this.input.charCodeAt(this.pos);
						if (
							!octal &&
							!startsWithDot &&
							this.options.ecmaVersion >= 11 &&
							next === 110
						) {
							var str$1 = this.input.slice(start, this.pos);
							var val$1 =
								typeof BigInt !== 'undefined'
									? BigInt(str$1)
									: null;
							++this.pos;
							if (isIdentifierStart(this.fullCharCodeAtPos())) {
								this.raise(
									this.pos,
									'Identifier directly after number'
								);
							}
							return this.finishToken(types.num, val$1);
						}
						if (next === 46 && !octal) {
							// '.'
							++this.pos;
							this.readInt(10);
							next = this.input.charCodeAt(this.pos);
						}
						if ((next === 69 || next === 101) && !octal) {
							// 'eE'
							next = this.input.charCodeAt(++this.pos);
							if (next === 43 || next === 45) {
								++this.pos;
							} // '+-'
							if (this.readInt(10) === null) {
								this.raise(start, 'Invalid number');
							}
						}
						if (isIdentifierStart(this.fullCharCodeAtPos())) {
							this.raise(
								this.pos,
								'Identifier directly after number'
							);
						}

						var str = this.input.slice(start, this.pos);
						var val = octal ? parseInt(str, 8) : parseFloat(str);
						return this.finishToken(types.num, val);
					};

					// Read a string value, interpreting backslash-escapes.

					pp$9.readCodePoint = function () {
						var ch = this.input.charCodeAt(this.pos),
							code;

						if (ch === 123) {
							// '{'
							if (this.options.ecmaVersion < 6) {
								this.unexpected();
							}
							var codePos = ++this.pos;
							code = this.readHexChar(
								this.input.indexOf('}', this.pos) - this.pos
							);
							++this.pos;
							if (code > 0x10ffff) {
								this.invalidStringToken(
									codePos,
									'Code point out of bounds'
								);
							}
						} else {
							code = this.readHexChar(4);
						}
						return code;
					};

					function codePointToString$1(code) {
						// UTF-16 Decoding
						if (code <= 0xffff) {
							return String.fromCharCode(code);
						}
						code -= 0x10000;
						return String.fromCharCode(
							(code >> 10) + 0xd800,
							(code & 1023) + 0xdc00
						);
					}

					pp$9.readString = function (quote) {
						var out = '',
							chunkStart = ++this.pos;
						for (;;) {
							if (this.pos >= this.input.length) {
								this.raise(
									this.start,
									'Unterminated string constant'
								);
							}
							var ch = this.input.charCodeAt(this.pos);
							if (ch === quote) {
								break;
							}
							if (ch === 92) {
								// '\'
								out += this.input.slice(chunkStart, this.pos);
								out += this.readEscapedChar(false);
								chunkStart = this.pos;
							} else {
								if (
									isNewLine(
										ch,
										this.options.ecmaVersion >= 10
									)
								) {
									this.raise(
										this.start,
										'Unterminated string constant'
									);
								}
								++this.pos;
							}
						}
						out += this.input.slice(chunkStart, this.pos++);
						return this.finishToken(types.string, out);
					};

					// Reads template string tokens.

					var INVALID_TEMPLATE_ESCAPE_ERROR = {};

					pp$9.tryReadTemplateToken = function () {
						this.inTemplateElement = true;
						try {
							this.readTmplToken();
						} catch (err) {
							if (err === INVALID_TEMPLATE_ESCAPE_ERROR) {
								this.readInvalidTemplateToken();
							} else {
								throw err;
							}
						}

						this.inTemplateElement = false;
					};

					pp$9.invalidStringToken = function (position, message) {
						if (
							this.inTemplateElement &&
							this.options.ecmaVersion >= 9
						) {
							throw INVALID_TEMPLATE_ESCAPE_ERROR;
						} else {
							this.raise(position, message);
						}
					};

					pp$9.readTmplToken = function () {
						var out = '',
							chunkStart = this.pos;
						for (;;) {
							if (this.pos >= this.input.length) {
								this.raise(this.start, 'Unterminated template');
							}
							var ch = this.input.charCodeAt(this.pos);
							if (
								ch === 96 ||
								(ch === 36 &&
									this.input.charCodeAt(this.pos + 1) === 123)
							) {
								// '`', '${'
								if (
									this.pos === this.start &&
									(this.type === types.template ||
										this.type === types.invalidTemplate)
								) {
									if (ch === 36) {
										this.pos += 2;
										return this.finishToken(
											types.dollarBraceL
										);
									} else {
										++this.pos;
										return this.finishToken(
											types.backQuote
										);
									}
								}
								out += this.input.slice(chunkStart, this.pos);
								return this.finishToken(types.template, out);
							}
							if (ch === 92) {
								// '\'
								out += this.input.slice(chunkStart, this.pos);
								out += this.readEscapedChar(true);
								chunkStart = this.pos;
							} else if (isNewLine(ch)) {
								out += this.input.slice(chunkStart, this.pos);
								++this.pos;
								switch (ch) {
									case 13:
										if (
											this.input.charCodeAt(this.pos) ===
											10
										) {
											++this.pos;
										}
									case 10:
										out += '\n';
										break;
									default:
										out += String.fromCharCode(ch);
										break;
								}
								if (this.options.locations) {
									++this.curLine;
									this.lineStart = this.pos;
								}
								chunkStart = this.pos;
							} else {
								++this.pos;
							}
						}
					};

					// Reads a template token to search for the end, without validating any escape sequences
					pp$9.readInvalidTemplateToken = function () {
						for (; this.pos < this.input.length; this.pos++) {
							switch (this.input[this.pos]) {
								case '\\':
									++this.pos;
									break;

								case '$':
									if (this.input[this.pos + 1] !== '{') {
										break;
									}
								// falls through

								case '`':
									return this.finishToken(
										types.invalidTemplate,
										this.input.slice(this.start, this.pos)
									);

								// no default
							}
						}
						this.raise(this.start, 'Unterminated template');
					};

					// Used to read escaped characters

					pp$9.readEscapedChar = function (inTemplate) {
						var ch = this.input.charCodeAt(++this.pos);
						++this.pos;
						switch (ch) {
							case 110:
								return '\n'; // 'n' -> '\n'
							case 114:
								return '\r'; // 'r' -> '\r'
							case 120:
								return String.fromCharCode(this.readHexChar(2)); // 'x'
							case 117:
								return codePointToString$1(
									this.readCodePoint()
								); // 'u'
							case 116:
								return '\t'; // 't' -> '\t'
							case 98:
								return '\b'; // 'b' -> '\b'
							case 118:
								return '\u000b'; // 'v' -> '\u000b'
							case 102:
								return '\f'; // 'f' -> '\f'
							case 13:
								if (this.input.charCodeAt(this.pos) === 10) {
									++this.pos;
								} // '\r\n'
							case 10: // ' \n'
								if (this.options.locations) {
									this.lineStart = this.pos;
									++this.curLine;
								}
								return '';
							default:
								if (ch >= 48 && ch <= 55) {
									var octalStr = this.input
										.substr(this.pos - 1, 3)
										.match(/^[0-7]+/)[0];
									var octal = parseInt(octalStr, 8);
									if (octal > 255) {
										octalStr = octalStr.slice(0, -1);
										octal = parseInt(octalStr, 8);
									}
									this.pos += octalStr.length - 1;
									ch = this.input.charCodeAt(this.pos);
									if (
										(octalStr !== '0' ||
											ch === 56 ||
											ch === 57) &&
										(this.strict || inTemplate)
									) {
										this.invalidStringToken(
											this.pos - 1 - octalStr.length,
											inTemplate
												? 'Octal literal in template string'
												: 'Octal literal in strict mode'
										);
									}
									return String.fromCharCode(octal);
								}
								if (isNewLine(ch)) {
									// Unicode new line characters after \ get removed from output in both
									// template literals and strings
									return '';
								}
								return String.fromCharCode(ch);
						}
					};

					// Used to read character escape sequences ('\x', '\u', '\U').

					pp$9.readHexChar = function (len) {
						var codePos = this.pos;
						var n = this.readInt(16, len);
						if (n === null) {
							this.invalidStringToken(
								codePos,
								'Bad character escape sequence'
							);
						}
						return n;
					};

					// Read an identifier, and return it as a string. Sets `this.containsEsc`
					// to whether the word contained a '\u' escape.
					//
					// Incrementally adds only escaped chars, adding other chunks as-is
					// as a micro-optimization.

					pp$9.readWord1 = function () {
						this.containsEsc = false;
						var word = '',
							first = true,
							chunkStart = this.pos;
						var astral = this.options.ecmaVersion >= 6;
						while (this.pos < this.input.length) {
							var ch = this.fullCharCodeAtPos();
							if (isIdentifierChar(ch, astral)) {
								this.pos += ch <= 0xffff ? 1 : 2;
							} else if (ch === 92) {
								// "\"
								this.containsEsc = true;
								word += this.input.slice(chunkStart, this.pos);
								var escStart = this.pos;
								if (this.input.charCodeAt(++this.pos) !== 117) {
									// "u"
									this.invalidStringToken(
										this.pos,
										'Expecting Unicode escape sequence \\uXXXX'
									);
								}
								++this.pos;
								var esc = this.readCodePoint();
								if (
									!(
										first
											? isIdentifierStart
											: isIdentifierChar
									)(esc, astral)
								) {
									this.invalidStringToken(
										escStart,
										'Invalid Unicode escape'
									);
								}
								word += codePointToString$1(esc);
								chunkStart = this.pos;
							} else {
								break;
							}
							first = false;
						}
						return word + this.input.slice(chunkStart, this.pos);
					};

					// Read an identifier or keyword token. Will check for reserved
					// words when necessary.

					pp$9.readWord = function () {
						var word = this.readWord1();
						var type = types.name;
						if (this.keywords.test(word)) {
							if (this.containsEsc) {
								this.raiseRecoverable(
									this.start,
									'Escape sequence in keyword ' + word
								);
							}
							type = keywords$1[word];
						}
						return this.finishToken(type, word);
					};

					// Acorn is a tiny, fast JavaScript parser written in JavaScript.

					var version = '6.4.2';

					Parser.acorn = {
						Parser: Parser,
						version: version,
						defaultOptions: defaultOptions,
						Position: Position,
						SourceLocation: SourceLocation,
						getLineInfo: getLineInfo,
						Node: Node,
						TokenType: TokenType,
						tokTypes: types,
						keywordTypes: keywords$1,
						TokContext: TokContext,
						tokContexts: types$1,
						isIdentifierChar: isIdentifierChar,
						isIdentifierStart: isIdentifierStart,
						Token: Token,
						isNewLine: isNewLine,
						lineBreak: lineBreak,
						lineBreakG: lineBreakG,
						nonASCIIwhitespace: nonASCIIwhitespace,
					};

					// The main exported interface (under `self.acorn` when in the
					// browser) is a `parse` function that takes a code string and
					// returns an abstract syntax tree as specified by [Mozilla parser
					// API][api].
					//
					// [api]: https://developer.mozilla.org/en-US/docs/SpiderMonkey/Parser_API

					function parse(input, options) {
						return Parser.parse(input, options);
					}

					// This function tries to parse a single expression at a given
					// offset in a string. Useful for parsing mixed-language formats
					// that embed JavaScript expressions.

					function parseExpressionAt(input, pos, options) {
						return Parser.parseExpressionAt(input, pos, options);
					}

					// Acorn is organized as a tokenizer and a recursive-descent parser.
					// The `tokenizer` export provides an interface to the tokenizer.

					function tokenizer(input, options) {
						return Parser.tokenizer(input, options);
					}

					exports.Node = Node;
					exports.Parser = Parser;
					exports.Position = Position;
					exports.SourceLocation = SourceLocation;
					exports.TokContext = TokContext;
					exports.Token = Token;
					exports.TokenType = TokenType;
					exports.defaultOptions = defaultOptions;
					exports.getLineInfo = getLineInfo;
					exports.isIdentifierChar = isIdentifierChar;
					exports.isIdentifierStart = isIdentifierStart;
					exports.isNewLine = isNewLine;
					exports.keywordTypes = keywords$1;
					exports.lineBreak = lineBreak;
					exports.lineBreakG = lineBreakG;
					exports.nonASCIIwhitespace = nonASCIIwhitespace;
					exports.parse = parse;
					exports.parseExpressionAt = parseExpressionAt;
					exports.tokContexts = types$1;
					exports.tokTypes = types;
					exports.tokenizer = tokenizer;
					exports.version = version;

					Object.defineProperty(exports, '__esModule', {
						value: true,
					});
				});
			},
			{},
		],
		35: [
			function (require, module, exports) {
				exports.join = function (array, separator) {
					if (array.length === 0) return '';
					var last = array.length - 1;
					var index = 0;
					var result = '';
					while (index < last) {
						result += array[index++] + separator;
					}
					return result + array[last];
				};

				exports.flat = function (array1) {
					var result = [];
					var length = 0;
					var index1 = 0;
					var length1 = array1.length;
					while (index1 < length1) {
						var array2 = array1[index1++];
						var index2 = 0;
						var length2 = array2.length;
						while (index2 < length2) {
							result[length++] = array2[index2++];
						}
					}
					return result;
				};

				exports.concat = function () {
					var result = [];
					var index1 = 0;
					var length1 = arguments.length;
					while (index1 < length1) {
						var array2 = arguments[index1++];
						var index2 = 0;
						var length2 = array2.length;
						while (index2 < length2) {
							result[result.length] = array2[index2++];
						}
					}
					return result;
				};

				exports.some = function (array, predicate) {
					var index = 0;
					var length = array.length;
					while (index < length) {
						if (predicate(array[index], index++, array)) {
							return true;
						}
					}
					return false;
				};

				exports.every = function (array, predicate) {
					var index = 0;
					var length = array.length;
					while (index < length) {
						if (!predicate(array[index], index++, array)) {
							return false;
						}
					}
					return true;
				};

				exports.includes = function (array, element) {
					var index = 0;
					var length = array.length;
					while (index < length) {
						if (array[index++] === element) {
							return true;
						}
					}
					return false;
				};

				exports.reverse = function (array) {
					var index = array.length - 1;
					var result = [];
					var length = 0;
					while (index >= 0) {
						result[length++] = array[index--];
					}
					return result;
				};

				exports.map = function (array, transform) {
					var result = [];
					var index = 0;
					var length = array.length;
					while (index < length) {
						result[index] = transform(array[index], index++, array);
					}
					return result;
				};

				exports.flatMap = function (array1, transform) {
					var result = [];
					var length = 0;
					var index1 = 0;
					var length1 = array1.length;
					while (index1 < length1) {
						var array2 = transform(
							array1[index1],
							index1++,
							array1
						);
						var index2 = 0;
						var length2 = array2.length;
						while (index2 < length2) {
							result[length++] = array2[index2++];
						}
					}
					return result;
				};

				exports.filter = function (array, predicate) {
					var result = [];
					var index = 0;
					var length = array.length;
					while (index < length) {
						if (predicate(array[index], index, array)) {
							result[result.length] = array[index++];
						} else {
							index++;
						}
					}
					return result;
				};

				exports.forEach = function (array, procedure) {
					var index = 0;
					var length = array.length;
					while (index < length) {
						procedure(array[index], index++, array);
					}
				};

				exports.reduce = function (array, accumulator, result) {
					var index = 0;
					var length = array.length;
					while (index < length) {
						result = accumulator(
							result,
							array[index],
							index++,
							array
						);
					}
					return result;
				};

				exports.reduceRight = function (array, accumulator, result) {
					var index = array.length;
					while (index--) {
						result = accumulator(
							result,
							array[index],
							index,
							array
						);
					}
					return result;
				};

				exports.indexOf = function (array, value) {
					var index = 0;
					var length = array.length;
					while (index < length) {
						if (array[index] === value) {
							return index;
						}
						index++;
					}
					return -1;
				};

				exports.find = function (array, predicate) {
					var index = 0;
					var length = array.length;
					while (index < length) {
						if (predicate(array[index], index, array)) {
							return array[index];
						}
						index++;
					}
				};

				exports.findIndex = function (array, predicate) {
					var index = 0;
					var length = array.length;
					while (index < length) {
						if (predicate(array[index], index, array)) {
							return index;
						}
						index++;
					}
					return -1;
				};

				exports.lastIndexOf = function (array, value) {
					var index = array.length;
					while (index--) {
						if (array[index] === value) {
							return index;
						}
					}
					return -1;
				};

				exports.slice = function (array, index, length) {
					var result = [];
					while (index < length) {
						result[result.length] = array[index++];
					}
					return result;
				};
			},
			{},
		],
		36: [
			function (require, module, exports) {
				Object.defineProperty(exports, '__esModule', {
					value: true,
				});
				exports.generate = generate;
				exports.baseGenerator = void 0;

				function _classCallCheck(instance, Constructor) {
					if (!(instance instanceof Constructor)) {
						throw new TypeError(
							'Cannot call a class as a function'
						);
					}
				}

				function _defineProperties(target, props) {
					for (var i = 0; i < props.length; i++) {
						var descriptor = props[i];
						descriptor.enumerable = descriptor.enumerable || false;
						descriptor.configurable = true;
						if ('value' in descriptor) descriptor.writable = true;
						Object.defineProperty(
							target,
							descriptor.key,
							descriptor
						);
					}
				}

				function _createClass(Constructor, protoProps, staticProps) {
					if (protoProps)
						_defineProperties(Constructor.prototype, protoProps);
					if (staticProps)
						_defineProperties(Constructor, staticProps);
					return Constructor;
				}

				var stringify = JSON.stringify;

				if (!String.prototype.repeat) {
					throw new Error(
						'String.prototype.repeat is undefined, see https://github.com/davidbonnet/astring#installation'
					);
				}

				if (!String.prototype.endsWith) {
					throw new Error(
						'String.prototype.endsWith is undefined, see https://github.com/davidbonnet/astring#installation'
					);
				}

				var OPERATOR_PRECEDENCE = {
					'||': 3,
					'&&': 4,
					'|': 5,
					'^': 6,
					'&': 7,
					'==': 8,
					'!=': 8,
					'===': 8,
					'!==': 8,
					'<': 9,
					'>': 9,
					'<=': 9,
					'>=': 9,
					in: 9,
					instanceof: 9,
					'<<': 10,
					'>>': 10,
					'>>>': 10,
					'+': 11,
					'-': 11,
					'*': 12,
					'%': 12,
					'/': 12,
					'**': 13,
				};
				var NEEDS_PARENTHESES = 17;
				var EXPRESSIONS_PRECEDENCE = {
					ArrayExpression: 20,
					TaggedTemplateExpression: 20,
					ThisExpression: 20,
					Identifier: 20,
					Literal: 18,
					TemplateLiteral: 20,
					Super: 20,
					SequenceExpression: 20,
					MemberExpression: 19,
					CallExpression: 19,
					NewExpression: 19,
					ArrowFunctionExpression: NEEDS_PARENTHESES,
					ClassExpression: NEEDS_PARENTHESES,
					FunctionExpression: NEEDS_PARENTHESES,
					ObjectExpression: NEEDS_PARENTHESES,
					UpdateExpression: 16,
					UnaryExpression: 15,
					BinaryExpression: 14,
					LogicalExpression: 13,
					ConditionalExpression: 4,
					AssignmentExpression: 3,
					AwaitExpression: 2,
					YieldExpression: 2,
					RestElement: 1,
				};

				function formatSequence(state, nodes) {
					var generator = state.generator;
					state.write('(');

					if (nodes != null && nodes.length > 0) {
						generator[nodes[0].type](nodes[0], state);
						var length = nodes.length;

						for (var i = 1; i < length; i++) {
							var param = nodes[i];
							state.write(', ');
							generator[param.type](param, state);
						}
					}

					state.write(')');
				}

				function expressionNeedsParenthesis(
					node,
					parentNode,
					isRightHand
				) {
					var nodePrecedence = EXPRESSIONS_PRECEDENCE[node.type];

					if (nodePrecedence === NEEDS_PARENTHESES) {
						return true;
					}

					var parentNodePrecedence =
						EXPRESSIONS_PRECEDENCE[parentNode.type];

					if (nodePrecedence !== parentNodePrecedence) {
						return (
							(!isRightHand &&
								nodePrecedence === 15 &&
								parentNodePrecedence === 14 &&
								parentNode.operator === '**') ||
							nodePrecedence < parentNodePrecedence
						);
					}

					if (nodePrecedence !== 13 && nodePrecedence !== 14) {
						return false;
					}

					if (
						node.operator === '**' &&
						parentNode.operator === '**'
					) {
						return !isRightHand;
					}

					if (isRightHand) {
						return (
							OPERATOR_PRECEDENCE[node.operator] <=
							OPERATOR_PRECEDENCE[parentNode.operator]
						);
					}

					return (
						OPERATOR_PRECEDENCE[node.operator] <
						OPERATOR_PRECEDENCE[parentNode.operator]
					);
				}

				function formatBinaryExpressionPart(
					state,
					node,
					parentNode,
					isRightHand
				) {
					var generator = state.generator;

					if (
						expressionNeedsParenthesis(
							node,
							parentNode,
							isRightHand
						)
					) {
						state.write('(');
						generator[node.type](node, state);
						state.write(')');
					} else {
						generator[node.type](node, state);
					}
				}

				function reindent(state, text, indent, lineEnd) {
					var lines = text.split('\n');
					var end = lines.length - 1;
					state.write(lines[0].trim());

					if (end > 0) {
						state.write(lineEnd);

						for (var i = 1; i < end; i++) {
							state.write(indent + lines[i].trim() + lineEnd);
						}

						state.write(indent + lines[end].trim());
					}
				}

				function formatComments(state, comments, indent, lineEnd) {
					var length = comments.length;

					for (var i = 0; i < length; i++) {
						var comment = comments[i];
						state.write(indent);

						if (comment.type[0] === 'L') {
							state.write('// ' + comment.value.trim() + '\n');
						} else {
							state.write('/*');
							reindent(state, comment.value, indent, lineEnd);
							state.write('*/' + lineEnd);
						}
					}
				}

				function hasCallExpression(node) {
					var currentNode = node;

					while (currentNode != null) {
						var _currentNode = currentNode,
							type = _currentNode.type;

						if (type[0] === 'C' && type[1] === 'a') {
							return true;
						} else if (
							type[0] === 'M' &&
							type[1] === 'e' &&
							type[2] === 'm'
						) {
							currentNode = currentNode.object;
						} else {
							return false;
						}
					}
				}

				function formatVariableDeclaration(state, node) {
					var generator = state.generator;
					var declarations = node.declarations;
					state.write(node.kind + ' ');
					var length = declarations.length;

					if (length > 0) {
						generator.VariableDeclarator(declarations[0], state);

						for (var i = 1; i < length; i++) {
							state.write(', ');
							generator.VariableDeclarator(
								declarations[i],
								state
							);
						}
					}
				}

				var ForInStatement,
					FunctionDeclaration,
					RestElement,
					BinaryExpression,
					ArrayExpression,
					BlockStatement;
				var baseGenerator = {
					Program: function Program(node, state) {
						var indent = state.indent.repeat(state.indentLevel);
						var lineEnd = state.lineEnd,
							writeComments = state.writeComments;

						if (writeComments && node.comments != null) {
							formatComments(
								state,
								node.comments,
								indent,
								lineEnd
							);
						}

						var statements = node.body;
						var length = statements.length;

						for (var i = 0; i < length; i++) {
							var statement = statements[i];

							if (writeComments && statement.comments != null) {
								formatComments(
									state,
									statement.comments,
									indent,
									lineEnd
								);
							}

							state.write(indent);
							this[statement.type](statement, state);
							state.write(lineEnd);
						}

						if (writeComments && node.trailingComments != null) {
							formatComments(
								state,
								node.trailingComments,
								indent,
								lineEnd
							);
						}
					},
					BlockStatement: (BlockStatement = function BlockStatement(
						node,
						state
					) {
						var indent = state.indent.repeat(state.indentLevel++);
						var lineEnd = state.lineEnd,
							writeComments = state.writeComments;
						var statementIndent = indent + state.indent;
						state.write('{');
						var statements = node.body;

						if (statements != null && statements.length > 0) {
							state.write(lineEnd);

							if (writeComments && node.comments != null) {
								formatComments(
									state,
									node.comments,
									statementIndent,
									lineEnd
								);
							}

							var length = statements.length;

							for (var i = 0; i < length; i++) {
								var statement = statements[i];

								if (
									writeComments &&
									statement.comments != null
								) {
									formatComments(
										state,
										statement.comments,
										statementIndent,
										lineEnd
									);
								}

								state.write(statementIndent);
								this[statement.type](statement, state);
								state.write(lineEnd);
							}

							state.write(indent);
						} else {
							if (writeComments && node.comments != null) {
								state.write(lineEnd);
								formatComments(
									state,
									node.comments,
									statementIndent,
									lineEnd
								);
								state.write(indent);
							}
						}

						if (writeComments && node.trailingComments != null) {
							formatComments(
								state,
								node.trailingComments,
								statementIndent,
								lineEnd
							);
						}

						state.write('}');
						state.indentLevel--;
					}),
					ClassBody: BlockStatement,
					EmptyStatement: function EmptyStatement(node, state) {
						state.write(';');
					},
					ExpressionStatement: function ExpressionStatement(
						node,
						state
					) {
						var precedence =
							EXPRESSIONS_PRECEDENCE[node.expression.type];

						if (
							precedence === NEEDS_PARENTHESES ||
							(precedence === 3 &&
								node.expression.left.type[0] === 'O')
						) {
							state.write('(');
							this[node.expression.type](node.expression, state);
							state.write(')');
						} else {
							this[node.expression.type](node.expression, state);
						}

						state.write(';');
					},
					IfStatement: function IfStatement(node, state) {
						state.write('if (');
						this[node.test.type](node.test, state);
						state.write(') ');
						this[node.consequent.type](node.consequent, state);

						if (node.alternate != null) {
							state.write(' else ');
							this[node.alternate.type](node.alternate, state);
						}
					},
					LabeledStatement: function LabeledStatement(node, state) {
						this[node.label.type](node.label, state);
						state.write(': ');
						this[node.body.type](node.body, state);
					},
					BreakStatement: function BreakStatement(node, state) {
						state.write('break');

						if (node.label != null) {
							state.write(' ');
							this[node.label.type](node.label, state);
						}

						state.write(';');
					},
					ContinueStatement: function ContinueStatement(node, state) {
						state.write('continue');

						if (node.label != null) {
							state.write(' ');
							this[node.label.type](node.label, state);
						}

						state.write(';');
					},
					WithStatement: function WithStatement(node, state) {
						state.write('with (');
						this[node.object.type](node.object, state);
						state.write(') ');
						this[node.body.type](node.body, state);
					},
					SwitchStatement: function SwitchStatement(node, state) {
						var indent = state.indent.repeat(state.indentLevel++);
						var lineEnd = state.lineEnd,
							writeComments = state.writeComments;
						state.indentLevel++;
						var caseIndent = indent + state.indent;
						var statementIndent = caseIndent + state.indent;
						state.write('switch (');
						this[node.discriminant.type](node.discriminant, state);
						state.write(') {' + lineEnd);
						var occurences = node.cases;
						var occurencesCount = occurences.length;

						for (var i = 0; i < occurencesCount; i++) {
							var occurence = occurences[i];

							if (writeComments && occurence.comments != null) {
								formatComments(
									state,
									occurence.comments,
									caseIndent,
									lineEnd
								);
							}

							if (occurence.test) {
								state.write(caseIndent + 'case ');
								this[occurence.test.type](
									occurence.test,
									state
								);
								state.write(':' + lineEnd);
							} else {
								state.write(caseIndent + 'default:' + lineEnd);
							}

							var consequent = occurence.consequent;
							var consequentCount = consequent.length;

							for (var _i = 0; _i < consequentCount; _i++) {
								var statement = consequent[_i];

								if (
									writeComments &&
									statement.comments != null
								) {
									formatComments(
										state,
										statement.comments,
										statementIndent,
										lineEnd
									);
								}

								state.write(statementIndent);
								this[statement.type](statement, state);
								state.write(lineEnd);
							}
						}

						state.indentLevel -= 2;
						state.write(indent + '}');
					},
					ReturnStatement: function ReturnStatement(node, state) {
						state.write('return');

						if (node.argument) {
							state.write(' ');
							this[node.argument.type](node.argument, state);
						}

						state.write(';');
					},
					ThrowStatement: function ThrowStatement(node, state) {
						state.write('throw ');
						this[node.argument.type](node.argument, state);
						state.write(';');
					},
					TryStatement: function TryStatement(node, state) {
						state.write('try ');
						this[node.block.type](node.block, state);

						if (node.handler) {
							var handler = node.handler;

							if (handler.param == null) {
								state.write(' catch ');
							} else {
								state.write(' catch (');
								this[handler.param.type](handler.param, state);
								state.write(') ');
							}

							this[handler.body.type](handler.body, state);
						}

						if (node.finalizer) {
							state.write(' finally ');
							this[node.finalizer.type](node.finalizer, state);
						}
					},
					WhileStatement: function WhileStatement(node, state) {
						state.write('while (');
						this[node.test.type](node.test, state);
						state.write(') ');
						this[node.body.type](node.body, state);
					},
					DoWhileStatement: function DoWhileStatement(node, state) {
						state.write('do ');
						this[node.body.type](node.body, state);
						state.write(' while (');
						this[node.test.type](node.test, state);
						state.write(');');
					},
					ForStatement: function ForStatement(node, state) {
						state.write('for (');

						if (node.init != null) {
							var init = node.init;

							if (init.type[0] === 'V') {
								formatVariableDeclaration(state, init);
							} else {
								this[init.type](init, state);
							}
						}

						state.write('; ');

						if (node.test) {
							this[node.test.type](node.test, state);
						}

						state.write('; ');

						if (node.update) {
							this[node.update.type](node.update, state);
						}

						state.write(') ');
						this[node.body.type](node.body, state);
					},
					ForInStatement: (ForInStatement = function ForInStatement(
						node,
						state
					) {
						state.write(
							'for '.concat(node['await'] ? 'await ' : '', '(')
						);
						var left = node.left;

						if (left.type[0] === 'V') {
							formatVariableDeclaration(state, left);
						} else {
							this[left.type](left, state);
						}

						state.write(node.type[3] === 'I' ? ' in ' : ' of ');
						this[node.right.type](node.right, state);
						state.write(') ');
						this[node.body.type](node.body, state);
					}),
					ForOfStatement: ForInStatement,
					DebuggerStatement: function DebuggerStatement(node, state) {
						state.write('debugger;' + state.lineEnd);
					},
					FunctionDeclaration: (FunctionDeclaration =
						function FunctionDeclaration(node, state) {
							state.write(
								(node.async ? 'async ' : '') +
									(node.generator
										? 'function* '
										: 'function ') +
									(node.id ? node.id.name : ''),
								node
							);
							formatSequence(state, node.params);
							state.write(' ');
							this[node.body.type](node.body, state);
						}),
					FunctionExpression: FunctionDeclaration,
					VariableDeclaration: function VariableDeclaration(
						node,
						state
					) {
						formatVariableDeclaration(state, node);
						state.write(';');
					},
					VariableDeclarator: function VariableDeclarator(
						node,
						state
					) {
						this[node.id.type](node.id, state);

						if (node.init != null) {
							state.write(' = ');
							this[node.init.type](node.init, state);
						}
					},
					ClassDeclaration: function ClassDeclaration(node, state) {
						state.write(
							'class ' +
								(node.id ? ''.concat(node.id.name, ' ') : ''),
							node
						);

						if (node.superClass) {
							state.write('extends ');
							this[node.superClass.type](node.superClass, state);
							state.write(' ');
						}

						this.ClassBody(node.body, state);
					},
					ImportDeclaration: function ImportDeclaration(node, state) {
						state.write('import ');
						var specifiers = node.specifiers;
						var length = specifiers.length;
						var i = 0;

						if (length > 0) {
							for (; i < length; ) {
								if (i > 0) {
									state.write(', ');
								}

								var specifier = specifiers[i];
								var type = specifier.type[6];

								if (type === 'D') {
									state.write(
										specifier.local.name,
										specifier
									);
									i++;
								} else if (type === 'N') {
									state.write(
										'* as ' + specifier.local.name,
										specifier
									);
									i++;
								} else {
									break;
								}
							}

							if (i < length) {
								state.write('{');

								for (;;) {
									var _specifier = specifiers[i];
									var name = _specifier.imported.name;
									state.write(name, _specifier);

									if (name !== _specifier.local.name) {
										state.write(
											' as ' + _specifier.local.name
										);
									}

									if (++i < length) {
										state.write(', ');
									} else {
										break;
									}
								}

								state.write('}');
							}

							state.write(' from ');
						}

						this.Literal(node.source, state);
						state.write(';');
					},
					ExportDefaultDeclaration: function ExportDefaultDeclaration(
						node,
						state
					) {
						state.write('export default ');
						this[node.declaration.type](node.declaration, state);

						if (
							EXPRESSIONS_PRECEDENCE[node.declaration.type] &&
							node.declaration.type[0] !== 'F'
						) {
							state.write(';');
						}
					},
					ExportNamedDeclaration: function ExportNamedDeclaration(
						node,
						state
					) {
						state.write('export ');

						if (node.declaration) {
							this[node.declaration.type](
								node.declaration,
								state
							);
						} else {
							state.write('{');
							var specifiers = node.specifiers,
								length = specifiers.length;

							if (length > 0) {
								for (var i = 0; ; ) {
									var specifier = specifiers[i];
									var name = specifier.local.name;
									state.write(name, specifier);

									if (name !== specifier.exported.name) {
										state.write(
											' as ' + specifier.exported.name
										);
									}

									if (++i < length) {
										state.write(', ');
									} else {
										break;
									}
								}
							}

							state.write('}');

							if (node.source) {
								state.write(' from ');
								this.Literal(node.source, state);
							}

							state.write(';');
						}
					},
					ExportAllDeclaration: function ExportAllDeclaration(
						node,
						state
					) {
						state.write('export * from ');
						this.Literal(node.source, state);
						state.write(';');
					},
					MethodDefinition: function MethodDefinition(node, state) {
						if (node['static']) {
							state.write('static ');
						}

						var kind = node.kind[0];

						if (kind === 'g' || kind === 's') {
							state.write(node.kind + ' ');
						}

						if (node.value.async) {
							state.write('async ');
						}

						if (node.value.generator) {
							state.write('*');
						}

						if (node.computed) {
							state.write('[');
							this[node.key.type](node.key, state);
							state.write(']');
						} else {
							this[node.key.type](node.key, state);
						}

						formatSequence(state, node.value.params);
						state.write(' ');
						this[node.value.body.type](node.value.body, state);
					},
					ClassExpression: function ClassExpression(node, state) {
						this.ClassDeclaration(node, state);
					},
					ArrowFunctionExpression: function ArrowFunctionExpression(
						node,
						state
					) {
						state.write(node.async ? 'async ' : '', node);
						var params = node.params;

						if (params != null) {
							if (
								params.length === 1 &&
								params[0].type[0] === 'I'
							) {
								state.write(params[0].name, params[0]);
							} else {
								formatSequence(state, node.params);
							}
						}

						state.write(' => ');

						if (node.body.type[0] === 'O') {
							state.write('(');
							this.ObjectExpression(node.body, state);
							state.write(')');
						} else {
							this[node.body.type](node.body, state);
						}
					},
					ThisExpression: function ThisExpression(node, state) {
						state.write('this', node);
					},
					Super: function Super(node, state) {
						state.write('super', node);
					},
					RestElement: (RestElement = function RestElement(
						node,
						state
					) {
						state.write('...');
						this[node.argument.type](node.argument, state);
					}),
					SpreadElement: RestElement,
					YieldExpression: function YieldExpression(node, state) {
						state.write(node.delegate ? 'yield*' : 'yield');

						if (node.argument) {
							state.write(' ');
							this[node.argument.type](node.argument, state);
						}
					},
					AwaitExpression: function AwaitExpression(node, state) {
						state.write('await ');

						if (node.argument) {
							this[node.argument.type](node.argument, state);
						}
					},
					TemplateLiteral: function TemplateLiteral(node, state) {
						var quasis = node.quasis,
							expressions = node.expressions;
						state.write('`');
						var length = expressions.length;

						for (var i = 0; i < length; i++) {
							var expression = expressions[i];
							this.TemplateElement(quasis[i], state);
							state.write('${');
							this[expression.type](expression, state);
							state.write('}');
						}

						state.write(quasis[quasis.length - 1].value.raw);
						state.write('`');
					},
					TemplateElement: function TemplateElement(node, state) {
						state.write(node.value.raw);
					},
					TaggedTemplateExpression: function TaggedTemplateExpression(
						node,
						state
					) {
						this[node.tag.type](node.tag, state);
						this[node.quasi.type](node.quasi, state);
					},
					ArrayExpression: (ArrayExpression =
						function ArrayExpression(node, state) {
							state.write('[');

							if (node.elements.length > 0) {
								var elements = node.elements,
									length = elements.length;

								for (var i = 0; ; ) {
									var element = elements[i];

									if (element != null) {
										this[element.type](element, state);
									}

									if (++i < length) {
										state.write(', ');
									} else {
										if (element == null) {
											state.write(', ');
										}

										break;
									}
								}
							}

							state.write(']');
						}),
					ArrayPattern: ArrayExpression,
					ObjectExpression: function ObjectExpression(node, state) {
						var indent = state.indent.repeat(state.indentLevel++);
						var lineEnd = state.lineEnd,
							writeComments = state.writeComments;
						var propertyIndent = indent + state.indent;
						state.write('{');

						if (node.properties.length > 0) {
							state.write(lineEnd);

							if (writeComments && node.comments != null) {
								formatComments(
									state,
									node.comments,
									propertyIndent,
									lineEnd
								);
							}

							var comma = ',' + lineEnd;
							var properties = node.properties,
								length = properties.length;

							for (var i = 0; ; ) {
								var property = properties[i];

								if (
									writeComments &&
									property.comments != null
								) {
									formatComments(
										state,
										property.comments,
										propertyIndent,
										lineEnd
									);
								}

								state.write(propertyIndent);
								this[property.type](property, state);

								if (++i < length) {
									state.write(comma);
								} else {
									break;
								}
							}

							state.write(lineEnd);

							if (
								writeComments &&
								node.trailingComments != null
							) {
								formatComments(
									state,
									node.trailingComments,
									propertyIndent,
									lineEnd
								);
							}

							state.write(indent + '}');
						} else if (writeComments) {
							if (node.comments != null) {
								state.write(lineEnd);
								formatComments(
									state,
									node.comments,
									propertyIndent,
									lineEnd
								);

								if (node.trailingComments != null) {
									formatComments(
										state,
										node.trailingComments,
										propertyIndent,
										lineEnd
									);
								}

								state.write(indent + '}');
							} else if (node.trailingComments != null) {
								state.write(lineEnd);
								formatComments(
									state,
									node.trailingComments,
									propertyIndent,
									lineEnd
								);
								state.write(indent + '}');
							} else {
								state.write('}');
							}
						} else {
							state.write('}');
						}

						state.indentLevel--;
					},
					Property: function Property(node, state) {
						if (node.method || node.kind[0] !== 'i') {
							this.MethodDefinition(node, state);
						} else {
							if (!node.shorthand) {
								if (node.computed) {
									state.write('[');
									this[node.key.type](node.key, state);
									state.write(']');
								} else {
									this[node.key.type](node.key, state);
								}

								state.write(': ');
							}

							this[node.value.type](node.value, state);
						}
					},
					ObjectPattern: function ObjectPattern(node, state) {
						state.write('{');

						if (node.properties.length > 0) {
							var properties = node.properties,
								length = properties.length;

							for (var i = 0; ; ) {
								this[properties[i].type](properties[i], state);

								if (++i < length) {
									state.write(', ');
								} else {
									break;
								}
							}
						}

						state.write('}');
					},
					SequenceExpression: function SequenceExpression(
						node,
						state
					) {
						formatSequence(state, node.expressions);
					},
					UnaryExpression: function UnaryExpression(node, state) {
						if (node.prefix) {
							state.write(node.operator);

							if (node.operator.length > 1) {
								state.write(' ');
							}

							if (
								EXPRESSIONS_PRECEDENCE[node.argument.type] <
								EXPRESSIONS_PRECEDENCE.UnaryExpression
							) {
								state.write('(');
								this[node.argument.type](node.argument, state);
								state.write(')');
							} else {
								this[node.argument.type](node.argument, state);
							}
						} else {
							this[node.argument.type](node.argument, state);
							state.write(node.operator);
						}
					},
					UpdateExpression: function UpdateExpression(node, state) {
						if (node.prefix) {
							state.write(node.operator);
							this[node.argument.type](node.argument, state);
						} else {
							this[node.argument.type](node.argument, state);
							state.write(node.operator);
						}
					},
					AssignmentExpression: function AssignmentExpression(
						node,
						state
					) {
						this[node.left.type](node.left, state);
						state.write(' ' + node.operator + ' ');
						this[node.right.type](node.right, state);
					},
					AssignmentPattern: function AssignmentPattern(node, state) {
						this[node.left.type](node.left, state);
						state.write(' = ');
						this[node.right.type](node.right, state);
					},
					BinaryExpression: (BinaryExpression =
						function BinaryExpression(node, state) {
							var isIn = node.operator === 'in';

							if (isIn) {
								state.write('(');
							}

							formatBinaryExpressionPart(
								state,
								node.left,
								node,
								false
							);
							state.write(' ' + node.operator + ' ');
							formatBinaryExpressionPart(
								state,
								node.right,
								node,
								true
							);

							if (isIn) {
								state.write(')');
							}
						}),
					LogicalExpression: BinaryExpression,
					ConditionalExpression: function ConditionalExpression(
						node,
						state
					) {
						if (
							EXPRESSIONS_PRECEDENCE[node.test.type] >
							EXPRESSIONS_PRECEDENCE.ConditionalExpression
						) {
							this[node.test.type](node.test, state);
						} else {
							state.write('(');
							this[node.test.type](node.test, state);
							state.write(')');
						}

						state.write(' ? ');
						this[node.consequent.type](node.consequent, state);
						state.write(' : ');
						this[node.alternate.type](node.alternate, state);
					},
					NewExpression: function NewExpression(node, state) {
						state.write('new ');

						if (
							EXPRESSIONS_PRECEDENCE[node.callee.type] <
								EXPRESSIONS_PRECEDENCE.CallExpression ||
							hasCallExpression(node.callee)
						) {
							state.write('(');
							this[node.callee.type](node.callee, state);
							state.write(')');
						} else {
							this[node.callee.type](node.callee, state);
						}

						formatSequence(state, node['arguments']);
					},
					CallExpression: function CallExpression(node, state) {
						if (
							EXPRESSIONS_PRECEDENCE[node.callee.type] <
							EXPRESSIONS_PRECEDENCE.CallExpression
						) {
							state.write('(');
							this[node.callee.type](node.callee, state);
							state.write(')');
						} else {
							this[node.callee.type](node.callee, state);
						}

						formatSequence(state, node['arguments']);
					},
					MemberExpression: function MemberExpression(node, state) {
						if (
							EXPRESSIONS_PRECEDENCE[node.object.type] <
							EXPRESSIONS_PRECEDENCE.MemberExpression
						) {
							state.write('(');
							this[node.object.type](node.object, state);
							state.write(')');
						} else {
							this[node.object.type](node.object, state);
						}

						if (node.computed) {
							state.write('[');
							this[node.property.type](node.property, state);
							state.write(']');
						} else {
							state.write('.');
							this[node.property.type](node.property, state);
						}
					},
					MetaProperty: function MetaProperty(node, state) {
						state.write(
							node.meta.name + '.' + node.property.name,
							node
						);
					},
					Identifier: function Identifier(node, state) {
						state.write(node.name, node);
					},
					Literal: function Literal(node, state) {
						if (node.raw != null) {
							state.write(node.raw, node);
						} else if (node.regex != null) {
							this.RegExpLiteral(node, state);
						} else {
							state.write(stringify(node.value), node);
						}
					},
					RegExpLiteral: function RegExpLiteral(node, state) {
						var regex = node.regex;
						state.write(
							'/'.concat(regex.pattern, '/').concat(regex.flags),
							node
						);
					},
				};
				exports.baseGenerator = baseGenerator;
				var EMPTY_OBJECT = {};

				var State = (function () {
					function State(options) {
						_classCallCheck(this, State);

						var setup = options == null ? EMPTY_OBJECT : options;
						this.output = '';

						if (setup.output != null) {
							this.output = setup.output;
							this.write = this.writeToStream;
						} else {
							this.output = '';
						}

						this.generator =
							setup.generator != null
								? setup.generator
								: baseGenerator;
						this.indent =
							setup.indent != null ? setup.indent : '  ';
						this.lineEnd =
							setup.lineEnd != null ? setup.lineEnd : '\n';
						this.indentLevel =
							setup.startingIndentLevel != null
								? setup.startingIndentLevel
								: 0;
						this.writeComments = setup.comments
							? setup.comments
							: false;

						if (setup.sourceMap != null) {
							this.write =
								setup.output == null
									? this.writeAndMap
									: this.writeToStreamAndMap;
							this.sourceMap = setup.sourceMap;
							this.line = 1;
							this.column = 0;
							this.lineEndSize =
								this.lineEnd.split('\n').length - 1;
							this.mapping = {
								original: null,
								generated: this,
								name: undefined,
								source:
									setup.sourceMap.file ||
									setup.sourceMap._file,
							};
						}
					}

					_createClass(State, [
						{
							key: 'write',
							value: function write(code) {
								this.output += code;
							},
						},
						{
							key: 'writeToStream',
							value: function writeToStream(code) {
								this.output.write(code);
							},
						},
						{
							key: 'writeAndMap',
							value: function writeAndMap(code, node) {
								this.output += code;
								this.map(code, node);
							},
						},
						{
							key: 'writeToStreamAndMap',
							value: function writeToStreamAndMap(code, node) {
								this.output.write(code);
								this.map(code, node);
							},
						},
						{
							key: 'map',
							value: function map(code, node) {
								if (node != null && node.loc != null) {
									var mapping = this.mapping;
									mapping.original = node.loc.start;
									mapping.name = node.name;
									this.sourceMap.addMapping(mapping);
								}

								if (code.length > 0) {
									if (this.lineEndSize > 0) {
										if (code.endsWith(this.lineEnd)) {
											this.line += this.lineEndSize;
											this.column = 0;
										} else if (
											code[code.length - 1] === '\n'
										) {
											this.line++;
											this.column = 0;
										} else {
											this.column += code.length;
										}
									} else {
										if (code[code.length - 1] === '\n') {
											this.line++;
											this.column = 0;
										} else {
											this.column += code.length;
										}
									}
								}
							},
						},
						{
							key: 'toString',
							value: function toString() {
								return this.output;
							},
						},
					]);

					return State;
				})();

				function generate(node, options) {
					var state = new State(options);
					state.generator[node.type](node, state);
					return state.output;
				}
			},
			{},
		],
	},
	{},
	[1]
);
