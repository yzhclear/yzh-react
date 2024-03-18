import { Props, ReactElementType } from 'shared/ReactTypes';
import {
	FiberNode,
	createFiberFromElement,
	createWorkInProgress
} from './fiber';
import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols';
import { HostText } from './workTags';
import { ChildDeletion, Placement } from './fiberFlags';

type ExistingChildren = Map<string | number, FiberNode>;

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

	function deletRemainingChild(
		returnFiber: FiberNode,
		currentFirstChild: FiberNode | null
	) {
		if (!shouldTrackEffects) return;

		let childToDelete = currentFirstChild;
		while (childToDelete !== null) {
			deleteChild(returnFiber, childToDelete);
			childToDelete = childToDelete.sibling;
		}
	}

	function reconcileSingleElement(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		element: ReactElementType
	) {
		while (currentFiber !== null) {
			// update
			const key = element.key;
			if (currentFiber.key === key) {
				if (element.$$typeof === REACT_ELEMENT_TYPE) {
					if (currentFiber.type === element.type) {
						// 节点复用
						const existing = useFiber(currentFiber, element.props);
						existing.return = returnFiber;
						// 当前节点可复用， 删除剩余的节点
						deletRemainingChild(returnFiber, currentFiber.sibling);
						return existing;
					}
					// key相同， type不同， 都无法复用，删掉所有旧的
					deletRemainingChild(returnFiber, currentFiber);
					break;
				} else {
					if (__DEV__) {
						console.warn('未实现react类型');
						break;
					}
				}
			} else {
				// key不同
				deleteChild(returnFiber, currentFiber);
				currentFiber = currentFiber.sibling;
				break;
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
		while (currentFiber !== null) {
			// update
			if (currentFiber.tag === HostText) {
				const existing = useFiber(currentFiber, { content });
				existing.return = returnFiber;
				deletRemainingChild(returnFiber, currentFiber.sibling);
				return existing;
			}
			deleteChild(returnFiber, currentFiber);
			currentFiber = currentFiber.sibling;
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

	function reconcileChildrenArray(
		returnFiber: FiberNode,
		currentFirstChild: FiberNode | null,
		newChild: any[]
	) {
		// 最后一个可复用fiber在current中的index
		let lastPlacedIndex: number = 0;
		// 创建的第一个fiber
		let firstNewFiber: FiberNode | null = null
		// 创建的最后一个fiber
		let lastNewFiber: FiberNode | null = null

		// 1. 将current所有同级的fiber保存到map中
		let existingChildren: ExistingChildren = new Map();
		let current = currentFirstChild;
		while (current !== null) {
			let key = current.key !== null ? current.key : current.index;
			existingChildren.set(key, current);
			current = current.sibling;
		}

		for (let i = 0; i < newChild.length; i++) {
			// 2. 遍历当前的newChild
			const after = newChild[i];
			const newFiber = updateFromMap(returnFiber, existingChildren, i, after);

			// 之前xxx节点 更新为 null/undefined
			if (newFiber === null) {
				continue;
			}

			// 3. 标记移动还是插入
			newFiber.index = i
			// 需要去构建兄弟关系, 父子关系
			newFiber.return = returnFiber
			if (lastNewFiber === null) {
				lastNewFiber = newFiber
				firstNewFiber = newFiber
			} else {
				lastNewFiber.sibling = newFiber
				lastNewFiber = lastNewFiber.sibling
			}

			if (!shouldTrackEffects) continue

			const current = newFiber.alternate
			if (current !== null) {
				const oldIndex = current.index
				if (oldIndex < lastPlacedIndex) {
					// 标记移动
					newFiber.flags |= Placement
					continue
				} else {
					// 不移动
					lastPlacedIndex = oldIndex
				}
			} else {
				// mount  新创建的fiber
				newFiber.flags |= Placement
			}
		}

		// 将map剩下的fiber标记为删除
		existingChildren.forEach(fiber => {
			deleteChild(returnFiber, fiber)
		})

		return firstNewFiber
	}

	function updateFromMap(
		returnFiber: FiberNode,
		existingChildren: ExistingChildren,
		index: number,
		element: any
	) {
		const keyToUse = element.key !== null ? element.key : index
		const before = existingChildren.get(keyToUse)

		// HostText
		if (typeof element === 'string' || typeof element === 'number') {
			if (before) {
				existingChildren.delete(keyToUse)
				return useFiber(before, {content: element + ''}) 
			}
			return new FiberNode(HostText, {content: element + ''}, null)
		}

		// ReactElement
		if (typeof element === 'object' && typeof element !== null) {
			switch(element.$$typeof) {
				case REACT_ELEMENT_TYPE:
					if (before) {
						if (element.type === before.type) {
							existingChildren.delete(keyToUse)
							return useFiber(before, element.props)
						}
					}
					return createFiberFromElement(element)
				default:
					break
			} 
		}

		// TODO 数组类型
		if (Array.isArray(element) && __DEV__) {
			console.warn('还未实现数组类型的child')
		}

		return null
	}

	return function reconcileChildFibers(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		newChild: ReactElementType
	) {
		// 多节点的情况 ul > li * 3
		if (Array.isArray(newChild)) {
			return reconcileChildrenArray(returnFiber, currentFiber, newChild);
		}

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

		// HostText
		if (typeof newChild === 'string' || typeof newChild === 'number') {
			return placeSingleChild(
				reconcileSingleTextNode(returnFiber, currentFiber, newChild)
			);
		}

		// 兜底删除
		if (currentFiber !== null) {
			deleteChild(returnFiber, currentFiber);
		}

		if (__DEV__) {
			console.warn('未实现的reconcile类型', newChild);
		}

		return null;
	};
}

export const reconcileChildFibers = ChildReconciler(true);
export const mountChildFiber = ChildReconciler(false);
