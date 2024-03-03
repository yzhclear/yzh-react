const supportSymbol = typeof Symbol === 'function' && Symbol.for;

// 和 Symbol() 不同的是，用 Symbol.for() 方法创建的 symbol 会被放入一个全局 symbol 注册表中。Symbol.for() 并不是每次都会创建一个新的 symbol，
// 它会首先检查给定的 key 是否已经在注册表中了。
// 假如是，则会直接返回上次存储的那个。否则，它会再新建一个
export const REACT_ELEMENT_TYPE = supportSymbol
	? Symbol.for('react.element')
	: 0xeac7;

