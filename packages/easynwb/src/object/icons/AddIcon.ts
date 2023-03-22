
import { html } from 'lit';
import { Icon } from './Icon';

export class AddIcon extends Icon {

    constructor() {
      super();
    }

    render() {
        return html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 96 960 960"><path d="M450 856V606H200v-60h250V296h60v250h250v60H510v250h-60Z"/></svg>`
    }
  }
  
  customElements.get('add-icon') || customElements.define('add-icon',  AddIcon);