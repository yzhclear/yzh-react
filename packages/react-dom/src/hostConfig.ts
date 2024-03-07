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

export const appendChildToContainer = appendInitalChild
