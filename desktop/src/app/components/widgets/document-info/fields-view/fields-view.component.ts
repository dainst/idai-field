import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { Datastore, FieldDocument, FieldsViewGroup, FieldsViewUtil,
     Labels, Name, ProjectConfiguration, Resource } from 'idai-field-core';


@Component({
    selector: 'fields-view',
    templateUrl: './fields-view.html',
    standalone: false
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
                private labels: Labels) {}


    public getGroupLabel = (group: FieldsViewGroup) => this.labels.get(group);


    async ngOnChanges(changes: SimpleChanges) {

        if (this.resource && changes['resource']) {
            this.groups = await FieldsViewUtil.getGroupsForResource(
                this.resource, this.projectConfiguration, this.datastore, this.labels
            );
        }
    }


    public isGroupSectionOpened(group: Name): boolean {

        return this.expandAllGroups || this.getOpenSection() === group;
    }


    public toggleGroupSection(group: FieldsViewGroup) {

        this.openSection = this.getOpenSection() === group.name && !this.expandAllGroups
            ? undefined
            : group.name;

        this.onSectionToggled.emit(this.openSection);
    }


    public async jumpToResource(document: FieldDocument) {

        this.onJumpToResource.emit(document);
    }


    private getOpenSection(): string {

        return this.openSection
            ? this.openSection
            : this.groups.length > 0
                ? this.groups[0].name
                : undefined;
    }
}
