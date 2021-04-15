import * as tsfun from 'tsfun';
import {Datastore, ImageDocument} from 'idai-field-core';
import {ImagesState} from './images-state';


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


    public toggleSelected(document: ImageDocument) {

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
    public async fetchDocuments(limit: number, offset?: number) {

        this.currentQueryId = new Date().toISOString();
        const queryId = this.currentQueryId;

        const query = tsfun.clone(this.imagesState.getQuery());
        if (offset) query.offset = offset;
        query.limit = limit;
        query.constraints['project:exist'] = 'UNKNOWN';

        try {
            const {documents, totalCount} = await this.datastore.find(query);
            if (queryId !== this.currentQueryId) return;

            this.documents = documents.map(ImageDocument.fromDocument);
            this.totalDocumentCount = totalCount;
        } catch (errWithParams) {
            console.error('ERROR with find using query', query);
            if (errWithParams.length == 2) console.error('Cause: ', errWithParams[1]);
        }
    }
}
