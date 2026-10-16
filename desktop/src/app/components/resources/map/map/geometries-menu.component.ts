import { Renderer2, Component, Input, EventEmitter, Output } from '@angular/core';
import { sameset, to, subsetOf } from 'tsfun';
import { CategoryForm, Named } from 'idai-field-core'
import { MenuComponent } from '../../../widgets/menu.component';
import { Menus } from '../../../../services/menus';
import { ViewFacade } from '../../view/view-facade';


@Component({
    selector: 'geometries-menu',
    templateUrl: './geometries-menu.html',
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export class GeometriesMenuComponent extends MenuComponent {

    @Input() topLevelCategories: Array<CategoryForm>;
    @Input() selectedCategories: string[];
    @Input() disabled: boolean;

    @Output() onCategoriesToggled: EventEmitter<string[]> = new EventEmitter<string[]>;
    @Output() onCategoriesFocused: EventEmitter<string[]> = new EventEmitter<string[]>;


    constructor(renderer: Renderer2,
                menuService: Menus,
                viewFacade: ViewFacade) {

        super(renderer, menuService, 'geometries-button', 'geometries-menu');

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

            for (let topLevelCategory of this.topLevelCategories) {
                if (topLevelCategory.isAbstract && !this.selectedCategories.includes(topLevelCategory.name)
                        && subsetOf(this.selectedCategories, topLevelCategory.children.map(to(Named.NAME)))) {
                    this.selectedCategories.push(topLevelCategory.name);
                }
            }
        }
    }


    private toggleAllCategories() {

        const categoryNames: string[] = CategoryForm.getNamesOfCategoriesAndSubcategories(this.topLevelCategories);

        this.selectedCategories = sameset(this.selectedCategories, categoryNames)
            ? []
            : categoryNames;
    }
}
