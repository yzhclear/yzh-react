import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';

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

// function App() {
// 	const [num, setNum] = useState(0);

// 	return (
// 		<ul
// 			onClick={() => {
// 				setNum((num) => {
// 					console.log('1')
// 					return num + 1
// 				});
// 				setNum((num, a) => {
// 					console.log('2')
// 					return num + 1
// 				});
// 				setNum((num,a, b) => {
// 					console.log('3')
// 					return num + 1
// 				});
// 			}}
// 		>
// 			{num}
// 		</ul>
// 	);


function Child() {
  useEffect(() => {
    console.log("Child mount");
    return () => console.log("Child unmount");
  }, [])

  return "i am child"
}

export default function App() {
  const [num, updateNum] = useState(0)
  useEffect(() => {
    console.log('App mount');
  }, [])

  useEffect(() => {
    console.log("num change create", num);

    return ()=> {
      console.log("num change destroy", num);
    }
  }, [num])

  return (
    <div onClick={() => updateNum(num + 1)}>
      { num === 0 ? <Child /> : "noop"}
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
