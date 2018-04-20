import {Observer} from 'rxjs/Observer';
import {Observable} from 'rxjs/Observable';
import {Query} from 'idai-components-2/core';
import {Document} from 'idai-components-2/core';
import {IdaiFieldDocument} from 'idai-components-2/field';
import {MainTypeDocumentsManager} from './main-type-documents-manager';
import {NavigationPathManager} from './navigation-path-manager';
import {SettingsService} from '../../../core/settings/settings-service';
import {ChangeHistoryUtil} from '../../../core/model/change-history-util';
import {IdaiFieldDocumentReadDatastore} from '../../../core/datastore/field/idai-field-document-read-datastore';
import {RemoteChangesStream} from '../../../core/datastore/core/remote-changes-stream';
import {ResourcesState} from './resources-state';
import {ObserverUtil} from '../../../util/observer-util';
import {hasEqualId, hasId} from '../../../core/model/model-util';
import {includedIn, subtract, isNot} from 'tsfun';
import {ObjectUtil} from '../../../util/object-util';


/**
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 */
export class DocumentsManager {

    public projectDocument: Document;
    private documents: Array<Document>;
    private newDocumentsFromRemote: Array<Document> = [];

    private deselectionObservers: Array<Observer<Document>> = [];
    private populateDocumentsObservers: Array<Observer<Array<Document>>> = [];


    constructor(
        private datastore: IdaiFieldDocumentReadDatastore,
        private remoteChangesStream: RemoteChangesStream,
        private settingsService: SettingsService,
        private navigationPathManager: NavigationPathManager,
        private mainTypeDocumentsManager: MainTypeDocumentsManager,
        private resourcesState: ResourcesState
    ) {
        remoteChangesStream.notifications().subscribe(document => this.handleChange(document));
    }


    public getDocuments = () => this.documents;

    public getSelectedDocument = () => this.resourcesState.getSelectedDocument();

    public removeFromDocuments = (document: Document) => this.documents = subtract([document])(this.documents);

    public isNewDocumentFromRemote = (document: Document) => this.newDocumentsFromRemote.indexOf(document) > -1;

    public deselectionNotifications = (): Observable<Document> => ObserverUtil.register(this.deselectionObservers);

    public populateDocumentsNotifactions = (): Observable<Array<Document>> =>
        ObserverUtil.register(this.populateDocumentsObservers);


    public async populateProjectDocument(): Promise<void> {

        try {
            this.projectDocument = await this.datastore.get(this.settingsService.getSelectedProject() as any);
        } catch (_) {
            console.log('cannot find project document')
        }
    }


    public async setQueryString(q: string) {

        this.resourcesState.setQueryString(q);
        await this.populateAndDeselectIfNecessary();
    }


    public async setTypeFilters(types: string[]) {

        this.resourcesState.setTypeFilters(types);
        await this.populateAndDeselectIfNecessary();
    }


    public async moveInto(document: IdaiFieldDocument|undefined) {

        await this.navigationPathManager.moveInto(document);
        await this.populateAndDeselectIfNecessary();
    }


    public deselect() {

        if (this.resourcesState.getSelectedDocument()) {

            this.selectAndNotify(undefined);
            this.documents = this.documents.filter(hasId);
            this.resourcesState.setActiveDocumentViewTab(undefined);
        }
    }


    public addNewDocument(document: IdaiFieldDocument) {

        this.documents.unshift(document);
        this.selectAndNotify(document);
    }


    public async setSelected(documentToSelect: IdaiFieldDocument): Promise<any> {

        this.documents = this.documents.filter(hasId);
        this.newDocumentsFromRemote =
            subtract([documentToSelect as Document])(this.newDocumentsFromRemote);

        if (!(await this.createUpdatedDocumentList()).find(hasEqualId(documentToSelect))) {
            await this.makeSureSelectedDocumentAppearsInList(documentToSelect);
            await this.populateDocumentList();
        }
        this.selectAndNotify(documentToSelect);
    }


    private selectAndNotify(document: IdaiFieldDocument|undefined) {

        if (this.resourcesState.getSelectedDocument()) {
            ObserverUtil.notify(this.deselectionObservers, this.resourcesState.getSelectedDocument());
        }
        this.resourcesState.setSelectedDocument(document);
    }


    private async populateAndDeselectIfNecessary() {

        await this.populateDocumentList();
        if (!this.documents.find(hasEqualId(this.resourcesState.getSelectedDocument()))) this.deselect();
    }


    private async handleChange(changedDocument: Document) {

        if (!this.documents) return;
        if (this.documents.find(hasEqualId(changedDocument))) return;

        if (changedDocument.resource.type == this.resourcesState.getViewType()) {
            return this.mainTypeDocumentsManager.populate();
        }

        const oldDocuments = this.documents;
        await this.populateDocumentList();

        this.newDocumentsFromRemote = this.getNewRemoteDocuments(this.documents, oldDocuments);
    }


    public async populateDocumentList() {

        this.newDocumentsFromRemote = [];
        this.documents = await this.createUpdatedDocumentList();

        ObserverUtil.notify(this.populateDocumentsObservers, this.documents);
    }


    public async createUpdatedDocumentList(): Promise<Array<Document>> {

        const isRecordedInTarget = this.makeIsRecordedInTarget();
        if (!isRecordedInTarget) return [];

        return (await this.fetchDocuments(
                    this.makeDocsQuery(isRecordedInTarget.resource.id))
            ).filter(hasId);
    }


    private getNewRemoteDocuments(
        currentDocuments: Array<Document>,
        oldDocuments: Array<Document>) {

        return currentDocuments
            .filter(isNot(includedIn(oldDocuments)))
            .filter(async document =>
                ChangeHistoryUtil.isRemoteChange(
                    document,
                    await this.datastore.getConflictedRevisions(document.resource.id),
                    this.settingsService.getUsername())
            );
    }


    private makeIsRecordedInTarget(): Document|undefined {

        return this.resourcesState.isInOverview()
            ? this.projectDocument
            : this.resourcesState.getMainTypeDocument();
    }


    private async makeSureSelectedDocumentAppearsInList(documentToSelect: IdaiFieldDocument) {

        this.mainTypeDocumentsManager
            .selectLinkedOperationTypeDocumentForSelectedDocument(documentToSelect);

        await this.navigationPathManager
            .updateNavigationPathForDocument(documentToSelect);

        await this.adjustQuerySettingsIfNecessary(documentToSelect);
    }


    private async adjustQuerySettingsIfNecessary(documentToSelect: Document) {

        if (!(await this.updatedDocumentListContainsSelectedDocument(documentToSelect))) {

            this.resourcesState.setQueryString('');
            this.resourcesState.setTypeFilters([]);
        }
    }


    private async updatedDocumentListContainsSelectedDocument(documentToSelect: Document) {

        return (await this.createUpdatedDocumentList())
            .find(hasEqualId(documentToSelect))
    }


    private makeDocsQuery(mainTypeDocumentResourceId: string): Query {

        return {
            q: this.resourcesState.getQueryString(),
            constraints: this.makeConstraints(mainTypeDocumentResourceId),
            types: (this.resourcesState.getTypeFilters().length > 0)
                ? this.resourcesState.getTypeFilters()
                : undefined
        };
    }


    private async fetchDocuments(query: Query): Promise<any> {

        try {
            return (await this.datastore.find(query)).documents;
        } catch (errWithParams) {
            DocumentsManager.handleFindErr(errWithParams, query);
        }
    }


    private makeConstraints(mainTypeDocumentResourceId: string): { [name: string]: string}  {

        const rootDoc = this.navigationPathManager.getNavigationPath().rootDocument;

        const constraints: { [name: string]: string} =
            rootDoc
            ? { 'liesWithin:contain': rootDoc.resource.id}
            : { 'liesWithin:exist': 'UNKNOWN' };

        constraints['isRecordedIn:contain'] = mainTypeDocumentResourceId;
        return constraints;
    }


    private static handleFindErr(errWithParams: Array<string>, query: Query) {

        console.error('Error with find. Query:', query);
        if (errWithParams.length == 2) console.error('Error with find. Cause:', errWithParams[1]);
    }
}