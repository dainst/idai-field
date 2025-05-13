import { Document } from './document';
import { WorkflowStepResource } from './workflow-step-resource';


export interface WorkflowStepDocument extends Document {

    resource: WorkflowStepResource;
}
