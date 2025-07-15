import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { flatten, Map, set } from 'tsfun';
import { CategoryForm, Field, Labels, ProjectConfiguration } from 'idai-field-core';
import { ConfigurationIndex } from '../../../../services/configuration/index/configuration-index';


@Component({
    templateUrl: './create-process-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)',
    },
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export class CreateProcessModalComponent {

    public category: CategoryForm;
    public clonedProjectConfiguration: ProjectConfiguration;
    public selectedCategories: Map<string[]>;

    public selectableSupercategories: Array<CategoryForm>;
    public isExecutedOnSelected: boolean = false;


    constructor(public activeModal: NgbActiveModal,
                private configurationIndex: ConfigurationIndex,
                private labels: Labels) {}


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') this.activeModal.dismiss('cancel');
    }

    
    public initialize() {

        this.selectableSupercategories = this.getSelectableSupercategories();
        this.initializeSelectedCategories();
    }


    public validate(): boolean {

        return this.selectedCategories.isExecutedOn.length > 0;
    }


    public confirm() {

        if (!this.validate()) return;
    
        if (!this.isExecutedOnSelected) {
            this.isExecutedOnSelected = true;
        } else {
            this.activeModal.close(this.getTargetCategories());
        }
    }


    public cancel() {

        this.activeModal.dismiss('cancel');
    }


    public getFieldLabel(fieldName: string) {
        
        const field: Field = this.configurationIndex.findFields(fieldName, 'Process')?.[0];
        return field ? this.labels.get(field) : '';
    }


    public toggleCategory(category: CategoryForm, relationName: string) {
    
        const categoryNames: string[] = [category.name].concat(
            category.children ? category.children.map(childCategory => childCategory.name) : []
        );

        if (this.selectedCategories?.[relationName]?.includes(category.name)) {
            this.selectedCategories[relationName] = this.selectedCategories[relationName].filter(categoryName => {
                return !categoryNames.includes(categoryName) && category.parentCategory?.name !== categoryName;
            });
        } else {
            this.selectedCategories[relationName] = this.selectedCategories[relationName].concat(categoryNames);
        }
    }


    private getSelectableSupercategories(): Array<CategoryForm> {

        return this.clonedProjectConfiguration.getTopLevelCategories()
            .filter(category => !['Project', 'Process'].includes(category.name));
    }


    private getTargetCategories(): Map<string[]> {

        return {
            isExecutedOn: this.getSelectedSupercategories(this.selectedCategories.isExecutedOn),
            resultsIn: this.getSelectedSupercategories(this.selectedCategories.resultsIn)
        };
    }


    private getSelectedSupercategories(selectedCategories: string[]): string[] {

        return selectedCategories.filter(categoryName => {
            const category: CategoryForm = this.clonedProjectConfiguration.getCategory(categoryName);
            return (!category.parentCategory || !selectedCategories.includes(category.parentCategory.name));
        });
    }


    private initializeSelectedCategories() {

        if (this.selectedCategories) {
            for (let [relationName, categories] of Object.entries(this.selectedCategories)) {
                categories = this.removeUnselectableCategories(categories);
                this.selectedCategories[relationName] = this.addSubcategories(categories);
            }
        } else {
            this.selectedCategories = {
                isExecutedOn: [],
                resultsIn: []
            };
        }
    }


    private removeUnselectableCategories(categoryNames: string[]): string[] {

        const selectableCategoryNames: string[] = this.selectableSupercategories.map(category => category.name);
        return categoryNames.filter(categoryName => {
            const category: CategoryForm = this.clonedProjectConfiguration.getCategory(categoryName);
            return selectableCategoryNames.includes(category?.parentCategory?.name ?? categoryName);
        });
    }


    private addSubcategories(categoryNames: string[]): string[] {

        const subcategoryNames: string[] = flatten(
            categoryNames.map(category => {
                return this.clonedProjectConfiguration.getCategory(category)?.children.map(child => child.name);
            })
        );

        return set(categoryNames.concat(subcategoryNames));
    }
}
