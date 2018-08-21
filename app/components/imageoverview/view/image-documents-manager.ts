import {Injectable} from '@angular/core';
import {Query} from 'idai-components-2';
import {IdaiFieldImageDocument} from 'idai-components-2';
import {ViewFacade} from '../../resources/view/view-facade';
import {ImagesState} from './images-state';
import {IdaiFieldImageDocumentReadDatastore} from '../../../core/datastore/field/idai-field-image-document-read-datastore';


@Injectable()
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class ImageDocumentsManager {

    private documents: Array<IdaiFieldImageDocument>;
    private totalDocumentCount: number;

    public selected: Array<IdaiFieldImageDocument>  = [];

    private depictsRelationsSelected: boolean = false;


    constructor(
        public viewFacade: ViewFacade,
        private imagesState: ImagesState,
        private imageDatastore: IdaiFieldImageDocumentReadDatastore
    ) {
    }


    public getSelected = (): Array<IdaiFieldImageDocument> => this.selected;

    public getDocuments = (): Array<IdaiFieldImageDocument> => this.documents;

    public getTotalDocumentCount = (): number => this.totalDocumentCount;

    public getDepictsRelationsSelected = (): boolean => this.depictsRelationsSelected;

    public clearSelection = () => this.selected = [];


    public remove(document: IdaiFieldImageDocument) {

        this.documents.splice(this.documents.indexOf(document), 1);
    }


    /**
     * @param document the object that should be selected
     */
    public select(document: IdaiFieldImageDocument) {

        if (this.selected.indexOf(document) == -1) {
            this.selected.push(document);
        } else {
            this.selected.splice(this.selected.indexOf(document), 1);
        }

        this.depictsRelationsSelected = this.doSelectedDocumentsContainDepictsRelations();
    }


    private doSelectedDocumentsContainDepictsRelations(): boolean {

        for (let document of this.selected) {
            if (document.resource.relations.depicts &&
                    document.resource.relations.depicts.length > 0) {
                return true;
            }
        }
        return false;
    }


    /**
     * Populates the document list with all documents from
     * the datastore which match a <code>query</code>
     */
    public async fetchDocuments(limit: number) {

        const query: Query = JSON.parse(JSON.stringify(this.imagesState.getQuery()));
        query.limit = limit;

        try {
            const {documents, totalCount} = await this.imageDatastore.find(query);
            this.documents = documents;
            this.totalDocumentCount = totalCount;
        } catch (errWithParams) {
            console.error('ERROR with find using query', query);
            if (errWithParams.length == 2) console.error('Cause: ', errWithParams[1]);
        }
    }
}