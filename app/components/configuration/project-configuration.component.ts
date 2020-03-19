import {Component} from '@angular/core';
import {ProjectConfiguration} from '../../core/configuration/project-configuration';
import {IdaiType} from '../../core/configuration/model/idai-type';
import {to, on, is, includedIn, or} from 'tsfun';
import {FieldDefinition} from '../../core/configuration/model/field-definition';
import {Group} from '../../core/configuration/model/group';


@Component({
    moduleId: module.id,
    templateUrl: './project-configuration.html'
})
/**
 * @author Sebastian Cuy
 */
export class ProjectConfigurationComponent {

    public OVERRIDE_VISIBLE_FIELDS = ['identifier', 'shortDescription'];

    public typesTreeList: Array<IdaiType>;
    public selectedType: IdaiType;
    public selectedGroup: string;

    constructor(public projectConfiguration: ProjectConfiguration) {

        this.typesTreeList = projectConfiguration.getTypesList()
            .filter(type => !type.parentType);
        this.selectType(this.typesTreeList[0]);
    }


    public selectType(type: IdaiType) {

        this.selectedType = type;
        this.selectedGroup = this.getGroups(type)[0];
    }


    public getGroups = (type: IdaiType): any[] => (type.groups as any).map(to(Group.NAME));


    public getVisibleFields(type: IdaiType): FieldDefinition[] {

        return (type.groups as any)
            .find(on(Group.NAME, is(this.selectedGroup)))
            .fields
            .filter(
                or(
                    on(FieldDefinition.VISIBLE, is(true)),
                    on(FieldDefinition.NAME, includedIn(this.OVERRIDE_VISIBLE_FIELDS))));
    }
}