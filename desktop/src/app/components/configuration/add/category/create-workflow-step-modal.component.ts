import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Map } from 'tsfun';
import { CategoryForm, ProjectConfiguration } from 'idai-field-core';


@Component({
    templateUrl: './create-workflow-step-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)',
    },
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export class CreateWorkflowStepModalComponent {

    public category: CategoryForm;
    public clonedProjectConfiguration: ProjectConfiguration;

    public selectableCategories: Array<CategoryForm>;
    public selectedCategories: Map<string[]> = {
        isExecutedOn: [],
        resultsIn: []
    };
    public isExecutedOnSelected: boolean = false;


    constructor(public activeModal: NgbActiveModal) {}


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') this.activeModal.dismiss('cancel');
    }

    
    public initialize() {

        this.selectableCategories = this.getSelectableCategories();
    }


    public validate(): boolean {

        return this.selectedCategories.isExecutedOn.length > 0;
    }


    public confirm() {

        if (!this.validate()) return;
    
        if (!this.isExecutedOnSelected) {
            this.isExecutedOnSelected = true;
        } else {
            this.activeModal.close(this.selectedCategories);
        }
    }


    public cancel() {

        this.activeModal.dismiss('cancel');
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


    private getSelectableCategories(): Array<CategoryForm> {

        return this.clonedProjectConfiguration.getTopLevelCategories().filter(category => {
            return !['Project', 'TypeCatalog', 'Type', 'StoragePlace', 'WorkflowStep', 'Image']
                .includes(category.name);
        });
    } 
}
