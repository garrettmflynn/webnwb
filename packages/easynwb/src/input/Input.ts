import { LitElement, html, css } from "lit-element";
import { classMap } from "lit-html/directives/class-map.js";
import { getPersistent, setPersistent, PersistableProps } from './persistable';

export interface InputProps {
    value?: string | number | boolean | String | Number | Boolean;
    outline?: boolean;
    disabled?: boolean;
    type?: string;
    label?: string;
    persist?: boolean;
    onChange?: Function;
    onInput?: Function;
  }

export class Input extends LitElement {

    value: InputProps['value']
    outline: InputProps['outline']
    disabled: InputProps['disabled']
    type: InputProps['type']
    label: InputProps['label']
    persist: InputProps['persist']
    onChange: InputProps['onChange']
    onInput: InputProps['onInput']

    // properties getter
    static get properties() {
        return Object.assign(PersistableProps, {
            disabled: { type: Boolean, reflect: true },
            outline: { type: Boolean, reflect: true },
        });
    }

    constructor(props:InputProps = {}) {
        super();

        const val =  getPersistent(props)        
        this.value = props.value ?? (val) ? val : "";

        this.outline = props.outline ?? false;
        this.disabled = props.disabled ?? false;
        this.label = props.label;
        this.persist = props.persist;
        this.onChange = props.onChange;
        this.onInput = props.onInput;
    }

    willUpdate(changedProps:any) {
      if (changedProps.has('value')) setPersistent(this)
    }

    static get styles() {
        return css`

        :host {
            font-family: var(--visualscript-font-family, sans-serif);
            width: 100%;
            font-size: 15px;
        }
        
*{
box-sizing: border-box;
}
.form-group {
position: relative;
margin: 15px 0;
}
input.outline {
border: 1px solid gray;
border-radius: 5px;
}
label {
position: absolute;
left: 0;
top: 50%;
transform: translateY(-50%);
color: gray;
padding: 0 0.3rem;
margin: 0 0.5rem;
transition: 0.1s ease-out;
transform-origin: left top;
pointer-events: none;
}
input {
outline: none;
border: none;
border-radius: 0px;
padding: 15px 0.6rem 10px 0.6rem;
transition: 0.1s ease-out;
border-bottom: 1px solid gray;
background: transparent;
cursor: text;
margin-left: auto;
width: 95%;
margin-right: auto;
}
input::placeholder {
    color: transparent;
}
input:focus{
border-color:  #b949d5;
}
input:focus + label{
color:  #b949d5;
top: 0;
transform: translateY(-50%) scale(0.9);
}
input:not(:placeholder-shown) + label{
top: 0;
transform: translateY(-50%) scale(0.9);
}
input:focus:not(.outline) ~ label,
input:not(:placeholder-shown):not(.outline) ~ label
{
padding-left: 0px;
}
input:disabled,  input:disabled ~ .label {
opacity: 0.5;
}

@media (prefers-color-scheme: dark) {
    label {
      color: rgb(120,120,120);
    }

    input {
        color: white;
    }
  }
`;
    }
    render() {

        return html`
            <div class="form-group">
                <input
                value=${this.value}
                class=${classMap({
                            outline: this.outline ?? false
                        })}
                type="${this.type}"
                placeholder="${this.label}"
                ?disabled="${this.disabled}"

                @change=${(ev: any) => {
                    this.value = ev.target.value
                    if (this.onChange instanceof Function) this.onChange(ev)
                }}

                @input=${(ev: any) => {
                    if (this.onInput instanceof Function) this.onInput(ev)
                }}
                />

                <label>${this.label}</label>
            </div>
        `;
    }
}

customElements.get("visualscript-input") || customElements.define("visualscript-input",  Input);
