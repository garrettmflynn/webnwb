import { ArbitraryObject } from "src/types/general.types";
import extend from "../utils/extend";

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

        } else console.error('[classify]: Cannot add parent as child')
    }

    _inherit = (base:string, info:any, classes:any, group=Object.keys(this.tree)[0]) => {

        const baseClass = classes[base]
        if (!baseClass) {
            console.warn(`[classify]: ${base} was missing in the spec`)
            return undefined
        }

        // Get Inheritance
        if (info.inherits){

            const inheritanceInfo = this.tree[group][info.inherits]
            if (!inheritanceInfo.class) {
                const output = this._inherit(info.inherits, inheritanceInfo, classes, group) // inherit for parent
                inheritanceInfo.class = output
            } 

            info.class = extend(inheritanceInfo.class, baseClass.constructor) // extend base with inheritanc
            // try {
            //     console.log(`${base} inheriting from ${info.inherits}`, new info.class({
            //         sessionDescription: 'demonstrate NWBFile basics',
            //         identifier: 'NWB123',
            //         sessionStartTime: Date.now(),
            //         fileCreateDate: Date.now(),
            //     }))
            // } catch (e) {
            //     console.error('failed for ', base, e)
            // }

            return info.class
        } else return baseClass
    }

    inherit = (classes:any, group=Object.keys(this.tree)[0]) => {
        for (let key in this.tree[group]) {
            const info = this.tree[group][key]
            const res = this._inherit(key, info, classes, group) 
            if (res) classes[key] = res // update reference
        }
    }
}

export default InheritanceTree