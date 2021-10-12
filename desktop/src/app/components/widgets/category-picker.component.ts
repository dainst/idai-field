import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { is, Predicate } from 'tsfun';
import { CategoryForm, InPlace, Labels } from 'idai-field-core';
import { ConfigurationContextMenu } from '../configuration/context-menu/configuration-context-menu';


@Component({
    selector: 'category-picker',
    templateUrl: './category-picker.html'
})
/**
 * @author Thomas Kleinke
 */
export class CategoryPickerComponent {

    @Input() topLevelCategoriesArray: Array<CategoryForm>;
    @Input() selectedCategories: string[];
    @Input() allCategoriesOptionVisible: boolean = false;
    @Input() allowPickingAbstractCategories: boolean = false;
    @Input() highlightCustomCategories: boolean = false;
    @Input() showCreateButtons: boolean = false;
    @Input() allowChangingOrder: boolean = false;
    @Input() dragging: boolean = false;
    @Input() contextMenu: ConfigurationContextMenu;

    @Output() onCategoryPicked: EventEmitter<CategoryForm> = new EventEmitter<CategoryForm>();
    @Output() onCreateSubcategory: EventEmitter<CategoryForm> = new EventEmitter<CategoryForm>();
    @Output() onOrderChanged: EventEmitter<void> = new EventEmitter<void>();
    @Output() onEditCategory: EventEmitter<CategoryForm> = new EventEmitter<CategoryForm>();


    constructor(private labels: Labels) {}


    public getCategoryLabel = (category: CategoryForm): string => this.labels.get(category);

    public hasCustomFields = (category: CategoryForm): boolean => CategoryForm.hasCustomFields(category);

    public isCreateButtonVisible = (category: CategoryForm): boolean =>
        this.showCreateButtons && category.userDefinedSubcategoriesAllowed;

    public openContextMenu = (event: MouseEvent, category: CategoryForm) => this.contextMenu?.open(event, category)


    public pickCategory(category: CategoryForm) {

        if (category && category.isAbstract && !this.allowPickingAbstractCategories) return;

        this.onCategoryPicked.emit(category);
    }


    public onDrop(event: CdkDragDrop<any>, parentCategory?: CategoryForm) {

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

        this.onOrderChanged.emit();
    }


    public getCategoryId(category: CategoryForm): string {

        return (
            category.parentCategory
                ? (category.parentCategory as CategoryForm).name.toLowerCase() + '-'
                : ''
        ) + category.name.toLowerCase();
    }


    public isParentSelected(category: CategoryForm): boolean {

        if (!category.parentCategory
            || !this.selectedCategories) return false;

        return this.selectedCategories
            .find(is(category.parentCategory.name)) !== undefined;
    }


    public isCustomCategory: Predicate<CategoryForm> = category => category.source === 'custom';
}
