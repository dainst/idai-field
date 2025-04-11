import { Resource } from './resource';
import { DateSpecification } from '../input-types/date-specification';
import { parseDate } from '../../tools';


export interface WorkflowStepResource extends Resource {

    state: string;
    date: DateSpecification;
}


export module WorkflowStepResource {

    export function validateState(workflowStepResource: WorkflowStepResource,
                                  currentDate: Date = new Date()): boolean {

        switch (workflowStepResource.state) {
            case 'planned':
                return isInFuture(workflowStepResource, currentDate);
            case 'in progress':
                return isInProgress(workflowStepResource, currentDate);
            case 'completed':
            case 'canceled':
                return isInPast(workflowStepResource, currentDate);
        }
    }    


    function isInFuture(workflowStepResource: WorkflowStepResource, currentDate: Date): boolean {

        const startDate: Date = workflowStepResource.date?.value
            ? parseDate(workflowStepResource.date.value, 'UTC', true)
            : undefined;

        const endDate: Date = workflowStepResource.date?.endValue
            ? parseDate(workflowStepResource.date.endValue, 'UTC', true)
            : undefined;

        return (startDate !== undefined && startDate > currentDate)
            || (endDate !== undefined && endDate > currentDate);
    }


    function isInProgress(workflowStepResource: WorkflowStepResource, currentDate: Date): boolean {

        const startDate: Date = workflowStepResource.date?.value
            ? parseDate(workflowStepResource.date.value)
            : undefined;

        return !startDate || startDate < currentDate;
    }


    function isInPast(workflowStepResource: WorkflowStepResource, currentDate: Date): boolean {

        const startDate: Date = workflowStepResource.date?.value
            ? parseDate(workflowStepResource.date.value)
            : undefined;

        const endDate: Date = workflowStepResource.date?.endValue
            ? parseDate(workflowStepResource.date.endValue)
            : undefined;

        return (!startDate || startDate < currentDate) && (!endDate || endDate < currentDate);
    }
}
