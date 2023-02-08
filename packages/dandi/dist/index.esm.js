var L=Object.defineProperty;var S=(s,t)=>{for(var e in t)L(s,e,{get:t[e],enumerable:!0})};var $=(s,t,e)=>{if(!t.has(s))throw TypeError("Cannot "+e)};var i=(s,t,e)=>($(s,t,"read from private field"),e?e.call(s):t.get(s)),r=(s,t,e)=>{if(t.has(s))throw TypeError("Cannot add the same private member more than once");t instanceof WeakSet?t.add(s):t.set(s,e)},a=(s,t,e,n)=>($(s,t,"write to private field"),n?n.call(s,e):t.set(s,e),e);var V={};S(V,{getBase:()=>y,getInfo:()=>D,getInfoURL:()=>h,getInstance:()=>x,getJSON:()=>c,getLatestVersion:()=>w,paginate:()=>l});var U={main:"api.dandiarchive.org",staging:"api-staging.dandiarchive.org"},A=U;var w=async(s,t)=>{let e=await y(s,t);if(e){let n=e.most_recent_published_version?.version;if(n)return n;if(e.draft_version?.status==="Valid")return e.draft_version?.version}else return null},x=s=>typeof s=="string"?A[s]:A.main,c=s=>fetch(s).then(t=>t.json()),j=(s,t)=>`https://${x(t)}/api/dandisets/${s}`,y=(s,t)=>c(j(s,t)),h=(s,t)=>`${j(s,t?.instance)}/versions/${t?.version?t.version:"draft"}`,D=async(s,t)=>{let e=t?.version??await w(s,t?.instance);if(e)return c(h(s,{...t,version:e}))},l=async s=>{let t=[];if(s.results&&t.push(...s.results),s.next){let e=await c(s.next);t.push(...await l(e))}return t};var d,f,m,B,_=class{constructor(t,e,n="main"){r(this,d,void 0);r(this,f,void 0);r(this,m,{});r(this,B,t=>{Object.assign(this,t),this.asset_id=t.asset_id});e&&typeof e=="object"&&!(e instanceof String)?i(this,B).call(this,e):this.asset_id=e,a(this,d,n),a(this,f,t)}async get(t=i(this,f),e=this.asset_id,n=i(this,d)){a(this,f,t),a(this,d,n),this.asset_id=e;let o=await T(i(this,f),this.asset_id,i(this,d));return o&&Object.assign(this,o),o}async getInfo(t){return i(this,m)||a(this,m,await R(i(this,f),this.asset_id,{...t,instance:i(this,d)})),i(this,m)}};d=new WeakMap,f=new WeakMap,m=new WeakMap,B=new WeakMap;var T=async(s,t,e)=>{let n=h(s,e),o=await c(`${n}/${t}`);return new _(s,o,e?.instance)},R=async(s,t,e)=>{let n=h(s,e);return await c(`${n}/${t}/info`)};var p,b,u,g,I,O,v=class{constructor(t,e="main"){r(this,p,"main");r(this,b,{});r(this,u,{});r(this,g,{});r(this,I,!1);r(this,O,t=>{a(this,b,t),Object.assign(this,t),this.identifier=t.identifier});t&&typeof t=="object"&&!(t instanceof String)?i(this,O).call(this,t):this.identifier=t,a(this,p,e)}async get(t=this.identifier){if(t!==this.identifier){this.identifier=t,a(this,u,{}),a(this,g,{});let e=await y(this.identifier,i(this,p));e&&Object.assign(this,e)}return i(this,b)}async getInfo(t={}){return Object.keys(i(this,u)).length===0&&a(this,u,await D(this.identifier,{...t,instance:i(this,p)})),i(this,u)}async getAsset(t){return i(this,g)[t]||(i(this,g)[t]=await T(this.identifier,t,{instance:i(this,p)})),i(this,g)[t]}async getAssets(t={}){return i(this,I)||((await N(this.identifier,{...t,instance:i(this,p)}))?.forEach(n=>i(this,g)[n.asset_id]=n),a(this,I,!0)),i(this,g)}};p=new WeakMap,b=new WeakMap,u=new WeakMap,g=new WeakMap,I=new WeakMap,O=new WeakMap;var J=(s,t)=>`${h(s,t)}/assets`,N=async(s,t)=>{let e=t?.version??await w(s,t?.instance);if(e){let n=`${J(s,{...t,version:e})}`,o=await c(n);return(await l(o)).map(z=>new _(s,z,t?.instance))}},H=async s=>{let t=`https://${x(s)}/api/dandisets`,e=await c(t);return(await l(e)).map(o=>new v(o,s))},K=async(s,t)=>{let e=await y(s,t);return e?new v(e,t):null};export{_ as Asset,v as Dandiset,K as get,H as getAll,T as getAsset,R as getAssetInfo,N as getAssets,J as getAssetsUrl,V as utils};
//# sourceMappingURL=index.esm.js.map
