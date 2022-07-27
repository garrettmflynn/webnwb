import { ArbitraryObject } from "src/types/general.types";
import extend from "./utils/extend";

class InheritanceTree {

    tree: ArbitraryObject = {}
    constructor() {

    }

    add(parent:string, child:string, type='general') {
        if (parent != child){
            if (!this.tree[type]) this.tree[type] = {}
            if (!this.tree[type][child]) this.tree[type][child] = {inherits: null, inherited: []}
            if (!this.tree[type][parent]) this.tree[type][parent] = {inherits: null, inherited: []}
            this.tree[type][parent].inherited.push(child)
            this.tree[type][child].inherits = parent

        } else console.error('[InheritanceTree]: Cannot add parent as child')
    }

    _inherit = (base:any, info:any, group=Object.keys(this.tree)[0]) => {

        // if (typeof base === 'string') 

        // Get Inheritance
        if (info.inherits){
            const inheritanceInfo = this.tree[group][info.inherits]
            // console.log('check', group, info.inherits, inheritanceInfo.class, this.tree[group])
            if (!inheritanceInfo.class) {
                const output = this._inherit(base, inheritanceInfo, group) // inherit for parent
                // console.log('output', output)
                inheritanceInfo.class = output
            }

            console.log(`extending ${base.name} with ${inheritanceInfo.class.name}`, inheritanceInfo)
            return extend(inheritanceInfo.class, base) // extend base with inheritance
        } else return base
    }

    inherit = (classes:any, group=Object.keys(this.tree)[0]) => {
        console.log('[InheritanceTree]: Inheriting classes', classes, group, this.tree[group])
        for (let key in this.tree[group]) {
            const info = this.tree[group][key]
            const baseClass = classes[key]
            classes[key] = this._inherit(baseClass, info, group) // update reference
        }
    }
}

export default InheritanceTree