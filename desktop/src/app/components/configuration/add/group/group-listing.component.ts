import { Component, Input, Output, EventEmitter } from '@angular/core';
import { to } from 'tsfun';
import { CategoryForm, Labels, Named } from 'idai-field-core';
import { getSearchResultLabel } from '../getSearchResultLabel';
import { GroupEntry } from '../../../../services/configuration/index/group-index';


@Component({
    selector: 'group-listing',
    templateUrl: './group-listing.html',
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export class GroupListingComponent {

    @Input() groups: Array<GroupEntry> = [];
    @Input() category: CategoryForm;
    @Input() emptyGroup: GroupEntry|undefined;
    @Input() selectedGroup: GroupEntry;
    @Input() searchTerm: string = '';

    @Output() onGroupSelected = new EventEmitter<GroupEntry>();


    constructor(private labels: Labels) {}


    public select = (group: GroupEntry) => this.onGroupSelected.emit(group);

    public getGroupId = (group: GroupEntry) => 'select-group-' + group.name.replace(':', '-');

    public getLabel = (value: any) => this.labels.get(value);

    public isNewGroupOptionShown = (): boolean => this.emptyGroup !== undefined
        && !this.groups.map(group => group.name).includes(this.emptyGroup.name)
        && !this.category.groups.map(to(Named.NAME)).includes(this.emptyGroup.name);

    public getSearchResultLabel = (group: GroupEntry) => getSearchResultLabel(group, this.searchTerm, this.getLabel);
}
