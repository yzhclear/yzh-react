import internals from 'shared/internals';
import { FiberNode } from './fiber';
import { UpdateQueue, createUpdate, createUpdateQueue, enqueueUpdate, processUpdateQueue } from './updateQueue';
import { Dispatch, Dispatcher } from 'react/src/currentDispatcher';
import { Action } from 'shared/ReactTypes';
import { scheduleUpdateOnFiber } from './workLoop';
import { Lane, NoLane, requestUpdateLane } from './fiberLanes';
import { Flags, PassiveEffect } from './fiberFlags';
import { HookHasEffect, Passive } from './hookEffectTags';

let currentlyRenderingFiber: FiberNode | null = null
let workInprogressHook: Hook | null = null
let currentHook: Hook | null = null
let renderLane: Lane = NoLane

const { currentDispatcher } = internals;

interface Hook {
	memoizedState: any;
	updateQueue: unknown;
	next: Hook | null;
}


export interface Effect {
	tag: Flags;
	create: EffectCallback | void;
	destroy: EffectCallback | void;
	deps: EffectDeps;
	next: Effect | null
}

export interface FCUpdateQueue<State> extends UpdateQueue<State> {
	lastEffect: Effect | null
}

type EffectCallback = () => void 
export type EffectDeps = any[] | null

function createFCUpdateQueue<State>() {
	const updateQueue = (createUpdateQueue<State>()) as FCUpdateQueue<State>
	updateQueue.lastEffect = null
	return updateQueue
}

function  mountEffect(create: EffectCallback | void, deps: EffectDeps) {
	const hook = mountWorkInProgressHook()
	const nextDeps = deps === undefined ? null : deps;

	(currentlyRenderingFiber as FiberNode).flags  |= PassiveEffect

	hook.memoizedState = pushEffect(Passive | HookHasEffect, create, undefined, nextDeps )

}

function updateEffect(create: EffectCallback | void, deps: EffectDeps | void){
	// 找到当前 useState对应的hook数据
	const hook = updateWorkInprogressHook()
	const nextDeps = deps === undefined ? null : deps
	let destroy: EffectCallback | void

	if (currentHook !== null) {
		const prevEffect = currentHook.memoizedState as Effect
		destroy = prevEffect.destroy

		if (nextDeps !== null) {
			// 浅比较依赖
			const prevDeps = prevEffect.deps;
			if (areHookInputsEqual(nextDeps, prevDeps)) {
				hook.memoizedState = pushEffect(Passive, create, destroy, nextDeps)
				return
			}
		}

		// 浅比较 不相等
		(currentlyRenderingFiber as FiberNode).flags |= PassiveEffect;
		hook.memoizedState = pushEffect(
			Passive | HookHasEffect,
			create,
			destroy,
			nextDeps
		);
	}
	
}

function areHookInputsEqual(nextDeps: EffectDeps, prevDeps: EffectDeps) {
	if (nextDeps === null || prevDeps === null) {
		return false
	}

	for(let i = 0; i < prevDeps.length && i < nextDeps.length; i++) {
		if (Object.is(prevDeps[i], nextDeps[i])) {
			continue
		}
		return false
	}

	return true
}

function pushEffect(hookFlags: Flags, create: EffectCallback | void, destroy: EffectCallback |  void, deps: EffectDeps): Effect {
	const effect: Effect = {
		tag: hookFlags,
		create,
		destroy,
		deps,
		next: null
	}
	const fiber = currentlyRenderingFiber as FiberNode
	const updateQueue = fiber.updateQueue as FCUpdateQueue<any>

	if (updateQueue === null) {
		const updateQueue  = createFCUpdateQueue()
		fiber.updateQueue = updateQueue
		effect.next = effect
		updateQueue.lastEffect = effect
	} else {
		const lastEffect = updateQueue.lastEffect
		if (lastEffect === null) {
			updateQueue.lastEffect = effect
			effect.next = effect
		} else {
			const firstEffect = lastEffect.next
			lastEffect.next = effect
			effect.next = firstEffect
			updateQueue.lastEffect = effect
		}
	}
	return effect
}


export function renderWithHooks(wip: FiberNode, lane: Lane) {
	currentlyRenderingFiber = wip;
	wip.memoizedState = null; // memoizedState 存的是当前fiberNode的hook链表
	wip.updateQueue = null // 重置effect链表
	renderLane = lane

	const current = wip.alternate;
	if (current !== null) {
		// update
		currentDispatcher.current = HooksDispatcherOnUpdate
	} else {
		currentDispatcher.current = HooksDispatcherOnMount;
	}

	const Component = wip.type;
	const props = wip.pendingProps;

	// FC render
	const children = Component(props);
	// 重置操作
	currentlyRenderingFiber = null
	workInprogressHook = null
	currentHook = null
	renderLane = NoLane
	return children; // 返回jsx执行后生成的ReactElement
}

const HooksDispatcherOnMount: Dispatcher = {
	useState: mountState,
	useEffect: mountEffect
};
const HooksDispatcherOnUpdate: Dispatcher = {
	useState: updateState,
	useEffect: updateEffect
};


function updateState<State>(): [State, Dispatch<State>] {
	// 找到当前 useState对应的hook数据
	const hook = updateWorkInprogressHook()

	// 计算新state的逻辑
	const queue = hook.updateQueue as UpdateQueue<State>
	const pending = queue.shared.pending
	queue.shared.pending = null

	if (pending !== null) {
		const {memoizedState} = processUpdateQueue(hook.memoizedState, pending, renderLane)
		hook.memoizedState = memoizedState
	}

	return [hook.memoizedState, queue.dispatch as Dispatch<State>]
}

function updateWorkInprogressHook(): Hook {
	// TODO render阶段触发的更新
	let nextCurrentHook: Hook | null

	if (currentHook === null) {
		// 这是FC update时的第一个hook
		const current = currentlyRenderingFiber?.alternate
		if (current !== null) {
			nextCurrentHook = current?.memoizedState
		} else {
			nextCurrentHook = null
		}
	} else {
		// 这是 FC update时 后续的hook
		nextCurrentHook = currentHook.next
	}

	if (nextCurrentHook === null) {
		throw new Error(`组件${currentlyRenderingFiber?.type}本次执行时的Hook比上次多`)
	}

	currentHook = nextCurrentHook as Hook
	const newHook: Hook = {
		memoizedState: currentHook.memoizedState,
		updateQueue: currentHook.updateQueue,
		next: null
	}
	if (workInprogressHook === null) {
		if (currentlyRenderingFiber === null) {
			throw new Error('请在函数组件内调用hook');
		} else {
			workInprogressHook = newHook;
			currentlyRenderingFiber.memoizedState = workInprogressHook;
		}
	} else {
		workInprogressHook.next = newHook;
		workInprogressHook = newHook;
	}
	return newHook
}


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
	const lane = requestUpdateLane()
  const update = createUpdate(action, lane)
  enqueueUpdate(updateQueue, update)
  scheduleUpdateOnFiber(fiber, lane)
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
