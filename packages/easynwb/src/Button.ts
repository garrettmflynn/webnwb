import { LitElement, html, css } from 'lit';
import { styleMap } from 'lit-html/directives/style-map.js';

export interface ButtonProps {
  /**
   * Is this the principal call to action on the page?
   */
  primary?: boolean;
  /**
   * What background color to use
   */
  backgroundColor?: string;
  /**
   * How large should the button be?
   */
  size?: 'extra-small' | 'small' | 'medium' | 'large';
  /**
   * Optional click handler
   */
  onClick?: (ev: Event)=> any;
}

export class Button extends LitElement {

  static get styles() {
    return css`

    :host {
      font-family: var(--visualscript-font-family, sans-serif);
    }

    .nwb-button {
        width: 100%;
        font-weight: 700;
        border: 0;
        border-radius: 1em;
        cursor: pointer;
        display: inline-block;
        line-height: 1;
        overflow: hidden;
        display:flex;
        align-items: center;
        justify-content: center;
    }

    .nwb-button--primary {
      color: var(--visualscript-primary-font-color, white);
      background-color: var(--visualscript-primary-color, #1ea7fd);
    }
    .nwb-button--secondary {
      color: var(--visualscript-secondary-font-color, white);
      background-color: var(--visualscript-secondary-color, #333);
    }
    .nwb-button--extra-small {
      font-size: 10px;
      padding: 7px 12px;
    }

    .nwb-button--small {
      font-size: 12px;
      padding: 10px 16px;
    }
    .nwb-button--medium {
      font-size: 14px;
      padding: 11px 20px;
    }
    .nwb-button--large {
      font-size: 16px;
      padding: 12px 24px;
    }


    @media (prefers-color-scheme: dark) {
      .nwb-button--secondary {
        color: #cccccc;
        background-color: transparent;
        box-shadow: rgba(255, 255, 255, 0.50) 0px 0px 0px 1px inset;
      }
    }

    `;
  }
    
    static get properties() {
      return {
        primary:  {
          type: Boolean,
          reflect: true
        },
        backgroundColor:  {
          type: String,
          reflect: true
        },
        size:  {
          type: String,
          reflect: true
        },
        onClick: {
          type: Function,
          reflect: true
        }
      };
    }

    primary: ButtonProps['primary']
    backgroundColor: ButtonProps['backgroundColor']
    size: ButtonProps['size']
    onClick: ButtonProps['onClick']

    constructor(props: ButtonProps = {}) {
      super();

      this.primary = props.primary
      this.backgroundColor = props.backgroundColor
      this.size = props.size
      this.onClick = props.onClick

    }
    
    willUpdate(_:any) {
      // console.log(changedProps)
      // if (changedProps.has('type')) {

      // }
    }
  
    render() {

      const mode = (this.primary) ? 'nwb-button--primary' : 'nwb-button--secondary';

      return html`
      <button
           type="button"
            class=${['nwb-button', `nwb-button--${this.size || 'medium'}`, mode].join(' ')}
            style=${styleMap({ backgroundColor: this.backgroundColor })}
            @click=${this.onClick}
      >
        <slot>Button</slot>
      </button>
    `
    }
  }
  
  customElements.get('nwb-button') || customElements.define('nwb-button',  Button);