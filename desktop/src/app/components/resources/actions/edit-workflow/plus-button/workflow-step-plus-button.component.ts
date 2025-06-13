import { Component, EventEmitter, Input, OnChanges, Output, ViewChild } from '@angular/core';
import { CategoryForm, FieldDocument, ProjectConfiguration, Relation } from 'idai-field-core';


export type WorkflowStepPlusButtonResult = {
    category: CategoryForm;
    createMultiple?: boolean;
};


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

    @Output() onSubmit: EventEmitter<WorkflowStepPlusButtonResult> = new EventEmitter<WorkflowStepPlusButtonResult>();

    @ViewChild('popover') popover: any;

    public topLevelCategoriesArray: Array<CategoryForm>;
    public createMultiple: boolean|undefined = undefined;


    constructor(private projectConfiguration: ProjectConfiguration) {}


    ngOnChanges() {

        this.topLevelCategoriesArray = this.initializeTopLevelCategoriesArray();
    }


    public reset() {

        this.createMultiple = undefined;
    }


    public hasMultipleCategoryOptions(): boolean {

        return this.topLevelCategoriesArray?.length > 1 || this.topLevelCategoriesArray?.[0].children?.length > 0;
    }


    public selectCreateMultipleOption(createMultiple: boolean) {

        this.createMultiple = createMultiple;

        if (!this.hasMultipleCategoryOptions()) {
            this.selectCategory(this.topLevelCategoriesArray[0]);
        }
    }


    public selectCategory(category: CategoryForm) {

        const result: WorkflowStepPlusButtonResult = { category };
        if (this.createMultiple !== undefined) result.createMultiple = this.createMultiple;

        this.onSubmit.emit(result);

        if (this.popover) this.popover.close();
    }


    private initializeTopLevelCategoriesArray(): Array<CategoryForm> {

        return this.projectConfiguration.getCategory('WorkflowStep').children.filter(category => {
            return this.baseDocuments.every(document => {
                return this.projectConfiguration.isAllowedRelationDomainCategory(
                    category.name,
                    document.resource.category,
                    Relation.Workflow.IS_EXECUTED_ON
                );
            }) 
        });
    }
}
