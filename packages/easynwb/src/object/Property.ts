
import { LitElement, html, css } from 'lit';

import { Input } from '../input/Input'
import { darkBackgroundColor } from '../globals';
import { until } from 'lit-html/directives/until.js';

// Icons
import './icons/DeleteIcon'
import './icons/OpenIcon'
import './icons/AddIcon'
import './icons/EditIcon'


const noTypeSymbol = Symbol('noType')
var TypedArray = Object.getPrototypeOf(Uint8Array);


const isAnyArray = (val: any) => {
  return val && (Array.isArray(val) || val instanceof TypedArray)
}

type resolvedKeyTypes = string | number
type keyType = resolvedKeyTypes | symbol

export type ObjectEditorProps = {
  parent?: {[x:string]: any}
  key?: keyType
  force?: boolean
  readOnly?: boolean
  deferValues?: boolean
}

export class Property extends LitElement {

parent: any = {}
key: resolvedKeyTypes
force: boolean
readOnly: boolean
deferValues: boolean

  static get styles() {
    return css`

    delete-icon, open-icon, add-icon, edit-icon {
      width: 25px;
      cursor: pointer;
    }

    img {
      max-height: 100px;
    }

    :host {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      font-size: 90%;
      padding: 0px 15px;
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
        key: {
          type: String,
          reflect: true,
        },
        value: {
          type: Object,
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

    constructor(props: ObjectEditorProps = {}) {
      super();
      this.parent = props.parent ?? {}
      this.key = typeof props.key === 'symbol' ? '' : props.key ?? ''
      this.readOnly = props.readOnly ?? false
      this.force = props.force ?? false
      this.deferValues = props.deferValues ?? false
    }

    change = async (key: resolvedKeyTypes, parent=this.parent): Promise<any> => {} // User-defined function

    delete = () => {
      try {
        delete this.parent[this.key]
      } catch (e) {
        let val = this.parent[this.key]
        this.parent[this.key] = undefined
        if (val !== undefined && this.parent[this.key] !== undefined) {
          console.warn(`${this.key} defaults to ${typeof this.parent[this.key]} type and cannot be set to undefined.`)
        } else console.warn(`Cannot delete ${this.key}. Set to undefined.`)
      }

      this.requestUpdate()
    }

    getActions = async (value?:any, canOpen: boolean = false, writable?: HTMLElement) => {

      let actions = writable ? html`<delete-icon @click="${async () => this.delete()}"></delete-icon>` : '';

      if ((this.deferValues && canOpen) || typeof value === 'object' && canOpen) actions = html`<open-icon @click="${async () => this.change(this.key, this.parent)}"></open-icon>${actions}`
      else if (writable) {

        let storedEdit = value
        let input: HTMLElement | undefined;
        const cls = value?.constructor
        actions = html`<edit-icon @click="${() => {
          if (input) {
            if (!input.style.display) {
              input.style.display = 'none'
              const latestValue = storedEdit
              if (latestValue === value) return
              input.style.display = 'none'
              this.parent[this.key] = latestValue // Modify original data
              this.requestUpdate()
            } else input.style.display = ''
          } else {
            input = new Input({
              value, 
              onInput: (ev: any) => {
                if (cls) storedEdit = new cls(ev.target.value) // Modify original data
                else storedEdit = ev.target.value
              }
            })

            writable.appendChild(input)
          }


        }}"></edit-icon>${actions}`
      }


      return actions
    }

    isClassValue = (val: any) => {
      let classes = [String, Boolean, Number]
      return classes.find(cls => {
        if (val instanceof cls) return true
      })
    }

    getElement = async () => {
        
        const getValue = !this.deferValues || this.force || isAnyArray(this.parent)
        const val = (getValue) ? await Promise.resolve(this.parent[this.key]) : noTypeSymbol 
        let display : any = ''
        let distinguished: any = document.createElement('div')
        distinguished.style.width = '100%'

        let type: any = typeof val;

        let renderType = getValue

        let check = true

        let classes = [String, Boolean, Number]
        classes.forEach(cls => {
          if (val instanceof cls) {
            check = false
            type = cls.name
             display = html`<span>${val}</span>` // Avoid providing an input
          }
        })

        display = html`${display}${ await this.getActions(val, check, !this.readOnly ? distinguished : undefined)}`

        if (check) {
          if (val && (typeof val === 'object' || val === noTypeSymbol)) type = Object.keys(val).length ? val.constructor?.name : html`Empty ${val.constructor?.name}`
          else if (val === undefined) type = 'undefined'
          else if (val === null) type = 'null'
          else if (typeof val === 'string' && val.includes('data:image')) {
            distinguished = document.createElement('img') as HTMLImageElement
            distinguished.src = val
            distinguished.style.height = '100%'
          } 
          else display = html`<span>${val}</span>${display}` // Avoid providing an input
        }

        if (!getValue || this.readOnly) this.style.padding = '0px 15px;'

        return html`
          <div class="info">
            <span class="name">${typeof this.key === 'string' ? this.key : html`[${typeof this.key}]`}</span>
            ${(renderType) ? html`<br><span class="type">${type}</span>` : ''}
          </div>
          ${display ? html`<p class="display">${display}</p>` : ''}
          ${distinguished}
    `

    }
  
    render() {
        if (!this.key || !(this.key in this.parent) || typeof this.key === 'symbol') return ''

        return until(Promise.resolve(this.getElement())
        .then((res) => html`${res}`), html`<div id="loading"><span>Loading <b>${this.key}</b> property...</span></div>`)
    }
  }
  
  customElements.get('nwb-editor-property') || customElements.define('nwb-editor-property',  Property);