import {Component} from '@angular/core';
import {ProjectConfiguration} from '../../core/configuration/project-configuration';
import {IdaiType} from '../../core/configuration/model/idai-type';
import {map, set, flow, to, on, is, filter} from 'tsfun';
import {FieldDefinition} from '../../core/configuration/model/field-definition';

@Component({
    moduleId: module.id,
    templateUrl: './project-configuration.html'
})
/**
 * @author Sebastian Cuy
 */
export class ProjectConfigurationComponent {

    public typesTreeList: Array<IdaiType>;
    public selectedType: IdaiType;
    public selectedGroup: string = 'stem';


    constructor(public projectConfiguration: ProjectConfiguration) {

        this.typesTreeList = projectConfiguration.getTypesList()
            .filter(type => !type.parentType);
        this.selectedType = this.typesTreeList[0];
    }


    public selectType(type: IdaiType) {

        this.selectedType = type;
    }


    public getGroups = (type: IdaiType): string[] =>
        flow(
            type.fields,
            map(to(FieldDefinition.GROUP)),
            set
        );


    public getVisibleFields = (type: IdaiType): FieldDefinition[] =>
        flow(
            type.fields,
            filter(on(FieldDefinition.VISIBLE, is(true))),
            filter(on(FieldDefinition.GROUP, is(this.selectedGroup)))
        );
}