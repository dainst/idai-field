import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { CategoryForm, FieldDocument, ProjectConfiguration } from 'idai-field-core';


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
export class WorkflowStepPlusButtonComponent {

    @Input() baseDocuments: Array<FieldDocument>;
    @Input() allowedCategories: Array<CategoryForm>;

    @Output() onSubmit: EventEmitter<WorkflowStepPlusButtonResult> = new EventEmitter<WorkflowStepPlusButtonResult>();

    @ViewChild('popover') popover: any;

    public createMultiple: boolean|undefined = undefined;


    constructor(private projectConfiguration: ProjectConfiguration) {}


    public reset() {

        this.createMultiple = undefined;
    }


    public hasMultipleCategoryOptions(): boolean {

        return this.allowedCategories?.length > 1 || this.allowedCategories?.[0].children?.length > 0;
    }


    public selectCreateMultipleOption(createMultiple: boolean) {

        this.createMultiple = createMultiple;

        if (!this.hasMultipleCategoryOptions()) {
            this.selectCategory(this.allowedCategories[0]);
        }
    }


    public selectCategory(category: CategoryForm) {

        const result: WorkflowStepPlusButtonResult = { category };
        if (this.createMultiple !== undefined) result.createMultiple = this.createMultiple;

        this.onSubmit.emit(result);

        if (this.popover) this.popover.close();
    }
}
