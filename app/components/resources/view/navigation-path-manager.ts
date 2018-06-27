import {Observer} from 'rxjs/Observer';
import {Observable} from 'rxjs/Observable';
import {Document} from 'idai-components-2/core';
import {IdaiFieldDocument} from 'idai-components-2/field';
import {ModelUtil} from '../../../core/model/model-util';
import {IdaiFieldDocumentReadDatastore} from '../../../core/datastore/field/idai-field-document-read-datastore';
import {ObserverUtil} from '../../../util/observer-util';
import {ObjectUtil} from '../../../util/object-util';
import {ResourcesStateManager} from './resources-state-manager';
import {NavigationPath} from './state/navigation-path';
import {NavigationPathSegment} from './state/navigation-path-segment';


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

        if (!this.isPartOfNavigationPath(document)) await this.createNavigationPathForDocument(document);
    }


    // TODO unit test that it returns a clone
    public getNavigationPath(): NavigationPath {

        if (this.resourcesState.isInOverview()) return NavigationPath.empty();
        if (!this.resourcesState.getMainTypeDocumentResourceId()) return NavigationPath.empty();

        return ObjectUtil.cloneObject(this.resourcesState.getNavigationPath());
    }


    private notify() {

        ObserverUtil.notify(this.navigationPathObservers, this.getNavigationPath());
    }


    // TODO rename and / or split into multiple methods since it does more than the name says
    private isPartOfNavigationPath(document: IdaiFieldDocument): boolean {

        const navigationPath = this.getNavigationPath();

        if (navigationPath.selectedSegmentId && Document.hasRelationTarget(document, 'liesWithin',
                navigationPath.selectedSegmentId)) {
            return true;
        }

        const mainTypeDocumentResourceId = this.resourcesState.getMainTypeDocumentResourceId();

        return (!navigationPath.selectedSegmentId && mainTypeDocumentResourceId != undefined
                && Document.hasRelationTarget(document, 'isRecordedIn',
                    mainTypeDocumentResourceId )
                && !Document.hasRelations(document, 'liesWithin'));
    }


    private async createNavigationPathForDocument(document: IdaiFieldDocument) {

        const segments = await NavigationPathManager.makeSegments(document, resourceId => this.datastore.get(resourceId));
        if (segments.length == 0) return await this.moveInto(undefined);

        const navPath = NavigationPathManager.replaceSegmentsIfNecessary(
            this.resourcesState.getNavigationPath(), segments, segments[segments.length - 1].document.resource.id);

        this.resourcesState.setNavigationPath(navPath);
        this.notify();
    }


    private static async makeSegments(document: IdaiFieldDocument, get: (_: string) => Promise<IdaiFieldDocument>) {

        const segments: Array<NavigationPathSegment> = [];

        let currentResourceId = ModelUtil.getRelationTargetId(document, 'liesWithin', 0);
        while (currentResourceId) {

            const currentSegmentDoc = await get(currentResourceId);
            currentResourceId = ModelUtil.getRelationTargetId(currentSegmentDoc, 'liesWithin', 0);

            segments.unshift( {document: currentSegmentDoc, q: '', types: []});
        }
        return segments;
    }


    private static replaceSegmentsIfNecessary(navPath:NavigationPath,
                                              newSegments: NavigationPathSegment[],
                                              newSelectedSegmentId: string): NavigationPath {

        const updatedNavigationPath = ObjectUtil.cloneObject(navPath);

        if (!NavigationPath.segmentNotPresent(navPath, newSelectedSegmentId)) updatedNavigationPath.segments = newSegments;

        updatedNavigationPath.selectedSegmentId = newSelectedSegmentId;
        return updatedNavigationPath;
    }
}
