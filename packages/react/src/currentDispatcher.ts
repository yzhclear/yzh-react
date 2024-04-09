import { Action } from 'shared/ReactTypes'
import {EffectDeps } from 'react-reconciler/src/fiberHooks'

export interface Dispatcher {
  useState: <T>(initalState: (() => T | T)) => [T, Dispatch<T>];
  useEffect: (callback: () => void | void, deps: EffectDeps) => void;
  useTransition: () => [boolean, (callback: () => void) => void]
}

export type Dispatch<State> = (action: Action<State>) => void

const currentDispatcher: {current: Dispatcher | null} = {
  current: null
}

export function resolveDispatcher(): Dispatcher {
  // 在函数组件调用时 会将 currentDispatcher.current 赋值
  const dispatcher = currentDispatcher.current

  if (dispatcher === null) {
    throw new Error('hook只能在函数组件中执行')
  }
  
  return dispatcher
}

export default currentDispatcher