import {AfterViewInit, Component, ElementRef, Input, OnChanges, ViewChild} from '@angular/core';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {is, isNot, to, on, undefinedOrEmpty} from 'tsfun';
import {Document} from 'idai-components-2';
import {ProjectCategories} from '../../../core/configuration/project-categories';
import {GroupUtil} from '../../../core/configuration/group-util';
import {GROUP_NAME} from '../../constants';
import {FieldDefinition} from '../../../core/configuration/model/field-definition';
import {RelationDefinition} from '../../../core/configuration/model/relation-definition';
import {ProjectConfiguration} from '../../../core/configuration/project-configuration';
import {Category} from '../../../core/configuration/model/category';
import {TypeRelations} from '../../../core/model/relation-constants';
import {EditFormGroup, Group} from '../../../core/configuration/model/group';


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
    @Input() originalGroups: Array<Group>;
    @Input() relationDefinitions: Array<RelationDefinition>;
    @Input() inspectedRevisions: Document[];
    @Input() activeGroup: string;


    public categories: string[];

    public groups: Array<EditFormGroup> = [
        { name: 'stem', label: this.i18n({ id: 'docedit.group.stem', value: 'Stammdaten' }), fields: [],
            relations: [], widget: 'generic' },
        { name: 'identification', label: this.i18n({ id: 'docedit.group.identification', value: 'Bestimmung' }),
            fields: [], relations: [], widget: 'generic' },
        { name: 'parent', label: '', fields: [], relations: [], widget: 'generic' },
        { name: 'child', label: '', fields: [], relations: [], widget: 'generic' },
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
                private projectCategories: ProjectCategories) {}


    public activateGroup = (name: string) => this.activeGroup = name;


    public shouldShow(groupName: string) {

        return (groupName === 'images'
                && !this.projectCategories.getImageCategoryNames().includes(this.document.resource.category))
            || (groupName === 'conflicts' && this.document._conflicts)
            || this.getFieldDefinitions(groupName).filter(field => field.editable).length > 0
            || this.getRelationDefinitions(groupName).length > 0;
    }


    public getFieldDefinitions(groupName: string): Array<FieldDefinition> {

        return (this.groups.find((gd: EditFormGroup) => gd.name === groupName) as any).fields;
    }


    public getRelationDefinitions(groupName: string): Array<RelationDefinition> {

        return (this.groups.find((gd: EditFormGroup) => gd.name === groupName) as any).relations;
    }


    ngAfterViewInit() {

        this.focusFirstInputElement();
    }


    ngOnChanges() {

        this.setLabels();
        if (isNot(undefinedOrEmpty)(this.originalGroups)) this.setFields();
        if (isNot(undefinedOrEmpty)(this.relationDefinitions)) this.setRelations();
    }


    private setRelations() {

        this.groups.forEach(group => group.relations = []);

        for (let relation of this.relationDefinitions) {
            const groupName: string|undefined = GroupUtil.getGroupName(relation.name);
            if (!groupName || relation.name === TypeRelations.INSTANCEOF) continue;

            const group = this.groups.find(group => group.name === groupName) as EditFormGroup;
            group.relations.push(relation);
        }
    }


    private setFields() {

        for (let originalGroup of this.originalGroups) {
            const group = this.groups.find(on(Group.NAME)(originalGroup))!;
            group.fields = originalGroup.fields;
        }

        if (this.projectCategories.isGeometryCategory(this.document.resource.category)) {
            this.groups[GROUP_NAME.POSITION].fields.push({
                name: 'geometry',
                label: this.i18n({ id: 'docedit.geometry', value: 'Geometrie' }),
                group: 'position',
                inputType: 'geometry',
                editable: true
            });
        }

        // this.groups[GROUP_NAME.TIME].fields = this.fieldDefinitions.filter(on('group', is('time')));
    }


    private setLabels() {

        const category: Category
            = this.projectConfiguration.getCategoriesMap()[this.document.resource.category];

        if (category.parentCategory) {
            this.groups[GROUP_NAME.PROPERTIES].label = category.parentCategory.label;
            this.groups[GROUP_NAME.CHILD_PROPERTIES].label = category.label;
        } else {
            this.groups[GROUP_NAME.PROPERTIES].label = category.label;
        }
    }


    private focusFirstInputElement() {

        const inputElements: Array<HTMLElement> = this.elementRef.nativeElement.getElementsByTagName('input');
        if (inputElements.length > 0) inputElements[0].focus();
    }
}