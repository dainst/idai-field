import {Component, EventEmitter, Input, OnChanges, Output} from '@angular/core';
import {DecimalPipe} from '@angular/common';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {is, isnt, isUndefinedOrEmpty, isDefined, on, isNot, isString,
    includedIn, undefinedOrEmpty, lookup, compose, isEmpty, isBoolean} from 'tsfun';
import {Document, FieldDocument,  ReadDatastore, FieldResource,
    Resource, Dating, Dimension} from 'idai-components-2';
import {RoutingService} from '../../routing-service';
import {Group, GroupUtil} from '../../../core/model/group-util';
import {Name, ResourceId} from '../../../core/constants';
import {GROUP_NAME} from '../../constants';
import {pick} from '../../../core/util/utils';
import {UtilTranslations} from '../../../core/util/util-translations';
import {HierarchicalRelations} from '../../../core/model/relation-constants';
import {ProjectConfiguration} from '../../../core/configuration/project-configuration';
import {IdaiType} from '../../../core/configuration/model/idai-type';
import {RelationDefinition} from '../../../core/configuration/model/relation-definition';
import {FieldDefinition} from '../../../core/configuration/model/field-definition';
import {CatalogCriteria} from '../../docedit/core/forms/type-relation/catalog-criteria';
import {BuiltInTypes} from '../../../core/configuration/app-configurator';


const PERIOD = 'period';
const PERIODEND = 'periodEnd';

type FieldViewGroupDefinition = {

    name: string;
    label: string;
    shown: boolean;
}

export module FieldViewGroupDefinition {

    export const NAME = 'name';
    export const LABEL = 'label';
    export const SHOWN = 'shown';
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
    @Input() openSection: string|undefined = Group.STEM;
    @Input() expandAllGroups: boolean = false;

    @Output() onSectionToggled = new EventEmitter<string|undefined>();
    @Output() onJumpToResource = new EventEmitter<FieldDocument>();

    public fields: { [groupName: string]: Array<any> };
    public relations: { [groupName: string]: Array<any> } = {};


    private groups: Array<FieldViewGroupDefinition> = [
        { name: Group.STEM, label: this.i18n({ id: 'docedit.group.stem', value: 'Stammdaten' }), shown: true },
        { name: Group.IDENTIFICATION, label: this.i18n({ id: 'docedit.group.identification', value: 'Bestimmung' }), shown: false },
        { name: Group.PROPERTIES, label: '', shown: false },
        { name: Group.CHILD, label: '', shown: false },
        { name: Group.DIMENSION, label: this.i18n({ id: 'docedit.group.dimensions', value: 'Maße' }), shown: false },
        { name: Group.POSITION, label: this.i18n({ id: 'docedit.group.position', value: 'Lage' }), shown: false },
        { name: Group.TIME, label: this.i18n({ id: 'docedit.group.time', value: 'Zeit' }), shown: false }
    ];


    public isBoolean = (value: any) => isBoolean(value);


    constructor(private projectConfiguration: ProjectConfiguration,
                private datastore: ReadDatastore,
                private routingService: RoutingService,
                private decimalPipe: DecimalPipe,
                private utilTranslations: UtilTranslations,
                private i18n: I18n,
                private catalogCriteria: CatalogCriteria) {}


    async ngOnChanges() {

        this.fields = {};
        this.relations = {};
        this.relations[Group.STEM] = [];
        this.relations[Group.IDENTIFICATION] = [];
        this.relations[Group.PROPERTIES] = [];
        this.relations[Group.CHILD] = [];
        this.relations[Group.DIMENSION] = [];
        this.relations[Group.POSITION] = [];
        this.relations[Group.TIME] = [];

        if (this.resource) {
            await this.processRelations(this.resource);
            this.processFields(this.resource);
            this.updateGroupLabels(this.resource.type);
        }
    }


    public showGroupSection(group: Name) {

        return this.expandAllGroups || this.openSection === group;
    }


    public getGroups(): Array<FieldViewGroupDefinition> {

        return this.groups.filter(group => {

            return (this.fields[group.name] !== undefined && this.fields[group.name].length > 0)
                || this.relations[group.name].length > 0;
        });
    }


    public toggleGroupSection(group: FieldViewGroupDefinition) {

        this.openSection = (this.openSection === group.name && !this.expandAllGroups)
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
        } else {
            return arrayItem;
        }
    }


    private updateGroupLabels(typeName: Name) {

        const type: IdaiType = this.projectConfiguration.getTypesMap()[typeName];
        if (type.parentType) {
            this.groups[GROUP_NAME.PROPERTIES].label = type.parentType.label;
            this.groups[GROUP_NAME.CHILD_PROPERTIES].label = type.label;
        } else {
            this.groups[GROUP_NAME.PROPERTIES].label = type.label;
        }
    }


    private processFields(resource: Resource) {

        this.addBaseFields(resource);

        const existingResourceFields = this.projectConfiguration
            .getFieldDefinitions(resource.type)
            .filter(on(FieldViewGroupDefinition.NAME, isnt(Resource.RELATIONS)))
            .filter(on(FieldViewGroupDefinition.NAME, compose(lookup(resource), isDefined)));

        for (let field of existingResourceFields) {

            const group = field.group ? field.group : Group.PROPERTIES;
            if (!this.fields[group]) this.fields[group] = [];
            this.pushField(resource, field, group);
        }

        if (this.fields[Group.STEM]) GroupUtil.sortGroups(this.fields[Group.STEM], Group.STEM);
        if (this.fields[Group.DIMENSION]) GroupUtil.sortGroups(this.fields[Group.DIMENSION], Group.DIMENSION);
    }


    private pushField(resource: Resource, field: FieldDefinition, group: string) {

        if (field.name === PERIOD) {

            this.handlePeriodField(resource, field, group);

        } else if (resource.type === BuiltInTypes.TYPECATALOG
            && field.name === BuiltInTypes.TypeCatalog.CRITERION) {

            this.handleTypeCatalogCriterionField(resource, field);

        } else if (!!this.projectConfiguration.isVisible(resource.type, field.name)) {

            this.handleDefaultField(resource, field, group);
        }
    }


    private handleDefaultField(resource: Resource, field: FieldDefinition, group: string) {

        this.fields[group].push({
            name: field.name,
            label: this.projectConfiguration.getFieldDefinitionLabel(resource.type, field.name),
            value: FieldsViewComponent.getValue(resource, field.name),
            isArray: Array.isArray(resource[field.name])
        });
    }


    private handleTypeCatalogCriterionField(resource: Resource, field: FieldDefinition) {

        this.fields[Group.IDENTIFICATION].push({
            label: field.label,
            value: this.catalogCriteria.translateCriterion(resource[field.name]),
            isArray: false
        });
    }


    private handlePeriodField(resource: Resource, field: FieldDefinition, group: string) {

        this.fields[group].push({
            label: this.i18n({
                id: 'widgets.fieldsView.period',
                value: 'Grobdatierung'
            }) + (!isUndefinedOrEmpty(resource[PERIODEND])
                ? this.i18n({
                    id: 'widgets.fieldsView.period.from',
                    value: ' (von)'
                }) : ''),
            value: FieldsViewComponent.getValue(resource, field.name),
            isArray: false
        });

        if (!isUndefinedOrEmpty(resource[PERIODEND])) {
            this.fields[group].push({
                label: this.i18n({
                    id: 'widgets.fieldsView.period.to',
                    value: 'Grobdatierung (bis)'
                }),
                value: FieldsViewComponent.getValue(resource, PERIODEND),
                isArray: false
            });
        }
    }


    private addBaseFields(resource: Resource) {

        this.fields[Group.STEM] = [];

        const shortDescription =
            FieldsViewComponent.getValue(resource, FieldResource.SHORTDESCRIPTION);

        if (shortDescription) {
            this.fields[Group.STEM].push({
                label: this.getLabel(resource.type, FieldResource.SHORTDESCRIPTION),
                value: shortDescription,
                isArray: false
            });
        }

        this.fields[Group.STEM].push({
            label: this.getLabel(resource.type, Resource.TYPE),
            value: this.projectConfiguration.getLabelForType(resource.type),
            isArray: false
        });
    }


    private getLabel(type: Name, field: Name): string {

        return (pick(this.projectConfiguration.getTypesMap(), type).fields
            .find(on(FieldViewGroupDefinition.NAME, is(field))) as FieldDefinition)
            .label as string;
    }


    private async processRelations(resource: Resource) {

        const relations: Array<RelationDefinition>|undefined
            = this.projectConfiguration.getRelationDefinitions(resource.type);
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


    private static getValue(resource: Resource, field: Name): any {

        return isString(resource[field])
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
            .filter(on(FieldViewGroupDefinition.NAME, isNotHierarchical))
            .filter(on(FieldViewGroupDefinition.NAME, hasTargets));
    }
}
