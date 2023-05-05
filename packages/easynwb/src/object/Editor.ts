
import { LitElement, html, css } from 'lit';
import {until} from 'lit-html/directives/until.js';

import { TimeSeries } from '../plots/TimeSeries';
import {Input} from '../input/Input'
import { darkBackgroundColor } from '../globals';

// Icons
import './icons/DeleteIcon'
import './icons/OpenIcon'
import './icons/AddIcon'
import './icons/EditIcon'

// Buttons
import { Button } from '../Button'
import { Property } from './Property';
import { symbols } from '../../../../dist/index.esm';
import { hasTypedChildren } from 'packages/apify/utils/globals';
import { Select } from '../input/Select';
import { TypedInput } from '../input/TypedInput';


var TypedArray = Object.getPrototypeOf(Uint8Array);


const isAnyArray = (val: any) => {
  return val && (Array.isArray(val) || val instanceof TypedArray)
}

type keyType = string | number | symbol
export type ObjectEditorProps = {
  target?: {[x:string]: any}
  header?: keyType
  plot?: Function[],
  onRender?: Function
  toDisplay?: (key?: keyType, parent?: any, history?: ObjectEditor['history']) => boolean
  preprocess?: Function,
  deferValues?: boolean
  readOnly?: boolean
}

export class ObjectEditor extends LitElement {

  static get styles() {
    return css`

    :host * {
      font-family: var(--visualscript-font-family, sans-serif);
      box-sizing: border-box;
    }


    :host  {
      display: block;
      background: white;
      border-radius: 4px;
      overflow: hidden;
      border: 1px solid gray;
      height: 100%;
      width: 100%;
      position: relative;
    }

    delete-icon, open-icon, add-icon, edit-icon {
      width: 25px;
      cursor: pointer;
    }

    nwb-editor-property { 
      border-bottom: 1px solid lightgray;
      padding-bottom: 10px;
      margin-bottom: 10px;
    }

    nwb-editor-property:last-child {
      border-bottom: none;
      padding-bottom: 0px;
      margin-bottom: 0px;
    }

    img {
      max-height: 100px;
    }

    #header {
      padding: 5px 10px;
      font-size: 70%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid gray;
    }

    #footer {
      padding: 15px 10px;
      font-size: 70%;
      border-top: 1px solid gray;
    }

    #add-property-inputs {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    #add-property-inputs > * {
      margin-right: 10px;
    }

    #add-property-inputs > *:last-child {
      margin-right: 0px;
    }

    #history span {
      font-weight: 800;
      cursor: pointer;
      transition: color 0.2s;
    }

    #history span:hover {
      color: gray;
    }

    #history span:last-child {
      font-weight: normal;
    }

    #history span:first-child {
      font-weight: bold;
    }

    #container {
      width: 100%;
      padding: 10px;
      position: relative;
      overflow-y: scroll;
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    #display {
      position: relative;
      overflow-y: scroll;
      height: 50%;
    }

    #loading {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: center;
      height: 100%;
      width: 100%;
      font-size: 80%;
      font-weight: 800;
    }

    .separate {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .attribute {
      width: 100%;
      font-size: 90%;
      padding: 10px 15px;
      flex-grow: 1;
      min-height: 50px;
    }

    .display {
      font-size: 80%;
      text-align: right;
      flex-grow: 1;
      display: flex;
      align-items: center;
      justify-content: flex-end;
    }

    .display > * {
      margin-right: 10px;
    }

    .display > *:last-child {
      margin-right: 0;
    }

    .info {
      display: block;
      padding-right: 10px;
    }

    .name {
      font-weight: 800;
      padding-right: 10px;
    }

    .type {
      font-size: 70%;
    }

    @media (prefers-color-scheme: dark) {
      :host > * {
        background-color: ${darkBackgroundColor};
        box-shadow: 0 1px 5px 0 rgb(255 255 255 / 20%);
      }

      #header {
        border-bottom: 1px solid gray;
      }
    }

    `;
  }
    
    static get properties() {
      return {
        // target: {
        //   type: Object,
        //   reflect: false,
        // },
        keys: {
          type: Object,
          reflect: true,
        },
        plot: {
          type: Object,
          reflect: true,
        },
        header: {
          type: String,
          reflect: true,
        },
        onRender: {
          type: Function,
          reflect: true,
        },
        preprocess: {
          type: Function,
          reflect: true,
        },
        deferValues: {
          type: Boolean,
          reflect: true,
        },
        readOnly: {
          type: Boolean,
          reflect: true,
        },
      };
    }

    target: ObjectEditorProps['target'] | any
    keys?: (keyType)[]
    header: ObjectEditorProps['header']
    history: any[] = []
    plot: ObjectEditorProps['plot']
    onRender: ObjectEditorProps['onRender']
    preprocess: ObjectEditorProps['preprocess']
    deferValues: ObjectEditorProps['deferValues']
    readOnly: ObjectEditorProps['readOnly']

    timeseries: TimeSeries
    base: any

    constructor(props: ObjectEditorProps = {}) {
      super();

      const target = props.target ?? {}

      // this.header = props.header
      this.set(target, { base: true })
      this.plot = props.plot ?? []
      this.onRender = props.onRender
      this.deferValues = props.deferValues
      this.readOnly = props.readOnly

      if (props.preprocess) this.preprocess = props.preprocess


      this.timeseries = new TimeSeries({
        data: []
      })
    }

    set = async (target: any, options: {
      plot?: boolean,
      base?: boolean
    } = {
      plot: false,
      base: false
    }) => {

      if (options.base) this.base = target
      if (this.preprocess instanceof Function) this.target = await this.preprocess(target)
      else this.target = target


      const typeOf = typeof this.target
      const isClassValue = this.isClassValue(this.target)
      const isObject = (this.target && typeOf === 'object' && !isClassValue) 
      const isArray = this.target && isAnyArray(this.target)
      const renderValues = isObject || isArray
      if (renderValues) {
        this.header = this.target.constructor.name
        this.keys = Object.keys(this.target).sort()
      } else {
        this.header = this.target
        this.keys = undefined
      }
    }

    to = (path: string) => {

      this.history = []

      const registerAll = (path: string, target: any) => {

        let info: any = {
          history: []
        }

        // Multiple Values
        if (path.includes('.')) {
          const split = path.split('.')
          for (let key of split) {

            target = register(split, target, info)
            if (target === false) {
              console.error('Invalid path', key, path)
              return
            }
          }
        } 

        // Single Value
        else {
          register(path, target, info)
        }

        return info
      }

      const register = (key:string, target: any, info: any = {}) => {

        // const hasKey = (key in target)

        // // Check first for special hierarchy key
        // const deeper = target[specialHierarchyKey]
        // if (deeper && !hasKey){
        //    target = register(specialHierarchyKey, target, info)
        // }

        const hasKeyBase = (key in target)
        if (!hasKeyBase) return false

        // Grab general key
        const parent = target
        target = target[key]
        this.updateHistory(parent, key, info.history)

        info.last = key
        info.parent = parent
        info.value = target

        return target
      }


      this.updateHistory(parent, this.header) // Update base history
      const info = registerAll(path, this.base)
      if (!info) return
      else {
        this.history = [{key: this.header, value: this.base}, ...info.history.slice(0, -1)]
        this.set(info.value).then(() => {
          this.header = info.last
        })
        return true
      }
    }


    updateHistory = (value: any, key: string, history = this.history) => history.push({value, key})

    add = (key?: string, value?: any, parent=this.target) => {

      if (key && key in parent) throw new Error('Key already exists.')

      // parent[key] = undefined
      // if (!(key in parent)) throw new Error(`Cannot add ${key} to this object.`)

      const propertyInput = (this.shadowRoot as ShadowRoot).querySelector('#add-property-inputs') as HTMLElement
      if (propertyInput) return // Already adding a property


      const availableTypes = parent[hasTypedChildren] ?? new Set(['string', 'number', 'boolean', 'object', 'array', 'undefined'])

      let resolvedKey = key ?? ''
        const keyInput = new Input({
          value: key, 
          label: 'Key',
          onInput: (ev: any) => resolvedKey = ev.target.value
        })

        const valueInput = new TypedInput({ value, type: value ? typeof value : 'undefined' })
        const renderType = (type: string) => valueInput.type = type

        const typeSelector = new Select({
          value: valueInput.type, 
          label: 'Type',
          options: Array.from(availableTypes),
          onChange: (ev: any) => {
            renderType(ev.target.value)
          }
        })

        const submit = new Button()
        submit.onclick = () => {
          div.remove()
          if (!resolvedKey) throw new Error(`No property key specified.`)

          // Create a new key on the parent
          if (parent[symbols.new]) parent[symbols.new](resolvedKey, valueInput.value) // Ensure property reacts to new key
          else parent[resolvedKey] = valueInput.value

          if (!(resolvedKey in parent)) throw new Error(`Cannot add ${resolvedKey} to this object.`)
          this.set(parent)
        }

        submit.innerHTML = 'Add'

        const div = document.createElement('div')
        div.id="add-property-inputs"
        keyInput.style.flexGrow = '1'
        valueInput.style.flexGrow = '1'
        typeSelector.style.flexGrow = '1'
        typeSelector.style.width = '100%'


        div.appendChild(keyInput)
        div.appendChild(typeSelector)
        div.appendChild(valueInput)
        div.appendChild(submit)

        const container = (this.shadowRoot as ShadowRoot).querySelector('#container') as HTMLElement
        container.appendChild(div)
     }

    isClassValue = (val: any) => {
      let classes = [String, Boolean, Number]
      return classes.find(cls => {
        if (val instanceof cls) return true
      })
    }

    change = async (key: string, parent=this.target) => {
      const previousKey = this.header as string
      const val = await Promise.resolve(parent[key])
      this.updateHistory(parent, previousKey)
      await this.set(val)
      this.header = key
      return true
    }
  
    render() {
      
      const key = this.header

      // Only pass objects through the render function
      let display: any

      if (this.keys && this.onRender instanceof Function) display = this.onRender(this.header, this.target, this.history)

      const parent = this.history.slice(-1)[0]?.value
      const baseProps = {readOnly: this.readOnly, deferValues: this.deferValues}
      const content = this.keys ? this.keys?.map(key => new Property({key, parent: this.target, ...baseProps}))  : [new Property({key, parent, force: true, ...baseProps})]
      content.forEach(p => p.change = this.change)
        const historyEl = document.createElement('div')
        historyEl.id = 'history'
        const historyArr = [...this.history, { key, value: this.target }]
        historyArr.forEach((o, i) => {
          const last =  i === (this.history.length)
          const pointInHistory = document.createElement('span')
          historyEl.appendChild(pointInHistory)

          pointInHistory.innerHTML = o.key
          if (!last) {
            pointInHistory.addEventListener('click', () => {
              this.set(o.value)
              this.history = historyArr.slice(0, i)
              this.header = o.key
              return false
            })
            historyEl.insertAdjacentHTML('beforeend', ' —&nbsp;')
          }
        })
        
        return html`
          <div id="header">
            ${historyEl}
          </div>
          ${until(Promise.resolve(display).then((res) => res ? html`<div id="display">${res}</div>` : ''), '')}
          <div id="container">
            ${content}
          </div>

          ${this.readOnly ? '' : html`<div id="footer">
            <nwb-button style="width: 100%;" @click="${() => this.add()}">
              <add-icon style="fill: white;"></add-icon> <span>Add Property</span>
            </nwb-button>
          </div>`}
      `

      // return html`
      //   <div>
      //     <div id="header">
      //       ${historyEl}
      //     </div>
      //     <div id="container">
      //       ${until(Promise.all(content).then((data) => html`${data}`), html`<div id="loading"><span>Loading...</span></div>`)}
      //       </div>
      //   </div>
      // `

    // // This Go Back button used to be implemented instead of the history trail
    //   ${ (this.history.length > 0) ? html`<visualscript-button size="extra-small" @click="${() => {
    //     const historyItem = this.history.pop()
    //     this.set(historyItem.value)
    //     this.header = historyItem.key
    // }}">Go Back</visualscript-button>` : ``}
    }
  }
  
  customElements.get('nwb-editor') || customElements.define('nwb-editor',  ObjectEditor);