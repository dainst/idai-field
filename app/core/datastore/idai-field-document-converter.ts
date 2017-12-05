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


    public validateTypes(types: string[]|undefined, typeClass: string): string[]|undefined {

        if (typeClass == 'IdaiFieldImageDocument') {

            if (!types) {
                types = this.imageTypeUtility.getImageTypeNames();
            } else {
                types.forEach(type => {
                    if (!this.imageTypeUtility.isImageType(type))
                        throw "Wrong type: not all specified types are image types"
                });
            }
            return types;

        } else if (typeClass == 'IdaiFieldDocument') {

            if (!types) {
                types = this.imageTypeUtility.getNonImageTypeNames();
            } else {
                types.forEach(type => {
                    if (this.imageTypeUtility.isImageType(type))
                        throw "Wrong type: image types not allowed in query"
                });
            }
            return types;
        }
    }


    public proveIsCorrectType(doc: Document, typeClass: string): void {

        if (typeClass == 'IdaiFieldImageDocument') {
            if (!this.imageTypeUtility.isImageType(doc.resource.type)) throw "Wrong type class: must be IdaiFieldImageDocument";
        } else if (typeClass == 'IdaiFieldDocument') {
            if (this.imageTypeUtility.isImageType(doc.resource.type)) throw "Wrong type class: must not be IdaiFieldImageDocument";
        }
    }


    public convertToIdaiFieldDocument<T extends Document>(
            doc: Document): T {

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