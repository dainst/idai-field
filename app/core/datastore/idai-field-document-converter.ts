import {DocumentConverter} from "./core/document-converter";
import {Document} from 'idai-components-2/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {ImageTypeUtility} from '../../common/image-type-utility';
import {IdaiFieldImageDocument} from '../model/idai-field-image-document';
import {Injectable} from "@angular/core";

@Injectable()
/**
 * @author Daniel de Oliveira
 */
export class IdaiFieldDocumentConverter extends DocumentConverter {

    constructor(private imageTypeUtility: ImageTypeUtility) {
        super();
    }

    public convertToIdaiFieldDocument<T extends Document>(doc: Document): T {

        if (this.imageTypeUtility.isImageType(doc.resource.type)) {
            const d = doc as IdaiFieldImageDocument;
            if (!d.resource.identifier) d.resource.identifier = '';
            if (!d.resource.relations.depicts) d.resource.relations.depicts = [];
        } else {
            const d = doc as IdaiFieldDocument;
            if (!d.resource.identifier) d.resource.identifier = '';
            if (!d.resource.relations.isRecordedIn) d.resource.relations.isRecordedIn = [];
        }

        return doc as T;
    }
}