import { Component } from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'
import shallowequal from 'shallowequal'
import cloneDeep from 'lodash/cloneDeep'

export default class Upload extends Component {
  constructor (props) {
    super(props)
    const fileList = cloneDeep(this.props.defaultFileList)
    this.state = {
      fileList
    }
  }

  componentWillReceiveProps (nextProps) {
    if (!shallowequal(nextProps.defaultFileList, this.props.defaultFileList)) {
      this.setState({
        fileList: cloneDeep(nextProps.defaultFileList)
      })
    }
  }

  static propTypes = {
    uploadType: PropTypes.string,
    accept: PropTypes.string,
    limit: PropTypes.number,
    buttonText: PropTypes.string,
    buttonIcon: PropTypes.string,
    uploadAction: PropTypes.string,
    param: PropTypes.object,
    name: PropTypes.string,
    disabled: PropTypes.bool,
    headers: PropTypes.object,
    showUploadList: PropTypes.bool,
    multiple: PropTypes.bool,
    onChange: PropTypes.func,
    defaultFileList: PropTypes.array,
    onRemove: PropTypes.oneOfType([PropTypes.func, PropTypes.bool])
  }

  static defaultProps = {
    defaultFileList: [],
    headers: {'Content-type': 'application/x-www-form-urlencoded'},
    accept: '',
    limit: null,
    buttonIcon: 'upload',
    uploadAction: '',
    param: null,
    name: 'file',
    disabled: false,
    showUploadList: true,
    multiple: false,
    onRemove: () => true,
    onChange: () => {}
    // overEvent: false
  }

  getFileType (file) {
    let ext = file.name.slice(file.name.lastIndexOf('.') + 1).toLowerCase()
    let fileType = ''

    switch (ext) {
      case 'jpg':
      case 'gif':
      case 'png':
      case 'bmp':
        fileType = 'img'
        break
      case 'rar':
      case 'zip':
        fileType = 'zip'
        break
      case 'doc':
      case 'dcox':
        fileType = 'word'
        break
      case 'pdf':
        fileType = 'pdf'
        break
      case 'ppt':
      case 'pptx':
        fileType = 'ppt'
        break
      case 'xls':
      case 'xlsx':
        fileType = 'excel'
        break
      default:
        fileType = 'other'
        break
    }
    return fileType
  }

  uploadFiles (files) {
    const {
      fileList
    } = this.state

    if (files.length === 0) return
    for (let key in files) {
      if (!files.hasOwnProperty(key)) continue
      let file = files[key]
      file.uploadState = 'loading'
      file.fileType = this.getFileType(file)
      fileList.unshift(file)
      this.setState({ fileList })
      this.uploadFile(file)
    }
    ReactDOM.findDOMNode(this.uploadRef).value = ''
  }

  deleteFile (file, index) {
    const {
      fileList
    } = this.state
    const {
      onRemove
    } = this.props
    const doRemove = () => {
      fileList.splice(index, 1)
      this.setState({fileList})
    }
    const ret = onRemove(file, fileList)
    if (ret === true) {
      doRemove()
    } else if (ret && typeof ret.then === 'function') {
      ret.then(res => {
        if (res === true) {
          doRemove()
        }
      })
    }
  }

  uploadFile (file) {
    const FileReader = window.FileReader
    const XMLHttpRequest = window.XMLHttpRequest
    const FormData = window.FormData
    const {
      fileList
    } = this.state
    const {
      name,
      param,
      onChange,
      headers,
      uploadAction
    } = this.props

    if (file.fileType === 'img') { // 用来图片预览
      const fr = new FileReader()

      fr.onload = e => {
        const url = e.target.result
        file.url = url
        this.setState({ fileList })
      }
      fr.readAsDataURL(file)
    }

    let xhr = new XMLHttpRequest()
    let formFile = new FormData()
    formFile.append(name, file)
    // 设置除file外需要带入的参数
    if (param) {
      for (let i in param) {
        formFile.append(i, param[i])
      }
    }
    xhr.upload.onload = () => {
      file.uploadState = 'success'
      this.setState({ fileList })
    }
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          onChange(file, fileList, JSON.parse(xhr.response))
        }
      }
    }
    xhr.upload.onerror = () => {
      file.uploadState = 'error'
      this.setState({ fileList })
      onChange(file, fileList, {})
    }
    xhr.upload.onprogress = event => {
      var e = event || window.event
      var percentComplete = Math.ceil(e.loaded / e.total * 100)
      file.progressNumber = percentComplete
      this.setState({ fileList })
    }

    xhr.open('post', uploadAction, true)
    // 设置用户传入的请求头
    if (headers) {
      for (let j in headers) {
        xhr.setRequestHeader(j, headers[j])
      }
    }
    xhr.send(formFile)
  }
}