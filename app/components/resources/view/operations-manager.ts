import {FieldDocument, Query} from 'idai-components-2';
import {FieldReadDatastore} from '../../../core/datastore/field/field-read-datastore';
import {ResourcesStateManager} from './resources-state-manager';
import {ResourcesState} from './state/resources-state';

/**
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 */
export class OperationsManager {

    private documents: Array<FieldDocument>;


    constructor(
        private datastore: FieldReadDatastore,
        private resourcesStateManager: ResourcesStateManager
    ) {}

    
    public getDocuments = () => this.documents;


    public async populate(): Promise<void> {

        if (this.resourcesStateManager.isInOverview()) return this.resourcesStateManager.setMainTypeDocument('project');

        // TODO
        // this.documents = await this.fetchDocuments({ types: [
        //         this.resourcesStateManager.getViewType() as string // cast ok because we populate only when not in overview
        //     ]});
        //
        // if (this.documents.length === 0) return this.resourcesStateManager.setMainTypeDocument(undefined);
        //
        // await this.restoreLastSelectedOperationTypeDocument();
    }


    public selectLinkedOperationForSelectedDocument(
        selectedDocument: FieldDocument|undefined) {

        if (!this.documents || this.documents.length === 0) return;

        const operationTypeDocument = OperationsManager.getMainTypeDocumentForDocument(
            selectedDocument, this.documents);

        if (operationTypeDocument && operationTypeDocument.resource.id
                !== this.resourcesStateManager.get().view) {

            this.resourcesStateManager.setMainTypeDocument(operationTypeDocument.resource.id);
        }
    }


    public async getAllOperations(): Promise<Array<FieldDocument>> {

        // TODO
        // const viewMainTypes = this.resourcesStateManager.getViews()
        //     .map((view: any) => {return view.operationSubtype});
        //
        let operations: Array<FieldDocument> = [];
        //
        // for (let viewMainType of viewMainTypes) {
        //     if (viewMainType === 'Project') continue;
        //
        //     operations = operations.concat(
        //         (await this.datastore.find({ types: [viewMainType] })).documents);
        // }

        return operations;
    }


    private async fetchDocuments(query: Query): Promise<any> {

        try {
            const result = await this.datastore.find(query as any);
            if (result) return result.documents;
        } catch (errWithParams) {
            OperationsManager.handleFindErr(errWithParams, query);
        }
    }


    private selectFirstOperationFromList() {

        if (this.documents && this.documents.length > 0) {
            this.resourcesStateManager.setMainTypeDocument(this.documents[0].resource.id);
        } else {
            console.warn('cannot set selectedMainTypeDocument because mainTypeDocuments is empty')
        }
    };


    private async restoreLastSelectedOperationTypeDocument(): Promise<void> {

        const mainTypeDocumentResourceId = this.resourcesStateManager.get().view;
        if (!mainTypeDocumentResourceId) {
            this.selectFirstOperationFromList();
        } else {
            try {
                const document = await this.datastore.get(mainTypeDocumentResourceId);
                this.resourcesStateManager.setMainTypeDocument(document.resource.id);
            } catch(e) {
                this.resourcesStateManager.removeActiveLayersIds();
                this.selectFirstOperationFromList();
            }
        }
    }


    private static getMainTypeDocumentForDocument(document: FieldDocument|undefined,
                                                  mainTypeDocuments: FieldDocument[]): FieldDocument|undefined {

        if (!mainTypeDocuments) return undefined;
        if (!document) return undefined;

        for (let documentId of document.resource.relations.isRecordedIn) {
            for (let mainTypeDocument of mainTypeDocuments) {
                if (mainTypeDocument.resource.id == documentId) return mainTypeDocument as FieldDocument;
            }
        }
    }


    private static handleFindErr(errWithParams: Array<string>, query: Query) {

        console.error('Error with find. Query:', query);
        if (errWithParams.length == 2) console.error('Error with find. Cause:', errWithParams[1]);
    }
}