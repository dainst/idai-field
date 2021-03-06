import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { any, is, compose, map, to, Predicate } from 'tsfun';
import { Field, Category, Named, InPlace, Labels } from 'idai-field-core';
import { ConfigurationContextMenu } from '../configuration/context-menu/configuration-context-menu';


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
    @Input() dragging: boolean = false;
    @Input() contextMenu: ConfigurationContextMenu;

    @Output() onCategoryPicked: EventEmitter<Category> = new EventEmitter<Category>();
    @Output() onCreateSubcategory: EventEmitter<Category> = new EventEmitter<Category>();
    @Output() onOrderChanged: EventEmitter<string[]> = new EventEmitter<string[]>();
    @Output() onEditCategory: EventEmitter<Category> = new EventEmitter<Category>();


    constructor(private labels: Labels) {}


    public getCategoryLabel = (category: Category): string => this.labels.get(category);

    public isCreateButtonVisible = (category: Category): boolean =>
        this.showCreateButtons && category.userDefinedSubcategoriesAllowed;

    public openContextMenu = (event: MouseEvent, category: Category) => this.contextMenu?.open(event, category);


    public pickCategory(category: Category) {

        if (category && category.isAbstract && !this.allowPickingAbstractCategories) return;

        this.onCategoryPicked.emit(category);
    }


    public onDrop(event: CdkDragDrop<any>, parentCategory?: Category) {

        if (parentCategory) {
            InPlace.moveInArray(
                this.topLevelCategoriesArray
                    .find(category => category.name === parentCategory.name)
                    .children,
                event.previousIndex,
                event.currentIndex
            );
        } else {
            InPlace.moveInArray(
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


    public isCustomCategory: Predicate<Category> = category => category.source === 'custom';


    public hasCustomFields: Predicate<Category> = compose(
        Category.getFields,
        map(to(Field.SOURCE)),
        any(is(Field.Source.CUSTOM))
    );


    private getCategoriesOrder(): string[] {

        return this.topLevelCategoriesArray.reduce((order, category) => {
            order.push(category.name);
            if (category.children) order = order.concat(category.children.map(to(Named.NAME)));
            return order;
        }, []);
    }
}
