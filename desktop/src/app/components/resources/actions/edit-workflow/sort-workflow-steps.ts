import { parseDate, Document } from 'idai-field-core';


export function sortWorkflowSteps(workflowSteps: Array<Document>) {

    workflowSteps.sort((workflowStep1: Document, workflowStep2: Document) => {
        return parseDate(workflowStep1.resource.executionDate).getTime()
            - parseDate(workflowStep2.resource.executionDate).getTime();
    });
}
