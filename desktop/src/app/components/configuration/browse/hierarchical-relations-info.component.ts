import { Component, Input, OnChanges, ViewChild } from '@angular/core';
import { NgbPopover } from '@ng-bootstrap/ng-bootstrap';
import { CategoryForm, Labels, ProjectConfiguration } from 'idai-field-core';
import { ComponentHelpers } from '../../component-helpers';


@Component({
    selector: 'hierarchical-relations-info',
    templateUrl: './hierarchical-relations-info.html',
    host: {
        '(document:click)': 'handleClick($event, false)',
        '(document:contextmenu)': 'handleClick($event, true)',
    },
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export class HierarchicalRelationsInfoComponent implements OnChanges {

    @Input() category: CategoryForm;
    @Input() mode: 'liesWithin'|'includes';
    @Input() clonedProjectConfiguration: ProjectConfiguration;

    @ViewChild('popover', { static: false }) private popover: NgbPopover;

    public categories: Array<CategoryForm> = [];


    constructor(private labels: Labels) {}


    public getLabel = (category: CategoryForm) => this.labels.get(category);


    ngOnChanges() {

        this.categories = this.mode === 'liesWithin'
            ? this.getLiesWithinCategories()
            : this.getIncludesCategories();

    }


    public handleClick(event: any, rightClick: boolean) {

        if (!this.popover) return;

        if (rightClick) return this.popover.close();

        if (!ComponentHelpers.isInside(event.target, target => target.id
                && (target.id.includes('hierarchical-relations-info-' + this.mode)
                    || target.id.includes('hierarchical-relations-info-popover')))) {
            this.popover.close();
        }
    }


    private getLiesWithinCategories() {

        const categories: Array<CategoryForm> = this.clonedProjectConfiguration
            .getAllowedRelationRangeCategories('liesWithin', this.category.name);

        return this.category.mustLieWithin
            ? categories
            : this.clonedProjectConfiguration
                .getAllowedRelationRangeCategories('isRecordedIn', this.category.name)
                .concat(categories);
    }

    
    private getIncludesCategories() {

        const categories: Array<CategoryForm> = this.clonedProjectConfiguration
            .getAllowedRelationDomainCategories('liesWithin', this.category.name);

        return this.clonedProjectConfiguration
            .getAllowedRelationDomainCategories('isRecordedIn', this.category.name)
            .filter(category => !category.mustLieWithin)
            .concat(categories);
    }
}
