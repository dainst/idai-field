import {Component, EventEmitter, Input, OnChanges, Output} from '@angular/core';
import {DecimalPipe} from '@angular/common';
import {isBoolean, isArray, aFlow, aMap, isObject, filter, compose, Mapping, on, isDefined, map, flatten, to, pairWith,
    R, L, update_a, lookup} from 'tsfun';
import {Resource, Dating, Dimension, Literature, OptionalRange} from 'idai-components-2';
import {FieldDocument, namedArrayToNamedMap, Named} from '@idai-field/core';
import {RoutingService} from '../../routing-service';
import {Name} from '../../../core/constants';
import {UtilTranslations} from '../../../core/util/util-translations';
import {ProjectConfiguration} from '../../../core/configuration/project-configuration';
import {FieldDefinition} from '../../../core/configuration/model/field-definition';
import {Group, Groups} from '../../../core/configuration/model/group';
import {FieldsViewField, FieldsViewGroup, FieldsViewUtil} from '../../../core/util/fields-view-util';
import {RelationDefinition} from '../../../core/configuration/model/relation-definition';
import shouldBeDisplayed = FieldsViewUtil.shouldBeDisplayed;
import {ReadDatastore} from '../../../core/datastore/model/read-datastore';
import {ValuelistUtil} from '../../../core/util/valuelist-util';


type FieldContent = any;


@Component({
    selector: 'fields-view',
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
                private utilTranslations: UtilTranslations) {}


    async ngOnChanges() {

        if (!this.resource) return;

        this.groups = await aFlow(
            FieldsViewUtil.getGroups(this.resource.category, namedArrayToNamedMap(this.projectConfiguration.getCategoriesArray())),
            await this.putActualResourceRelationsIntoGroups(this.resource),
            this.putActualResourceFieldsIntoGroups(this.resource),
            filter(shouldBeDisplayed)
        );
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


    public getObjectLabel(object: any, field: FieldsViewField): string {

        if (object.label) {
            return object.label;
        } else if (object.begin || object.end) {
            return Dating.generateLabel(
                object,
                (key: string) => this.utilTranslations.getTranslation(key)
            );
        } else if (object.inputUnit) {
            return Dimension.generateLabel(
                object,
                (value: any) => this.decimalPipe.transform(value),
                (key: string) => this.utilTranslations.getTranslation(key),
                ValuelistUtil.getValueLabel(field.positionValues, object.measurementPosition)
            );
        } else if (object.quotation) {
            return Literature.generateLabel(
                object, (key: string) => this.utilTranslations.getTranslation(key)
            );
        } else if (object.value) {
            return OptionalRange.generateLabel(
                object,
                (key: string) => this.utilTranslations.getTranslation(key),
                (value: string) => ValuelistUtil.getValueLabel(field.valuelist, value)
            );
        } else {
            return object;
        }
    }


    private putActualResourceFieldsIntoGroups(resource: Resource): Mapping {

        const fieldContent: Mapping<FieldDefinition, FieldContent>
            = compose(to(Named.NAME), lookup(resource));

        return map(
            update_a(Group.FIELDS,
                compose(
                    map(pairWith(fieldContent)),
                    filter(on(R, isDefined)),
                    filter(on(L, FieldsViewUtil.isVisibleField)),
                    map(this.makeField.bind(this)),
                    flatten() as any /* TODO review typing*/
                )
            )
        );
    }


    private makeField([field, fieldContent]: [FieldDefinition, FieldContent]): FieldsViewField {

        return {
            label: field.label,
            value: isArray(fieldContent)
                ? fieldContent.map((fieldContent: any) =>
                    FieldsViewUtil.getValue(
                        fieldContent, field.name, this.projectConfiguration, field.valuelist
                    )
                )
                : FieldsViewUtil.getValue(
                    fieldContent, field.name, this.projectConfiguration, field.valuelist
                ),
            type: isArray(fieldContent) ? 'array' : isObject(fieldContent) ? 'object' : 'default',
            valuelist: field.valuelist,
            positionValues: field.positionValues
        };
    }


    private putActualResourceRelationsIntoGroups(resource: Resource) {

        return ($: any) => aMap(async (group: any /* ! modified in place ! */) => {

            group.relations = await aFlow(
                group.relations,
                FieldsViewUtil.filterRelationsToShowFor(resource),
                aMap(async (relation: RelationDefinition) => {
                    return {
                        label: relation.label,
                        targets: await this.datastore.getMultiple(resource.relations[relation.name])
                    }
                })
            );
            return group;
        }, $);
    }
}
