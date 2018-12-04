import React, { Component } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import Provider from '../context'
import deprecatedPropsCheck from '../_util/deprecatedPropsCheck'

class Button extends Component {
  static propTypes = {
    type: PropTypes.oneOf(['primary', 'line', 'success', 'danger', 'default', 'warning', 'info']),
    size: PropTypes.oneOf(['large', 'small', 'normal']),
    appearance: PropTypes.oneOf(['link', 'button', 'line']),
    className: PropTypes.string,
    style: PropTypes.object,
    disabled: PropTypes.bool,
    onClick: PropTypes.func,
    href: PropTypes.string,
    target: PropTypes.oneOf(['_self', '_blank', '_parent', '_top'])
  }

  static defaultProps = {
    type: 'default',
    disabled: false,
    appearance: 'button',
    size: 'normal'
  }

  prefix = 'hi-btn'
  deprecatedProps = {
    type: ['info'],
    appearance: ['line']
  }

  clickCb () {
    if (this.props.onClick) {
      this.props.onClick()
    }
  }

  get classNames () {
    const {
      type,
      disabled,
      className,
      size,
      appearance,
      theme
    } = this.props
    const classList = []

    classList.push('theme__' + theme)
    classList.push(this.prefix)
    classList.push(`${this.prefix}--type--${type}`)
    appearance && classList.push(`${this.prefix}--appearance--${appearance}`)
    size && classList.push(`${this.prefix}--size--${size}`)
    disabled && classList.push(`${this.prefix}--disabled`)
    className && classList.push(className)

    // For version < 1.1.0
    type === 'primary' && appearance === 'line' && classList.push(`${this.prefix}--type--line`)

    return classNames(...classList)
  }

  render () {
    const {
      disabled,
      style,
      title,
      href,
      target
    } = this.props
    const disabledBool = !!disabled

    deprecatedPropsCheck(this.deprecatedProps, this.props, 'Button')

    return (
      href
        ? <a
          className={this.classNames}
          title={title}
          href={href}
          target={target}
          style={style}
          onClick={() => this.clickCb()}
        >
          {this.props.children}
        </a>
        : <button
          type='button'
          className={this.classNames}
          disabled={disabledBool}
          title={title}
          style={style}
          onClick={() => this.clickCb()}
        >
          {this.props.children}
        </button>
    )
  }
}

export default Provider(Button)
