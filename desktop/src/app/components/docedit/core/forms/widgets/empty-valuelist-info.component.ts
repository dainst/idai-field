import { Component, Input, OnChanges } from '@angular/core';
import { is } from 'tsfun';
import { Datastore, Field, ProjectConfiguration, ValuelistUtil, Labels, CategoryForm, Named } from 'idai-field-core';


type EmptyValuelistInfoType = 'configuration'|'projectDocumentField'|'parent';


@Component({
    selector: 'empty-valuelist-info',
    templateUrl: './empty-valuelist-info.html'
})
/**
 * @author Thomas Kleinke
 */
export class EmptyValuelistInfoComponent implements OnChanges {

    @Input() field: Field;

    public infoType: EmptyValuelistInfoType;


    constructor(private datastore: Datastore,
                private projectConfiguration: ProjectConfiguration,
                private labels: Labels) {}


    async ngOnChanges() {

        this.infoType = await this.getInfoType();
    }


    public getProjectDocumentFieldLabel(): string {

        if (!this.field.valuelistFromProjectField) return '';

        const field: Field| undefined =
            CategoryForm.getFields(this.projectConfiguration.getCategory('Project'))
                .find(Named.onName(is(this.field.valuelistFromProjectField)));

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
