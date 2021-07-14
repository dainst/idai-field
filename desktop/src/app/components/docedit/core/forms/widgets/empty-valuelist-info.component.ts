import { Component, Input, OnChanges } from '@angular/core';
import {Labels} from '../../../../services/labels';
import { Datastore, FieldDefinition, ProjectConfiguration, Resource, ValuelistUtil } from 'idai-field-core';
import { is, on } from 'tsfun';


type EmptyValuelistInfoType = 'configuration'|'projectDocumentField'|'parent';


@Component({
    selector: 'empty-valuelist-info',
    templateUrl: './empty-valuelist-info.html'
})
/**
 * @author Thomas Kleinke
 */
export class EmptyValuelistInfoComponent implements OnChanges {

    @Input() resource: Resource;
    @Input() field: FieldDefinition;

    public infoType: EmptyValuelistInfoType;


    constructor(private datastore: Datastore,
                private projectConfiguration: ProjectConfiguration,
                private labels: Labels) {}


    async ngOnChanges() {

        this.infoType = await this.getInfoType();
    }


    public getProjectDocumentFieldLabel(): string {

        if (!this.field.valuelistFromProjectField) return '';

        const field: FieldDefinition| undefined = this.projectConfiguration
            .getFieldDefinitions('Project')
            .find(on('name', is(this.field.valuelistFromProjectField)));

        return field ? this.labels.get(field) : '';
    }


    private async getInfoType(): Promise<EmptyValuelistInfoType> {

        if (this.field.valuelist) {
            return 'configuration';
        } else if (await this.hasValuesInProjectDocument()) {
            return 'projectDocumentField';
        } else {
            return 'parent';
        }
    }


    private async hasValuesInProjectDocument(): Promise<boolean> {

        return Object.keys(
            ValuelistUtil.getValuelistFromProjectField(
                this.field.valuelistFromProjectField as string,
                await this.datastore.get('project')
            ).values
        ).length === 0
    }
}
