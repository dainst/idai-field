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

    public static PATH='config/Configuration.json';

    public static createInstance(http,messages) : Promise<DataModelConfiguration>{

        return new Promise<DataModelConfiguration>((resolve,reject) => {
            http.get(DataModelConfiguration.PATH).
            subscribe(data_=>{

                try {
                    var data=JSON.parse(data_['_body']);
                } catch (e) {
                    messages.add(MessagesDictionary.MSGKEY_DMC_GENERIC_ERROR, 'danger');
                    console.log(":",e.toString());
                    reject(e.message);
                }

                var fieldMap:{ [type: string]: any[] }={};
                for (var i in data['types']) {
                    fieldMap[data['types'][i].type]
                        =DataModelConfiguration.createFields(fieldMap,data['types'][i],messages);
                }

                resolve(new DataModelConfiguration(messages,fieldMap,data['excavation']))
            });
        });
    }

    private static createFields(fieldMap,type,messages) {
        var fields=[];
        if (type.parent!=undefined) {
            if (fieldMap[type.parent]==undefined) {
                messages.add(MessagesDictionary.MSGKEY_DMC_GENERIC_ERROR, 'danger');
            } else
                fields=fieldMap[type.parent];
        }
        return fields.concat(type.fields);
    }

    /**
     * @param messages
     * @param excavation
     * @param fieldMap Contains an array of fields for every object type defined in the configurationData
     */
    constructor(
        private messages: Messages,
        private fieldMap: { [type: string]: any[] },
        private excavation: string
    ) {}


    /**
     * Returns an array containing the possible object types
     */
    public getTypes(): string[] {
        return Object.keys(this.fieldMap);
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
