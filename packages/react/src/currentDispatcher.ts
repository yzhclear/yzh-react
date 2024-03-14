import { Action } from 'shared/ReactTypes'

export interface Dispatcher {
  useState: <T>(initalState: (() => T | T)) => [T, Dispatch<T>]
}

export type Dispatch<State> = (action: Action<State>) => void

export const currentDispatcher: {current: Dispatcher | null} = {
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