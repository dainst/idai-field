import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {IdaiFieldImageDocument} from '../model/idai-field-image-document';
import {Query, ReadDatastore} from 'idai-components-2/datastore';
import {ViewFacade} from '../resources/view/view-facade';
import {ImageTypeUtility} from '../docedit/image-type-utility';
import {ImagesState} from './images-state';
import {Document} from 'idai-components-2/core';
import {Injectable} from '@angular/core';


import {DocumentsManager} from './documents-manager';


@Injectable()
/**
 */
export class ImageOverviewFacade {

    constructor(private documentsManager:
                    DocumentsManager) {

    }


    public select(document: IdaiFieldImageDocument) {

        return this.documentsManager.select(document);
    }


    public getDocuments(): Array<IdaiFieldImageDocument> {

        return this.documentsManager.getDocuments();
    }


    public cacheIdentifier(document: Document) {

        return this.documentsManager.cacheIdentifier(document);
    }


    public remove(document: IdaiFieldImageDocument) {

        return this.documentsManager.remove(document);
    }


    public getSelected(): Array<IdaiFieldImageDocument> {

        return this.documentsManager.getSelected();
    }


    public clearSelection() {

        return this.documentsManager.clearSelection();
    }


    public fetchDocuments() {

        return this.documentsManager.fetchDocuments();
    }
}