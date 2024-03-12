import { Props, ReactElementType } from 'shared/ReactTypes';
import { FiberNode, createFiberFromElement, createWorkInProgress } from './fiber';
import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols';
import { HostText } from './workTags';
import { ChildDeletion, Placement } from './fiberFlags';

function useFiber(fiber: FiberNode, pendingProps: Props) {
  const clone = createWorkInProgress(fiber, pendingProps)

  // 为什么需要重置这两个属性？
  clone.index = 0
  clone.sibling = null

  return clone
}

function ChildReconciler(shouldTrackEffects: boolean) {

  function deleteChild(returnFiber: FiberNode, childToDelete: FiberNode) {
    if (!shouldTrackEffects) return

    let deletions = returnFiber.deletions
    if (!deletions) {
      returnFiber.deletions = [childToDelete]
      returnFiber.flags |= ChildDeletion
    } else {
      deletions.push(childToDelete)
    }
  }

  function reconcileSingleElement(
    returnFiber: FiberNode,
    currentFiber: FiberNode | null,
    element: ReactElementType
  ) {
    const key = element.key

    work: if (currentFiber !== null) {
      // update
      if (currentFiber.key === key) {
        // key相同
        if (element.$$typeof === REACT_ELEMENT_TYPE) {
          if (currentFiber.type === element.type) {
            // fiber节点可以复用
            const existing = useFiber(currentFiber, element.props)
            existing.return = returnFiber
            return  existing
          }
          deleteChild(returnFiber, currentFiber)
          break work;
        } else {
          if (__DEV__) {
            console.warn('还未实现的React类型')
            break work;
          }
        }
      } else {
        deleteChild(returnFiber, currentFiber)
      }
    }
    

    const fiber = createFiberFromElement(element)
    fiber.return = returnFiber
    return fiber
  }

  function reconcileSingleTextNode(
    returnFiber: FiberNode,
    currentFiber: FiberNode | null,
    content: string | number
  ) {
    if (currentFiber !== null) {
      // update
      if (currentFiber.tag === HostText) {
        // 类型没变
        const existing = useFiber(currentFiber, {content})
        existing.return = returnFiber
        return existing
      }
      deleteChild(returnFiber, currentFiber)
    }
    const fiber = new FiberNode(HostText, { content }, null)
    fiber.return = returnFiber
    return fiber
  }

  function placeSingleChild(fiber: FiberNode) {
    if (shouldTrackEffects && fiber.alternate === null) {
      fiber.flags |= Placement
    }
    return fiber
  }


  return function reconcileChildFibers(
    returnFiber: FiberNode,
    currentFiber: FiberNode | null,
    newChild?: ReactElementType
  ) {
    if (typeof newChild === 'object' && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          return placeSingleChild(reconcileSingleElement(returnFiber, currentFiber, newChild))
        default:
          if (__DEV__) {
            console.warn('未实现的reconcile类型', newChild)
          }
      }
    }

    // TODO 多节点的情况 ul > li * 3


    // HostText
    if(typeof newChild === 'string' || typeof newChild === 'number') {
      return placeSingleChild(reconcileSingleTextNode(returnFiber, currentFiber, newChild))
    }

    // 兜底删除
    if (currentFiber !== null) {
      deleteChild(returnFiber, currentFiber)
    }

    if (__DEV__) {
      console.warn('未实现的reconcile类型', newChild)
    }

    return null
  }
}

export const reconcileChildFibers = ChildReconciler(true)
export const mountChildFiber = ChildReconciler(false)