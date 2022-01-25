export class NWBMixin 
// extends AbstractContainer
{

    constructor() {
        // super()
    }
}
export class NWBContainer extends NWBMixin{
    constructor() {
        super()
    }
}

export class NWBDataInterface extends NWBContainer{
    
    name: string
    constructor(name:string) {
        super()
        this.name = name
    }

}