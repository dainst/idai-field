import {Component, EventEmitter, Input, OnChanges, Output} from '@angular/core';
import {DecimalPipe} from '@angular/common';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {isUndefinedOrEmpty, isBoolean, isArray, filter, or, on, isNot, empty} from 'tsfun';
import {flow as asyncFlow} from 'tsfun/async';
import {Document, FieldDocument,  ReadDatastore, FieldResource, Resource,
    Dating, Dimension, Literature, ValOptionalEndVal} from 'idai-components-2';
import {RoutingService} from '../../routing-service';
import {Name, ResourceId} from '../../../core/constants';
import {UtilTranslations} from '../../../core/util/util-translations';
import {ProjectConfiguration} from '../../../core/configuration/project-configuration';
import {FieldDefinition} from '../../../core/configuration/model/field-definition';
import {Groups} from '../../../core/configuration/model/group';
import {FieldsViewGroup, FieldsViewUtil} from '../../../core/util/fields-view-util';


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
                    on(FieldsViewGroup._FIELDS, isNot(empty)),
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


    private putActualResourceFieldsIntoGroups(resource: Resource) {

        return (groups: Array<FieldsViewGroup> /* ! modified in place !*/): Array<FieldsViewGroup> => {

            for (let group of groups) {
                for (let field of group.fields) {

                    const fieldContent = resource[field.name];
                    if (fieldContent) group._fields =
                        group._fields.concat(this.makeField(fieldContent, field, resource.category));
                }
            }
            return groups;
        }
    }


    /**
     * @param fieldContent
     * @param field
     * @param category
     */
    private makeField(fieldContent: any,
                      field: FieldDefinition,
                      category: string): Array<any> {

        if (field.inputType === FieldDefinition.InputType.DROPDOWNRANGE) {

            return this.addValOptionalEndValFieldToGroup(fieldContent, field);

        } else if (this.projectConfiguration.isVisible(category, field.name)
            || field.name === Resource.CATEGORY
            || field.name === FieldResource.SHORTDESCRIPTION) {

            return [this.makeDefaultField(fieldContent, field, category)];

        } else return [];
    }


    /**
     * @param fieldContent
     * @param field
     * @param category
     */
    private makeDefaultField(fieldContent: any,
                             field: FieldDefinition,
                             category: string) {

        return {
            label: this.projectConfiguration.getFieldDefinitionLabel(category, field.name),
            value: isArray(fieldContent)
                ? fieldContent.map((fieldContent: any) =>
                    FieldsViewUtil.getValue(fieldContent, field.valuelist))
                : FieldsViewUtil.getValue(fieldContent, field.valuelist),
            isArray: isArray(fieldContent)
        };
    }


    /**
     * @param fieldContent
     * @param field
     */
    private addValOptionalEndValFieldToGroup(fieldContent: any,
                                             field: FieldDefinition) {

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

        return async (groups: Array<FieldsViewGroup> /* ! modified in place ! */)
            : Promise<Array<FieldsViewGroup>> => {

            for (let group of groups) {
                for (let relation of FieldsViewUtil.computeRelationsToShow(resource)(group.relations)) {
                    group._relations.push({
                        label: relation.label,
                        targets: await this.getTargetDocuments(resource.relations[relation.name])
                    });
                }
            }
            return groups;
        }
    }


    private getTargetDocuments(targetIds: Array<ResourceId>): Promise<Array<Document>> {

        return this.datastore.getMultiple(targetIds);
    }
}
