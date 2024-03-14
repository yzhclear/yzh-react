import { FiberNode } from 'react-reconciler/src/fiber';
import { HostComponent, HostText } from 'react-reconciler/src/workTags';
import { Props } from 'shared/ReactTypes';

export type Container = Element;
export type Instance = Element;
export type TextInstance = Text

export const createInstance = (type: string, props: Props) => {
  // TODO 处理props
  const element = document.createElement(type)
  return element
}

export const appendInitalChild = (parent: Container | Instance, child: Instance) => {
  parent.appendChild(child)
}

export const createTextInstance = (content: string) => {
  return document.createTextNode(content)
}

export const commitUpdate = (fiber: FiberNode) => {
  switch(fiber.tag) {
    case HostText:
      const text = fiber.memoizedProps.content
      return commitTextUpdate(fiber.stateNode, text)
    case HostComponent:
      // TODO
  }
}

export function commitTextUpdate(textInstance: TextInstance, text: string) {
  textInstance.textContent = text
}

export function removeChild(child: Instance | TextInstance, container: Container) {
  container.removeChild(child)
}

export const appendChildToContainer = appendInitalChild
