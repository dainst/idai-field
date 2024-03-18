import { v4 as uuid } from 'uuid';


export class IdGenerator {

    public generateId(): string {

        return uuid();
    }
}
