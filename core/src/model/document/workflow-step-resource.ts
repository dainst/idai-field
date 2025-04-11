import { Resource } from './resource';
import { DateSpecification } from '../input-types/date-specification';


export interface WorkflowStepResource extends Resource {

    status: string;
    date: DateSpecification;
}
