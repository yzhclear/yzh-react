import {
	Container,
	Instance,
	appendChildToContainer,
	commitUpdate,
	insertChildToContainer,
	removeChild
} from 'hostConfig';
import { FiberNode, FiberRootNode } from './fiber';
import {
	ChildDeletion,
	MutationMask,
	NoFlags,
	Placement,
	Update
} from './fiberFlags';
import {
	FunctionComponent,
	HostComponent,
	HostRoot,
	HostText
} from './workTags';

let nextEffect: FiberNode | null;
// 深度优先遍历， 先找到这样一个fiber节点，它的子fiber节点没有副作用，即它是最深层次的一个有副作用的节点， 它的子fiber节点就不用管了，可以复用
// 找到它后， 根据它的flags执行副作用
// 执行完成后， 再查看这个fiber节点有没有兄弟fiber节点，如果有， 以这个兄弟fiber节点为根节点， 重新再走一次深度优先遍历
// 当所有深度优先遍历走完后， 再向上进行遍历
export function commitMutationEffects(finishedWork: FiberNode) {
	nextEffect = finishedWork;

	while (nextEffect !== null) {
		// 向下遍历
		const child: FiberNode | null = nextEffect.child;
		if (
			(nextEffect.subtreeFlags & MutationMask) !== NoFlags &&
			child !== null
		) {
			nextEffect = child;
		} else {
			// 向上遍历DFS
			up: while (nextEffect !== null) {
				commitMutationEffectsOnFiber(nextEffect);
				const sibling: FiberNode | null = nextEffect.sibling;

				if (sibling !== null) {
					nextEffect = sibling;
					break up;
				}

				nextEffect = nextEffect.return;
			}
		}
	}
}

const commitMutationEffectsOnFiber = (finishedWork: FiberNode) => {
	const flags = finishedWork.flags;

	if ((flags & Placement) !== NoFlags) {
		commitPlacement(finishedWork);
		finishedWork.flags &= ~Placement;
	}

	if ((flags & Update) !== NoFlags) {
		commitUpdate(finishedWork);
		finishedWork.flags &= ~Update;
	}

	if ((flags & ChildDeletion) !== NoFlags) {
		const deletions = finishedWork.deletions;
		if (deletions !== null) {
			deletions.forEach((childToDelete) => {
				commitDeletion(childToDelete);
			});
		}
		finishedWork.flags &= ~ChildDeletion;
	}
};

function recordHostChildrenToDelete(childrenToDelete: FiberNode[], unmountFiber: FiberNode) {
	// 找到第一个 root host节点
	let lastOne = childrenToDelete[childrenToDelete.length - 1]

	if (!lastOne) {
		childrenToDelete.push(unmountFiber)
	} else {
		let node = lastOne.sibling
		while(node !== null) {
			if (unmountFiber === node) {
				childrenToDelete.push(unmountFiber)
			}
			node = node.sibling
		}
	}
}

function commitDeletion(childToDelete: FiberNode) {
	let rootChildrenToDelete: FiberNode[] = []
	// 递归子树 对子树中的每个节点做卸载操作
	// 在对子树中的每个节点做卸载操作时， 需要根据不同类型执行不同的操作
	commitNestedComponent(childToDelete, (unMountFiber) => {
		switch (unMountFiber.tag) {
			case HostComponent:
				// if (rootHostNode === null) {
				// 	// 这里的赋值是因为， 当前要删除的子树的根节点可能并不是HostText或者HostCommponent
				// 	rootHostNode = unMountFiber; // 所以我们要找到这个子树根节点对应的第一个真实的DOM节点， 进行删除
				// }
				recordHostChildrenToDelete(rootChildrenToDelete, unMountFiber)
				// TODO 解绑ref
				return;
			case HostText:
				// if (rootHostNode === null) {
				// 	rootHostNode = unMountFiber;
				// }
				recordHostChildrenToDelete(rootChildrenToDelete, unMountFiber)
				return
			case FunctionComponent:
				// TODO Effect unmount
				// 解绑ref
				return;
			default:
				if (__DEV__) {
					console.warn('未处理的unmount类型', unMountFiber);
				}
				break;
		}
	});

	// 删除hostRootNode
	if (rootChildrenToDelete.length) {
		const hostParent = getHostParent(childToDelete);
		if (hostParent !== null) {
			rootChildrenToDelete.forEach(node => {
				removeChild(node.stateNode, hostParent);
			})
			
		}
	}

	// 重置属性
	childToDelete.return = null;
	childToDelete.child = null;
}

function commitNestedComponent(
	root: FiberNode,
	onCommitUnMount: (fiber: FiberNode) => void
) {
	let node = root;

	while (true) {
		onCommitUnMount(node);
		if (node.child !== null) {
			node.child.return = node;
			node = node.child;
			continue;
		}

		if (node === root) {
			return;
		}

		while (node.sibling === null) {
			if (node.return === null || node.return === root) {
				return;
			}
			node = node.return;
		}
		node.sibling.return = node.return;
		node = node.sibling;
	}
}

const commitPlacement = (finishedWork: FiberNode) => {
	if (__DEV__) {
		console.warn('执行Placement操作', finishedWork);
	}

	// find parent DOM
	const parent = getHostParent(finishedWork);
	const sibling = getHostSibling(finishedWork);
	if (parent !== null) {
		insertOrAppendPlacementNodeIntoContainer(finishedWork, parent, sibling);
	}
};

function getHostSibling(fiber: FiberNode) {
	let node: FiberNode = fiber;

	findSibling: while (true) {
		while (node.sibling === null) {
			const parent = node.return;

			if (
				parent === null ||
				parent.tag == HostComponent ||
				parent.tag === HostRoot
			) {
				return null;
			}

			node = parent;
		}

		node.sibling.return = node.return;
		node = node.sibling; 

		while (node.tag !== HostComponent && node.tag !== HostText) {
			// 向下遍历
			if ((node.flags & Placement) !== NoFlags) {
				continue findSibling;
			}
			if (node.child === null) {
				continue findSibling;
			} else {
				node.child.return = node;
				node = node.child;
			}
		}

		if ((node.flags & Placement) === NoFlags) {
			return node.stateNode;
		}
	}
}

function getHostParent(fiber: FiberNode): Container | null {
	let parent = fiber.return;

	while (parent) {
		const parentTag = parent.tag;
		if (parentTag === HostComponent) {
			return parent.stateNode;
		}
		if (parentTag === HostRoot) {
			return (parent.stateNode as FiberRootNode).container;
		}

		parent = parent.return;
	}

	if (__DEV__) {
		console.warn('未找到host parent');
	}

	return null;
}

function insertOrAppendPlacementNodeIntoContainer(
	finishedWork: FiberNode,
	hostParent: Container,
	before?: Instance
) {
	// fiber host
	if (finishedWork.tag === HostComponent || finishedWork.tag === HostText) {
		if (before) {
			insertChildToContainer(finishedWork.stateNode, hostParent, before);
		} else {
			appendChildToContainer(hostParent, finishedWork.stateNode);
		}
		return;
	}

	const child = finishedWork.child;
	if (child !== null) {
		insertOrAppendPlacementNodeIntoContainer(child, hostParent);

		let sibling = child.sibling;

		while (sibling !== null) {
			insertOrAppendPlacementNodeIntoContainer(sibling, hostParent);
			sibling = sibling.sibling;
		}
	}
}
