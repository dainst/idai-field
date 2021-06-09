import { NewResource } from './new-resource';


export interface NewDocument {

    resource: NewResource;
}


export module NewDocument {

    export const hasId = (doc: NewDocument) => doc.resource.id !== undefined;
}
