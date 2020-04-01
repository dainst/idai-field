import {Component, EventEmitter, Input, OnChanges, Output} from '@angular/core';
import {DecimalPipe} from '@angular/common';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {is, isUndefinedOrEmpty, isDefined, on, lookup, isNot, includedIn, to,
    compose, isEmpty, isBoolean, isArray} from 'tsfun';
import {Document, FieldDocument,  ReadDatastore, FieldResource, Resource, Dating, Dimension, Literature,
    ValOptionalEndVal, FeatureResource} from 'idai-components-2';
import {RoutingService} from '../../routing-service';
import {Name, ResourceId} from '../../../core/constants';
import {UtilTranslations} from '../../../core/util/util-translations';
import {ProjectConfiguration} from '../../../core/configuration/project-configuration';
import {RelationDefinition} from '../../../core/configuration/model/relation-definition';
import {FieldDefinition} from '../../../core/configuration/model/field-definition';
import {Groups} from '../../../core/configuration/model/group';
import {Named} from '../../../core/util/named';
import {FieldsViewGroup, FieldsViewUtil} from '../../../core/util/fields-view-util';


const fieldsToExclude = [Resource.ID, Resource.RELATIONS, FieldResource.IDENTIFIER];


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

        for (let group of groups) {
            for (let field of this.getResourceFieldsToShowInGroupsOtherThanStem(resource)) { // TODO why not iterate over group.fields instead
                if (isNot(includedIn(group.fields.map(to(Named.NAME))))(field.name)) continue;

                if (field.name === FeatureResource.PERIOD) {

                    this.handlePeriodField(resource, group);

                } else if (this.projectConfiguration.isVisible(resource.category, field.name)
                    || field.name === Resource.CATEGORY
                    || field.name === FieldResource.SHORTDESCRIPTION) {

                    this.handleDefaultField(resource, field, group);
                }
            }
        }
    }


    private getResourceFieldsToShowInGroupsOtherThanStem(resource: Resource): Array<FieldDefinition> {

        return this.projectConfiguration
            .getFieldDefinitions(resource.category)
            .filter(on(Named.NAME, isNot(includedIn(fieldsToExclude))))
            .filter(on(Named.NAME, compose(lookup(resource), isDefined)));
    }


    private handleDefaultField(resource: Resource, field: FieldDefinition, group: FieldsViewGroup) {

        group._fields.push({
            label: this.projectConfiguration.getFieldDefinitionLabel(resource.category, field.name),
            value: isArray(resource[field.name])
                ? resource[field.name].map((fieldContent: any) =>
                    FieldsViewUtil.getValue(fieldContent, field.valuelist))
                : FieldsViewUtil.getValue(resource[field.name], field.valuelist),
            isArray: isArray(resource[field.name])
        });
    }


    private handlePeriodField(resource: Resource, group: FieldsViewGroup) {

        group._fields.push({
            label: this.i18n({
                id: 'widgets.fieldsView.period',
                value: 'Grobdatierung'
            }) + (!isUndefinedOrEmpty(resource[FeatureResource.PERIOD][ValOptionalEndVal.ENDVALUE])
                ? this.i18n({
                    id: 'widgets.fieldsView.period.from',
                    value: ' (von)'
                }) : ''),
            value: resource[FeatureResource.PERIOD][ValOptionalEndVal.VALUE],
            isArray: false
        });

        if (!isUndefinedOrEmpty(resource[FeatureResource.PERIOD][ValOptionalEndVal.ENDVALUE])) {
            group._fields.push({
                label: this.i18n({
                    id: 'widgets.fieldsView.period.to',
                    value: 'Grobdatierung (bis)'
                }),
                value: resource[FeatureResource.PERIOD][ValOptionalEndVal.ENDVALUE],
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
                    label: relation.label,
                    targets: await this.getTargetDocuments(resource.relations[relation.name])
                });
            }
        }
    }


    private getTargetDocuments(targetIds: Array<ResourceId>): Promise<Array<Document>> {

        return this.datastore.getMultiple(targetIds); // what if error?
    }
}
