import {Observer} from 'rxjs/Observer';
import {Observable} from 'rxjs/Observable';
import {IdaiFieldDocument} from 'idai-components-2/field';
import {IdaiFieldDocumentReadDatastore} from '../../../core/datastore/field/idai-field-document-read-datastore';
import {ObserverUtil} from '../../../util/observer-util';
import {ResourcesStateManager} from './resources-state-manager';
import {NavigationPath} from './state/navigation-path';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class NavigationPathManager {

    private navigationPathObservers: Array<Observer<NavigationPath>> = [];

    constructor(private resourcesState: ResourcesStateManager,
                private datastore: IdaiFieldDocumentReadDatastore) {}


    public navigationPathNotifications = (): Observable<NavigationPath> =>
        ObserverUtil.register(this.navigationPathObservers);


    public setDisplayHierarchy(displayHierarchy: boolean) {

        this.resourcesState.setDisplayHierarchy(displayHierarchy);
        this.notify();
    }


    public setBypassOperationTypeSelection(bypassOperationTypeSelection: boolean) {

        this.resourcesState.setBypassOperationTypeSelection(bypassOperationTypeSelection);
        this.notify();
    }


    public async moveInto(document: IdaiFieldDocument|undefined) {

        const invalidSegment = await NavigationPath.findInvalidSegment(
            this.resourcesState.getMainTypeDocumentResourceId(),
            this.resourcesState.getNavigationPath(),
            async (resourceId: string) => (await this.datastore.find({ q: '',
                        constraints: { 'id:match': resourceId }})).totalCount !== 0);

        const validatedNavigationPath = invalidSegment
            ? NavigationPath.shorten(this.resourcesState.getNavigationPath(), invalidSegment)
            : this.resourcesState.getNavigationPath();

        const updatedNavigationPath = NavigationPath.setNewSelectedSegmentDoc(validatedNavigationPath, document);
        this.resourcesState.setNavigationPath(updatedNavigationPath);
        this.notify();
    }


    public async rebuildNavigationPath() {

        const segment = NavigationPath.getSelectedSegment(this.getNavigationPath());
        await this.moveInto(segment ? segment.document : undefined);
    }


    public setMainTypeDocument(selectedMainTypeDocumentResourceId: string|undefined) {

        if (!this.resourcesState.getDisplayHierarchy()) this.resourcesState.setBypassOperationTypeSelection(false);
        if (selectedMainTypeDocumentResourceId) this.resourcesState.setMainTypeDocument(selectedMainTypeDocumentResourceId);
        this.notify();
    }


    public async updateNavigationPathForDocument(document: IdaiFieldDocument) {

        if (!NavigationPath.isPartOfNavigationPath(document, this.getNavigationPath(), this.resourcesState.getMainTypeDocumentResourceId())) {
            await this.createNavigationPathForDocument(document);
        }
    }


    public getNavigationPath(): NavigationPath {

        if (this.resourcesState.isInOverview()) return NavigationPath.empty();
        if (!this.resourcesState.getMainTypeDocumentResourceId()) return NavigationPath.empty();

        return this.resourcesState.getNavigationPath();
    }


    private notify() {

        ObserverUtil.notify(this.navigationPathObservers, this.getNavigationPath());
    }


    private async createNavigationPathForDocument(document: IdaiFieldDocument) {

        const segments = await NavigationPath.makeSegments(document, resourceId => this.datastore.get(resourceId));
        if (segments.length == 0) return await this.moveInto(undefined);

        const navPath = NavigationPath.replaceSegmentsIfNecessary(
            this.resourcesState.getNavigationPath(), segments, segments[segments.length - 1].document.resource.id);

        this.resourcesState.setNavigationPath(navPath);
        this.notify();
    }
}
