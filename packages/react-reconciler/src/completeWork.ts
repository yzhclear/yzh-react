import { Container, Instance, appendInitalChild, createInstance, createTextInstance } from 'hostConfig';
import { FiberNode } from './fiber';
import { HostComponent, HostText, HostRoot, FunctionComponent, Fragment } from './workTags';
import { NoFlags, Update } from './fiberFlags';
import { updateFiberProps } from 'react-dom/src/SyntheticEvent';

// 递归中的归阶段
export const completeWork = (wip: FiberNode) => {
	const newProps = wip.pendingProps;
	const current = wip.alternate;

	switch (wip.tag) {
		case HostComponent:
			if (current !== null && wip.stateNode) {
				// update
				// 为了实现合成事件， 这里先直接给DOM元素赋值props
				// TODO 比较不同的props是否变化， 打上Update标记， 在commit阶段的commitUpdate方法里再赋值
				updateFiberProps(wip.stateNode, newProps)
			} else {
				// mount
				// 1.构建DOM
        const instance = createInstance(wip.type, newProps)
				// 2. 将DOM插入到DOM树中
        appendAllChildren(instance, wip)
        wip.stateNode = instance
			}
      bubbleProperties(wip)
			return null;
		case HostText:
      if (current !== null && wip.stateNode) {
				// update
				const oldText = current.memoizedProps.content
				const newText = newProps.content
				if (oldText !== newText) {
					markUpdate(wip)
				}
			} else {
				// mount
        const instance = createTextInstance(newProps.content)
        wip.stateNode = instance
			}
      bubbleProperties(wip)
			return null;
		case HostRoot:
    case FunctionComponent:
		case Fragment:
      bubbleProperties(wip)
      return null
    default:
      if (__DEV__) {
        console.warn('未处理的completeWork情况', wip)
      }
	}
};

function markUpdate(fiber: FiberNode) {
	fiber.flags |= Update
}

function appendAllChildren(parent: Container | Instance, wip: FiberNode) {
	let node = wip.child;

	while (node !== null) {
		if (node.tag === HostComponent || node.tag === HostText) {
			appendInitalChild(parent, node?.stateNode);
		} else if (node.child !== null) {
			node.child.return = node;
			node = node.child;
			continue;
		}

		if (node === wip) {
			return;
		}

		while (node.sibling === null) {
			if (node.return === null || node.return === wip) {
				return;
			}

			node = node?.return;
		}
		node.sibling.return = node.return;
		node = node.sibling;
	}
}

function bubbleProperties(wip: FiberNode) {
  let subtreeFlags = NoFlags
  let child = wip.child

  while(child != null) {
    subtreeFlags |= child.subtreeFlags
    subtreeFlags |= child.flags

    child.return = wip
    child = child.sibling
  }

  wip.subtreeFlags |= subtreeFlags
}
