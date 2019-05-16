import {Component, EventEmitter, Input, OnChanges, Output} from '@angular/core';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {is, isnt, isUndefinedOrEmpty, on} from 'tsfun';
import {
    Document,
    FieldDocument,
    IdaiType,
    ProjectConfiguration,
    ReadDatastore,
    RelationDefinition,
    Resource
} from 'idai-components-2';
import {RoutingService} from '../components/routing-service';
import {GroupUtil} from '../core/util/group-util';
import {GROUP_NAME, INCLUDES, LIES_WITHIN, POSITION_RELATIONS, RECORDED_IN, TIME_RELATIONS} from '../c';
import {isNot, undefinedOrEmpty} from 'tsfun/src/predicate';


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

    @Output() onSectionToggled: EventEmitter<string|undefined> = new EventEmitter<string|undefined>();
    @Output() onJumpToResource: EventEmitter<FieldDocument> = new EventEmitter<FieldDocument>();

    public fields: { [groupName: string]: Array<any> };
    public relations: { [groupName: string]: Array<any> } = {};


    private groups: Array<FieldViewGroupDefinition> = [
        { name: 'stem', label: this.i18n({ id: 'docedit.group.stem', value: 'Stammdaten' }), shown: true },
        { name: 'properties', label: '', shown: false },
        { name: 'child', label: '', shown: false },
        { name: 'dimension', label: this.i18n({ id: 'docedit.group.dimensions', value: 'Maße' }), shown: false },
        { name: 'position', label: this.i18n({ id: 'docedit.group.position', value: 'Lage' }), shown: false },
        { name: 'time', label: this.i18n({ id: 'docedit.group.time', value: 'Zeit' }), shown: false }
    ];


    constructor(private projectConfiguration: ProjectConfiguration,
                private datastore: ReadDatastore,
                private routingService: RoutingService,
                private i18n: I18n) {}


    async ngOnChanges() {

        this.fields = {};
        this.relations = {};
        this.relations['stem'] = [];
        this.relations['properties'] = [];
        this.relations['child'] = [];
        this.relations['dimension'] = [];
        this.relations['position'] = [];
        this.relations['time'] = [];

        if (this.resource) {
            await this.processRelations(this.resource);
            await this.processFields(this.resource);
            this.updateGroupLabels(this.resource.type);
        }
    }


    public isBoolean(value: any): boolean {

        return typeof value === 'boolean';
    }


    public getGroups(): Array<FieldViewGroupDefinition> {

        return this.groups.filter(group => {

            return ((this.fields[group.name] !== undefined && this.fields[group.name].length > 0)
                || this.relations[group.name].length > 0);
        });
    }


    public toggleGroupSection(group: FieldViewGroupDefinition) {

        this.openSection = this.openSection === group.name
            ? undefined
            : this.openSection = group.name;

        this.onSectionToggled.emit(this.openSection);
    }



    public async jumpToResource(document: FieldDocument) {

        this.onJumpToResource.emit(document);
    }


    private updateGroupLabels(typeName: string) {

        const type: IdaiType = this.projectConfiguration.getTypesMap()[typeName];
        if (type.parentType) {
            this.groups[GROUP_NAME.PROPERTIES].label = type.parentType.label;
            this.groups[GROUP_NAME.CHILD_PROPERTIES].label = type.label;
        } else {
            this.groups[GROUP_NAME.PROPERTIES].label = type.label;
        }
    }


    private async processFields(resource: Resource) {

        this.addBaseFields(resource);

        for (let field of this.projectConfiguration
            .getFieldDefinitions(resource.type)
            .filter(on(NAME, isnt('relations')))) {

            if (resource[field.name] === undefined) continue;

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

        this.fields['stem'] = [
            {
                label: this.getLabel(resource.type, 'shortDescription'),
                value: FieldsViewComponent.getValue(resource, 'shortDescription'),
                isArray: false
            }, {
                label: this.getLabel(resource.type, 'type'),
                value: this.projectConfiguration.getLabelForType(resource.type),
                isArray: false
            }
        ];
    }


    private getLabel(type: string, fieldName: string): string {

        return this.projectConfiguration
            .getTypesMap()[type].fields
            .find(on(NAME, is(fieldName))).label;
    }


    private static getValue(resource: Resource, fieldName: string): any {

        if (typeof resource[fieldName] === 'string') {
            return resource[fieldName]
                .replace(/^\s+|\s+$/g, '')
                .replace(/\n/g, '<br>');
        } else {
            return resource[fieldName];
        }
    }


    private async processRelations(resource: Resource) {

        const relations: Array<RelationDefinition>|undefined = this.projectConfiguration.getRelationDefinitions(resource.type);
        if (!relations) return;

        for (let relation of this.computeRelationsToShow(resource, relations)) {

            let group: string|undefined = undefined;
            if (TIME_RELATIONS.includes(relation.name)) group = 'time';
            if (POSITION_RELATIONS.includes(relation.name)) group = 'position';
            if (!group) continue;

            this.relations[group].push({
                label: relation.label,
                targets: (await this.getTargetDocuments(resource.relations[relation.name]))});
        }
    }


    private computeRelationsToShow(resource: Resource, relations: Array<RelationDefinition>) {

        // what about projectConfiguration.isVisibleRelation?
        return relations.filter(on(NAME, isnt(RECORDED_IN)))
            .filter(on(NAME, isnt(LIES_WITHIN)))
            .filter(on(NAME, isnt(INCLUDES)))
            .filter(relation => isNot(undefinedOrEmpty)(resource.relations[relation.name]))
    }


    private getTargetDocuments(targetIds: Array<string>): Promise<Array<Document>> {

        return this.datastore.getMultiple(targetIds); // what if error?
    }
}
