import {Observer} from 'rxjs/Observer';
import {Observable} from 'rxjs/Observable';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {ResourcesState} from './resources-state';
import {NavigationPath} from './navigation-path';
import {ModelUtil} from '../../../core/model/model-util';
import {IdaiFieldDocumentReadDatastore} from '../../../core/datastore/idai-field-document-read-datastore';
import {inform} from '../../../util/observer-util';

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class NavigationPathManager {

    private navigationPathObservers: Array<Observer<NavigationPath>> = [];


    constructor(private resourcesState: ResourcesState,
                private datastore: IdaiFieldDocumentReadDatastore) {
    }


    public moveInto(document: IdaiFieldDocument|undefined) {

        this.resourcesState.moveInto(document);
        this.notifyNavigationPathObservers();
    }


    public setMainTypeDocument(selectedMainTypeDocumentResource: IdaiFieldDocument | undefined) {

        if (!selectedMainTypeDocumentResource) return;
        this.resourcesState.setMainTypeDocument(selectedMainTypeDocumentResource);

        this.notifyNavigationPathObservers();
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


    public notifyNavigationPathObservers() {

        if (!this.navigationPathObservers) return;

        this.navigationPathObservers.forEach(inform(this.resourcesState.getNavigationPath()));
    }


    private isCorrectNavigationPathFor(document: IdaiFieldDocument): boolean {

        const navigationPath: NavigationPath = this.resourcesState.getNavigationPath();

        if (navigationPath.rootDocument && ModelUtil.hasRelationTarget(document, 'liesWithin',
                navigationPath.rootDocument.resource.id as string)) {
            return true;
        }

        const mainTypeDocument: IdaiFieldDocument | undefined = this.resourcesState.getMainTypeDocument();

        if (!navigationPath.rootDocument && mainTypeDocument
                && ModelUtil.hasRelationTarget(document, 'isRecordedIn',
                    mainTypeDocument.resource.id as string)
                && !ModelUtil.hasRelations(document, 'liesWithin')) {
            return true;
        }

        return false;
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
            this.resourcesState.moveInto(undefined);
        } else {
            this.resourcesState.setNavigationPath({ elements: elements, rootDocument: elements[elements.length - 1]});
        }

        this.notifyNavigationPathObservers();
    }
}

