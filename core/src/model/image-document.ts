import { Document, NewDocument } from './document';
import { ImageResource, NewImageResource } from './image-resource';


/**
 * @author Daniel de Oliveira
 */
 export interface NewImageDocument extends NewDocument {

    id?: string;
    resource: NewImageResource;
}


/**
 * @author Daniel de Oliveira
 */
export interface ImageDocument extends Document {

    id?: string;
    resource: ImageResource;
}


/**
 * @author Thomas Kleinke
 */
export module ImageDocument {

    export function getOriginalFileExtension(document: ImageDocument): string {
        
        return document.resource.originalFilename.split('.').pop();
    }
}