import React, {useState} from 'react'
import ReactDOM from 'react-dom/client'

function Child() {
  return <span>big-react</span>
}

// function App() {
//   const [num, setNum] = useState(100)
//   window.setNum = setNum
//   return num === 3 ? <Child/> : <div>{num}</div>
// }

function App() {
  const [num, setNum] = useState(100)
  
  return (
    <div>
      <span onClick={() => setNum(num+1)}>{num}</span>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <App />
)
