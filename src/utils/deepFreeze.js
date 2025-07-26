/**
 * Deep Freeze Utility for Immutable Nested Objects
 *
 * Provides a pure function to recursively freeze all object properties
 * and nested objects, preventing accidental mutations while maintaining
 * performance through optimization checks.
 *
 * Features:
 * - Handles all data types (objects, arrays, primitives, null, undefined)
 * - Circular reference protection using WeakSet
 * - Performance optimized (skips already-frozen objects)
 * - Type preserving (maintains original object structure)
 * - Pure function (no side effects)
 */

/**
 * Deep freeze utility for immutable nested objects
 * Recursively freezes all object properties and nested objects
 *
 * @param {any} obj - Object to deep freeze (primitives returned as-is)
 * @returns {any} Deep frozen object
 *
 * @example
 * const config = deepFreeze({
 *   simple: 'value',
 *   nested: {
 *     level1: {
 *       level2: ['a', 'b', 'c']
 *     }
 *   }
 * });
 *
 * // All levels are now frozen
 * config.simple = 'new'; // Throws in strict mode, silently fails otherwise
 * config.nested.level1 = {}; // Throws in strict mode, silently fails otherwise
 */
export function deepFreeze(obj) {
	// Handle primitives and null/undefined - return as-is
	if (obj === null || typeof obj !== 'object') {
		return obj;
	}

	// Performance optimization: skip already frozen objects
	if (Object.isFrozen(obj)) {
		return obj;
	}

	// Use WeakSet to track visited objects for circular reference protection
	const visited = new WeakSet();

	function freezeRecursive(current) {
		// Handle primitives and null/undefined
		if (current === null || typeof current !== 'object') {
			return current;
		}

		// Circular reference detection
		if (visited.has(current)) {
			return current;
		}

		// Performance optimization: skip already frozen objects
		if (Object.isFrozen(current)) {
			return current;
		}

		// Mark as visited to prevent circular reference issues
		visited.add(current);

		// Recursively freeze all property values
		Object.getOwnPropertyNames(current).forEach((prop) => {
			const value = current[prop];
			if (value && typeof value === 'object') {
				freezeRecursive(value);
			}
		});

		// Handle arrays - freeze indices and array methods
		if (Array.isArray(current)) {
			current.forEach((item) => {
				if (item && typeof item === 'object') {
					freezeRecursive(item);
				}
			});
		}

		// Finally freeze the current object
		return Object.freeze(current);
	}

	return freezeRecursive(obj);
}

/**
 * Check if an object is deeply frozen (all nested properties are frozen)
 * Useful for testing and debugging
 *
 * @param {any} obj - Object to check
 * @returns {boolean} True if object and all nested objects are frozen
 */
export function isDeeplyFrozen(obj) {
	// Primitives and null are considered "frozen"
	if (obj === null || typeof obj !== 'object') {
		return true;
	}

	// Check if the object itself is frozen
	if (!Object.isFrozen(obj)) {
		return false;
	}

	// Use WeakSet to track visited objects for circular reference protection
	const visited = new WeakSet();

	function checkRecursive(current) {
		if (current === null || typeof current !== 'object') {
			return true;
		}

		if (visited.has(current)) {
			return true; // Assume circular references are properly frozen
		}

		if (!Object.isFrozen(current)) {
			return false;
		}

		visited.add(current);

		// Check all properties recursively
		return Object.getOwnPropertyNames(current).every((prop) => {
			const value = current[prop];
			return checkRecursive(value);
		});
	}

	return checkRecursive(obj);
}

/**
 * Create a deep clone of an object before freezing
 * Useful when you need to freeze a copy without affecting the original
 *
 * @param {any} obj - Object to clone and freeze
 * @returns {any} Deep cloned and frozen object
 */
export function deepCloneAndFreeze(obj) {
	// Handle primitives and null/undefined
	if (obj === null || typeof obj !== 'object') {
		return obj;
	}

	// Use structured cloning for deep copy (modern browsers)
	if (
		typeof globalThis !== 'undefined' &&
		typeof globalThis.structuredClone === 'function'
	) {
		try {
			return deepFreeze(globalThis.structuredClone(obj));
		} catch (error) {
			// Fallback to JSON method if structuredClone fails
			console.warn(
				'structuredClone failed, falling back to JSON method:',
				error
			);
		}
	}

	// Fallback: JSON-based deep clone (limited but widely supported)
	try {
		const cloned = JSON.parse(JSON.stringify(obj));
		return deepFreeze(cloned);
	} catch (error) {
		console.error('Deep clone failed:', error);
		// Return the original object frozen as a last resort
		return deepFreeze(obj);
	}
}

export default deepFreeze;
