import { Key, Props, Ref } from 'shared/ReactTypes';
import { WorkTag } from './workTags';
import { Flags, NoFlags } from './fiberFlags';

export class FiberNode {
  type: any;
  tag: WorkTag;
  pendingProps: Props;
  key: Key;
  stateNode: any
  ref: Ref

  return: FiberNode | null;
  sibling: FiberNode | null;
  child: FiberNode | null;
  index: number;

  memoizedProps: Props | null;
  alternate: FiberNode | null;
  flags: Flags;

  constructor(tag: WorkTag, pendingProps: Props, key: Key) {
    this.tag = tag
    this.key = key
    this.stateNode = null // 存储真实DOM节点
    this.type = null // 如 FunctionComponent

    // 构成树状结构
    this.return = null     // 指向父FiberNode
    this.sibling = null
    this.child = null
    this.index = 0

    this.ref = null

    // 作为工作单元
    this.pendingProps = pendingProps 
    this.memoizedProps = null 

    this.alternate = null // 指向 currentFiberNode 或 workInprogress
    // 副作用
    this.flags = NoFlags
  }
}