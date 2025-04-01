import { parseDate, Document, DateSpecification } from 'idai-field-core';


export function sortWorkflowSteps(workflowSteps: Array<Document>) {

    workflowSteps.sort((workflowStep1: Document, workflowStep2: Document) => {
        return getDateTime(workflowStep1.resource.executionDate)
            - getDateTime(workflowStep2.resource.executionDate);
    });
}


function getDateTime(date: DateSpecification): number {

    if (!date) return 0;

    const dateValue: string = date.endValue ?? date.value;
    return parseDate(dateValue).getTime();
}
