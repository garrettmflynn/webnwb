function E(n){var t=n.tagName.toLowerCase(),e=t;return Array.prototype.slice.call(n.attributes).forEach(function(r){n.outerHTML.includes(r.name)&&(e+="["+r.name+'="'+r.value+'"]')}),e}function y(n){let t=n.parentElement;return!t||t.tagName=="HTML"?"html":y(t)+">"+t.tagName.toLowerCase()}function f(n){var t=y(n),e=E(n);return t+">"+e}var l={},h=["Object","Array","Map","Set","Number","Boolean","String","Date","RegExp","Function","Promise","Symbol","BigInt","Error","Float32Array","Float64Array","Int8Array","Int16Array","Int32Array","Uint8Array","Uint16Array","Uint32Array","Uint8ClampedArray","ArrayBuffer","SharedArrayBuffer"];function m(n){var t=[];if(n)do{let e=n.constructor?.name,r=h.includes(e);h.includes(e)&&(l[e]||(l[e]=[...Object.getOwnPropertyNames(globalThis[e].prototype)])),Object.getOwnPropertyNames(n).forEach(function(s){r&&l[e].includes(s)||t.indexOf(s)===-1&&t.push(s)})}while(n=Object.getPrototypeOf(n));return t}var d=(n,t={})=>{let e=[];return m(n).forEach(s=>{if(/^on/.test(s)){let a=s.slice(2);t.callback&&n.addEventListener(a,t.callback),(!t.ignore||!t.ignore.includes(a))&&e.push(a)}}),e};var g={},A=["x","y","deltaX","deltaY","deltaZ","deltaMode","animationName","propertyName","pseudoElement","elapsedTime","pressure","tangentialPressure","tiltX","tiltY","twist","pointerType","azimuthAngle","altitudeAngle","alpha","beta","gamma","absolute","key","location","repeat","isComposing","ctrlKey","shiftKey","altKey","metaKey"],b=class{constructor(t){this.on=!1;this.events={};this.raw={};this.#r={};this.#n=[];this.start=t=>{if(typeof t=="function"&&(this.#t=t),!this.on&&(this.on=!0,this.register(globalThis),globalThis.document&&this.register(globalThis.document),globalThis.window)){let e=document.getElementsByTagName("*");for(let r=0;r<e.length;r++)this.register(e[r])}};this.stop=()=>{this.#e.disconnect(),this.on=!1,this.#n.forEach(t=>t()),this.#n=[]};this.set=(t,e)=>{t=t.toLowerCase(),this.#r[t]=e};this.register=t=>{let e=t.tagName?t.tagName.toLowerCase():t===globalThis?"globalThis":"document",r=g[e];r||(g[e]=r=d(t)),t instanceof HTMLElement&&this.#e.observe(t,{childList:!0,subtree:!0}),r.forEach(s=>{this.raw[s]||(this.raw[s]=[]);let a=()=>t.removeEventListener(s,c),c=i=>{let p=i.target===document;if(i.target===t||p){this.raw[i.type].push(i);let o=this.compress(i);this.events[i.type]||(this.events[i.type]=[]),this.events[i.type].push(o);let u=p?"document":e;this.#t&&this.#t(o,i,u),this.#r[i.type]&&this.#r[i.type](o,i,u)}};t.addEventListener(s,c),this.#n.push(a)})};this.compress=t=>{let e={timestamp:t.timeStamp,target:t.target,type:t.type};return A.forEach(r=>{r in t&&(e[r]=t[r])}),e};this.stringify=t=>{try{return JSON.stringify(t,(e,r)=>r instanceof Element?f(r):r instanceof Node?r.nodeName:r instanceof Window?"Window":r," ")}catch(e){console.warn("Failed to pass event type",t.type,e);return}};this.#e=new MutationObserver(e=>{for(let r of e)r.type==="childList"&&r.addedNodes.forEach(s=>this.register(s))}),typeof t=="function"&&this.start(t)}#t;#e;#r;#n};export{b as Tracker};
