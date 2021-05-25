import { DecimalPipe } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { Datastore, FieldDocument, FieldsViewField, FieldsViewGroup, FieldsViewUtil, Groups, Name, ProjectConfiguration, Resource } from 'idai-field-core';
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

        return FieldsViewUtil.getObjectLabel(
            object,
            field,
            (key: string) => this.utilTranslations.getTranslation(key),
            (value: number) => this.decimalPipe.transform(value)
        );
    }
}
