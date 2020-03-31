import {Component, EventEmitter, Input, OnChanges, Output} from '@angular/core';
import {DecimalPipe} from '@angular/common';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {is, isnt, isUndefinedOrEmpty, isDefined, on, isNot, isString, includedIn, undefinedOrEmpty, lookup,
    compose, isEmpty, isBoolean, copy, assoc} from 'tsfun';
import {Document, FieldDocument,  ReadDatastore, FieldResource, Resource, Dating, Dimension, Literature,
    ValOptionalEndVal} from 'idai-components-2';
import {RoutingService} from '../../routing-service';
import {GroupUtil} from '../../../core/configuration/group-util';
import {Name, ResourceId} from '../../../core/constants';
import {pick} from '../../../core/util/utils';
import {UtilTranslations} from '../../../core/util/util-translations';
import {HierarchicalRelations} from '../../../core/model/relation-constants';
import {ProjectConfiguration} from '../../../core/configuration/project-configuration';
import {Category} from '../../../core/configuration/model/category';
import {RelationDefinition} from '../../../core/configuration/model/relation-definition';
import {FieldDefinition} from '../../../core/configuration/model/field-definition';
import {ValuelistDefinition} from '../../../core/configuration/model/valuelist-definition';
import {ValuelistUtil} from '../../../core/util/valuelist-util';
import {Groups} from '../../../core/configuration/model/group';
import {Labelled, Named} from '../../../core/util/named';


const PERIOD = 'period';

interface FieldViewGroupDefinition extends Named, Labelled {

    shown: boolean;
}


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
    @Input() openSection: string|undefined = Groups.STEM;
    @Input() expandAllGroups: boolean = false;

    @Output() onSectionToggled = new EventEmitter<string|undefined>();
    @Output() onJumpToResource = new EventEmitter<FieldDocument>();

    public fields: { [groupName: string]: Array<any> } = {};
    public relations: { [groupName: string]: Array<any> } = {};


    public groups: Array<FieldViewGroupDefinition> = [];


    public isBoolean = (value: any) => isBoolean(value);


    constructor(private projectConfiguration: ProjectConfiguration,
                private datastore: ReadDatastore,
                private routingService: RoutingService,
                private decimalPipe: DecimalPipe,
                private utilTranslations: UtilTranslations,
                private i18n: I18n) {}


    async ngOnChanges() {

        this.fields = {};
        this.relations = {};
        this.relations[Groups.STEM] = [];
        this.relations[Groups.IDENTIFICATION] = [];
        this.relations[Groups.PROPERTIES] = [];
        this.relations[Groups.CHILD] = [];
        this.relations[Groups.DIMENSION] = [];
        this.relations[Groups.POSITION] = [];
        this.relations[Groups.TIME] = [];

        if (this.resource) {

            const groups = this.projectConfiguration.getCategoriesMap()[this.resource.category]
                .groups
                .map(group => assoc<any>('shown', group.name === 'stem')(group)) as Array<FieldViewGroupDefinition>;

            await this.processRelations(this.resource);
            this.addBaseFields(this.resource);
            this.processFields(this.resource);

            this.groups = groups.filter(group => {

                return (this.fields[group.name] !== undefined && this.fields[group.name].length > 0)
                    || (this.relations[group.name] !== undefined && this.relations[group.name].length > 0);
            });
        }
    }


    public showGroupSection(group: Name) {

        return this.expandAllGroups || this.openSection === group;
    }


    public toggleGroupSection(group: FieldViewGroupDefinition) {

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


    private processFields(resource: Resource) {

        const existingResourceFields = this.projectConfiguration
            .getFieldDefinitions(resource.category)
            .filter(on(Named.NAME, isnt(Resource.RELATIONS)))
            .filter(on(Named.NAME, compose(lookup(resource), isDefined)));

        for (let field of existingResourceFields) {

            const group = field.group;
            if (!this.fields[group]) this.fields[group] = [];
            this.pushField(resource, field, group);
        }
    }


    private pushField(resource: Resource, field: FieldDefinition, group: string) {

        if (field.name === PERIOD) {
            this.handlePeriodField(resource, group);
        } else if (!!this.projectConfiguration.isVisible(resource.category, field.name)) {
            this.handleDefaultField(resource, field, group);
        }
    }


    private handleDefaultField(resource: Resource, field: FieldDefinition, group: string) {

        this.fields[group].push({
            name: field.name,
            label: this.projectConfiguration.getFieldDefinitionLabel(resource.category, field.name),
            value: FieldsViewComponent.getValue(resource, field.name, field.valuelist),
            isArray: Array.isArray(resource[field.name])
        });
    }


    private handlePeriodField(resource: Resource, group: string) {

        this.fields[group].push({
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
            this.fields[group].push({
                label: this.i18n({
                    id: 'widgets.fieldsView.period.to',
                    value: 'Grobdatierung (bis)'
                }),
                value: resource[PERIOD][ValOptionalEndVal.ENDVALUE],
                isArray: false
            });
        }
    }


    private addBaseFields(resource: Resource) {

        this.fields[Groups.STEM] = [];

        const shortDescription =
            FieldsViewComponent.getValue(resource, FieldResource.SHORTDESCRIPTION);

        if (shortDescription) {
            this.fields[Groups.STEM].push({
                label: this.getLabel(resource.category, FieldResource.SHORTDESCRIPTION),
                value: shortDescription,
                isArray: false
            });
        }

        this.fields[Groups.STEM].push({
            label: this.getLabel(resource.category, Resource.CATEGORY),
            value: this.projectConfiguration.getLabelForCategory(resource.category),
            isArray: false
        });
    }


    private getLabel(category: Name, field: Name): string {

        return ((Category.getFields(pick(this.projectConfiguration.getCategoriesMap(), category) as any))
            .find(on(Named.NAME, is(field))) as FieldDefinition)
            .label as string;
    }


    private async processRelations(resource: Resource) {

        const relations: Array<RelationDefinition>|undefined
            = this.projectConfiguration.getRelationDefinitions(resource.category);
        if (isEmpty(relations)) return;

        for (let relation of FieldsViewComponent.computeRelationsToShow(resource, relations)) {
            const groupName = GroupUtil.getGroupName(relation.name);
            if (!groupName) continue;

            this.relations[groupName].push({
                label: relation.label,
                targets: await this.getTargetDocuments(resource.relations[relation.name])});
        }
    }


    private getTargetDocuments(targetIds: Array<ResourceId>): Promise<Array<Document>> {

        return this.datastore.getMultiple(targetIds); // what if error?
    }


    private static getValue(resource: Resource, field: Name, valuelist?: ValuelistDefinition): any {

        return valuelist
            ? ValuelistUtil.getValueLabel(valuelist, resource[field])
            : isString(resource[field])
                ? resource[field]
                    .replace(/^\s+|\s+$/g, '')
                    .replace(/\n/g, '<br>')
                : resource[field];
    }


    private static computeRelationsToShow(resource: Resource,
                                          relations: Array<RelationDefinition>): Array<RelationDefinition> {

        const isNotHierarchical = isNot(includedIn(HierarchicalRelations.ALL));
        const hasTargets = compose(lookup(resource.relations), isNot(undefinedOrEmpty));

        return relations
            .filter(on(Named.NAME, isNotHierarchical))
            .filter(on(Named.NAME, hasTargets));
    }
}
