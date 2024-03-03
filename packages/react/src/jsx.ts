import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols'
import { ReactElementType, Type, Key, Props, Ref, ElementType } from 'shared/ReactTypes'

const ReactElement = function(
  type: Type,
  key: Key,
  ref: Ref,
  props: Props
):ReactElementType {
  return {
    $$typeof: REACT_ELEMENT_TYPE,
    type,
    key,
    ref,
    props,
    __mark: 'YZH'
  }
}


export function jsx(type: ElementType, config: any, ...maybeChildren: any) {
  let key: Key = ''
  let ref: Ref = null
  let props: Props = {}

  for(let prop in config) {
    const val = config[prop]
    if (prop === 'key') {
      if (val !== undefined) {
        key = '' + val
      }
      continue
    }

    if (prop === 'ref') {
      if (val !== undefined) {
        ref = val
      }
      continue
    }

    if ({}.hasOwnProperty.call(config, prop)) {
      props[prop] = val
    }

    const maybeChildrenLength = maybeChildren.length
    if (maybeChildrenLength) {
      if (maybeChildrenLength === 1) {
        props.children = maybeChildren[0]
      } else {
        props.children = maybeChildren
      }
    } 

  }

  return ReactElement(type, key, ref, props)
}

export const jsxDEV =  (type: ElementType, config: any) => {
  let key: Key = ''
  let ref: Ref = null
  let props: Props = {}

  for(let prop in config) {
    const val = config[prop]
    if (prop === 'key') {
      if (val !== undefined) {
        key = '' + val
      }
      continue
    }

    if (prop === 'ref') {
      if (val !== undefined) {
        ref = val
      }
      continue
    }

    if ({}.hasOwnProperty.call(config, prop)) {
      props[prop] = val
    } 

  }

  return ReactElement(type, key, ref, props)
}