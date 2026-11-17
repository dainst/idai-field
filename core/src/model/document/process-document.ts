import { Document } from './document';
import { ProcessResource } from './process-resource';


export interface ProcessDocument extends Document {

    resource: ProcessResource;
}
