/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const t=window.ShadowRoot&&(void 0===window.ShadyCSS||window.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,e=Symbol(),i=new Map;class s{constructor(t,i){if(this._$cssResult$=!0,i!==e)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t}get styleSheet(){let e=i.get(this.cssText);return t&&void 0===e&&(i.set(this.cssText,e=new CSSStyleSheet),e.replaceSync(this.cssText)),e}toString(){return this.cssText}}const r=(t,...i)=>{const r=1===t.length?t[0]:i.reduce(((e,i,s)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+t[s+1]),t[0]);return new s(r,e)},o=t?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let i="";for(const e of t.cssRules)i+=e.cssText;return(t=>new s("string"==typeof t?t:t+"",e))(i)})(t):t
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */;var n;const l=window.trustedTypes,a=l?l.emptyScript:"",h=window.reactiveElementPolyfillSupport,d={toAttribute(t,e){switch(e){case Boolean:t=t?a:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let i=t;switch(e){case Boolean:i=null!==t;break;case Number:i=null===t?null:Number(t);break;case Object:case Array:try{i=JSON.parse(t)}catch(t){i=null}}return i}},c=(t,e)=>e!==t&&(e==e||t==t),u={attribute:!0,type:String,converter:d,reflect:!1,hasChanged:c};class p extends HTMLElement{constructor(){super(),this._$Et=new Map,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Ei=null,this.o()}static addInitializer(t){var e;null!==(e=this.l)&&void 0!==e||(this.l=[]),this.l.push(t)}static get observedAttributes(){this.finalize();const t=[];return this.elementProperties.forEach(((e,i)=>{const s=this._$Eh(i,e);void 0!==s&&(this._$Eu.set(s,i),t.push(s))})),t}static createProperty(t,e=u){if(e.state&&(e.attribute=!1),this.finalize(),this.elementProperties.set(t,e),!e.noAccessor&&!this.prototype.hasOwnProperty(t)){const i="symbol"==typeof t?Symbol():"__"+t,s=this.getPropertyDescriptor(t,i,e);void 0!==s&&Object.defineProperty(this.prototype,t,s)}}static getPropertyDescriptor(t,e,i){return{get(){return this[e]},set(s){const r=this[t];this[e]=s,this.requestUpdate(t,r,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)||u}static finalize(){if(this.hasOwnProperty("finalized"))return!1;this.finalized=!0;const t=Object.getPrototypeOf(this);if(t.finalize(),this.elementProperties=new Map(t.elementProperties),this._$Eu=new Map,this.hasOwnProperty("properties")){const t=this.properties,e=[...Object.getOwnPropertyNames(t),...Object.getOwnPropertySymbols(t)];for(const i of e)this.createProperty(i,t[i])}return this.elementStyles=this.finalizeStyles(this.styles),!0}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const i=new Set(t.flat(1/0).reverse());for(const t of i)e.unshift(o(t))}else void 0!==t&&e.push(o(t));return e}static _$Eh(t,e){const i=e.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof t?t.toLowerCase():void 0}o(){var t;this._$Ep=new Promise((t=>this.enableUpdating=t)),this._$AL=new Map,this._$Em(),this.requestUpdate(),null===(t=this.constructor.l)||void 0===t||t.forEach((t=>t(this)))}addController(t){var e,i;(null!==(e=this._$Eg)&&void 0!==e?e:this._$Eg=[]).push(t),void 0!==this.renderRoot&&this.isConnected&&(null===(i=t.hostConnected)||void 0===i||i.call(t))}removeController(t){var e;null===(e=this._$Eg)||void 0===e||e.splice(this._$Eg.indexOf(t)>>>0,1)}_$Em(){this.constructor.elementProperties.forEach(((t,e)=>{this.hasOwnProperty(e)&&(this._$Et.set(e,this[e]),delete this[e])}))}createRenderRoot(){var e;const i=null!==(e=this.shadowRoot)&&void 0!==e?e:this.attachShadow(this.constructor.shadowRootOptions);return((e,i)=>{t?e.adoptedStyleSheets=i.map((t=>t instanceof CSSStyleSheet?t:t.styleSheet)):i.forEach((t=>{const i=document.createElement("style"),s=window.litNonce;void 0!==s&&i.setAttribute("nonce",s),i.textContent=t.cssText,e.appendChild(i)}))})(i,this.constructor.elementStyles),i}connectedCallback(){var t;void 0===this.renderRoot&&(this.renderRoot=this.createRenderRoot()),this.enableUpdating(!0),null===(t=this._$Eg)||void 0===t||t.forEach((t=>{var e;return null===(e=t.hostConnected)||void 0===e?void 0:e.call(t)}))}enableUpdating(t){}disconnectedCallback(){var t;null===(t=this._$Eg)||void 0===t||t.forEach((t=>{var e;return null===(e=t.hostDisconnected)||void 0===e?void 0:e.call(t)}))}attributeChangedCallback(t,e,i){this._$AK(t,i)}_$ES(t,e,i=u){var s,r;const o=this.constructor._$Eh(t,i);if(void 0!==o&&!0===i.reflect){const n=(null!==(r=null===(s=i.converter)||void 0===s?void 0:s.toAttribute)&&void 0!==r?r:d.toAttribute)(e,i.type);this._$Ei=t,null==n?this.removeAttribute(o):this.setAttribute(o,n),this._$Ei=null}}_$AK(t,e){var i,s,r;const o=this.constructor,n=o._$Eu.get(t);if(void 0!==n&&this._$Ei!==n){const t=o.getPropertyOptions(n),l=t.converter,a=null!==(r=null!==(s=null===(i=l)||void 0===i?void 0:i.fromAttribute)&&void 0!==s?s:"function"==typeof l?l:null)&&void 0!==r?r:d.fromAttribute;this._$Ei=n,this[n]=a(e,t.type),this._$Ei=null}}requestUpdate(t,e,i){let s=!0;void 0!==t&&(((i=i||this.constructor.getPropertyOptions(t)).hasChanged||c)(this[t],e)?(this._$AL.has(t)||this._$AL.set(t,e),!0===i.reflect&&this._$Ei!==t&&(void 0===this._$E_&&(this._$E_=new Map),this._$E_.set(t,i))):s=!1),!this.isUpdatePending&&s&&(this._$Ep=this._$EC())}async _$EC(){this.isUpdatePending=!0;try{await this._$Ep}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){var t;if(!this.isUpdatePending)return;this.hasUpdated,this._$Et&&(this._$Et.forEach(((t,e)=>this[e]=t)),this._$Et=void 0);let e=!1;const i=this._$AL;try{e=this.shouldUpdate(i),e?(this.willUpdate(i),null===(t=this._$Eg)||void 0===t||t.forEach((t=>{var e;return null===(e=t.hostUpdate)||void 0===e?void 0:e.call(t)})),this.update(i)):this._$EU()}catch(t){throw e=!1,this._$EU(),t}e&&this._$AE(i)}willUpdate(t){}_$AE(t){var e;null===(e=this._$Eg)||void 0===e||e.forEach((t=>{var e;return null===(e=t.hostUpdated)||void 0===e?void 0:e.call(t)})),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EU(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$Ep}shouldUpdate(t){return!0}update(t){void 0!==this._$E_&&(this._$E_.forEach(((t,e)=>this._$ES(e,this[e],t))),this._$E_=void 0),this._$EU()}updated(t){}firstUpdated(t){}}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
var v;p.finalized=!0,p.elementProperties=new Map,p.elementStyles=[],p.shadowRootOptions={mode:"open"},null==h||h({ReactiveElement:p}),(null!==(n=globalThis.reactiveElementVersions)&&void 0!==n?n:globalThis.reactiveElementVersions=[]).push("1.2.1");const g=globalThis.trustedTypes,f=g?g.createPolicy("lit-html",{createHTML:t=>t}):void 0,$=`lit$${(Math.random()+"").slice(9)}$`,m="?"+$,y=`<${m}>`,_=document,b=(t="")=>_.createComment(t),A=t=>null===t||"object"!=typeof t&&"function"!=typeof t,x=Array.isArray,w=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,E=/-->/g,S=/>/g,C=/>|[ 	\n\r](?:([^\s"'>=/]+)([ 	\n\r]*=[ 	\n\r]*(?:[^ 	\n\r"'`<>=]|("|')|))|$)/g,k=/'/g,U=/"/g,P=/^(?:script|style|textarea)$/i,T=(t=>(e,...i)=>({_$litType$:t,strings:e,values:i}))(1),N=Symbol.for("lit-noChange"),H=Symbol.for("lit-nothing"),O=new WeakMap,M=_.createTreeWalker(_,129,null,!1),z=(t,e)=>{const i=t.length-1,s=[];let r,o=2===e?"<svg>":"",n=w;for(let e=0;e<i;e++){const i=t[e];let l,a,h=-1,d=0;for(;d<i.length&&(n.lastIndex=d,a=n.exec(i),null!==a);)d=n.lastIndex,n===w?"!--"===a[1]?n=E:void 0!==a[1]?n=S:void 0!==a[2]?(P.test(a[2])&&(r=RegExp("</"+a[2],"g")),n=C):void 0!==a[3]&&(n=C):n===C?">"===a[0]?(n=null!=r?r:w,h=-1):void 0===a[1]?h=-2:(h=n.lastIndex-a[2].length,l=a[1],n=void 0===a[3]?C:'"'===a[3]?U:k):n===U||n===k?n=C:n===E||n===S?n=w:(n=C,r=void 0);const c=n===C&&t[e+1].startsWith("/>")?" ":"";o+=n===w?i+y:h>=0?(s.push(l),i.slice(0,h)+"$lit$"+i.slice(h)+$+c):i+$+(-2===h?(s.push(void 0),e):c)}const l=o+(t[i]||"<?>")+(2===e?"</svg>":"");if(!Array.isArray(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return[void 0!==f?f.createHTML(l):l,s]};class R{constructor({strings:t,_$litType$:e},i){let s;this.parts=[];let r=0,o=0;const n=t.length-1,l=this.parts,[a,h]=z(t,e);if(this.el=R.createElement(a,i),M.currentNode=this.el.content,2===e){const t=this.el.content,e=t.firstChild;e.remove(),t.append(...e.childNodes)}for(;null!==(s=M.nextNode())&&l.length<n;){if(1===s.nodeType){if(s.hasAttributes()){const t=[];for(const e of s.getAttributeNames())if(e.endsWith("$lit$")||e.startsWith($)){const i=h[o++];if(t.push(e),void 0!==i){const t=s.getAttribute(i.toLowerCase()+"$lit$").split($),e=/([.?@])?(.*)/.exec(i);l.push({type:1,index:r,name:e[2],strings:t,ctor:"."===e[1]?D:"?"===e[1]?V:"@"===e[1]?W:I})}else l.push({type:6,index:r})}for(const e of t)s.removeAttribute(e)}if(P.test(s.tagName)){const t=s.textContent.split($),e=t.length-1;if(e>0){s.textContent=g?g.emptyScript:"";for(let i=0;i<e;i++)s.append(t[i],b()),M.nextNode(),l.push({type:2,index:++r});s.append(t[e],b())}}}else if(8===s.nodeType)if(s.data===m)l.push({type:2,index:r});else{let t=-1;for(;-1!==(t=s.data.indexOf($,t+1));)l.push({type:7,index:r}),t+=$.length-1}r++}}static createElement(t,e){const i=_.createElement("template");return i.innerHTML=t,i}}function j(t,e,i=t,s){var r,o,n,l;if(e===N)return e;let a=void 0!==s?null===(r=i._$Cl)||void 0===r?void 0:r[s]:i._$Cu;const h=A(e)?void 0:e._$litDirective$;return(null==a?void 0:a.constructor)!==h&&(null===(o=null==a?void 0:a._$AO)||void 0===o||o.call(a,!1),void 0===h?a=void 0:(a=new h(t),a._$AT(t,i,s)),void 0!==s?(null!==(n=(l=i)._$Cl)&&void 0!==n?n:l._$Cl=[])[s]=a:i._$Cu=a),void 0!==a&&(e=j(t,a._$AS(t,e.values),a,s)),e}class B{constructor(t,e){this.v=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}p(t){var e;const{el:{content:i},parts:s}=this._$AD,r=(null!==(e=null==t?void 0:t.creationScope)&&void 0!==e?e:_).importNode(i,!0);M.currentNode=r;let o=M.nextNode(),n=0,l=0,a=s[0];for(;void 0!==a;){if(n===a.index){let e;2===a.type?e=new L(o,o.nextSibling,this,t):1===a.type?e=new a.ctor(o,a.name,a.strings,this,t):6===a.type&&(e=new G(o,this,t)),this.v.push(e),a=s[++l]}n!==(null==a?void 0:a.index)&&(o=M.nextNode(),n++)}return r}m(t){let e=0;for(const i of this.v)void 0!==i&&(void 0!==i.strings?(i._$AI(t,i,e),e+=i.strings.length-2):i._$AI(t[e])),e++}}class L{constructor(t,e,i,s){var r;this.type=2,this._$AH=H,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=i,this.options=s,this._$Cg=null===(r=null==s?void 0:s.isConnected)||void 0===r||r}get _$AU(){var t,e;return null!==(e=null===(t=this._$AM)||void 0===t?void 0:t._$AU)&&void 0!==e?e:this._$Cg}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===t.nodeType&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=j(this,t,e),A(t)?t===H||null==t||""===t?(this._$AH!==H&&this._$AR(),this._$AH=H):t!==this._$AH&&t!==N&&this.$(t):void 0!==t._$litType$?this.T(t):void 0!==t.nodeType?this.S(t):(t=>{var e;return x(t)||"function"==typeof(null===(e=t)||void 0===e?void 0:e[Symbol.iterator])})(t)?this.A(t):this.$(t)}M(t,e=this._$AB){return this._$AA.parentNode.insertBefore(t,e)}S(t){this._$AH!==t&&(this._$AR(),this._$AH=this.M(t))}$(t){this._$AH!==H&&A(this._$AH)?this._$AA.nextSibling.data=t:this.S(_.createTextNode(t)),this._$AH=t}T(t){var e;const{values:i,_$litType$:s}=t,r="number"==typeof s?this._$AC(t):(void 0===s.el&&(s.el=R.createElement(s.h,this.options)),s);if((null===(e=this._$AH)||void 0===e?void 0:e._$AD)===r)this._$AH.m(i);else{const t=new B(r,this),e=t.p(this.options);t.m(i),this.S(e),this._$AH=t}}_$AC(t){let e=O.get(t.strings);return void 0===e&&O.set(t.strings,e=new R(t)),e}A(t){x(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let i,s=0;for(const r of t)s===e.length?e.push(i=new L(this.M(b()),this.M(b()),this,this.options)):i=e[s],i._$AI(r),s++;s<e.length&&(this._$AR(i&&i._$AB.nextSibling,s),e.length=s)}_$AR(t=this._$AA.nextSibling,e){var i;for(null===(i=this._$AP)||void 0===i||i.call(this,!1,!0,e);t&&t!==this._$AB;){const e=t.nextSibling;t.remove(),t=e}}setConnected(t){var e;void 0===this._$AM&&(this._$Cg=t,null===(e=this._$AP)||void 0===e||e.call(this,t))}}class I{constructor(t,e,i,s,r){this.type=1,this._$AH=H,this._$AN=void 0,this.element=t,this.name=e,this._$AM=s,this.options=r,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=H}get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}_$AI(t,e=this,i,s){const r=this.strings;let o=!1;if(void 0===r)t=j(this,t,e,0),o=!A(t)||t!==this._$AH&&t!==N,o&&(this._$AH=t);else{const s=t;let n,l;for(t=r[0],n=0;n<r.length-1;n++)l=j(this,s[i+n],e,n),l===N&&(l=this._$AH[n]),o||(o=!A(l)||l!==this._$AH[n]),l===H?t=H:t!==H&&(t+=(null!=l?l:"")+r[n+1]),this._$AH[n]=l}o&&!s&&this.k(t)}k(t){t===H?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,null!=t?t:"")}}class D extends I{constructor(){super(...arguments),this.type=3}k(t){this.element[this.name]=t===H?void 0:t}}const Z=g?g.emptyScript:"";class V extends I{constructor(){super(...arguments),this.type=4}k(t){t&&t!==H?this.element.setAttribute(this.name,Z):this.element.removeAttribute(this.name)}}class W extends I{constructor(t,e,i,s,r){super(t,e,i,s,r),this.type=5}_$AI(t,e=this){var i;if((t=null!==(i=j(this,t,e,0))&&void 0!==i?i:H)===N)return;const s=this._$AH,r=t===H&&s!==H||t.capture!==s.capture||t.once!==s.once||t.passive!==s.passive,o=t!==H&&(s===H||r);r&&this.element.removeEventListener(this.name,this,s),o&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){var e,i;"function"==typeof this._$AH?this._$AH.call(null!==(i=null===(e=this.options)||void 0===e?void 0:e.host)&&void 0!==i?i:this.element,t):this._$AH.handleEvent(t)}}class G{constructor(t,e,i){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(t){j(this,t)}}const J=window.litHtmlPolyfillSupport;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
var q,F;null==J||J(R,L),(null!==(v=globalThis.litHtmlVersions)&&void 0!==v?v:globalThis.litHtmlVersions=[]).push("2.1.2");class K extends p{constructor(){super(...arguments),this.renderOptions={host:this},this._$Dt=void 0}createRenderRoot(){var t,e;const i=super.createRenderRoot();return null!==(t=(e=this.renderOptions).renderBefore)&&void 0!==t||(e.renderBefore=i.firstChild),i}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Dt=((t,e,i)=>{var s,r;const o=null!==(s=null==i?void 0:i.renderBefore)&&void 0!==s?s:e;let n=o._$litPart$;if(void 0===n){const t=null!==(r=null==i?void 0:i.renderBefore)&&void 0!==r?r:null;o._$litPart$=n=new L(e.insertBefore(b(),t),t,void 0,null!=i?i:{})}return n._$AI(t),n})(e,this.renderRoot,this.renderOptions)}connectedCallback(){var t;super.connectedCallback(),null===(t=this._$Dt)||void 0===t||t.setConnected(!0)}disconnectedCallback(){var t;super.disconnectedCallback(),null===(t=this._$Dt)||void 0===t||t.setConnected(!1)}render(){return N}}K.finalized=!0,K._$litElement$=!0,null===(q=globalThis.litElementHydrateSupport)||void 0===q||q.call(globalThis,{LitElement:K});const Q=globalThis.litElementPolyfillSupport;null==Q||Q({LitElement:K}),(null!==(F=globalThis.litElementVersions)&&void 0!==F?F:globalThis.litElementVersions=[]).push("3.1.2");class X extends K{constructor(t={}){var e,i,s;super(),this.volume=null!==(e=t.volume)&&void 0!==e?e:0,this.backgroundColor=null!==(i=t.backgroundColor)&&void 0!==i?i:"#69ce2b",this.count=null!==(s=t.count)&&void 0!==s?s:10}static get styles(){return r`#wrapper{width:100%}`}static get properties(){return{volume:{type:Number},count:{type:Number},backgroundColor:{type:String,reflect:!0}}}willUpdate(t){t.has("volume")&&(!this.volume||this.volume<0?this.volume=0:this.volume>1&&(this.volume=1))}render(){var t;const e=Math.round(this.count*(null!==(t=this.volume)&&void 0!==t?t:0));return T`<style>.target{width:calc(${100/this.count}% - 10px);height:10px;display:inline-block;margin:5px;background-color:#e6e7e8}.active{background-color:${this.backgroundColor}}</style><div id="wrapper">${Array.from({length:this.count},((t,i)=>T`<div class="${i<e?"target active":"target"}"></div>`))}</div>`}}customElements.define("brainsatplay-audio-volume",X);var Y=Object.freeze({__proto__:null,Volume:X});class tt extends K{constructor(t={}){super(),this.source=t.source,this.autoplay=t.autoplay,this.controls=t.controls}static get styles(){return r`video{width:100%}`}static get properties(){return{source:{converter:{toAttribute:t=>t,fromAttribute:t=>t}},autoplay:{type:Boolean},controls:{type:Boolean}}}willUpdate(t){}render(){let t=document.createElement("video");if("object"==typeof this.source)t.srcObject=this.source;else if(this.source){const e=document.createElement("source");e.src=this.source,t.insertAdjacentElement("beforeend",e)}return this.autoplay&&(t.autoplay=this.autoplay),this.controls&&(t.controls=this.controls),t}}customElements.define("brainsatplay-video-player",tt);var et=Object.freeze({__proto__:null,Player:tt});class it extends K{constructor(t={}){var e,i,s;super(),this.volume=null!==(e=t.volume)&&void 0!==e?e:0,this.backgroundColor=null!==(i=t.backgroundColor)&&void 0!==i?i:"#69ce2b",this.count=null!==(s=t.count)&&void 0!==s?s:10}static get styles(){return r`#wrapper{width:100%}`}static get properties(){return{volume:{type:Number},count:{type:Number},backgroundColor:{type:String,reflect:!0}}}willUpdate(t){t.has("volume")&&(!this.volume||this.volume<0?this.volume=0:this.volume>1&&(this.volume=1))}render(){var t;const e=Math.round(this.count*(null!==(t=this.volume)&&void 0!==t?t:0));return T`<style>.target{width:calc(${100/this.count}% - 10px);height:10px;display:inline-block;margin:5px;background-color:#e6e7e8}.active{background-color:${this.backgroundColor}}</style><div id="wrapper">${Array.from({length:this.count},((t,i)=>T`<div class="${i<e?"target active":"target"}"></div>`))}</div>`}}customElements.define("brainsatplay-data-timeseries",it);var st=Object.freeze({__proto__:null,TimeSeries:it}),rt=Object.freeze({__proto__:null,audio:Y,video:et,data:st});class ot extends K{constructor(t={}){var e,i;super(),this.verb=null!==(e=t.verb)&&void 0!==e?e:"contribute",this.color=null!==(i=t.color)&&void 0!==i?i:"blue"}static get styles(){return r`img{width:100%}`}static get properties(){return{verb:{type:String},color:{type:String,reflect:!0}}}willUpdate(t){}render(){return T`<a href="https://opencollective.com/brainsatplay/donate" target="_blank"><img src="https://opencollective.com/brainsatplay/${this.verb}/button@2x.png?color=${this.color}"></a>`}}customElements.define("brainsatplay-contribute",ot);var nt=Object.freeze({__proto__:null,Contribute:ot});class lt extends K{constructor(t={brand:{content:"My Brand"},primary:{menu:[],options:[]},secondary:[]}){var e,i,s,r;super(),this.getElement=t=>"button"===t.type?T`<a href="${t.link}" target="${t.external?"_blank":"_self"}"><button>${t.content}</button></a>`:T`<a href="${t.link}" target="${t.external?"_blank":"_self"}" class="decorate">${t.content}</a>`,this.primary=null!==(e=t.primary)&&void 0!==e?e:{menu:[],options:[]},this.secondary=null!==(i=t.secondary)&&void 0!==i?i:[],this.color=null!==(s=t.color)&&void 0!==s?s:"blue",this.brand=null!==(r=t.brand)&&void 0!==r?r:"My Brand"}static get styles(){return r`:host{font-family:sans-serif}header{width:100%;position:absolute;top:0;left:0}:host *{box-sizing:border-box}nav{color:#fff;width:100%;padding:0 25px;display:flex;align-items:center;background:#060606}#primary{position:sticky;top:0;left:0;height:70px;max-height:100px;justify-content:space-between;font-size:80%}#primary>div{height:100%;width:100%;display:flex;align-items:center;justify-content:space-between;flex-direction:row-reverse}#menu,#options{height:100%;display:flex;align-items:center;justify-content:center}#secondary{height:50px;justify-content:flex-end;border-bottom:1px solid #3d3d3d;font-size:75%}a{color:#fff;text-decoration:none}.brand{padding-right:15px}a:not(.brand){height:100%;display:flex;align-items:center;justify-content:center;text-align:center}.decorate{padding:10px 15px}#primary .decorate:hover{box-shadow:0 4px 0 #0fb3ff inset}#secondary .decorate:hover{box-shadow:0 3px 0 #c4c4c4 inset}button{border:1px solid #fff;color:#fff;border-radius:3px;background:0 0;padding:5px 10px;margin-left:10px;font-size:95%}nav button:last-child{margin-right:0}button:hover{outline:1.1px solid #fff;cursor:pointer}@media only screen and (max-width:800px){#primary #menu{display:none}}`}static get properties(){return{primary:{type:Object,reflect:!0},secondary:{type:Array,reflect:!0},brand:{type:Object},color:{type:String,reflect:!0}}}willUpdate(t){}render(){var t,e,i;return T`<header>${this.secondary.length>0?T`<nav id="secondary">${null===(t=this.secondary)||void 0===t?void 0:t.map((t=>this.getElement(t)))}</nav>`:""}<nav id="primary">${T`<a class="brand" target="${this.brand.external?"_blank":"_self"}" href="${this.brand.link}">${/(jpg|gif|png|JPG|GIF|PNG|JPEG|jpeg)$/.test(this.brand.content)?T`<img src="${this.brand.content}">`:T`<h1>${this.brand.content.toUpperCase()}</h1>`}</a>`}<div><div id="options">${null===(e=this.primary.options)||void 0===e?void 0:e.map((t=>this.getElement(t)))}</div><div id="menu">${null===(i=this.primary.menu)||void 0===i?void 0:i.map((t=>this.getElement(t)))}</div></div></nav></header>`}}customElements.define("brainsatplay-nav",lt);class at extends K{constructor(t={}){var e,i,s,r;super(),this.progress=t.progress,this.color=t.color,this.background=null!==(e=t.background)&&void 0!==e?e:"#f3f3f3",this.type=null!==(i=t.type)&&void 0!==i?i:"default",this.showPercent=null===(s=t.showPercent)||void 0===s||s,this.text=t.text,this.textBackground=t.textBackground,this.textColor=t.textColor,this.size=null!==(r=t.size)&&void 0!==r?r:"13px",this.color||("default"===this.type?this.color="blue":this.color="#7aff80")}static get styles(){return r`
    
    :host {
      font-family: sans-serif;
    }

    #container {  
      width: 100%;
    }

    #indicator { 
      width: 100%;
      overflow: hidden;
      animate: 0.5s;
      opacity: 0.7;
    }

    #indicator > div {
      width: 100%;
      height: 100%;
    }

    #linear-text {  
      padding: 10px 15px;
      border-top-left-radius: 5px;
      border-top-right-radius: 5px;
      font-size: 75%;
      background: white;
    }

    .loader-container {
      width: 80px;
      height: 80px;
      position: relative;
      color: #5b5b5b;
    }

    .loader {
      width: 100%;
      height: 100%;
      border: 4px solid;
      background: white;
      border-right: none;
      border-top: none;
      border-left: none;
      z-index: 2000;
      background-color: transparent;
      border-radius: 100%;
      transform: rotateZ(0);
    }

    .loader-container > span{
      position: absolute;
      top: 50%;
      left: 50%;
      font-size: 80%;
      transform: translate(-50%, -50%);
      user-select: none;
    }

    .loader.active {
      opacity: 0.45;
      -webkit-animation: spin 2s linear infinite;
      animation: spin 2s linear infinite;
    }

    /* @-moz-keyframes spin {  . . . } */
    
    
    /* @-ms-keyframes spin {  . . . } */
    
    
    /* @-o-keyframes spin { . . . } */
    
    @-webkit-keyframes spin {
      from {
        transform: rotateZ(0deg) scale(1);
      }
      50% {
        transform: rotateZ(540deg) scale(0.9);
        filter: brightness(50%);        
      }
      to {
        transform: rotateZ(1080deg) scale(1);
      }
    }
    
    @keyframes spin {
      from {
        transform: rotateZ(0deg) scale(1);
      }
      50% {
        transform: rotateZ(540deg) scale(0.9);
        filter: brightness(50%);
      }
      to {
        transform: rotateZ(1080deg) scale(1);
      }
    }
    `}static get properties(){return{progress:{type:Number,reflect:!0},text:{type:String,reflect:!0},type:{type:String,reflect:!0},color:{type:String,reflect:!0},background:{type:String,reflect:!0},textBackground:{type:String,reflect:!0},textColor:{type:String,reflect:!0},size:{type:String,reflect:!0}}}willUpdate(t){}render(){var t;const e=null!==(t=this.progress)&&void 0!==t?t:0,i=null!=this.text?this.text:this.showPercent?`${(100*e).toFixed(1)}%`:"";return"linear"===this.type?T`
            ${i?T`<div id="linear-text" style="background: ${this.textBackground}; color: ${this.textColor};">${i}</div>`:""}
            <div id="indicator" style="height:${this.size}; background:${this.background}; opacity:${1===e?1:""};">
                <div style="width:${100*e}%; background: ${this.color}"></div>
              </div>
            `:T`
            <div class="loader-container" style="height:${this.size}; width:${this.size}; background: ${this.textBackground};">
              ${i?T`<span style="color: ${this.textColor};">${i}</span>`:""}
              <div class="loader active" style="border-color: ${this.color};"></div>
            </div>
            `}}customElements.define("brainsatplay-loader",at);export{at as Loader,lt as Nav,nt as brand,rt as streams};
