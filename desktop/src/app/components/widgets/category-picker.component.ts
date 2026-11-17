import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { is, Predicate, to } from 'tsfun';
import { CategoryForm, Labels, ProjectConfiguration } from 'idai-field-core';
import { ConfigurationContextMenu } from '../configuration/context-menu/configuration-context-menu';
import { ConfigurationIndex } from '../../services/configuration/index/configuration-index';


export type OrderChange = {

    previousIndex: number;
    currentIndex: number
    parentCategory?: CategoryForm;
}


@Component({
    selector: 'category-picker',
    templateUrl: './category-picker.html',
    standalone: false
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
    @Input() customProjectConfiguration: ProjectConfiguration;

    @Output() onCategoryPicked: EventEmitter<CategoryForm> = new EventEmitter<CategoryForm>();
    @Output() onCreateSubcategory: EventEmitter<CategoryForm> = new EventEmitter<CategoryForm>();
    @Output() onOrderChanged: EventEmitter<OrderChange> = new EventEmitter<OrderChange>();
    @Output() onEditCategory: EventEmitter<CategoryForm> = new EventEmitter<CategoryForm>();


    constructor(private labels: Labels,
                private configurationIndex: ConfigurationIndex) {}


    public getCategoryLabel = (category: CategoryForm): string => this.labels.get(category);

    public hasCustomFields = (category: CategoryForm): boolean => CategoryForm.hasCustomFields(category);

    public openContextMenu = (event: MouseEvent, category: CategoryForm) => this.contextMenu?.open(event, category)


    public isCreateButtonVisible(category: CategoryForm): boolean {
        
        if (!this.showCreateButtons) return false;
        if (category.userDefinedSubcategoriesAllowed) return true;

        const unselectedChildren: Array<CategoryForm> = this.configurationIndex.getCategoryFormChildren(category.name)
            .filter(childCategory => !category.children.map(to('name')).includes(childCategory.name));

        return unselectedChildren.length > 0;
    }


    public pickCategory(category: CategoryForm) {

        if (category && category.isAbstract && !this.allowPickingAbstractCategories) return;

        this.onCategoryPicked.emit(category);
    }


    public onDrop(event: CdkDragDrop<any>, parentCategory?: CategoryForm) {

        if (event.previousIndex === event.currentIndex) return;

        this.onOrderChanged.emit({
            previousIndex: event.previousIndex,
            currentIndex: event.currentIndex,
            parentCategory
        });
    }


    public getCategoryId(category: CategoryForm): string {

        return (
            category.parentCategory
                ? (category.parentCategory as CategoryForm).name.replace(':', '-').toLowerCase() + '-'
                : ''
        ) + category.name.replace(':', '-').toLowerCase();
    }


    public isParentSelected(category: CategoryForm): boolean {

        if (!category.parentCategory
            || !this.selectedCategories) return false;

        return this.selectedCategories
            .find(is(category.parentCategory.name)) !== undefined;
    }


    public isCustomCategory: Predicate<CategoryForm> = category => category.source === 'custom';
}
