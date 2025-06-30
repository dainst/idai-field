import { parseDate, Document, DateSpecification, WorkflowStepDocument, SortMode, SortUtil } from 'idai-field-core';


export function sortWorkflowSteps(workflowSteps: Array<WorkflowStepDocument>, sortMode: SortMode) {

    workflowSteps.sort((workflowStep1: Document, workflowStep2: Document) => {
        switch (sortMode) {
            case SortMode.Alphanumeric:
                return compareAlphanumerically(workflowStep1, workflowStep2);
            case SortMode.AlphanumericDescending:
                return compareAlphanumerically(workflowStep1, workflowStep2) * -1;
            case SortMode.Date:
                return compareByDate(workflowStep1, workflowStep2);
            case SortMode.DateDescending:
                return compareByDate(workflowStep1, workflowStep2) * -1;
        }
    });
}


function compareAlphanumerically(workflowStep1: Document, workflowStep2: Document): number {

    return SortUtil.alnumCompare(
        workflowStep1.resource.identifier,
        workflowStep2.resource.identifier
    );
}


function compareByDate(workflowStep1: Document, workflowStep2: Document): number {

    return SortUtil.numberCompare(
        getDateTime(workflowStep1.resource.date),
        getDateTime(workflowStep2.resource.date)
    );
}


function getDateTime(date: DateSpecification): number {

    if (!date) return 0;

    const dateValue: string = date.endValue ?? date.value;
    return parseDate(dateValue).getTime();
}
