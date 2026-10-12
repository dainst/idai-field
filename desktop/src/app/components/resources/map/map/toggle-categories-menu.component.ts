import { Renderer2, Component, Input, EventEmitter, Output } from '@angular/core';
import { CategoryForm } from 'idai-field-core'
import { MenuComponent } from '../../../widgets/menu.component';
import { Menus } from '../../../../services/menus';


@Component({
    selector: 'toggle-categories-menu',
    templateUrl: './toggle-categories-menu.html',
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export class ToggleCategoriesMenuComponent extends MenuComponent {

    @Input() public topLevelCategories: Array<CategoryForm>;
    @Input() public selectedCategories: string[];

    @Output() public onCategoriesToggled: EventEmitter<string[]> = new EventEmitter<string[]>;


    constructor(renderer: Renderer2,
                menuService: Menus) {

        super(renderer, menuService, 'toggle-categories-button', 'toggle-categories-menu');
    }


    public toggleCategory(category: CategoryForm) {

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

        this.onCategoriesToggled.emit(this.selectedCategories);
    }
}
