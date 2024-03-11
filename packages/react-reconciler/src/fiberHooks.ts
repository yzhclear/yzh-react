import internals from 'shared/internals';
import { FiberNode } from './fiber';
import { UpdateQueue, createUpdate, createUpdateQueue, enqueueUpdate } from './updateQueue';
import { Dispatch, Dispatcher } from 'react/src/currentDispatcher';
import { Action } from 'shared/ReactTypes';
import { scheduleUpdateOnFiber } from './workLoop';

let currentlyRenderingFiber: FiberNode | null = null
let workInprogressHook: Hook | null = null

const { currentDispatcher } = internals;

interface Hook {
	memoizedState: any;
	updateQueue: unknown;
	next: Hook | null;
}

export function renderWithHooks(wip: FiberNode) {
	currentlyRenderingFiber = wip;
	wip.memoizedState = null; // memoizedState 存的是当前fiberNode的hook链表

	const current = wip.alternate;
	if (current !== null) {
		// update
	} else {
		currentDispatcher.current = HooksDispatcherOnMount;
	}

	const Component = wip.type;
	const props = wip.pendingProps;
	const children = Component(props);
	return children; // 返回jsx执行后生成的ReactElement
}

const HooksDispatcherOnMount: Dispatcher = {
	useState: mountState
};

function mountState<State>(
	initialState: (() => State) | State
): [State, Dispatch<State>] {
	// 找到当前useState对应的hook数据
	const hook = mountWorkInProgressHook();

	let memoizedState;
	if (initialState instanceof Function) {
		memoizedState = initialState();
	} else {
		memoizedState = initialState;
	}

	const queue = createUpdateQueue<State>();
	hook.updateQueue = queue;
  hook.memoizedState = memoizedState

  // @ts-ignore
  const dispatch = dispatchSetState.bind(null, currentlyRenderingFiber, queue)
  queue.dispatch = dispatch
	return [memoizedState, dispatch];
}

function dispatchSetState<State>(
	fiber: FiberNode,
	updateQueue: UpdateQueue<State>,
	action: Action<State>
) {
  const update = createUpdate(action)
  enqueueUpdate(updateQueue, update)
  scheduleUpdateOnFiber(fiber)
}

function mountWorkInProgressHook(): Hook {
	let hook = {
		memoizedState: null,
		updateQueue: null,
		next: null
	};

	if (workInprogressHook === null) {
		if (currentlyRenderingFiber === null) {
			throw new Error('请在函数组件内调用hook');
		} else {
			workInprogressHook = hook;
			currentlyRenderingFiber.memoizedState = workInprogressHook;
		}
	} else {
		workInprogressHook.next = hook;
		workInprogressHook = hook;
	}

	return hook;
}
