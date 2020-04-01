import {Component, EventEmitter, Input, OnChanges, Output} from '@angular/core';
import {DecimalPipe} from '@angular/common';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {is, isnt, isUndefinedOrEmpty, isDefined, on, lookup, isNot, includedIn, to,
    compose, isEmpty, isBoolean} from 'tsfun';
import {Document, FieldDocument,  ReadDatastore, FieldResource, Resource, Dating, Dimension, Literature,
    ValOptionalEndVal} from 'idai-components-2';
import {RoutingService} from '../../routing-service';
import {Name, ResourceId} from '../../../core/constants';
import {pick} from '../../../core/util/utils';
import {UtilTranslations} from '../../../core/util/util-translations';
import {ProjectConfiguration} from '../../../core/configuration/project-configuration';
import {Category} from '../../../core/configuration/model/category';
import {RelationDefinition} from '../../../core/configuration/model/relation-definition';
import {FieldDefinition} from '../../../core/configuration/model/field-definition';
import {Groups} from '../../../core/configuration/model/group';
import {Named} from '../../../core/util/named';
import {FieldsViewGroup, FieldsViewUtil} from '../../../core/util/fields-view-util';


const PERIOD = 'period';


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

        if (this.resource) {

            let groups = FieldsViewUtil
                .getGroups(this.resource.category, this.projectConfiguration.getCategoriesMap());
            await this.processRelations(groups, this.resource);
            this.addBaseFields(groups, this.resource);
            this.processFields(groups, this.resource);
            this.groups = groups.filter(group => group._fields.length > 0 || group._relations.length > 0);
        }
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


    /**
     * @param groups !modified in place
     * @param resource
     */
    private processFields(groups: Array<FieldsViewGroup>, resource: Resource) {

        const existingResourceFields = this.getResourceFieldsToShowInGroupsOtherThanStem(resource);

        for (let group of groups) {
            for (let field of existingResourceFields) {
                if (isNot(includedIn(group.fields.map(to(Named.NAME))))(field.name)) continue;

                if (field.name === PERIOD) {
                    this.handlePeriodField(resource, group);
                } else if (!!this.projectConfiguration.isVisible(resource.category, field.name)) {
                    this.handleDefaultField(resource, field, group);
                }
            }
        }
    }


    private getResourceFieldsToShowInGroupsOtherThanStem(resource: Resource): Array<FieldDefinition> {

        return this.projectConfiguration
            .getFieldDefinitions(resource.category)
            .filter(on(Named.NAME, isNot(includedIn(
                [
                    Resource.ID,
                    Resource.CATEGORY,
                    Resource.RELATIONS,
                    FieldResource.SHORTDESCRIPTION,
                    FieldResource.IDENTIFIER,
                ]
            ))))
            .filter(on(Named.NAME, isnt('geometry'))) // TODO review
            .filter(on(Named.NAME, compose(lookup(resource), isDefined)));
    }


    private handleDefaultField(resource: Resource, field: FieldDefinition, group: FieldsViewGroup) {

        group._fields.push({
            name: field.name,
            label: this.projectConfiguration.getFieldDefinitionLabel(resource.category, field.name),
            value: FieldsViewUtil.getValue(resource, field.name, field.valuelist),
            isArray: Array.isArray(resource[field.name])
        } as any /* TODO review; see name property */);
    }


    private handlePeriodField(resource: Resource, group: FieldsViewGroup) {

        group._fields.push({
            label: this.i18n({
                id: 'widgets.fieldsView.period',
                value: 'Grobdatierung'
            }) + (!isUndefinedOrEmpty(resource[PERIOD][ValOptionalEndVal.ENDVALUE])
                ? this.i18n({
                    id: 'widgets.fieldsView.period.from',
                    value: ' (von)'
                }) : ''),
            value: resource[PERIOD][ValOptionalEndVal.VALUE],
            isArray: false
        });

        if (!isUndefinedOrEmpty(resource[PERIOD][ValOptionalEndVal.ENDVALUE])) {
            group._fields.push({
                label: this.i18n({
                    id: 'widgets.fieldsView.period.to',
                    value: 'Grobdatierung (bis)'
                }),
                value: resource[PERIOD][ValOptionalEndVal.ENDVALUE],
                isArray: false
            });
        }
    }


    /**
     * @param groups ! modified in place
     * @param resource
     */
    private addBaseFields(groups: Array<FieldsViewGroup>, resource: Resource) {

        const group = groups.find(on(Named.NAME, is(Groups.STEM)))!;

        group._fields.push({
            label: this.getLabel(resource.category, Resource.CATEGORY),
            value: this.projectConfiguration.getLabelForCategory(resource.category),
            isArray: false
        });
        const shortDescription =
            FieldsViewUtil.getValue(resource, FieldResource.SHORTDESCRIPTION);
        if (shortDescription) {
            group._fields.push({
                label: this.getLabel(resource.category, FieldResource.SHORTDESCRIPTION),
                value: shortDescription, // TODO convert value to name
                isArray: false
            });
        }
    }


    /**
     * @param groups ! modified in place !
     * @param resource
     */
    private async processRelations(groups: Array<FieldsViewGroup>, resource: Resource) {

        const relations: Array<RelationDefinition> | undefined
            = this.projectConfiguration.getRelationDefinitions(resource.category);
        if (isEmpty(relations)) return;

        for (let group of groups) {
            for (let relation of FieldsViewUtil.computeRelationsToShow(resource, group.relations)) {
                group._relations.push({
                    label: relation.label!, // TODO remove !
                    targets: await this.getTargetDocuments(resource.relations[relation.name])
                });
            }
        }
    }


    private getLabel(category: Name, field: Name): string {

        return ((Category.getFields(pick(this.projectConfiguration.getCategoriesMap(), category) as any))
            .find(on(Named.NAME, is(field))) as FieldDefinition)
            .label as string;
    }


    private getTargetDocuments(targetIds: Array<ResourceId>): Promise<Array<Document>> {

        return this.datastore.getMultiple(targetIds); // what if error?
    }
}
