import {Inject} from "angular2/core";
import {Injectable} from "angular2/core";

/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
@Injectable()
export class DataModelConfiguration {

    /**
     * Contains the possible object types
     */
    private types: string[];

    /**
     * Contains an array of fields for every object type defined in the configurationData
     */
    private fieldMap: { [type: string]: any[] } = {};

    constructor(@Inject('app.dataModelConfig') private configurationData) {

        for (var i in configurationData.types) {
            this.fieldMap[configurationData.types[i].type]
                =this.createFields(configurationData.types[i]);
        }

        this.types = Object.keys(this.fieldMap);
    }

    private createFields(type) {
        var fields=[];
        if (type.parent!=undefined) {
            if (this.fieldMap[type.parent]==undefined) throw "Type not defined.";
            fields=this.fieldMap[type.parent];
        }
        return fields.concat(type.fields);
    }

    /**
     * Returns an array containing the possible object types
     */
    public getTypes(): string[] {
        return this.types;
    }

    /**
     * Returns an array containing the fields of the specified object type
     * @param type
     */
    public getFields(type: string): any[] {
        return this.fieldMap[type];
    }

    public getField(name: string) {
        return this.configurationData[name];
    }

}
