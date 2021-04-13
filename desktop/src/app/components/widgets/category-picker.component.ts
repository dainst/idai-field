import {Component, Input, Output, EventEmitter, OnChanges} from '@angular/core';
import {on, any, is, compose, map, to, Predicate} from 'tsfun';
import {Named, FieldDefinition, Category} from 'idai-field-core';


@Component({
    selector: 'category-picker',
    templateUrl: './category-picker.html'
})
/**
 * @author Thomas Kleinke
 */
export class CategoryPickerComponent implements OnChanges {

    @Input() toplevelCategoriesArray: Array<Category>;
    @Input() selectedCategories: string[];
    @Input() allCategoriesOptionVisible: boolean = false;
    @Input() allowPickingAbstractCategories: boolean = false;
    @Input() highlightCustomCategories: boolean = false;

    @Output() onCategoryPicked: EventEmitter<Category> = new EventEmitter<Category>();


    public categories: Array<Category> = [];


    ngOnChanges() {

        this.categories = [];

        this.toplevelCategoriesArray.forEach(category => {
            this.categories.push(category);
            if (category.children) this.categories = this.categories.concat(category.children);
        });
    }


    public pickCategory(category: Category) {

        if (category && category.isAbstract && !this.allowPickingAbstractCategories) return;

        this.onCategoryPicked.emit(category);
    }


    public getCategoryId(category: Category): string {

        return (this.isChildCategory(category) ? (category.parentCategory as Category).name.toLowerCase() + '-' : '')
            + category.name.toLowerCase();
    }


    public isChildCategory(category: Category): boolean {

        return category.parentCategory !== undefined
            && this.categories.find(on(Named.NAME)(category.parentCategory)) !== undefined;
    }


    public isParentSelected(category: Category): boolean {

        if (!category.parentCategory
            || !this.selectedCategories) return false;

        return this.selectedCategories
            .find(is(category.parentCategory.name)) !== undefined;
    }


    public isCustomCategory: Predicate<Category> = category => !category.libraryId;


    public hasCustomFields: Predicate<Category> = compose(
        Category.getFields,
        map(to(FieldDefinition.SOURCE)),
        any(is(FieldDefinition.Source.CUSTOM))
    );
}
