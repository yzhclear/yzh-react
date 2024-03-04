import { beginWork } from './beginWork';
import { completeWork } from './completekWork';
import { FiberNode } from './fiber';

let workInprogress: FiberNode | null = null

function prepareFreshStack(fiber: FiberNode) {
  workInprogress = fiber
}

function renderRoot(root: FiberNode) {
  // 初始化
  prepareFreshStack(root)

  do {
    try {
      workLoop(root)
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