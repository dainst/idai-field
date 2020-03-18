import {Component} from '@angular/core';
import {ProjectConfiguration} from '../../core/configuration/project-configuration';
import {IdaiType} from '../../core/configuration/model/idai-type';
import {map, set, flow, to, on, is, filter, intersect, append, includedIn} from 'tsfun';
import {FieldDefinition} from '../../core/configuration/model/field-definition';
import { GroupUtil } from '../../core/configuration/group-util';
import { debugId } from '../../core/util/utils';

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
    public availableGroups = [
        'stem',
        'identification',
        undefined,
        'child',
        'dimension',
        'position',
        'time'
    ];

    constructor(public projectConfiguration: ProjectConfiguration) {

        this.typesTreeList = projectConfiguration.getTypesList()
            .filter(type => !type.parentType);
        this.selectType(this.typesTreeList[0]);
    }


    public selectType(type: IdaiType) {

        this.selectedType = type;
        this.selectedGroup = this.getGroups(type)[0];
    }


    public getGroups = (type: IdaiType): any[] =>
        intersect(this.availableGroups)(type.fields.map(to(FieldDefinition.GROUP)));


    public getVisibleFields(type: IdaiType): FieldDefinition[] {

        const groupFields = type.fields.filter(on(FieldDefinition.GROUP, is(this.selectedGroup)));
        let fields = groupFields
            .filter(on(FieldDefinition.VISIBLE, is(true)))
            .concat(groupFields.filter(on(FieldDefinition.NAME, includedIn(this.OVERRIDE_VISIBLE_FIELDS))));
        GroupUtil.sortGroups(fields, this.selectedGroup);
        return fields;
    }

}