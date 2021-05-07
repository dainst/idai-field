import { Component, Input, Output, EventEmitter, OnChanges, ViewChild } from '@angular/core';
import { Category } from 'idai-field-core';
import { Loading } from '../../widgets/loading';
import { ProjectConfiguration } from 'idai-field-core';
import {ComponentHelpers} from '../../component-helpers';


@Component({
    selector: 'category-switcher-button',
    templateUrl: './category-switcher-button.html',
    host: {
        '(document:click)': 'handleClick($event)',
    }
})

/**
 * @author Thomas Kleinke
 */
export class CategorySwitcherButtonComponent implements OnChanges{

    @Input() category: string;

    @Output() onCategoryChanged: EventEmitter<string> = new EventEmitter<string>();

    @ViewChild('popover', { static: false }) private popover: any;

    public selectableCategoriesArray: Array<Category>;


    constructor(private projectConfiguration: ProjectConfiguration,
                private loading: Loading) {}


    ngOnChanges() {

        this.initializeCategories();
    }


    public isCategorySwitchingPossible(): boolean {

        return this.selectableCategoriesArray
            && this.selectableCategoriesArray.length > 0
            && this.selectableCategoriesArray[0].children
            && this.selectableCategoriesArray[0].children.length > 0
            && !this.loading.isLoading('docedit');
    }


    public chooseCategory(category: Category) {

        this.category = category.name;
        this.onCategoryChanged.emit(category.name);
    }


    public handleClick(event: any) {

        if (!this.popover) return;

        if (!ComponentHelpers.isInside(event.target, target =>
                target.id === 'category-switcher-button' || target.id === 'category-changer-menu')) {

            this.popover.close();
        }
    }


    private initializeCategories() {

        const categoryObject: Category = this.projectConfiguration.getCategory(this.category);
        if (categoryObject.parentCategory && !categoryObject.parentCategory.isAbstract) {
            this.selectableCategoriesArray = [categoryObject.parentCategory];
        } else {
            this.selectableCategoriesArray = [categoryObject];
        }
    }
}
