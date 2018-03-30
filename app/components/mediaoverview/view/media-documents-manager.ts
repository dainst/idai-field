import {Injectable} from '@angular/core';
import {Query} from 'idai-components-2/datastore';
import {ViewFacade} from '../../resources/view/view-facade';
import {MediaState} from './media-state';
import {IdaiFieldMediaDocumentReadDatastore} from '../../../core/datastore/idai-field-media-document-read-datastore';
import {IdaiFieldMediaDocument} from '../../../core/model/idai-field-media-document';


@Injectable()
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class MediaDocumentsManager {

    private documents: Array<IdaiFieldMediaDocument>;
    private totalDocumentCount: number;

    public selected: Array<IdaiFieldMediaDocument>  = [];

    private depictsRelationsSelected: boolean = false;


    constructor(
        public viewFacade: ViewFacade,
        private mediaState: MediaState,
        private mediaDatastore: IdaiFieldMediaDocumentReadDatastore
    ) {
    }


    public getSelected(): Array<IdaiFieldMediaDocument> {

        return this.selected;
    }


    public getDocuments(): Array<IdaiFieldMediaDocument> {

        return this.documents;
    }


    public getTotalDocumentCount(): number {

        return this.totalDocumentCount;
    }


    public getDepictsRelationsSelected(): boolean {

        return this.depictsRelationsSelected;
    }


    public remove(document: IdaiFieldMediaDocument) {

        this.documents.splice(this.documents.indexOf(document), 1);
    }


    /**
     * @param document the object that should be selected
     */
    public select(document: IdaiFieldMediaDocument) {

        if (this.selected.indexOf(document) == -1) {
            this.selected.push(document);
        } else {
            this.selected.splice(this.selected.indexOf(document), 1);
        }

        this.depictsRelationsSelected = this.doSelectedDocumentsContainDepictsRelations();
    }


    private doSelectedDocumentsContainDepictsRelations(): boolean {

        for (let document of this.selected) {

            // TODO make sure the DAO always returns docs with depicts, then simplify here
            if (document.resource.relations.depicts &&
                    document.resource.relations.depicts.length > 0) {
                return true;
            }
        }

        return false;
    }


    public clearSelection() {

        this.selected = [];
    }


    /**
     * Populates the document list with all documents from
     * the datastore which match a <code>query</code>
     */
    public async fetchDocuments(limit: number) {

        const query: Query = JSON.parse(JSON.stringify(this.mediaState.getQuery()));
        query.limit = limit;

        console.debug('fetch docs', query);
        try {
            const {documents, totalCount} = await this.mediaDatastore.find(query);
            this.documents = documents;
            this.totalDocumentCount = totalCount;
            console.debug('fetch docs end');
        } catch (errWithParams) {
            console.error('ERROR with find using query', query);
            if (errWithParams.length == 2) console.error('Cause: ', errWithParams[1]);
        }
    }
}