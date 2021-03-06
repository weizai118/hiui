import React, { Component } from 'react'
import PropTypes from 'prop-types'
import ClickOutside from './clickOuterside'
import TableContent from './tableContent'
import prifix from './prefix'
import Checkbox from './checkbox'
import Pagination from '../pagination'
import Icon from '../icon'
import './style'
import loading from '../loading'
import '../pagination/style'
import '../icon/style'
import {setKey, scrollTop, getStyle} from './tool'
import request from 'axios'
let axios = request.create({
  baseURL: ''
})
class Table extends Component {
  static propTypes = {
    data: PropTypes.array,
    useFixedHeader: PropTypes.bool,
    columns: PropTypes.array,

    bodyStyle: PropTypes.object,
    style: PropTypes.object,
    rowKey: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
    rowClassName: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
    onRow: PropTypes.func,
    onHeaderRow: PropTypes.func,
    onRowDoubleClick: PropTypes.func,
    onRowContextMenu: PropTypes.func,
    onRowMouseEnter: PropTypes.func,
    onRowMouseLeave: PropTypes.func,
    showHeader: PropTypes.bool,
    title: PropTypes.func,
    id: PropTypes.string,
    footer: PropTypes.func,
    emptyText: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
    scroll: PropTypes.object
  }

  static defaultProps = {
    data: [],
    columns: [],
    useFixedHeader: false,
    rowKey: 'key',
    rowClassName: () => '',
    onRow () {},
    onHeaderRow () {},
    bodyStyle: {},
    style: {},
    showHeader: true,
    scroll: {x: undefined, y: undefined},
    rowRef: () => null,
    emptyText: () => 'No Data'
  }
  constructor (props) {
    super(props)
    // 只有dataSource,columns重造
    let {data = [], scroll} = props
    data = setKey(data, 'id')
    this.dom = React.createRef()
    this.fixLeft = React.createRef()
    this.fixRight = React.createRef()
    this.fixRight = React.createRef()
    this.setting = React.createRef()
    this.state = {
      dataSource: data,
      highlightCols: [],
      scroll,
      columnMenu: false,
      // 由外部属性重构为内部状态
      leftFiexColumns: [],
      rightFixColumns: [],
      columns: [],
      headerColumns: [],
      loading: false,
      serverPagination: {
        total: 0,
        current: 0
      }
    }
  }

  runMemory () {
    let {name} = this.props
    if (!name) {
      return
    }
    let {dataSource} = this.state
    let {columns, headerColumns, highlightCols} = this.state
    let col = window.localStorage.getItem(name + '-col')
    if (col) {
      col = col.split(',').filter(item => item)
      // 列隐藏记忆
      columns.map(item => {
        if (col.includes(item.key)) {
          item.hide = false
        } else {
          item.hide = true
        }
        return item
      })

      headerColumns.map(item => {
        if (col.includes(item.key)) {
          item.hide = false
        } else {
          item.hide = true
        }
        return item
      })
    }
    // 排序记忆
    let sorter = window.localStorage.getItem(name + '-sorter')
    if (sorter) {
      sorter = sorter.split(',').filter(item => !!item)
      let cb = columns.find(item => item.key === sorter[0])
      if (cb) {
        cb = cb.sorter
        dataSource = dataSource.sort(cb)
        if (sorter[1] === '1') {
          dataSource = dataSource.reverse()
        }
      }
    }
    // 高亮记忆
    let highlight = window.localStorage.getItem(name + '-highlight')
    if (highlight) {
      highlightCols = highlight.split(',').filter(item => !!item)
    }
    this.setState({columns, headerColumns, dataSource, highlightCols})
  }

  // noinspection JSAnnotator
  cbs = {
    highlighCol: (key) => {
      let {highlightCols} = this.state
      let col = highlightCols.indexOf(key)
      if (col > -1) {
        highlightCols.splice(col, 1)
      } else {
        highlightCols.push(key)
      }
      // 设置操作记忆
      let {name} = this.props
      window.localStorage.setItem(name + '-highlight', highlightCols)
      this.setState({highlightCols})
    },

    freezeCol: (key) => {
      // let col =
      let {scrollWidth} = this.props
      let {columns} = this.state
      let pin = false
      columns = columns.map(item => {
        delete item.fixed
        return item
      })

      columns = columns.map(item => {
        if (item.key !== key && !pin) {
          item.fixed = 'left'
        }
        if (item.key === key) {
          item.fixed = 'left'
          pin = true
        }
        return item
      })

      let columnsDetail = this.setColumnsDetail(columns)
      this.setState({scroll: {x: scrollWidth}, ...columnsDetail}, () => {
        this.xscroll()
      })
    },
    hideCol: (key) => {
      let {columns, headerColumns} = this.state
      columns.map(item => {
        if (item.key === key) {
          item.hide = !item.hide
        }
        return item
      })
      headerColumns.map(item => {
        if (item.key === key) {
          item.hide = !item.hide
        }
        return item
      })

      let colMemory = columns.filter(item => !item.hide).map(item => item.key)

      // 设置操作记忆
      let {name} = this.props
      window.localStorage.setItem(name + '-col', colMemory)

      this.setState({columns, headerColumns})
    },

    resetData: (dataSource) => {
      this.setState({dataSource})
    },

    resetColumns: (columns) => {
      this.setState({columns})
    },

    addExpand: (e, item, index, col) => {
      let {dataSource, columns} = this.state
      let columnsDetail = this.setColumnsDetail(columns)

      if (!item.ishiuitableopen) {
        dataSource.splice(index + 1, 0, {expand: true, parent: item.key, width: col.width || '50px', render: col.render})
      } else {
        dataSource.splice(index + 1, 1)
      }
      let obj = dataSource.find(o => o.key === item.key)
      obj.ishiuitableopen = !obj.ishiuitableopen
      this.setState({dataSource: dataSource, ...columnsDetail})
      // let {index, open} = e.target.dataset
      // index = parseInt(index)
      // open = open === 'true'
      //
      // let {data} = this.props
      // if (!open) {
      //   data.splice(index + 1, 0, {expand: true, parent: index, ...{width: '50px'}, ...item})
      // } else {
      //   data.splice(index + 1, 1)
      // }
      // e.target.dataset.open = !open
      // this.setState({dataSource: data})
    },

    fetch: (extra) => {
      extra = extra || {}
      const {origin} = this.props
      const {
        data,
        url,
        header,
        type = 'GET',
        success = (res) => {},
        error = () => {},
        currentPageName = Table.config.currentPageName,
        pageSizeName = Table.config.pageSizeName,
        pageSize = Table.config.pageSize
      } = origin

      let l = loading.open({
        target: this.dom.current
      })
      const {
        serverPagination: {current}
      } = this.state
      let requestParams = {
        ...data,
        ...extra
      }
      requestParams[currentPageName] = current
      requestParams[pageSizeName] = pageSize

      let options = {
        url,
        method: ['GET', 'get'].includes(type) ? 'GET' : 'POST'
      }
      if (options.method === 'GET') {
        options.params = requestParams
      } else {
        options.data = requestParams
      }
      if (header) {
        options.header = header
      }
      axios.request(options).then(res => {
        let {data, columns, page} = success(res)
        let columnsDetail = this.setColumnsDetail(null, null, columns)
        this.setState({
          dataSource: data,
          ...columnsDetail,
          loading: false,
          serverPagination: page
        })
        this.runMemory()
        l.close()
      }).catch(error)

      // axios.request(url, {params: requestParams}).then(res => {
      //
      // })
    }
  }

  getScrollXContent () {
    let scrollTable
    let {dataSource, highlightCols, columns, headerColumns, leftFiexColumns, rightFixColumns} = this.state
    let {scroll} = this.state
    let {style = {}, ...props} = this.props
    let handleScroll = (e) => {
      let onLeft = e.target.scrollLeft === 0
      let onRight = Math.abs(e.target.scrollWidth - e.target.scrollLeft - parseInt(getStyle(e.target, 'width'))) < 2
      let left = this.fixLeft.current
      let right = this.fixRight.current
      if (left) {
        if (onLeft) {
          left.style.display = 'none'
        } else {
          left.style.display = 'table'
        }
      }

      if (right) {
        if (onRight) {
          right.style.display = 'none'
        } else {
          right.style.display = 'table'
        }
      }
    }
    if (leftFiexColumns.length === 0 && rightFixColumns.length === 0) {
      scrollTable = this.getBaseContent()
    } else {
      scrollTable = [
        <div className={prifix('table-scroll')} onScroll={handleScroll} key='content'>

          <div className={prifix('table-body')} style={{overflowX: 'auto'}}>
            <TableContent style={{width: scroll.x + 'px', ...style}} {...Object.assign({}, {...props}, {columns}, {dataSource, highlightCols}, {cbs: this.cbs}, {headerColumns})} />
          </div>
          {
            dataSource.length === 0 ? this.getEmptyContent() : null
          }
        </div>
      ]

      if (leftFiexColumns.length > 0) {
        scrollTable.push(
          <div className={prifix('table-fixed-left')} ref={this.fixLeft} style={{display: 'none'}} key='left'>
            <div className={prifix('table-outer')}>
              <div className={prifix('table-inner')}>
                <TableContent style={{width: 'auto', ...style}} className={prifix('table-fixed')} {...Object.assign({}, {...props}, {columns: leftFiexColumns}, {dataSource, highlightCols}, {cbs: this.cbs})} />
              </div>
            </div>
          </div>
        )
      }

      if (rightFixColumns.length > 0) {
        scrollTable.push(
          <div className={prifix('table-fixed-right')} ref={this.fixRight} key='right'>
            <div className={prifix('table-outer')}>
              <div className={prifix('table-inner')}>
                <TableContent style={{width: 'auto', ...style}} className={prifix('table-fixed')} {...Object.assign({}, {...props}, {columns: rightFixColumns}, {dataSource, highlightCols}, {cbs: this.cbs})} />
              </div>
            </div>
          </div>
        )
      }
    }

    return (
      <div className={prifix('table-content')}>
        {scrollTable}
      </div>
    )
  }

  showColumsPanel= (e) => {

  }

  getScrollYContent () {
    let {dataSource, highlightCols, columns, headerColumns} = this.state
    let {scroll} = this.state
    let {style = {}, ...props} = this.props
    return (
      <div className={prifix('table-content')}>
        <div className={prifix('table-scroll')}>
          <div className={prifix('table-head')}>
            <TableContent {...Object.assign({}, {...props}, {style: {...style}}, {columns}, {dataSource, highlightCols}, {body: false, cbs: this.cbs})} />
          </div>
          <div className={prifix('table-body')} style={{maxHeight: scroll.y + 'px', overflow: 'auto'}} >
            <TableContent {...Object.assign({}, {...props}, {style: {...style}}, {columns}, {dataSource, highlightCols}, {head: false, cbs: this.cbs}, {headerColumns})} />
          </div>
        </div>
        {
          dataSource.length === 0 ? this.getEmptyContent() : null
        }
      </div>
    )
  }

  getBaseContent () {
    let {dataSource, highlightCols, columns, headerColumns} = this.state

    let {style = {}, ...props} = this.props
    return (
      <div className={prifix('table-content')}>

        <div className={prifix('table-body')} style={{overflowX: 'auto'}}>
          <TableContent {...Object.assign({}, {style: {...style}}, {...props}, {columns}, {dataSource, highlightCols}, {cbs: this.cbs}, {headerColumns})} />
        </div>
        {
          dataSource.length === 0 ? this.getEmptyContent() : null
        }
      </div>
    )
  }

  getEmptyContent () {
    let {emptyText} = this.props
    let text = typeof emptyText === 'string' ? emptyText : emptyText()
    return <div className='hi-table-placeholder'>{text}</div>
  }

  componentDidUpdate () {
    let leftFixTable = this.dom.current.querySelectorAll('.hi-table-fixed-left table tr')
    let rightFixTable = this.dom.current.querySelectorAll('.hi-table-fixed-right table tr')
    let scrollTable = this.dom.current.querySelectorAll('.hi-table-scroll table tr')

    // if(fixTable && scrollTable){
    //   console.log(fixTable,scrollTable,'fix-scroll')

    // }
    if (scrollTable) {
      scrollTable.forEach((tr, index) => {
        if (leftFixTable.length > index) {
          leftFixTable[index].style.height = getStyle(tr, 'height')
        }
        if (rightFixTable.length > index) {
          rightFixTable[index].style.height = getStyle(tr, 'height')
        }
      })
    }
  }

  render () {
    // 多选配置
    let {pagination, name, size = 'normal'} = this.props
    let {scroll, columnMenu, loading, serverPagination} = this.state

    let content
    // 不滚动
    if (!scroll.x && !scroll.y) {
      content = this.getBaseContent()
    }

    // 列滚动
    if (scroll.x && !scroll.y) {
      // 将多选框放到最左边
      content = this.getScrollXContent()
    }

    if (scroll.y && !scroll.x) {
      content = this.getScrollYContent()
    }

    if (scroll.x && scroll.y) {
      // todo x和y同时滚动有bug
      content = this.getBaseContent()
      // content = this.getScrollXYContent()
    }

    let {columns} = this.state

    return (
      <div className={prifix('table', size)} ref={this.dom}>
        {
          loading && ' '
        }
        <div >
          <div >{content}</div>
        </div>
        {(pagination || columns) && <br /> }
        <div style={{display: 'flex', alignItems: 'center'}}>
          {
            pagination ? <div className={prifix('table-page')} >
              <Pagination
                {...pagination}
              />
            </div> : null
          }
        </div>

        <div style={{display: 'flex', alignItems: 'center'}}>
          {
            serverPagination.current && serverPagination.current ? <div className={prifix('table-page')} >
              <Pagination
                pageSize={serverPagination.pageSize}
                total={serverPagination.total}
                current={serverPagination.current}
                onChange={(current) => {
                  this.setState({
                    serverPagination: {
                      ...serverPagination,
                      current
                    }
                  }, this.cbs.fetch)
                }}
              />
            </div> : null
          }
        </div>
        { name &&
          <div className={prifix('table-setting')} ref={this.setting}>
            <Icon name='menu' style={{color: '#4284F5', fontSize: '24px'}}
              onClick={(e) => {
                let {columnMenu} = this.state
                this.setState({columnMenu: !columnMenu})
              }} />
            {
              columnMenu && <ClickOutside onClickOutside={(e) => this.setState({columnMenu: false})} >
                <div className={prifix('table-setting-menu column-menu')} >
                  {
                    columns.map(item => (
                      <div key={item.key}>
                        <div>
                          {
                            (function () {
                              if (item.type === 'select') {
                                return '多选'
                              }
                              if (item.type === 'expand') {
                                return '展开'
                              }
                              if (typeof item.title === 'function') {
                                return item.title()
                              }
                              return item.title
                            }())
                          }
                        </div>
                        <div>
                          <Checkbox checked={!item.hide} onChange={(e) => this.cbs.hideCol(item.key)} />
                        </div>
                      </div>
                    ))
                  }
                </div>
              </ClickOutside>
            }
          </div>
        }
      </div>
    )
  }

  xscroll () {
    let {fixTop, name} = this.props
    if (typeof fixTop === 'boolean') {
      fixTop = 0
    } else {
      fixTop = parseFloat(fixTop)
    }
    let dom = this.dom.current
    console.log(this.dom.current, 'this.dom')
    let thead = dom.querySelectorAll('thead')
    if (scrollTop() + fixTop > dom.offsetTop && scrollTop() + fixTop < dom.offsetTop + parseInt(getStyle(dom, 'height')) - parseInt(getStyle(thead[0], 'height'))) {
      thead.forEach(th => {
        th.style.display = 'table-header-group'
        let h = (dom.offsetTop - scrollTop() - fixTop) * -1
        th.style.transform = `translate(0,${h}px)`
        if (name) {
          this.setting.current.style.transform = `translate(0,${h}px)`
        }
      })
    } else {
      thead.forEach(th => {
        th.style.transform = `translate(0,0)`
        if (name) {
          this.setting.current.style.transform = `translate(0,0)`
        }
      })
    }
  }
  getColumns (columns) {
    let select = columns.find(({type}) => type === 'select')
    let leftFiexColumns = columns.filter(({fixed}) => !!fixed && fixed === 'left')
    // 将多选框放到左边，如果没有就放个null

    // 去掉null,否则遍历会报错
    leftFiexColumns = leftFiexColumns.filter(col => !!col)
    const rightFixColumns = columns.filter(({fixed}) => !!fixed && fixed === 'right')
    const commanColumns = columns.filter(({fixed}) => !fixed || (fixed !== 'left' && fixed !== 'right'))

    // 讲表格重新排序，并且去掉slelect ，因为是null
    columns = [...leftFiexColumns, ...commanColumns, ...rightFixColumns]
      .filter(item => item !== select)
      .filter(col => !!col)

    // leftFiexColumns.unshift(select)
    select && columns.unshift(select) && leftFiexColumns.unshift(select)
    return {
      leftFiexColumns,
      rightFixColumns,
      columns
    }
  }

  getHeaderGroup (columns) {
    columns = columns.map((item) => {
      item.title = item.title || item.dataIndex
      item.key = item.key || item.dataIndex || item.title || item.id
      if (item.type === 'expand') {
        item.open = !!item.open
      }
      return item
    })
    let bodyColumns = []
    let headerColumns = []
    let deepMap = (columns, parent) => {
      for (let key in columns) {
        columns[key].key = columns[key].key || columns[key].title
        columns[key].depth = parent.depth + 1
        let children = columns[key].children
        if (children && children.length > 0) {
          columns[key].isLast = false
          deepMap(children, columns[key])
          // delete columns[key].children
        } else {
          columns[key].isLast = true
        }
        bodyColumns.push(columns[key])
      }
    }

    deepMap(columns, {depth: 0, children: []})
    let getNum = (obj) => {
      let num = 0
      let getn = (list) => {
        for (let i = 0; i < list.length; i++) {
          let item = list[i]
          if (item.isLast) {
            num++
          }
          if (item.children) {
            getn(item.children)
          }
        }
      }
      getn([obj])
      return num
    }

    for (let key in bodyColumns) {
      bodyColumns[key].headColSpan = getNum(bodyColumns[key], 1)
    }

    let maxArray = [...bodyColumns].sort((pre, next) => (next.depth - pre.depth))
    let max = maxArray.length > 0 ? maxArray[0].depth : 0
    // 设置header-rowSpan
    let bd = bodyColumns.map(item => {
      if (item.isLast) {
        item.headRowSpan = max + 1 - item.depth
      }
      return item
    })

    for (let i = 1; i < max + 1; i++) {
      let arr = bd.filter(({depth}) => depth === i)
      headerColumns.push(arr)
    }

    bodyColumns = bodyColumns.filter(({isLast}) => isLast)
    return [headerColumns, bodyColumns]
  }

  setColumnsDetail (bool, prop, c) {
    let props = prop || this.props
    let leftFiexColumns = []
    let rightFixColumns = []
    let [headerColumns, columns] = this.getHeaderGroup(c || props.columns)

    let {rowSelection, scroll, name} = props

    if (rowSelection) {
      let {selectedRowKeys = [], dataName = 'key'} = rowSelection
      columns.unshift({
        width: '50',
        type: 'select',
        key: 'hi-table-select-' + name,
        title: () => {
          let {getCheckboxProps = (record) => ({ disabled: false }), onChange} = rowSelection
          return (
            <Checkbox type='checkbox'

              checked={selectedRowKeys.length === this.state.dataSource.filter(record => !getCheckboxProps(record).disabled).length}
              onChange={(e, checked) => {
                let data = this.state.dataSource.filter(record => !getCheckboxProps(record).disabled)
                if (checked) {
                  selectedRowKeys.splice(0, selectedRowKeys.length)
                  for (let i = 0; i < data.length; i++) {
                    selectedRowKeys.push(data[i][dataName])
                  }
                } else {
                  selectedRowKeys.splice(0, selectedRowKeys.length)
                }
                onChange(selectedRowKeys, data.filter(record => selectedRowKeys.includes(record[dataName])))
              }}
            />
          )
        },
        render: (text, record, index) => {
          let {getCheckboxProps = (record) => ({ disabled: false }), onChange} = rowSelection
          // todo dataName 是干嘛的不明白

          return (
            <Checkbox type='checkbox'
              che={selectedRowKeys.includes(record[dataName])}
              checked={selectedRowKeys.includes(record[dataName])}
              disabled={getCheckboxProps(record).disabled}
              onChange={(e, checked) => {
                let data = this.state.dataSource.filter(record => !getCheckboxProps(record).disabled)
                if (checked) {
                  selectedRowKeys.push(record[dataName])
                } else {
                  selectedRowKeys = selectedRowKeys.filter(key => record[dataName] !== key)
                }
                onChange(selectedRowKeys, data.filter(record => selectedRowKeys.includes(record[dataName])))
              }}
              key={record[dataName]}
            />
          )
        }
      })
    }

    // TODO 这里的逻辑要优化
    if (scroll.x || bool) {
      let obj = this.getColumns(columns)
      leftFiexColumns = obj.leftFiexColumns
      rightFixColumns = obj.rightFixColumns
      columns = obj.columns
    }

    return {
      leftFiexColumns,
      rightFixColumns,
      columns,
      headerColumns
    }
  }

  fetch () {
    // noinspection JSAnnotator
    const {
      origin: {
        data,
        url,
        header,
        type = 'GET',
        success = (res) => {},
        error = () => {},
        pageSize = Table.config.pageSize,
        pageSizeName = Table.config.pageSizeName
      }
    } = this.props

    let l = loading.open({target: this.dom.current})
    this.setState({
      loading: true
    })
    let requestParams = {
      ...data
    }
    requestParams[pageSizeName] = pageSize
    let options = {
      method: ['GET', 'get'].includes(type) ? 'GET' : 'POST',
      url
    }
    if (options.method === 'GET') {
      options.params = requestParams
    } else {
      options.data = requestParams
    }
    if (header) {
      options.header = header
    }

    axios(options).then(res => {
      let {data, columns, page} = success(res)
      this.setState({
        dataSource: data,
        loading: false,
        serverPagination: page
      })
      setTimeout((e) => {
        let columnsDetail = this.setColumnsDetail(null, null, columns)
        this.setState({
          ...columnsDetail
        })
        this.runMemory()
        l.close()
      })
    }).catch(error)
    // axios.request(url, {params: requestParams}).then(res => {
    //   let {data, columns, page} = success(res)
    //
    //   this.setState({
    //     dataSource: data,
    //     loading: false,
    //     serverPagination: page
    //   })
    //   setTimeout((e) => {
    //     let columnsDetail = this.setColumnsDetail(null, null, columns)
    //     this.setState({
    //       ...columnsDetail
    //     })
    //     this.runMemory()
    //   })
    // })
  }

  componentDidMount () {
    let {fixTop, scroll, name, origin} = this.props
    console.log(this.dom)
    let dom = this.dom.current
    let thead = dom.querySelectorAll('thead')
    if (fixTop) {
      // 吸顶逻辑
      document.addEventListener('scroll', () => {
        this.xscroll()
      })
    }

    // 如果有列冻结的配置
    if (scroll.x) {
      let dom = this.dom.current
      // 如果表格本身太宽超过列冻结配置的话，右边的列冻结就取消
      if (parseInt(getStyle(dom, 'width')) > scroll.x) {
        if (this.fixRight.current) {
          this.fixRight.current.style.display = 'none'
        }
      }
    }

    let columnsDetail = this.setColumnsDetail()
    this.setState({
      ...columnsDetail
    })

    // 操作记忆设置
    if (name) {
      this.setting.current.style.lineHeight = parseInt(getStyle(thead[0], 'height')) - 10 + 'px'
      this.setting.current.style.marginTop = '5px'
    }
    setTimeout(() => {
      this.runMemory()

      if (origin) {
        this.fetch()
      }
    }, 0)
  }

  componentWillReceiveProps ({data, columns, width, scroll, ...props}) {
    // 服务端表格
    if (props.origin) {
      props.origin.auto && this.fetch()
    } else {
      data = setKey(data, 'id')
      // 只有dataSource,columns重造
      let columnsDetail = this.setColumnsDetail(columns, {data, columns, width, scroll, ...props})
      this.setState({dataSource: data, scroll, ...columnsDetail, ...props})
      setTimeout(() => {
        this.runMemory()
      }, 0)
    }
  }
}

Table.config = {
  currentPageName: 'current',
  pageSizeName: 'pageSize',
  pageSize: 10,
  host: ''
}

export default Table
