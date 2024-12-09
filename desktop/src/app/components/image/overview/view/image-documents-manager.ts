import { clone } from 'tsfun';
import { Datastore, ImageDocument } from 'idai-field-core';
import { ImagesState } from './images-state';


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class ImageDocumentsManager {

    public selected: Array<ImageDocument> = [];

    private documents: Array<ImageDocument>;
    private totalDocumentCount: number;

    private depictsRelationsSelected: boolean = false;
    private currentQueryId: string;


    constructor(private imagesState: ImagesState,
                private datastore: Datastore) {}


    public getSelected = (): Array<ImageDocument> => this.selected;

    public getDocuments = (): Array<ImageDocument> => this.documents;

    public getTotalDocumentCount = (): number => this.totalDocumentCount;

    public getDepictsRelationsSelected = (): boolean => this.depictsRelationsSelected;

    public clearSelection = () => this.selected = [];


    public remove(document: ImageDocument) {

        this.documents.splice(this.documents.indexOf(document), 1);
    }


    public select(document: ImageDocument) {

        if (this.selected.indexOf(document) == -1) this.selected.push(document);
        this.depictsRelationsSelected = this.doSelectedDocumentsContainDepictsRelations();
    }


    public toggleSelected(document: ImageDocument, multiSelect: boolean = false) {

        if (multiSelect && this.selected.length > 0) {
            this.selectBetween(this.selected[this.selected.length - 1], document);
        } else {
            if (this.selected.indexOf(document) == -1) {
                this.selected.push(document);
            } else {
                this.selected.splice(this.selected.indexOf(document), 1);
            }
        }

        this.depictsRelationsSelected = this.doSelectedDocumentsContainDepictsRelations();
    }


    private selectBetween(document1: ImageDocument, document2: ImageDocument) {

        const index1: number = this.documents.indexOf(document1);
        const index2: number = this.documents.indexOf(document2);

        for (let i = Math.min(index1, index2); i <= Math.max(index1, index2); i++) {
            const document = this.documents[i];
            if (!this.selected.includes(document)) this.selected.push(document);
        }
    }   


    private doSelectedDocumentsContainDepictsRelations(): boolean {

        for (let document of this.selected) {
            if (document.resource.relations.depicts && document.resource.relations.depicts.length > 0) {
                return true;
            }
        }
        return false;
    }


    /**
     * Populates the document list with all documents from
     * the datastore which match a <code>query</code>
     */
    public async fetchDocuments(limit: number, offset?: number) {

        this.currentQueryId = new Date().toISOString();
        const queryId = this.currentQueryId;

        const query = clone(this.imagesState.getQuery());
        if (offset) query.offset = offset;
        query.limit = limit;
        query.constraints['project:exist'] = 'UNKNOWN';

        try {
            const {documents, totalCount} = await this.datastore.find(query);
            if (queryId !== this.currentQueryId) return;

            this.documents = documents as Array<ImageDocument>;
            this.totalDocumentCount = totalCount;
        } catch (errWithParams) {
            console.error('ERROR with find using query', query);
            if (errWithParams.length == 2) console.error('Cause: ', errWithParams[1]);
        }
    }
}
