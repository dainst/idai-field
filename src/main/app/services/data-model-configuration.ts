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

    /**
     * Contains the possible object types
     */
    private types: Promise<string[]>;

    /**
     * Contains an array of fields for every object type defined in the configurationData
     */
    private fieldMap: Promise<{ [type: string]: any[] }>;
    private excavation: Promise<any>;

    constructor(
        http:Http,
        private messages: Messages
    ) {
        this.fieldMap = new Promise<{ [type: string]: any[] }>((resolve)=> {
            http.get(DataModelConfiguration.PATH).
            subscribe(data_=>{

                var data=JSON.parse(data_['_body']);
                var fieldMap:{ [type: string]: any[] }={}
                for (var i in data['types']) {
                    fieldMap[data['types'][i].type]
                        =this.createFields(fieldMap,data['types'][i]);
                }
                resolve(fieldMap);
            });
        });

        this.excavation = new Promise<{}>((resolve)=> {
            http.get(DataModelConfiguration.PATH).
            subscribe(data_=>{
                var data=JSON.parse(data_['_body']);
                resolve(data['excavation']);
            });
        });
    }

    private createFields(fieldMap,type) {
        var fields=[];
        if (type.parent!=undefined) {
            if (fieldMap[type.parent]==undefined) {
                this.messages.add(MessagesDictionary.MSGKEY_DMC_GENERIC_ERROR, 'danger');
            } else
                fields=fieldMap[type.parent];
        }
        return fields.concat(type.fields);
    }

    /**
     * Returns an array containing the possible object types
     */
    public getTypes(): Promise<string[]> {
        return new Promise<string[]>((resolve,reject)=>{
            this.fieldMap.then(function(fm){
                resolve(Object.keys(fm))
            });
        });
    }

    /**
     * Returns an array containing the fields of the specified object type
     * @param type
     */
    public getFields(type: string): Promise<any[]> {
        return new Promise<any[]>((resolve,reject)=>{
            this.fieldMap.then(function(fm){
                resolve(fm[type]);
            });
        });
    }

    public getExcavationName() : Promise<any> {
        return new Promise<any>((resolve)=>{
            this.excavation.then(name=>resolve(name))
        });
    }

}
