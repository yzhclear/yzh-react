import { beginWork } from './beginWork';
import { completeWork } from './completekWork';
import { FiberNode, FiberRootNode, createWorkInProgress } from './fiber';
import { HostRoot } from './workTags';

let workInprogress: FiberNode | null = null

function prepareFreshStack(root: FiberRootNode) {
  workInprogress = createWorkInProgress(root.current, {})
}

export function scheduleUpdateOnFiber(fiber: FiberNode) {
  // TODO 调度功能
  const root = markUpdateFromFiberToRoot(fiber)
  renderRoot(root)
}

function markUpdateFromFiberToRoot(fiber: FiberNode) {
  let node = fiber
  let parent = fiber.return

  while(parent !== null) {
    node = parent
    parent = node.return
  }

  if (node.type === HostRoot) {
    return node.stateNode
  }

  return null
}

function renderRoot(root: FiberRootNode) {
  // 初始化
  prepareFreshStack(root)

  do {
    try {
      workLoop(root.current)
    } catch (error) {
      console.warn('workloop发生错误')
    }
  } while (true);
}

function workLoop(fiber: FiberNode) {
  while(workInprogress !== null) {
    performUnitOfWork(workInprogress)
  }
}

function performUnitOfWork(fiber: FiberNode) {
  const next = beginWork(fiber)
  fiber.memoizedProps = fiber.pendingProps

  if (next === null) {
    completeUnitOfWork(fiber)
  } else {
    workInprogress = next
  }
}

function completeUnitOfWork(fiber: FiberNode) {
  let node: FiberNode | null = fiber

  do {
    completeWork(fiber)
    const sibling = node.sibling

    if (sibling !== null) {
      workInprogress = sibling
      return
    }
    node = node.return
    workInprogress = node

  } while (node !== null);
}