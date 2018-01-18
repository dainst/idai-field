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
 * @author Sebastian Cuy
 */
export class ViewManager {



    private navigationPathObservers: Array<Observer<NavigationPath>> = [];


    constructor(
        private resourcesState: ResourcesState,
        private datastore: IdaiFieldDocumentReadDatastore) {
    }


    public getViewType() {

        if (this.resourcesState.isInOverview()) return 'Project';
        return this.resourcesState.getTypeForName(this.resourcesState.getView());
    }


    public getNavigationPath(mainTypeDocumentId: string): NavigationPath {

        const navigationPath = this.resourcesState.getNavigationPath();
        return navigationPath ? navigationPath : { elements: [] };
    }


    public setNavigationPath(mainTypeDocumentId: string, navigationPath: NavigationPath) {

        this.resourcesState.setNavigationPath(navigationPath);
        this.notifyNavigationPathObservers(mainTypeDocumentId);
    }


    public setLastSelectedOperationTypeDocumentId(selectedMainTypeDocumentResource: IdaiFieldDocument|undefined) {

        if (!selectedMainTypeDocumentResource) return;
        this.resourcesState.setSelectedOperationTypeDocumentId(selectedMainTypeDocumentResource);

        this.notifyNavigationPathObservers(selectedMainTypeDocumentResource.resource.id as string);
    }


    public getLastSelectedOperationTypeDocumentId() {

        return this.resourcesState.getSelectedOperationTypeDocument();
    }


    public initialize(defaultMode?: any)  {

        return this.resourcesState.initialize(defaultMode);
    }


    public setupView(viewName: string, defaultMode: string): Promise<any> {

        return ((!this.resourcesState.getView() || viewName != this.resourcesState.getView())
            ? this.initializeView(viewName)

            // TODO simplify this branch
            : Promise.resolve()).then(() => {
                return this.initialize(defaultMode ? 'map' : undefined);
            });
    }


    public setupNavigationPath(mainTypeDocumentId: string) {

        this.notifyNavigationPathObservers(mainTypeDocumentId);
    }


    public async createNavigationPathForDocument(document: IdaiFieldDocument, mainTypeDocumentId: string) {

        const navigationPath: NavigationPath = { elements: [] };

        let currentResourceId = ModelUtil.getRelationTargetId(document, 'liesWithin', 0);

        while (currentResourceId) {
            const currentDocument: IdaiFieldDocument = await this.datastore.get(currentResourceId);
            navigationPath.elements.unshift(currentDocument);
            if (!navigationPath.rootDocument) navigationPath.rootDocument = currentDocument;

            currentResourceId = ModelUtil.getRelationTargetId(currentDocument, 'liesWithin', 0);
        }

        this.setNavigationPath(mainTypeDocumentId, navigationPath);
        this.notifyNavigationPathObservers(mainTypeDocumentId);
    }


    public navigationPathNotifications(): Observable<NavigationPath> {

        return Observable.create((observer: Observer<NavigationPath>) => {
            this.navigationPathObservers.push(observer);
        });
    }


    private notifyNavigationPathObservers(mainTypeDocumentId: string) {

        if (this.navigationPathObservers) {
            const navigationPath: NavigationPath = this.getNavigationPath(mainTypeDocumentId);

            this.navigationPathObservers.forEach(
                (observer: Observer<NavigationPath>) => observer.next(navigationPath)
            );
        }
    }


    private async initializeView(viewName: string): Promise<any> {

        this.resourcesState.setView(viewName);
    }
}