import {Component, Input} from '@angular/core';
import {on, is} from 'tsfun';
import {Resource} from 'idai-components-2'
import {FieldDefinition} from '../../../../../core/configuration/model/field-definition';
import {ValuelistUtil} from '../../../../../core/util/valuelist-util';
import {SettingsService} from '../../../../../core/settings/settings-service';
import {ProjectConfiguration} from '../../../../../core/configuration/project-configuration';


@Component({
    selector: 'empty-valuelist-info',
    moduleId: module.id,
    templateUrl: './empty-valuelist-info.html'
})

/**
 * @author Thomas Kleinke
 */
export class EmptyValuelistInfoComponent {

    @Input() resource: Resource;
    @Input() field: FieldDefinition;


    constructor(private settingsService: SettingsService,
                private projectConfiguration: ProjectConfiguration) {}


    public getInfoType(): 'configuration'|'projectDocumentField'|'parent' {

        if (this.field.valuelist) {
            return 'configuration';
        } else if (ValuelistUtil.getValuelistFromProjectField(
            this.field.valuelistFromProjectField as string,
            this.settingsService.getProjectDocument()
        ).length === 0) {
            return 'projectDocumentField';
        } else {
            return 'parent';
        }
    }


    public getProjectDocumentFieldLabel(): string {

        if (!this.field.valuelistFromProjectField) return '';

        const field: FieldDefinition| undefined = this.projectConfiguration
            .getFieldDefinitions('Project')
            .find(on('name', is(this.field.valuelistFromProjectField)));

        return field && field.label ? field.label : '';
    }
}