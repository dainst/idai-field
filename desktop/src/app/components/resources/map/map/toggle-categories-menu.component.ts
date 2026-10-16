import { Renderer2, Component, Input, EventEmitter, Output } from '@angular/core';
import { sameset } from 'tsfun';
import { CategoryForm } from 'idai-field-core'
import { MenuComponent } from '../../../widgets/menu.component';
import { Menus } from '../../../../services/menus';
import { ViewFacade } from '../../view/view-facade';


@Component({
    selector: 'toggle-categories-menu',
    templateUrl: './toggle-categories-menu.html',
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export class ToggleCategoriesMenuComponent extends MenuComponent {

    @Input() topLevelCategories: Array<CategoryForm>;
    @Input() selectedCategories: string[];
    @Input() disabled: boolean;

    @Output() onCategoriesToggled: EventEmitter<string[]> = new EventEmitter<string[]>;
    @Output() onCategoriesFocused: EventEmitter<string[]> = new EventEmitter<string[]>;


    constructor(renderer: Renderer2,
                menuService: Menus,
                viewFacade: ViewFacade) {

        super(renderer, menuService, 'toggle-categories-button', 'toggle-categories-menu');

        viewFacade.navigationPathNotifications().subscribe(() => this.close());
    }


    public toggleCategory(category: CategoryForm) {

        if (category) {
            this.toggleSingleCategory(category);
        } else {
            this.toggleAllCategories();
        }

        this.onCategoriesToggled.emit(this.selectedCategories);
    }


    public focusCategory(category: CategoryForm) {

        const categoriesToFocus: string[] = category
            ? CategoryForm.getNamesOfCategoryAndSubcategories(category)
            : CategoryForm.getNamesOfCategoriesAndSubcategories(this.topLevelCategories);

        this.onCategoriesFocused.emit(categoriesToFocus);
    }


    private toggleSingleCategory(category: CategoryForm) {

        const categoryNames: string[] = [category.name].concat(
            category.children ? category.children.map(childCategory => childCategory.name) : []
        );

        if (this.selectedCategories?.includes(category.name)) {
            this.selectedCategories = this.selectedCategories.filter(categoryName => {
                return !categoryNames.includes(categoryName)
                    && category.parentCategory?.name !== categoryName;
            });
        } else {
            this.selectedCategories = (this.selectedCategories ?? []).concat(categoryNames);
        }
    }


    private toggleAllCategories() {

        const categoryNames: string[] = CategoryForm.getNamesOfCategoriesAndSubcategories(this.topLevelCategories);

        this.selectedCategories = sameset(this.selectedCategories, categoryNames)
            ? []
            : categoryNames;
    }
}
