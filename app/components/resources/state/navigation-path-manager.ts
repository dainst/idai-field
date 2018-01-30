import {Observer} from 'rxjs/Observer';
import {Observable} from 'rxjs/Observable';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {ResourcesState} from './resources-state';
import {NavigationPath} from './navigation-path';
import {ModelUtil} from '../../../core/model/model-util';
import {IdaiFieldDocumentReadDatastore} from '../../../core/datastore/idai-field-document-read-datastore';
import {notify} from '../../../util/observer-util';
import {includedIn, takeUntil} from '../../../util/list-util';
import {NavigationPathInternal, NavigationPathSegment, isSameSegment, toDocument} from './navigation-path-internal';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class NavigationPathManager {

    private navigationPathObservers: Array<Observer<NavigationPath>> = [];


    constructor(private resourcesState: ResourcesState,
                private datastore: IdaiFieldDocumentReadDatastore) {
    }


    /**
     * @param document set undefined to make rootElement of navigation path undefined
     */
    public moveInto(document: IdaiFieldDocument|undefined) {

        const result: NavigationPathInternal = NavigationPathManager.makeNewNavigationPath(
            this.resourcesState.getNavigationPathInternal(), document);

        this.resourcesState.setNavigationPathInternal(result);

        notify(this.navigationPathObservers, this.resourcesState.getNavigationPath());
    }


    public setNavigationPath(newNavigationPath: NavigationPath) {

        const currentNavigationPath: NavigationPathInternal
            = this.resourcesState.getNavigationPathInternal();
        const currentNavigationPathResourceIds: Array<string> = currentNavigationPath.elements
            .map(element => element.document.resource.id as string);

        const result: NavigationPathInternal = {
            elements: [],
            rootDocument: newNavigationPath.rootDocument,
            q: currentNavigationPath.q,
            types: currentNavigationPath.types
        };

        if (!newNavigationPath.rootDocument ||
            currentNavigationPathResourceIds.indexOf(newNavigationPath.rootDocument.resource.id as string) > -1) {
            result.elements = currentNavigationPath.elements;
        } else {
            for (let document of newNavigationPath.elements) {
                const index: number = currentNavigationPathResourceIds.indexOf(document.resource.id as string);
                result.elements.push(index > -1 ?
                    currentNavigationPath.elements[index] :
                    {document: document}
                );
            }
        }

        this.resourcesState.setNavigationPathInternal(result);

        notify(this.navigationPathObservers, this.resourcesState.getNavigationPath());
    }


    public setMainTypeDocument(selectedMainTypeDocumentResource: IdaiFieldDocument | undefined) {

        if (!selectedMainTypeDocumentResource) return;
        this.resourcesState.setMainTypeDocument(selectedMainTypeDocumentResource);

        notify(this.navigationPathObservers, this.resourcesState.getNavigationPath());
    }


    public async updateNavigationPathForDocument(document: IdaiFieldDocument) {

        if (!this.isCorrectNavigationPathFor(document)) {
            await this.createNavigationPathForDocument(document);
        }
    }


    public navigationPathNotifications(): Observable<NavigationPath> {

        return Observable.create((observer: Observer<NavigationPath>) => {
            this.navigationPathObservers.push(observer);
        });
    }


    private isCorrectNavigationPathFor(document: IdaiFieldDocument): boolean {

        const navigationPath = this.resourcesState.getNavigationPath();

        if (navigationPath.rootDocument && ModelUtil.hasRelationTarget(document, 'liesWithin',
                navigationPath.rootDocument.resource.id as string)) {
            return true;
        }

        const mainTypeDocument = this.resourcesState.getMainTypeDocument();

        return (!navigationPath.rootDocument && (mainTypeDocument != undefined)
                && ModelUtil.hasRelationTarget(document, 'isRecordedIn',
                    mainTypeDocument.resource.id as string)
                && !ModelUtil.hasRelations(document, 'liesWithin'));
    }


    private async createNavigationPathForDocument(document: IdaiFieldDocument) {

        const elements: Array<IdaiFieldDocument> = [];

        let currentResourceId = ModelUtil.getRelationTargetId(document, 'liesWithin', 0);
        while (currentResourceId) {
            const currentDocument: IdaiFieldDocument = await this.datastore.get(currentResourceId);
            elements.unshift(currentDocument);
            currentResourceId = ModelUtil.getRelationTargetId(currentDocument, 'liesWithin', 0);
        }

        if (elements.length == 0) {
            this.moveInto(undefined);
        } else {
            this.setNavigationPath({ elements: elements, rootDocument: elements[elements.length - 1]});
        }
    }


    private static makeNewNavigationPath(
        oldNavigationPath: NavigationPathInternal,
        newRootDocument: IdaiFieldDocument|undefined): NavigationPathInternal {

        return (newRootDocument)
            ? {
                elements: this.rebuildElements(
                    oldNavigationPath.elements,
                    oldNavigationPath.rootDocument,
                    newRootDocument),
                rootDocument: newRootDocument,
                q: oldNavigationPath.q,
                types: oldNavigationPath.types
            }
            : {
                elements: oldNavigationPath.elements,
                // rootDocument <- undefined, because no document
                q: oldNavigationPath.q,
                types: oldNavigationPath.types
            }
    }


    private static rebuildElements(oldElements: Array<NavigationPathSegment>, oldRoot: IdaiFieldDocument|undefined,
                                   newRoot: IdaiFieldDocument) {

        if (includedIn(oldElements.map(toDocument))(newRoot)) return oldElements;

        return (oldRoot ? takeUntil(isSameSegment(oldRoot))(oldElements) : []).concat([{document: newRoot}]);
    }
}

