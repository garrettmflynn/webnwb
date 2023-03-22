
import { LitElement, html, css } from 'lit';

export class Icon extends LitElement {

  static get styles() {
    return css`
        :host {
            display: inline-block;
        }
    `;
  }
    

    constructor() {
      super();
    }

    render() {
      
        return html``
    }
  }
  
  customElements.get('nwb-icon') || customElements.define('nwb-icon',  Icon);