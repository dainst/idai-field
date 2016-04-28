import {Inject} from "angular2/core";
import {Injectable} from "angular2/core";
import {Http} from "angular2/http";
import {Messages} from "./messages";
import {MessagesDictionary} from "./messages-dictionary";

/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
@Injectable()
export class DataModelConfiguration {

    private fieldMap: { [type: string]: any[] }

    private excavation: string
    /**
     * @param messages
     * @param excavation
     * @param fieldMap Contains an array of fields for every object type defined in the configurationData
     */
    constructor(data) {

        this.fieldMap={};
        for (var i in data['types']) {
            this.fieldMap[data['types'][i].type]
                = this.createFields(this.fieldMap,data['types'][i])
        }
        this.excavation=data['excavation']
    }

    private createFields(fieldMap,type) {
        var fields=[];
        if (type.parent!=undefined) {
            if (fieldMap[type.parent]==undefined) {
                throw MessagesDictionary.MSGKEY_DMC_GENERIC_ERROR
            } else
                fields=fieldMap[type.parent]
        }
        return fields.concat(type.fields)
    }


    /**
     * Returns an array containing the possible object types
     */
    public getTypes(): string[] {
        return Object.keys(this.fieldMap)
    }

    /**
     * Returns an array containing the fields of the specified object type
     * @param type
     */
    public getFields(type: string): any[] {
        return this.fieldMap[type];
    }

    public getExcavationName() : any {
        return this.excavation;
    }

}
