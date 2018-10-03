import {UUID} from 'angular2-uuid';


export class IdGenerator {

    public generateId():string {

        return UUID.UUID();
    }
}