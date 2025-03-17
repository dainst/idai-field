import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { CategoryForm, FieldDocument, ProjectConfiguration, Relation } from 'idai-field-core';


@Component({
    selector: 'workflow-step-plus-button',
    templateUrl: './workflow-step-plus-button.html',
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export class WorkflowStepPlusButtonComponent implements OnChanges {

    @Input() baseDocument: FieldDocument;

    @Output() onCategorySelected: EventEmitter<CategoryForm> = new EventEmitter<CategoryForm>();

    public topLevelCategoriesArray: Array<CategoryForm>;


    constructor(private projectConfiguration: ProjectConfiguration) {}
    
    
    public selectCategory = (category: CategoryForm) => this.onCategorySelected.emit(category);


    ngOnChanges() {

        this.topLevelCategoriesArray = this.initializeTopLevelCategoriesArray();
    }


    public hasMultipleCategoryOptions(): boolean {

        return this.topLevelCategoriesArray.length > 1 || this.topLevelCategoriesArray[0].children?.length > 0;
    }


    private initializeTopLevelCategoriesArray(): Array<CategoryForm> {

        return this.projectConfiguration.getTopLevelCategories().filter(category => {
            return this.projectConfiguration.isAllowedRelationDomainCategory(
                this.baseDocument.resource.category,
                category.name,
                Relation.Workflow.IS_EXECUTION_TARGET_OF
            );
        });
    }
}
