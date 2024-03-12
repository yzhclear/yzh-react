import { Props, ReactElementType } from 'shared/ReactTypes';
import {
	FiberNode,
	createFiberFromElement,
	createWorkInProgress
} from './fiber';
import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols';
import { HostText } from './workTags';
import { ChildDeletion, Placement } from './fiberFlags';

function useFiber(fiber: FiberNode, pendingProps: Props) {
	const clone = createWorkInProgress(fiber, pendingProps);

	clone.index = 0;
	clone.sibling = null;

	return clone;
}

function ChildReconciler(shouldTrackEffects: boolean) {
	function deleteChild(fiber: FiberNode, childToDelete: FiberNode) {
		if (!shouldTrackEffects) return;

		const deletions = fiber.deletions;
		if (!deletions) {
			fiber.deletions = [childToDelete];
			fiber.flags |= ChildDeletion;
		} else [deletions.push(childToDelete)];
	}

	function reconcileSingleElement(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		element: ReactElementType
	) {
		work: if (currentFiber !== null) {
			// update
			const key = element.key;
			if (currentFiber.key === key) {
				if (element.$$typeof === REACT_ELEMENT_TYPE) {
					if (currentFiber.type === element.type) {
						// 节点复用
						const existing = useFiber(currentFiber, element.props);
						existing.return = returnFiber;
						return existing;
					}
					deleteChild(returnFiber, currentFiber);
					break work;
				} else {
					if (__DEV__) {
						console.warn('未实现react类型');
						break work;
					}
				}
			} else {
				deleteChild(returnFiber, currentFiber);
				break work;
			}
		}

		const fiber = createFiberFromElement(element);
		fiber.return = returnFiber;
		return fiber;
	}

	function reconcileSingleTextNode(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		content: string | number
	) {
    if (currentFiber !== null) {
      // update
      if (currentFiber.tag === HostText) {
        const existing = useFiber(currentFiber, {content})
        existing.return = returnFiber
        return existing
      }
      deleteChild(returnFiber, currentFiber)
    }
		const fiber = new FiberNode(HostText, { content }, null);
		fiber.return = returnFiber;
		return fiber;
	}

	function placeSingleChild(fiber: FiberNode) {
		if (shouldTrackEffects && fiber.alternate === null) {
			fiber.flags |= Placement;
		}
		return fiber;
	}

	return function reconcileChildFibers(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		newChild?: ReactElementType
	) {
		if (typeof newChild === 'object' && newChild !== null) {
			switch (newChild.$$typeof) {
				case REACT_ELEMENT_TYPE:
					return placeSingleChild(
						reconcileSingleElement(returnFiber, currentFiber, newChild)
					);
				default:
					if (__DEV__) {
						console.warn('未实现的reconcile类型', newChild);
					}
			}
		}

		// TODO 多节点的情况 ul > li * 3

		// HostText
		if (typeof newChild === 'string' || typeof newChild === 'number') {
			return placeSingleChild(
				reconcileSingleTextNode(returnFiber, currentFiber, newChild)
			);
		}

    // 兜底删除
    if (currentFiber !== null) {
      deleteChild(returnFiber, currentFiber)
    }

    if (__DEV__) {
      console.warn('未实现的reconcile类型', newChild)
    }

		return null;
	};
}

export const reconcileChildFibers = ChildReconciler(true);
export const mountChildFiber = ChildReconciler(false);
