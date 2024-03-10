import { FiberNode } from './fiber';

export function renderWithHooks(wip: FiberNode) {
  const Component = wip.type
  const props = wip.pendingProps
  const children = Component(props)
  return children // 返回jsx执行后生成的ReactElement
}