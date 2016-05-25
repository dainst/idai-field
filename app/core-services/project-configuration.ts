import {Injectable} from "@angular/core";
import {M} from "../m";

/**
 * ProjectConfiguration maintains the current projects properties.
 * Amongst them is the set of types for the current project,
 * which ProjectConfiguration provides to its clients.
 *
 * Within a project, objects of the available types can get created,
 * where every type is a configuration of different fields.
 *
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
@Injectable()
export class ProjectConfiguration {

    private fieldMap: { [type: string]: any[] } = {}

    private excavation: string

    /**
     * @param configuration
     */
    constructor(configuration) {

        this.initFieldMap(configuration['types']);
        this.expandTypesWithParentFields(configuration['types']);

        this.excavation=configuration['excavation']
    }

    /**
     * @returns {string[]} array with the names of all types of the current project.
     */
    public getTypes(): string[] {
        return Object.keys(this.fieldMap)
    }

    /**
     * @param typeName
     * @returns {any[]} the fields definitions for the type.
     */
    public getFields(typeName: string): any[] {
        return this.fieldMap[typeName];
    }

    /**
     * @returns {string} the name of the excavation, if defined.
     *   <code>undefined</code> otherwise.
     */
    public getExcavationName() : any {
        return this.excavation;
    }

    private initFieldMap(types) {
        for (var type of types) {
            this.fieldMap[this.name(type)] = type.fields;
        }
    }

    private expandTypesWithParentFields(types) {
        for (var type of types) {
            if (this.hasParent(type)) {
                this.fieldMap[this.name(type)]
                    = this.prependFieldsOfParentType(type);
            }
        }
    }

    private name(type) : string {
        return type.type;
    }

    private hasParent(type) : Boolean {
        return type['parent'];
    }

    /**
     * @param type
     * @returns {Array[]} a new fields array, with the fields
     *   of the parent type from the field map first,
     *   and then the types own fields.
     */
    private prependFieldsOfParentType(type) {
        var fields=[];

        if (this.fieldMap[type.parent]==undefined) {
            throw M.PC_GENERIC_ERROR
        } else
            fields=this.fieldMap[type.parent]

        return fields.concat(type.fields)
    }
}
