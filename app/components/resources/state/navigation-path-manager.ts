import {Observer} from 'rxjs/Observer';
import {Observable} from 'rxjs/Observable';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {ResourcesState} from './resources-state';
import {NavigationPath} from '../navigation-path';
import {ModelUtil} from '../../../core/model/model-util';
import {IdaiFieldDocumentReadDatastore} from '../../../core/datastore/idai-field-document-read-datastore';

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class NavigationPathManager {


    private navigationPathObservers: Array<Observer<NavigationPath>> = [];


    constructor(
        private resourcesState: ResourcesState,
        private datastore: IdaiFieldDocumentReadDatastore) {
    }


    public getNavigationPath(mainTypeDocumentId: string): NavigationPath {

        const navigationPath = this.resourcesState.getNavigationPath();
        return navigationPath ? navigationPath : { elements: [] };
    }


    public setNavigationPath(document: IdaiFieldDocument) {

        this.resourcesState.moveInto(document);
        this.notifyNavigationPathObservers();
    }


    public setLastSelectedOperationTypeDocumentId(selectedMainTypeDocumentResource: IdaiFieldDocument|undefined) {

        if (!selectedMainTypeDocumentResource) return;
        this.resourcesState.setSelectedOperationTypeDocumentId(selectedMainTypeDocumentResource);

        this.notifyNavigationPathObservers();
    }


    public async createNavigationPathForDocument(document: IdaiFieldDocument) {


        const navigationPath: NavigationPath = { elements: [] };

        let currentResourceId = ModelUtil.getRelationTargetId(document, 'liesWithin', 0);


        while (currentResourceId) {
            const currentDocument: IdaiFieldDocument = await this.datastore.get(currentResourceId);
            navigationPath.elements.unshift(currentDocument);
            if (!navigationPath.rootDocument) navigationPath.rootDocument = currentDocument;

            currentResourceId = ModelUtil.getRelationTargetId(currentDocument, 'liesWithin', 0);
        }

        this.resourcesState.setNavigationPath(navigationPath);


        this.notifyNavigationPathObservers();
    }


    public navigationPathNotifications(): Observable<NavigationPath> {

        return Observable.create((observer: Observer<NavigationPath>) => {
            this.navigationPathObservers.push(observer);
        });
    }


    public notifyNavigationPathObservers() {

        const mainTypeDoc = this.resourcesState.getSelectedOperationTypeDocument();
        if (!mainTypeDoc) return;

        if (!this.navigationPathObservers) return;

        const navigationPath: NavigationPath = this.getNavigationPath(mainTypeDoc.resource.id as string);

        this.navigationPathObservers.forEach(
            (observer: Observer<NavigationPath>) => observer.next(navigationPath)
        );
    }
}