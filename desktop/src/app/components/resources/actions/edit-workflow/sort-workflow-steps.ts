import { parseDate, Document, DateSpecification, WorkflowStepDocument } from 'idai-field-core';


export function sortWorkflowSteps(workflowSteps: Array<WorkflowStepDocument>) {

    workflowSteps.sort((workflowStep1: Document, workflowStep2: Document) => {
        return getDateTime(workflowStep1.resource.date)
            - getDateTime(workflowStep2.resource.date);
    });
}


function getDateTime(date: DateSpecification): number {

    if (!date) return 0;

    const dateValue: string = date.endValue ?? date.value;
    return parseDate(dateValue).getTime();
}
