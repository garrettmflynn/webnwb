import { ArbitraryObject } from "../../types/general.types";


let thrownError = false
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

        } else {
            if (!thrownError) {
                thrownError = true
                console.error('[classify]: Not adding parents as children')
            }
        }
    }
}

export default InheritanceTree