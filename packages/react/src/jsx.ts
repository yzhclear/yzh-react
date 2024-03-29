import { REACT_ELEMENT_TYPE, REACT_FRAGMENT_TYPE } from 'shared/ReactSymbols'
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

export function isValidElement(object: any) {
  return (
    typeof object === 'object' &&
    object !== null &&
    object.$$typeof === REACT_ELEMENT_TYPE
  )
}


export function jsx(type: ElementType, config: any, maybeKey: any,  ...maybeChildren: any) {
  let key: Key = null
  let ref: Ref = null
  let props: Props = {}

  if (maybeKey !== undefined) {
    key = '' + maybeKey
  }

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

  const maybeChildrenLength = maybeChildren.length
  if (maybeChildrenLength) {
    if (maybeChildrenLength === 1) {
      props.children = maybeChildren[0]
    } else {
      props.children = maybeChildren
    }
  } 

  return ReactElement(type, key, ref, props)
}

export const Fragment = REACT_FRAGMENT_TYPE

export const jsxDEV =  (type: ElementType, config: any, maybeKey: any) => {
  let key: Key = null
  let ref: Ref = null
  let props: Props = {}

  if (maybeKey !== undefined) {
    key = '' + maybeKey
  }

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