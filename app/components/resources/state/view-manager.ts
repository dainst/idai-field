import {Observer} from 'rxjs/Observer';
import {Observable} from 'rxjs/Observable';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {ResourcesState} from './resources-state';
import {NavigationPath} from '../navigation-path';
import {ModelUtil} from '../../../core/model/model-util';
import {IdaiFieldDocumentReadDatastore} from '../../../core/datastore/idai-field-document-read-datastore';
import {is, takeUntil} from '../../../util/fp-util';

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


    public getNavigationPath(mainTypeDocumentId: string): NavigationPath {

        const navigationPath = this.resourcesState.getNavigationPath();
        return navigationPath ? navigationPath : { elements: [] };
    }


    public setNavigationPath(document: IdaiFieldDocument) {

        const navigationPath = ViewManager.makeNewNavigationPath(
            this.resourcesState.getNavigationPath(), document);

        const selectedMainTypeDocument: IdaiFieldDocument|undefined = this.resourcesState.getSelectedOperationTypeDocument();
        if (!selectedMainTypeDocument || !selectedMainTypeDocument.resource.id) return;

        this.resourcesState.setNavigationPath(navigationPath);
        this.notifyNavigationPathObservers(selectedMainTypeDocument.resource.id as string);
    }


    public setLastSelectedOperationTypeDocumentId(selectedMainTypeDocumentResource: IdaiFieldDocument|undefined) {

        if (!selectedMainTypeDocumentResource) return;
        this.resourcesState.setSelectedOperationTypeDocumentId(selectedMainTypeDocumentResource);

        this.notifyNavigationPathObservers(selectedMainTypeDocumentResource.resource.id as string);
    }


    public setupNavigationPath(mainTypeDocumentId: string) {

        this.notifyNavigationPathObservers(mainTypeDocumentId);
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
        this.notifyNavigationPathObservers((this.resourcesState.getSelectedOperationTypeDocument() as any).resource.id)
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


    private static makeNewNavigationPath(
        oldNavigationPath: NavigationPath,
        document: IdaiFieldDocument): NavigationPath {

        return (document)
            ? {
                elements: this.rebuildElements(
                    oldNavigationPath.elements,
                    oldNavigationPath.rootDocument,
                    document),
                rootDocument: document
            }
            : {
                elements: oldNavigationPath.elements
                // rootDocument <- undefined, because no document
            }
    }


    private static rebuildElements(oldElements: Array<IdaiFieldDocument>, oldRoot: IdaiFieldDocument|undefined,
                                   newRoot: IdaiFieldDocument) {

        if (oldElements.indexOf(newRoot) !== -1) return oldElements;

        return (oldRoot ? takeUntil(is(oldRoot))(oldElements) : []).concat([newRoot]);
    }
}