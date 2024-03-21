import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';

function Child() {
	return <span>big-react</span>;
}

// function App() {
// 	return (
// 		<ul>
// 			<>
// 				<li>a</li>
// 				<li>b</li>
// 			</>
// 			<li>c</li>
// 		</ul>
// 	);
// }

// function App() {
// 	const [num, setNum] = useState(100);
// 		const arr =
// 		num % 2 === 0
// 			? [<li key="1">1</li>, <li key="2">2</li>, <li key="3">3</li>]
// 			: [<li key="3">3</li>, <li key="2">2</li>, <li key="1">1</li>];
// 	return (
// 		<ul onClick={() => setNum(num + 1)}>
// 			<li>a</li>
// 			<li>b</li>
// 			{arr}
// 		</ul>
// 	);
// }

// function App() {
// 	const [num, setNum] = useState(100);

// 	const arr =
// 		num % 2 === 0
// 			? [<li key="1">1</li>, <li key="2">2</li>, <li key="3">3</li>]
// 			: [<li key="3">3</li>, <li key="2">2</li>, <li key="1">1</li>];

// 	return <ul onClick={() => setNum(num + 1)}>{arr}</ul>;
// }

// function App() {
//   const [num, setNum] = useState(100)
//   window.setNum = setNum
//   return num === 3 ? <Child/> : <div>{num}</div>
// }

// function App() {
//   const [num, setNum] = useState(100)

//   return (
//     <div>
//       <span onClick={() => setNum(num+1)}>{num}</span>
//     </div>
//   )
// }

function App() {
	const [num, setNum] = useState(0);

	return (
		<ul
			onClick={() => {
				setNum((num) => {
					console.log('1')
					return num + 1
				});
				setNum((num, a) => {
					console.log('2')
					return num + 1
				});
				setNum((num,a, b) => {
					console.log('3')
					return num + 1
				});
			}}
		>
			{num}
		</ul>
	);
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
