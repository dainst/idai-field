import { Document, NewDocument } from './document';
import { ImageGeoreference } from './image-georeference';
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
        
        return document.resource.originalFilename.split('.').pop().toLowerCase();
    }


    export function getWldFileContent(document: ImageDocument): string {

        if (!document.resource.georeference) return undefined;

        let lines: number[] = [];
        const georeference: ImageGeoreference = document.resource.georeference;
        const width: number = document.resource.width - 1;
        const height: number = document.resource.height - 1;

        lines[0] = (georeference.topRightCoordinates[1] - georeference.topLeftCoordinates[1]) / width;
        lines[1] = (georeference.topRightCoordinates[0] - georeference.topLeftCoordinates[0]) / height;
        lines[2] = (georeference.bottomLeftCoordinates[1] - georeference.topLeftCoordinates[1]) / width;
        lines[3] = (georeference.bottomLeftCoordinates[0] - georeference.topLeftCoordinates[0]) / height;
        lines[4] = georeference.topLeftCoordinates[1];
        lines[5] = georeference.topLeftCoordinates[0];

        return lines.map((x: number) => x).join('\n');
    }
}