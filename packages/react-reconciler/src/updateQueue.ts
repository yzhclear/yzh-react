import { Dispatch } from 'react/src/currentDispatcher';
import { Action } from 'shared/ReactTypes';
import { Lane, NoLane, isSubsetOfLanes } from './fiberLanes';

export interface Update<State> {
	action: Action<State>;
	lane: Lane;
	next: Update<any> | null;
}

export interface UpdateQueue<State> {
	shared: {
		pending: Update<State> | null;
	};
	dispatch: Dispatch<State> | null;
}

export const createUpdate = <State>(
	action: Action<State>,
	lane: Lane
): Update<State> => {
	return {
		action,
		lane,
		next: null
	};
};

export const createUpdateQueue = <State>(): UpdateQueue<State> => {
	return {
		shared: {
			pending: null
		},
		dispatch: null
	} as UpdateQueue<State>;
};

export const enqueueUpdate = <State>(
	updateQueue: UpdateQueue<State>,
	update: Update<State>
) => {
	let pending = updateQueue.shared.pending;
	if (pending === null) {
		update.next = update;
	} else {
		update.next = pending.next;
		pending.next = update;
	}
	updateQueue.shared.pending = update;
};

// 消费updateQueue
export const processUpdateQueue = <State>(
	baseState: State,
	pendingUpdate: Update<State> | null,
	renderLane: Lane
): {
	memoizedState: State;
	baseState: State;
	baseQueue: Update<State> | null;
} => {
	const result: ReturnType<typeof processUpdateQueue<State>> = {
		memoizedState: baseState,
		baseState,
		baseQueue: null
	};

	if (pendingUpdate !== null) {
		const first = pendingUpdate.next;
		let pending = pendingUpdate.next as Update<any>;

		let newBaseState = baseState
		let newState = baseState
		let newBaseQueueFirst: Update<State> | null = null
		let newBaseQueueLast: Update<State> | null = null

		do {
			const updateLane = pendingUpdate.lane;

			if (!isSubsetOfLanes(renderLane, updateLane)) {
				// 优先级不够， 被跳过
				
				const clone = createUpdate(pending.action, pending.lane)
				// 是否是第一个被跳过的优先级
				if (newBaseQueueFirst === null) {
					newBaseQueueFirst = clone
					newBaseQueueLast = clone
					newBaseState = newState  // 被跳过的优先级， 这时候baseState就固定下来了， 后续的状态计算都不会去变更baseState
				} else {
					(newBaseQueueLast as Update<State>).next = clone
					newBaseQueueLast = clone
				}

			} else {
				// 优先级足够
				if (newBaseQueueLast !== null) {
					const clone = createUpdate(pending.action, NoLane)
					newBaseQueueLast.next = clone
					newBaseQueueLast = clone
				}

				const action = pending.action;
				if (action instanceof Function) {
					newState = action(baseState);
				} else {
					newState = action;
				}
			}

			pending = pending.next as Update<any>;
		} while (pending !== first);

		if (newBaseQueueLast === null) {
			// 本次计算没有被跳过的update
			newBaseState = newState
		} else {
			newBaseQueueLast.next = newBaseQueueFirst
		}
		result.memoizedState = newState;
		result.baseState = newBaseState
		result.baseQueue = newBaseQueueLast
	}

	return result;
};

// const createSet = <T>(inital: T) => {
//   return new Set<T>([inital])
// }
// const stringSet = createSet<string>('matt')
// const numberSet = createSet<number>('hell')
