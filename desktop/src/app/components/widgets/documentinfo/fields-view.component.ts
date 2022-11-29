import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { Datastore, FieldDocument, FieldsViewGroup, FieldsViewUtil,
     Labels, Name, ProjectConfiguration, Resource } from 'idai-field-core';
import { UtilTranslations } from '../../../util/util-translations';


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
    @Input() openSection: string|undefined;
    @Input() expandAllGroups: boolean = false;

    @Output() onSectionToggled = new EventEmitter<string | undefined>();
    @Output() onJumpToResource = new EventEmitter<FieldDocument>();

    public groups: Array<FieldsViewGroup> = [];


    constructor(private projectConfiguration: ProjectConfiguration,
                private datastore: Datastore,
                private utilTranslations: UtilTranslations,
                private labels: Labels) {}


    public getGroupLabel = (group: FieldsViewGroup) => this.labels.get(group);


    async ngOnChanges(changes: SimpleChanges) {

        if (!this.resource) return;

        if (changes['resource']) {
            this.groups = await FieldsViewUtil.getGroupsForResource(
                this.resource, this.projectConfiguration, this.datastore, this.labels,
                this.utilTranslations.getTranslation('includesStratigraphicalUnits')
            );
            if (!this.openSection && this.groups.length > 0) this.openSection = this.groups[0].name;
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
}
