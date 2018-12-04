function deprecatedWarning (componentName, propName, propValue) {
  console.warn(
    'Deprecated Warning: Invalid prop `' + propName + '`' +
    (propValue ? ' of value `' + propValue + '`' : '') +
    ' supplied to ' + componentName + '.'
  )
}

export default function deprecatedPropsCheck (deprecatedProps, props, componentName) {
  for (const propName in deprecatedProps) {
    if (deprecatedProps.hasOwnProperty(propName)) {
      if (Array.isArray(deprecatedProps[propName]) && deprecatedProps[propName].includes(props[propName])) {
        deprecatedWarning(componentName, propName, props[propName])
      } else if (typeof deprecatedProps[propName] === 'boolean' && deprecatedProps[propName] && props[propName]) {
        deprecatedWarning(componentName, propName)
      }
    }
  }
}

export { deprecatedWarning }
