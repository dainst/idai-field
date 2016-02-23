import {Inject} from "angular2/core";
import {Injectable} from "angular2/core";

/**
 * @author Thomas Kleinke
 */
@Injectable()
export class DataModelConfiguration {

    /**
     * Contains an array of fields for every object type defined in the configurationData
     */
    private fieldMap: { [type: string]: any[] };

    constructor(@Inject('app.dataModelConfig') private configurationData) {

        this.fieldMap = configurationData["types"].reduce(function(map, object) {
            map[object.type] = object.fields;
            return map;
        }, {});
    }

    /**
     * Returns an array containing the fields of the specified object type
     * @param type
     */
    public getFields(type: string): any[] {

        return this.fieldMap[type];
    }

}
