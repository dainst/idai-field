import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {Query} from 'idai-components-2/datastore';
import {NavigationPathManager} from './navigation-path-manager';
import {IdaiFieldDocumentReadDatastore} from '../../../core/datastore/idai-field-document-read-datastore';
import {ResourcesState} from './resources-state';

/**
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 */
export class MainTypeDocumentsManager {

    private documents: Array<IdaiFieldDocument>;

    constructor(
        private datastore: IdaiFieldDocumentReadDatastore,
        private navigationPathManager: NavigationPathManager,
        private resourcesState: ResourcesState
    ) {}

    
    public getDocuments = () => this.documents;

    public select = (document: IdaiFieldDocument) => this.navigationPathManager.setMainTypeDocument(document);


    public async populate(): Promise<any> {

        this.documents = await this.fetchDocuments(
            MainTypeDocumentsManager.makeMainTypeQuery(this.resourcesState.getViewType()));

        if (this.documents.length === 0) return this.resourcesState.setMainTypeDocument(undefined);

        await this.restoreLastSelectedOperationTypeDocument();
    }


    public selectLinkedOperationTypeDocumentForSelectedDocument(
        selectedDocument: IdaiFieldDocument|undefined) {

        if (!this.documents || this.documents.length === 0) return;

        const operationTypeDocument = MainTypeDocumentsManager.getMainTypeDocumentForDocument(
            selectedDocument, this.documents);

        if (operationTypeDocument && operationTypeDocument != this.resourcesState.getMainTypeDocument()) {
            this.select(operationTypeDocument);
        }
    }


    public isRecordedInSelectedOperationTypeDocument(document: IdaiFieldDocument|undefined): boolean {

        if (document) return false;
        if (!this.resourcesState.getMainTypeDocument()) return false;

        const operationTypeDocumentForDocument
            = MainTypeDocumentsManager.getMainTypeDocumentForDocument(document, this.documents);

        if (!operationTypeDocumentForDocument) {
            console.error('Could not find main type document for selected document', document);
            return false;
        }

        return (operationTypeDocumentForDocument.resource.id != (this.resourcesState.getMainTypeDocument() as any).resource.id);
    }


    private async fetchDocuments(query: Query): Promise<any> {

        try {
            const result = await this.datastore.find(query as any);
            if (result) return result.documents;
        } catch (errWithParams) {
            MainTypeDocumentsManager.handleFindErr(errWithParams, query);
        }
    }


    private selectFirstOperationTypeDocumentFromList() {

        if (this.documents && this.documents.length > 0) {
            this.resourcesState.setMainTypeDocument(this.documents[0]);
        } else {
            console.warn('cannot set selectedMainTypeDocument because mainTypeDocuments is empty')
        }
    };


    private async restoreLastSelectedOperationTypeDocument(): Promise<any> {

        const mainTypeDocument = this.resourcesState.getMainTypeDocument();
        if (!mainTypeDocument) {
            this.selectFirstOperationTypeDocumentFromList();
        } else {
            try {
                const document = await this.datastore.get(mainTypeDocument.resource.id as string);
                this.resourcesState.setMainTypeDocument(document);
            } catch(e) {
                this.resourcesState.removeActiveLayersIds();
                this.navigationPathManager.setMainTypeDocument(undefined);
                this.selectFirstOperationTypeDocumentFromList();
            }
        }
    }


    private static getMainTypeDocumentForDocument(document: IdaiFieldDocument|undefined,
                                                  mainTypeDocuments: IdaiFieldDocument[]): IdaiFieldDocument|undefined {

        if (!mainTypeDocuments) return undefined;
        if (!document) return undefined;

        for (let documentId of document.resource.relations.isRecordedIn) {
            for (let mainTypeDocument of mainTypeDocuments) {
                if (mainTypeDocument.resource.id == documentId) return mainTypeDocument as IdaiFieldDocument;
            }
        }
    }


    private static handleFindErr(errWithParams: Array<string>, query: Query) {

        console.error('Error with find. Query:', query);
        if (errWithParams.length == 2) console.error('Error with find. Cause:', errWithParams[1]);
    }


    private static makeMainTypeQuery(mainType: string): Query {

        return { types: [mainType] };
    }
}