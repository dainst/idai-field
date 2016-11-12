import {Component, OnInit, OnChanges, Input, EventEmitter, Output} from "@angular/core";
import {IdaiFieldResource} from "../model/idai-field-resource";
import {ProjectConfiguration, ConfigLoader, ReadDatastore} from "idai-components-2/idai-components-2";

/**
 * @author Daniel de Oliveira
 */
export class WithConfiguration  {

    protected projectConfiguration: ProjectConfiguration;

    constructor(configLoader:ConfigLoader) {
        configLoader.configuration().subscribe((result) => {
            if(result.error == undefined) {
                this.projectConfiguration = result.projectConfiguration;
            }
        });
    }

     // TODO everything below this line should go directly to project configuration

    protected getRelationLabel(relationName: string) {

        var relationFields = this.projectConfiguration.getRelationFields();
        return this.getLabel(relationName, relationFields);
    }

    protected getFieldLabel(type: string, fieldName: string) {

        var fields = this.projectConfiguration.getFields(type);
        return this.getLabel(fieldName, fields);
    }

    protected getLabel(fieldName: string, fields: Array<any>) {

        for (var i in fields) {
            if (fields[i].name == fieldName) {
                if (fields[i].label) {
                    return fields[i].label;
                } else {
                    return fieldName;
                }
            }
        }

        return fieldName;
    }
}