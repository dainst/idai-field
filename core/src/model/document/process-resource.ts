import { Resource } from './resource';
import { DateSpecification } from '../input-types/date-specification';
import { parseDate } from '../../tools/parse-date';


export interface ProcessResource extends Resource {

    state: string;
    date: DateSpecification;
}


export module ProcessResource {

    export function validateState(processResource: ProcessResource,
                                  currentDate: Date = new Date()): boolean {

        switch (processResource.state) {
            case 'planned':
                return isInFuture(processResource, currentDate);
            case 'in progress':
                return isInProgress(processResource, currentDate);
            case 'completed':
            case 'canceled':
                return isInPast(processResource, currentDate);
        }
    }    


    function isInFuture(processResource: ProcessResource, currentDate: Date): boolean {

        const startDate: Date = processResource.date?.value
            ? parseDate(processResource.date.value, 'UTC', true)
            : undefined;

        const endDate: Date = processResource.date?.endValue
            ? parseDate(processResource.date.endValue, 'UTC', true)
            : undefined;

        return (startDate !== undefined && startDate > currentDate)
            || (endDate !== undefined && endDate > currentDate);
    }


    function isInProgress(processResource: ProcessResource, currentDate: Date): boolean {

        const startDate: Date = processResource.date?.value
            ? parseDate(processResource.date.value)
            : undefined;

        const endDate: Date = processResource.date?.endValue
            ? parseDate(processResource.date.endValue, 'UTC', true)
            : undefined;

        return (!startDate || startDate < currentDate) && (!endDate || endDate > currentDate);
    }


    function isInPast(processResource: ProcessResource, currentDate: Date): boolean {

        const startDate: Date = processResource.date?.value
            ? parseDate(processResource.date.value)
            : undefined;

        const endDate: Date = processResource.date?.endValue
            ? parseDate(processResource.date.endValue)
            : undefined;

        return (!startDate || startDate < currentDate) && (!endDate || endDate < currentDate);
    }
}
