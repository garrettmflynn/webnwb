import { LitElement, html, css } from "lit-element";
import { Input } from "./Input";
import { Switch } from "./Switch";

export interface TypedInputProps {
    value?: undefined | string | number | boolean | Object | Array<any> | String | Number | Boolean;
    type?: string;
  }

export class TypedInput extends LitElement {

    value: TypedInputProps['value']
    type: TypedInputProps['type']

    // properties getter
    static get properties() {
        return {
            type: { type: String, reflect: true },
        }
    }

    constructor(props: TypedInputProps = {}) {
        super();

        this.value = props.value ?? "";
        this.type = props.type ?? "string";
    }

    static get styles() {
        return css``;
    }

    render() {

        const type = this.type
        this.style.width = 'auto'

        if (type === 'string' || type === 'number') {
            // value = type === 'string' ? '' : 0,
            if ( type === 'string' && typeof this.value !== 'string') this.value = ''
            if ( type === 'number' && typeof this.value !== 'number') this.value = 0

            this.style.width = '100%'
            return new Input({
              value: this.value as any, 
              type: type === 'string' ? 'text' : 'number',
              label: 'Value',
              onInput: (ev: any) => this.value = type === 'string' ? ev.target.value : Number.parseInt(ev.target.value)
            })
          } else if (type === 'boolean') {
            // value = false
            if (typeof this.value !== 'boolean') this.value = false
            const switchEl = new Switch({
              value: this.value as boolean, 
              label: 'Value',
              onChange: () => this.value = switchEl.value
            }) as Switch
            return switchEl
          } 
          else if (type === 'undefined') this.value = undefined
          else if (type === 'object') this.value = {}
          else if (type === 'array') this.value = []
          else {
            throw new Error(`Unknown type ${type}`)
          }

        return html``; // Just a value
    }
}

customElements.get("visualscript-typed-input") || customElements.define("visualscript-typed-input",  TypedInput);
