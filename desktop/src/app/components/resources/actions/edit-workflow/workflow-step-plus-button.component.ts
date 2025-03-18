import { Component, EventEmitter, Input, OnChanges, Output, ViewChild } from '@angular/core';
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

    @Input() baseDocuments: Array<FieldDocument>;

    @Output() onCategorySelected: EventEmitter<CategoryForm> = new EventEmitter<CategoryForm>();

    @ViewChild('popover') popover: any;

    public topLevelCategoriesArray: Array<CategoryForm>;


    constructor(private projectConfiguration: ProjectConfiguration) {}


    ngOnChanges() {

        this.topLevelCategoriesArray = this.initializeTopLevelCategoriesArray();
    }


    public hasMultipleCategoryOptions(): boolean {

        return this.topLevelCategoriesArray?.length > 1 || this.topLevelCategoriesArray?.[0].children?.length > 0;
    }


    public selectCategory(category: CategoryForm) {

        this.popover.close();
        this.onCategorySelected.emit(category);
    }


    private initializeTopLevelCategoriesArray(): Array<CategoryForm> {

        return this.projectConfiguration.getCategory('WorkflowStep').children.filter(category => {
            return this.baseDocuments.every(document => {
                return this.projectConfiguration.isAllowedRelationDomainCategory(
                    document.resource.category,
                    category.name,
                    Relation.Workflow.IS_EXECUTION_TARGET_OF
                );
            }) 
        });
    }
}
