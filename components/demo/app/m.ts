import {Injectable} from "@angular/core";
import {Message} from "../../src/core/messages/message"
import {MD} from "../../src/core/messages/md"

@Injectable()
export class M extends MD{

    public msgs : { [id: string]: Message } = {};

    constructor() {
        super();
        this.msgs['success_msg']={
            content: 'Erfolg.',
            level: 'success',
            params: [],
            hidden: false
        };
        this.msgs['info_msg']={
            content: 'Info.',
            level: 'info',
            params: [],
            hidden: false
        };
        this.msgs['warning_msg']={
            content: 'Warnung!',
            level: 'warning',
            params: [],
            hidden: false
        };
        this.msgs['danger_msg']={
            content: 'Schwerwiegender Fehler!',
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs['with_params']={
            content: "Hier ist ein Parameter: {0}",
            level: 'success',
            params: [ "Standardwert" ],
            hidden: false
        };
    }
}