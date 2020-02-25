import {AfterViewInit, Component, ElementRef, Input, OnChanges, ViewChild} from '@angular/core';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {is, isNot, on, undefinedOrEmpty} from 'tsfun';
import {Document} from 'idai-components-2';
import {ProjectTypes} from '../../../core/configuration/project-types';
import {GroupUtil} from '../../../core/model/group-util';
import {GROUP_NAME} from '../../constants';
import {FieldDefinition} from '../../../core/configuration/model/field-definition';
import {RelationDefinition} from '../../../core/configuration/model/relation-definition';
import {ProjectConfiguration} from '../../../core/configuration/project-configuration';
import {IdaiType} from '../../../core/configuration/model/idai-type';


interface GroupDefinition {

    name: string;
    label: string;
    fields: any[];
    relations: any[];
    widget: string|undefined;
}


@Component({
    moduleId: module.id,
    selector: 'edit-form',
    templateUrl: './edit-form.html'
})
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class EditFormComponent implements AfterViewInit, OnChanges {

    @ViewChild('editor', {static: false}) rootElement: ElementRef;

    @Input() document: any;
    @Input() fieldDefinitions: Array<FieldDefinition>;
    @Input() relationDefinitions: Array<RelationDefinition>;
    @Input() inspectedRevisions: Document[];
    @Input() activeGroup: string;


    public types: string[];

    public groups: Array<GroupDefinition> = [
        { name: 'stem', label: this.i18n({ id: 'docedit.group.stem', value: 'Stammdaten' }), fields: [],
            relations: [], widget: 'generic' },
        { name: 'identification', label: this.i18n({ id: 'docedit.group.identification', value: 'Bestimmung' }),
            fields: [], relations: [], widget: 'generic' },
        { name: 'properties', label: '', fields: [], relations: [], widget: 'generic' },
        { name: 'childProperties', label: '', fields: [], relations: [], widget: 'generic' },
        { name: 'dimension', label: this.i18n({ id: 'docedit.group.dimensions', value: 'Maße' }),
            fields: [], relations: [], widget: 'generic' },
        { name: 'position', label: this.i18n({ id: 'docedit.group.position', value: 'Lage' }),
            fields: [], relations: [], widget: 'generic' },
        { name: 'time', label: this.i18n({ id: 'docedit.group.time', value: 'Zeit' }), fields: [],
            relations: [], widget: 'generic' },
        { name: 'images', label: this.i18n({ id: 'docedit.group.images', value: 'Bilder' }), fields: [],
            relations: [], widget: undefined },
        { name: 'conflicts', label: this.i18n({ id: 'docedit.group.conflicts', value: 'Konflikte' }),
            fields: [], relations: [], widget: undefined } ];


    constructor(private elementRef: ElementRef,
                private i18n: I18n,
                private projectConfiguration: ProjectConfiguration,
                private typeUtility: ProjectTypes) {}

    public activateGroup = (name: string) => this.activeGroup = name;


    public shouldShow(groupName: string) {

        return (groupName === 'images'
                && !this.typeUtility.getImageTypeNames().includes(this.document.resource.type))
            || (groupName === 'conflicts' && this.document._conflicts)
            || this.getFieldDefinitions(groupName).filter(field => field.editable).length > 0
            || this.getRelationDefinitions(groupName).length > 0;
    }


    public getFieldDefinitions(groupName: string): Array<FieldDefinition> {

        return (this.groups.find((gd: GroupDefinition) => gd.name === groupName) as any).fields;
    }


    public getRelationDefinitions(groupName: string): Array<RelationDefinition> {

        return (this.groups.find((gd: GroupDefinition) => gd.name === groupName) as any).relations;
    }


    ngAfterViewInit() {

        this.focusFirstInputElement();
    }


    ngOnChanges() {

        this.setLabels();

        if (isNot(undefinedOrEmpty)(this.fieldDefinitions)) {
            this.setFields();
            GroupUtil.sortGroups(this.groups[GROUP_NAME.STEM].fields, 'stem');
            GroupUtil.sortGroups(this.groups[GROUP_NAME.DIMENSION].fields, 'dimension');
        }

        if (isNot(undefinedOrEmpty)(this.relationDefinitions)) {
            this.setRelations();
        }
    }


    private setRelations() {

        this.groups.forEach(group => group.relations = []);

        for (let relation of this.relationDefinitions) {
            const groupName: string|undefined = GroupUtil.getGroupName(relation.name);
            if (!groupName) continue;

            const group = this.groups.find(group => group.name === groupName) as GroupDefinition;
            group.relations.push(relation);
        }
    }


    private setFields() {

        this.groups[GROUP_NAME.STEM].fields = this.fieldDefinitions.filter(on('group', is('stem')));
        this.groups[GROUP_NAME.IDENTIFICATION].fields = this.fieldDefinitions.filter(on('group', is('identification')));
        this.groups[GROUP_NAME.PROPERTIES].fields = this.fieldDefinitions.filter(on('group', is(undefined)));
        this.groups[GROUP_NAME.CHILD_PROPERTIES].fields = this.fieldDefinitions.filter(on('group', is('child')));
        this.groups[GROUP_NAME.DIMENSION].fields = this.fieldDefinitions.filter(on('group', is('dimension')));
        this.groups[GROUP_NAME.POSITION].fields = this.fieldDefinitions.filter(on('group', is('position')));

        if (this.typeUtility.isGeometryType(this.document.resource.type)) {
            this.groups[GROUP_NAME.POSITION].fields.push({
                name: 'geometry',
                label: this.i18n({ id: 'docedit.geometry', value: 'Geometrie' }),
                group: 'position',
                inputType: 'geometry',
                editable: true
            });
        }

        this.groups[GROUP_NAME.TIME].fields = this.fieldDefinitions.filter(on('group', is('time')));
    }


    private setLabels() {

        const type: IdaiType = this.projectConfiguration.getTypesMap()[this.document.resource.type];
        if (type.parentType) {
            this.groups[GROUP_NAME.PROPERTIES].label = type.parentType.label;
            this.groups[GROUP_NAME.CHILD_PROPERTIES].label = type.label;
        } else {
            this.groups[GROUP_NAME.PROPERTIES].label = type.label;
        }
    }


    private focusFirstInputElement() {

        const inputElements: Array<HTMLElement> = this.elementRef.nativeElement.getElementsByTagName('input');
        if (inputElements.length > 0) inputElements[0].focus();
    }
}