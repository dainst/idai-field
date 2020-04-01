import {Component, EventEmitter, Input, OnChanges, Output} from '@angular/core';
import {DecimalPipe} from '@angular/common';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {isUndefinedOrEmpty, isBoolean, isArray, filter, or, val, update, compose, Mapping, on, is, isDefined,
    isNot, empty, map, flatten, lookup, to, pairWith, conds, singleton, otherwise} from 'tsfun';
import {flow as asyncFlow, map as asyncMap} from 'tsfun/async';
import {FieldDocument,  ReadDatastore, FieldResource, Resource,
    Dating, Dimension, Literature, ValOptionalEndVal} from 'idai-components-2';
import {RoutingService} from '../../routing-service';
import {Name} from '../../../core/constants';
import {UtilTranslations} from '../../../core/util/util-translations';
import {ProjectConfiguration} from '../../../core/configuration/project-configuration';
import {FieldDefinition} from '../../../core/configuration/model/field-definition';
import {Group, Groups} from '../../../core/configuration/model/group';
import {FieldsViewField, FieldsViewGroup, FieldsViewUtil} from '../../../core/util/fields-view-util';
import {RelationDefinition} from '../../../core/configuration/model/relation-definition';
import {Named} from '../../../core/util/named';


@Component({
    selector: 'fields-view',
    moduleId: module.id,
    templateUrl: './fields-view.html'
})
/**
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 */
export class FieldsViewComponent implements OnChanges {

    @Input() resource: Resource;
    @Input() openSection: string | undefined = Groups.STEM;
    @Input() expandAllGroups: boolean = false;

    @Output() onSectionToggled = new EventEmitter<string | undefined>();
    @Output() onJumpToResource = new EventEmitter<FieldDocument>();

    public groups: Array<FieldsViewGroup> = [];


    public isBoolean = (value: any) => isBoolean(value);


    constructor(private projectConfiguration: ProjectConfiguration,
                private datastore: ReadDatastore,
                private routingService: RoutingService,
                private decimalPipe: DecimalPipe,
                private utilTranslations: UtilTranslations,
                private i18n: I18n) {
    }


    async ngOnChanges() {

        if (!this.resource) return;

        this.groups = await asyncFlow(
            FieldsViewUtil.getGroups(this.resource.category, this.projectConfiguration.getCategoriesMap()),
            await this.putActualResourceRelationsIntoGroups(this.resource),
            this.putActualResourceFieldsIntoGroups(this.resource),
            filter(or(
                    on(FieldsViewGroup.FIELDS, isNot(empty)),
                    on(FieldsViewGroup._RELATIONS, isNot(empty)))));
    }


    public showGroupSection(group: Name) {

        return this.expandAllGroups || this.openSection === group;
    }


    public toggleGroupSection(group: FieldsViewGroup) {

        this.openSection = this.openSection === group.name && !this.expandAllGroups
            ? undefined
            : group.name;

        this.onSectionToggled.emit(this.openSection);
    }


    public async jumpToResource(document: FieldDocument) {

        this.onJumpToResource.emit(document);
    }


    public getArrayItemLabel(arrayItem: any): string {

        if (arrayItem.begin || arrayItem.end) {
            return Dating.generateLabel(arrayItem, (key: string) => this.utilTranslations.getTranslation(key));
        } else if (arrayItem.inputUnit) {
            return Dimension.generateLabel(
                arrayItem,
                (value: any) => this.decimalPipe.transform(value),
                (key: string) => this.utilTranslations.getTranslation(key));
        } else if (arrayItem.quotation) {
            return Literature.generateLabel(
                arrayItem, (key: string) => this.utilTranslations.getTranslation(key)
            );
        } else {
            return arrayItem;
        }
    }


    private putActualResourceFieldsIntoGroups(resource: Resource): Mapping {

        return map(
                update(Group.FIELDS,
                    compose(
                        map(pairWith(compose(to(Named.NAME), lookup(resource)))),
                        filter(on([1], isDefined)),
                        map(this.convertToFieldsViewField.bind(this)),
                        flatten)));
    }


    private convertToFieldsViewField = conds(
            [
                on([0, FieldDefinition.INPUTTYPE], is(FieldDefinition.InputType.DROPDOWNRANGE)),
                this.makeValOptionalEndValField.bind(this)
            ],
            [
                or(
                    on([0, FieldDefinition.VISIBLE], is(true)),
                    on([0, Named.NAME], is(Resource.CATEGORY)),
                    on([0, Named.NAME], is(FieldResource.SHORTDESCRIPTION))),
                compose(this.makeDefaultField.bind(this), singleton)
            ],
            [otherwise, []]
        );


    private makeDefaultField([field, fieldContent]: [FieldDefinition, any]): FieldsViewField {

        return {
            label: field.label,
            value: isArray(fieldContent)
                ? fieldContent.map((fieldContent: any) =>
                    FieldsViewUtil.getValue(fieldContent, field.valuelist))
                : FieldsViewUtil.getValue(fieldContent, field.valuelist),
            isArray: isArray(fieldContent)
        };
    }


    private makeValOptionalEndValField([field, fieldContent]: [FieldDefinition, any]): Array<FieldsViewField> {

        const val = {
            label: field.label + (!isUndefinedOrEmpty(fieldContent[ValOptionalEndVal.ENDVALUE])
                ? ' ' + this.i18n({
                    id: 'widgets.fieldsView.range.from',
                    value: '(von)'
                }) : ''),
            value: fieldContent[ValOptionalEndVal.VALUE],
            isArray: false
        };

        if (isUndefinedOrEmpty(fieldContent[ValOptionalEndVal.ENDVALUE])) return [val];
        else return [
                val,
                {
                    label: field.label + ' ' + this.i18n({
                        id: 'widgets.fieldsView.range.to',
                        value: field.label + '(bis)'
                    }),
                    value: fieldContent[ValOptionalEndVal.ENDVALUE],
                    isArray: false
                }];
    }


    private async putActualResourceRelationsIntoGroups(resource: Resource) {

        return asyncMap(async (group: any /* ! modified in place ! */) => {

            group.relations = await asyncFlow(
                group.relations,
                FieldsViewUtil.computeRelationsToShow(resource),
                asyncMap(async (relation: RelationDefinition) => {
                    return {
                        label: relation.label,
                        targets: await this.datastore.getMultiple(resource.relations[relation.name])
                    }
                }));
            return group;
        });
    }
}
