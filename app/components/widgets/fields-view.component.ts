import {Component, EventEmitter, Input, OnChanges, Output} from '@angular/core';
import {DecimalPipe} from '@angular/common';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {is, isnt, isUndefinedOrEmpty, isDefined, on, isNot, includedIn, undefinedOrEmpty, lookup, compose} from 'tsfun';
import {Document, FieldDocument,  ReadDatastore, Resource, Dating, Dimension} from 'idai-components-2';
import {RoutingService} from '../routing-service';
import {GroupUtil} from '../../core/model/group-util';
import {Name, ResourceId} from '../../core/constants';
import {GROUP_NAME} from '../constants';
import {isBoolean} from '../../core/util/utils';
import {UtilTranslations} from '../../core/util/util-translations';
import {HIERARCHICAL_RELATIONS} from '../../core/model/relation-constants';
import {ProjectConfiguration} from '../../core/configuration/project-configuration';
import {IdaiType} from '../../core/configuration/model/idai-type';
import {RelationDefinition} from '../../core/configuration/model/relation-definition';


type FieldViewGroupDefinition = {
    name: string;
    label: string;
    shown: boolean;
}

const NAME = 'name';


@Component({
    selector: 'fields-view',
    moduleId: module.id,
    templateUrl: './fields-view.html'
})
/**
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 */
export class FieldsViewComponent implements OnChanges {

    @Input() resource: Resource;
    @Input() openSection: string|undefined = 'stem';
    @Input() expandAllGroups: boolean = false;

    @Output() onSectionToggled = new EventEmitter<string|undefined>();
    @Output() onJumpToResource = new EventEmitter<FieldDocument>();

    public fields: { [groupName: string]: Array<any> };
    public relations: { [groupName: string]: Array<any> } = {};


    private groups: Array<FieldViewGroupDefinition> = [
        { name: 'stem', label: this.i18n({ id: 'docedit.group.stem', value: 'Stammdaten' }), shown: true },
        { name: 'identification', label: this.i18n({ id: 'docedit.group.identification', value: 'Bestimmung' }), shown: false },
        { name: 'properties', label: '', shown: false },
        { name: 'child', label: '', shown: false },
        { name: 'dimension', label: this.i18n({ id: 'docedit.group.dimensions', value: 'Maße' }), shown: false },
        { name: 'position', label: this.i18n({ id: 'docedit.group.position', value: 'Lage' }), shown: false },
        { name: 'time', label: this.i18n({ id: 'docedit.group.time', value: 'Zeit' }), shown: false }
    ];


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
        this.relations['stem'] = [];
        this.relations['identification'] = [];
        this.relations['properties'] = [];
        this.relations['child'] = [];
        this.relations['dimension'] = [];
        this.relations['position'] = [];
        this.relations['time'] = [];

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

            return ((this.fields[group.name] !== undefined && this.fields[group.name].length > 0)
                || this.relations[group.name].length > 0);
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

        const existsInResource = compose(lookup(resource), isDefined);

        const fields = this.projectConfiguration
            .getFieldDefinitions(resource.type)
            .filter(on(NAME, isnt('relations')))
            .filter(on(NAME, existsInResource));

        for (let field of fields) {

            const group: string = field.group ? field.group : 'properties';

            if (!this.fields[group]) this.fields[group] = [];

            if (field.name === 'period') {
                this.fields[group].push({
                    label: this.i18n({
                        id: 'widgets.fieldsView.period',
                        value: 'Grobdatierung'
                    }) + (!isUndefinedOrEmpty(resource['periodEnd'])
                        ? this.i18n({
                            id: 'widgets.fieldsView.period.from',
                            value: ' (von)'
                        }) : ''),
                    value: FieldsViewComponent.getValue(resource, field.name),
                    isArray: false
                });

                if (!isUndefinedOrEmpty(resource['periodEnd'])) {
                    this.fields[group].push({
                        label: this.i18n({
                            id: 'widgets.fieldsView.period.to',
                            value: 'Grobdatierung (bis)'
                        }),
                        value: FieldsViewComponent.getValue(resource, 'periodEnd'),
                        isArray: false
                    });
                }
                continue;
            }

            if (!this.projectConfiguration.isVisible(resource.type, field.name)) continue;

            this.fields[group].push({
                name: field.name,
                label: this.projectConfiguration.getFieldDefinitionLabel(resource.type, field.name),
                value: FieldsViewComponent.getValue(resource, field.name),
                isArray: Array.isArray(resource[field.name])
            });
        }

        if (this.fields['stem']) GroupUtil.sortGroups(this.fields['stem'], 'stem');
        if (this.fields['dimension']) GroupUtil.sortGroups(this.fields['dimension'], 'dimension');
    }


    private addBaseFields(resource: Resource) {

        this.fields['stem'] = [];

        const shortDescription: string = FieldsViewComponent.getValue(resource, 'shortDescription');
        if (shortDescription) {
            this.fields['stem'].push({
                label: this.getLabel(resource.type, 'shortDescription'),
                value: shortDescription,
                isArray: false
            });
        }

        this.fields['stem'].push({
            label: this.getLabel(resource.type, 'type'),
            value: this.projectConfiguration.getLabelForType(resource.type),
            isArray: false
        });
    }


    private getLabel(type: Name, field: Name): string {

        return this.projectConfiguration
            .getTypesMap()[type].fields
            .find(on(NAME, is(field))).label;
    }


    private static getValue(resource: Resource, field: Name): any {

        return typeof resource[field] === 'string'
            ? resource[field]
                .replace(/^\s+|\s+$/g, '')
                .replace(/\n/g, '<br>')
            : resource[field];
    }


    private async processRelations(resource: Resource) {

        const relations: Array<RelationDefinition>|undefined
            = this.projectConfiguration.getRelationDefinitions(resource.type);
        if (!relations) return;

        for (let relation of FieldsViewComponent.computeRelationsToShow(resource, relations)) {
            const groupName: string|undefined = GroupUtil.getGroupName(relation.name);
            if (!groupName) continue;

            this.relations[groupName].push({
                label: relation.label,
                targets: (await this.getTargetDocuments(resource.relations[relation.name]))});
        }
    }


    private static computeRelationsToShow(resource: Resource,
                                          relations: Array<RelationDefinition>): Array<RelationDefinition> {

        const isNotHierarchical = isNot(includedIn(HIERARCHICAL_RELATIONS.ALL));
        const hasTargets = compose(lookup<any>(resource.relations), isNot(undefinedOrEmpty));

        return relations
            .filter(on(NAME, isNotHierarchical))
            .filter(on(NAME, hasTargets));
    }


    private getTargetDocuments(targetIds: Array<ResourceId>): Promise<Array<Document>> {

        return this.datastore.getMultiple(targetIds); // what if error?
    }
}
