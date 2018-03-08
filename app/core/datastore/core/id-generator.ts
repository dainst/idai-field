import {UUID} from "angular2-uuid/index";


export class IdGenerator {

    public generateId():string {

        return UUID.UUID();
    }
}