import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { any, is, compose, map, to, Predicate } from 'tsfun';
import { FieldDefinition, Category, LabelUtil, Named, Inplace } from 'idai-field-core';


@Component({
    selector: 'category-picker',
    templateUrl: './category-picker.html'
})
/**
 * @author Thomas Kleinke
 */
export class CategoryPickerComponent {

    @Input() topLevelCategoriesArray: Array<Category>;
    @Input() selectedCategories: string[];
    @Input() allCategoriesOptionVisible: boolean = false;
    @Input() allowPickingAbstractCategories: boolean = false;
    @Input() highlightCustomCategories: boolean = false;
    @Input() showCreateButtons: boolean = false;
    @Input() allowChangingOrder: boolean = false;

    @Output() onCategoryPicked: EventEmitter<Category> = new EventEmitter<Category>();
    @Output() onCreateSubcategory: EventEmitter<Category> = new EventEmitter<Category>();
    @Output() onOrderChanged: EventEmitter<string[]> = new EventEmitter<string[]>();


    public getCategoryLabel = (category: Category): string => LabelUtil.getLabel(category);

    public isCreateButtonVisible = (category: Category): boolean =>
        this.showCreateButtons && category.userDefinedSubcategoriesAllowed;


    public pickCategory(category: Category) {

        if (category && category.isAbstract && !this.allowPickingAbstractCategories) return;

        this.onCategoryPicked.emit(category);
    }


    public onDrop(event: CdkDragDrop<any>, parentCategory?: Category) {

        if (parentCategory) {
            Inplace.moveInArray(
                this.topLevelCategoriesArray
                    .find(category => category.name === parentCategory.name)
                    .children,
                event.previousIndex,
                event.currentIndex
            );
        } else {
            Inplace.moveInArray(
                this.topLevelCategoriesArray,
                event.previousIndex,
                event.currentIndex
            );
        }

        this.onOrderChanged.emit(this.getCategoriesOrder());
    }


    public getCategoryId(category: Category): string {

        return (
            category.parentCategory
                ? (category.parentCategory as Category).name.toLowerCase() + '-'
                : ''
        ) + category.name.toLowerCase();
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


    private getCategoriesOrder(): string[] {

        return this.topLevelCategoriesArray.reduce((order, category) => {
            order.push(category.name);
            if (category.children) order = order.concat(category.children.map(to(Named.NAME)));
            return order;
        }, []);
    }
}
