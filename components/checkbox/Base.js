import React, { Component } from 'react'
import classnames from 'classnames'
import MultipleCheckboxsOpera from './common'
class Base extends Component {
  constructor (props) {
    super(props)
    this.state = {
      checked: props.checked,
      disabled: props.disabled,
      value: props.value,
      content: props.content,
      part: false,
      onChange: props.onChange || (() => {})
    }
    this.handleChange = this.handleChange.bind(this)
  }
  componentDidMount () {
    const root = MultipleCheckboxsOpera.getRoot(this.props.name)

    if (this.state.checked) {
      root && root.setState({part: true})
    }
  }
  componentWillReceiveProps (nextProps) {
    if ('checked' in nextProps) {
      if (nextProps.checked !== this.props.checked) {
        this.setState({
          checked: nextProps.checked
        })
      }
    }
  }
  handleChange (data) {
    const {value, checked, name, all} = data
    let checkedList = []
    if (all) {
      const list = MultipleCheckboxsOpera.getAll(all)
      const root = MultipleCheckboxsOpera.getRoot(all)
      let num = 0
      list.map(item => {
        if (item.state.disabled && item.state.checked) {
          num++
          checkedList.push(item.state.value)
          return
        } else if (checked) {
          num++
          checkedList.push(item.state.value)
        }
        item.setState({
          checked: checked
        })
      })
      root && root.setState({
        part: !!((num > 0 && num < list.length))
      })
    }
    if (name) {
      const allRef = MultipleCheckboxsOpera.getAll(name)
      const root = MultipleCheckboxsOpera.getRoot(name)
      if (root) {
        const t = allRef.filter(item => item.state.checked === true)
        let part = false
        let _checked = false
        t.length < allRef.length && t.length !== 0 && (part = true)
        t.length === allRef.length && (_checked = true)

        root && root.setState({
          part,
          checked: _checked
        })
        checkedList = t.map(item => {
          return item.state.value
        })
      } else {
        const t = allRef.filter(item => item.state.checked === true)
        checkedList = t.map(item => {
          return item.state.value
        })
      }
    }
    if (name || all) {
      const root = MultipleCheckboxsOpera.getRoot(name || all)
      root ? root.state.onChange(checkedList, value, checked) : this.state.onChange(checkedList, value, checked)
      return
    }
    this.state.onChange(value, checked)
  }
  render () {
    const {value, content, disabled, checked, part} = this.state
    const {name, all} = this.props

    const labelClass = classnames(
      'hi-checkbox',
      disabled && 'hi-checkbox--disabled',
      checked && 'hi-checkbox--checked',
      part && `hi-checkbox--part`
    )
    return (
      <div
        className={labelClass}
        onClick={() => {
          if (disabled) return
          this.setState({
            checked: !this.state.checked,
            part: false
          }, () => {
            this.handleChange({value, checked: this.state.checked, name, all})
          })
        }}
      >
        <span className='hi-checkbox__input' />
        <span className='hi-checkbox__label'>
          {content}
        </span>
      </div>
    )
  }
}

export default Base
