import { Component, Input, OnChanges } from '@angular/core';
import { Datastore, FieldDefinition, Resource } from 'idai-field-core';
import { is, on } from 'tsfun';
import { ProjectConfiguration } from '../../../../../core/configuration/project-configuration';
import { ValuelistUtil } from '../../../../../core/util/valuelist-util';


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
                private projectConfiguration: ProjectConfiguration) {}


    async ngOnChanges() {

        this.infoType = await this.getInfoType();
    }


    public getProjectDocumentFieldLabel(): string {

        if (!this.field.valuelistFromProjectField) return '';

        const field: FieldDefinition| undefined = this.projectConfiguration
            .getFieldDefinitions('Project')
            .find(on('name', is(this.field.valuelistFromProjectField)));

        return field && field.label ? field.label : '';
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
