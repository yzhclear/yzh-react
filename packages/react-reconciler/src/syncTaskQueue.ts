let syncTaskQueue: ((...arg: any) => void)[] | null = null
let isFlushingSyncQueue: boolean = false

export function scheduleSyncCallback(callback: (...arg: any) => void) {
  if (syncTaskQueue === null) {
    syncTaskQueue = [callback]
  } else {
    syncTaskQueue.push(callback)
  }
}

export function flushSyncCallbacks() {
  if (!isFlushingSyncQueue && syncTaskQueue) {
    isFlushingSyncQueue = true

    try {
      syncTaskQueue.forEach(callback => callback())
    } catch (error) {
      if (__DEV__) {
        console.warn('flushSyncCallbacks报错', error)
      }
    }finally {
      isFlushingSyncQueue = false
    }
  }
}