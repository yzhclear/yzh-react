import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';

function Child() {
	return <span>big-react</span>;
}

function App() {
	const [num, setNum] = useState(100);

	const arr =
		num % 2 === 0
			? [<li id="1" key="1">1</li>, <li id="2" key="2">2</li>, <li id='3' key="3">3</li>]
			: [<li key="3">3</li>, <li key="2">2</li>, <li key="1">1</li>];

	return <ul onClick={() => setNum(num + 1)}>{arr}</ul>;
}

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

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
