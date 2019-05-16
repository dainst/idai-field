import {Component, OnChanges, Input, Output, EventEmitter} from '@angular/core';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {isUndefinedOrEmpty} from 'tsfun';
import {Resource, ProjectConfiguration, FieldDefinition, RelationDefinition, IdaiType, ReadDatastore,
    FieldDocument} from 'idai-components-2';
import {RoutingService} from '../components/routing-service';
import {GroupUtil} from '../core/util/group-util';


type FieldViewGroupDefinition = {
    name: string;
    label: string;
    shown: boolean;
}


const PROPERTIES = 1;
const CHILD_PROPERTIES = 2;


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
    @Input() suppressRelations: boolean = false;

    @Output() onSectionToggled: EventEmitter<string|undefined> = new EventEmitter<string|undefined>();
    @Output() onJumpClicked: EventEmitter<undefined> = new EventEmitter<undefined>();

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


    ngOnChanges() {

        this.fields = {};
        this.relations = {};
        this.relations['stem'] = [];
        this.relations['properties'] = [];
        this.relations['child'] = [];
        this.relations['dimension'] = [];
        this.relations['position'] = [];
        this.relations['time'] = [];

        if (this.resource) {
            this.processFields(this.resource);
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

        this.onJumpClicked.emit();
        await this.routingService.jumpToResource(document);
    }


    private updateGroupLabels(typeName: string) {

        const type: IdaiType = this.projectConfiguration.getTypesMap()[typeName];
        if (type.parentType) {
            this.groups[PROPERTIES].label = type.parentType.label;
            this.groups[CHILD_PROPERTIES].label = type.label;
        } else {
            this.groups[PROPERTIES].label = type.label;
        }
    }


    private async processFields(resource: Resource) {

        this.addBaseFields(resource);

        const fields: Array<FieldDefinition> = this.projectConfiguration.getFieldDefinitions(resource.type);

        const relations: Array<RelationDefinition>|undefined = this.projectConfiguration.getRelationDefinitions(resource.type);


        if (relations && !this.suppressRelations) for (let relation of relations) {
            if (relation.name === 'isRecordedIn') continue;
            if (relation.name === 'liesWithin') continue;
            if (relation.name === 'includes') continue;
            if (isUndefinedOrEmpty(resource.relations[relation.name])) continue;

            const group = ['isContemporaryWith', 'isBefore', 'isAfter']
                .includes(relation.name)
                    ? 'time'
                    : 'position';

            const relationsForGroup = { label: relation.label, targets: []};

            for (let target of resource.relations[relation.name]) {
                const tar = await this.datastore.get(target); // what if error?
                relationsForGroup.targets.push(tar as never);
            }
            this.relations[group].push(relationsForGroup);
        }


        for (let field of fields) {
            if (field.name === 'relations') continue;
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
            .find((field: FieldDefinition) => field.name == fieldName).label;
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
}
