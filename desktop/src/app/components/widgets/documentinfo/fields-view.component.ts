import {Component, EventEmitter, Input, OnChanges, Output} from '@angular/core';
import {DecimalPipe} from '@angular/common';
import {isBoolean, isArray, isObject, filter, compose, Mapping, on, isDefined, map, flatten, to, pairWith,
    RIGHT, LEFT} from 'tsfun';
import {update, lookup} from 'tsfun/associative';
import {AsyncMapping, flow as asyncFlow, map as asyncMap} from 'tsfun/async';
import {Resource, Dating, Dimension, Literature, OptionalRange} from 'idai-components-2';
import {FieldDocument} from '@idai-field/core';
import {RoutingService} from '../../routing-service';
import {Name} from '../../../core/constants';
import {UtilTranslations} from '../../../core/util/util-translations';
import {ProjectConfiguration} from '../../../core/configuration/project-configuration';
import {FieldDefinition} from '../../../core/configuration/model/field-definition';
import {Group, Groups} from '../../../core/configuration/model/group';
import {FieldsViewField, FieldsViewGroup, FieldsViewUtil} from '../../../core/util/fields-view-util';
import {RelationDefinition} from '../../../core/configuration/model/relation-definition';
import {Named, namedArrayToNamedMap} from '../../../core/util/named';
import shouldBeDisplayed = FieldsViewUtil.shouldBeDisplayed;
import {ReadDatastore} from '../../../core/datastore/model/read-datastore';
import {ValuelistUtil} from '../../../core/util/valuelist-util';
import { clone } from '../../../core/util/object-util';


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

        this.groups = await asyncFlow(
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
            const clonedObject = clone(object);
            if (clonedObject.measurementPosition) {
                clonedObject.measurementPosition = ValuelistUtil.getValueLabel(
                    field.positionValues, clonedObject.measurementPosition
                );
            }
            return Dimension.generateLabel(
                clonedObject,
                (value: any) => this.decimalPipe.transform(value),
                (key: string) => this.utilTranslations.getTranslation(key),
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
            update(Group.FIELDS,
                compose(
                    map(pairWith(fieldContent)),
                    filter(on([RIGHT], isDefined)),
                    filter(on([LEFT], FieldsViewUtil.isVisibleField)),
                    map(this.makeField.bind(this)),
                    flatten()
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


    private putActualResourceRelationsIntoGroups(resource: Resource): AsyncMapping {

        return ($: any) => asyncMap(async (group: any /* ! modified in place ! */) => {

            group.relations = await asyncFlow(
                group.relations,
                FieldsViewUtil.filterRelationsToShowFor(resource),
                asyncMap(async (relation: RelationDefinition) => {
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
