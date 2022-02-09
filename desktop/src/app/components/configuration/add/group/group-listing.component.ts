import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Labels } from 'idai-field-core';
import { getSearchResultLabel } from '../getSearchResultLabel';
import { GroupEntry } from '../../../../services/configuration/index/group-index';


@Component({
    selector: 'group-listing',
    templateUrl: './group-listing.html'
})
/**
 * @author Thomas Kleinke
 */
export class GroupListingComponent {

    @Input() groups: Array<GroupEntry> = [];
    @Input() emptyGroup: GroupEntry|undefined;
    @Input() selectedGroup: GroupEntry;
    @Input() searchTerm: string = '';

    @Output() onGroupSelected = new EventEmitter<GroupEntry>();


    constructor(private labels: Labels) {}


    public select = (group: GroupEntry) => this.onGroupSelected.emit(group);

    public getLabel = (value: any) => this.labels.get(value);

    public isNewGroupOptionShown = (): boolean => this.emptyGroup !== undefined
        && !this.groups.map(group => group.name).includes(this.searchTerm);

    public getSearchResultLabel = (group: GroupEntry) => getSearchResultLabel(group, this.searchTerm, this.getLabel);
}
