import { DecimalPipe } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { Datastore, Dating, Dimension, FieldDocument, FieldsViewField, FieldsViewGroup, FieldsViewUtil, Groups, Literature, Name, OptionalRange, ProjectConfiguration, Resource, ValuelistUtil } from 'idai-field-core';
import { isBoolean } from 'tsfun';
import { UtilTranslations } from '../../../core/util/util-translations';
import { RoutingService } from '../../routing-service';


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
                private datastore: Datastore,
                routingService: RoutingService, // TODO unused
                private decimalPipe: DecimalPipe,
                private utilTranslations: UtilTranslations) {}


    async ngOnChanges() {

        if (!this.resource) return;

        this.groups = await FieldsViewUtil.getGroupsForResource(this.resource, this.projectConfiguration, this.datastore);
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
}
