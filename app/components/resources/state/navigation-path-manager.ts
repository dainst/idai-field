import {Observer} from 'rxjs/Observer';
import {Observable} from 'rxjs/Observable';
import {Document} from 'idai-components-2/core';
import {IdaiFieldDocument} from 'idai-components-2/field';
import {ResourcesState} from './resources-state';
import {ModelUtil} from '../../../core/model/model-util';
import {IdaiFieldDocumentReadDatastore} from '../../../core/datastore/field/idai-field-document-read-datastore';
import {ObserverUtil} from '../../../util/observer-util';
import {takeWhile} from 'tsfun';
import {NavigationPath} from './navpath/navigation-path';
import {
    differentFrom, NavigationPathSegment,
    toResourceId
} from './navpath/navigation-path-segment';
import {ObjectUtil} from '../../../util/object-util';
import {SegmentValidator} from './segment-validator';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class NavigationPathManager {

    private navigationPathObservers: Array<Observer<NavigationPath>> = [];
    private segmentValidator: SegmentValidator;

    constructor(private resourcesState: ResourcesState,
                private datastore: IdaiFieldDocumentReadDatastore) {

        this.segmentValidator = new SegmentValidator(datastore);
    }


    public navigationPathNotifications = (): Observable<NavigationPath> =>
        ObserverUtil.register(this.navigationPathObservers);


    public setDisplayHierarchy(displayHierarchy: boolean) {

        this.resourcesState.setDisplayHierarchy(displayHierarchy);
        this.notify();
    }


    public async moveInto(document: IdaiFieldDocument|undefined) {

        const invalidSegment = await this.segmentValidator.findInvalidSegment(
            this.resourcesState.getMainTypeDocumentResourceId(), this.resourcesState.getNavigationPath());
        const validatedNavigationPath = invalidSegment
            ? NavigationPathManager.shorten(this.resourcesState.getNavigationPath(), invalidSegment)
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

        const segments: Array<NavigationPathSegment> = [];

        let currentResourceId = ModelUtil.getRelationTargetId(document, 'liesWithin', 0);
        while (currentResourceId) {

            const currentSegmentDoc = await this.datastore.get(currentResourceId);
            currentResourceId = ModelUtil.getRelationTargetId(currentSegmentDoc, 'liesWithin', 0);

            segments.unshift( {document: currentSegmentDoc, q: '', types: []});
        }

        if (segments.length == 0) {
            await this.moveInto(undefined);
        } else {
            this.setNavigationPath(segments, segments[segments.length - 1].document.resource.id);
        }
    }


    private setNavigationPath(newSegments: NavigationPathSegment[], newSelectedSegmentId: string) {

        const updatedNavigationPath = ObjectUtil.cloneObject(this.resourcesState.getNavigationPath());

        if (!NavigationPathManager.segmentNotPresentInOldNavPath(
            newSelectedSegmentId, this.resourcesState.getNavigationPath())) {

            updatedNavigationPath.segments = newSegments;
        }
        updatedNavigationPath.selectedSegmentId = newSelectedSegmentId;

        this.resourcesState.setNavigationPath(updatedNavigationPath);
        this.notify();
    }


    private static shorten(navigationPath: NavigationPath,
                           firstToBeExcluded: NavigationPathSegment): NavigationPath {

        const shortenedNavigationPath = ObjectUtil.cloneObject(navigationPath);
        shortenedNavigationPath.segments = takeWhile(differentFrom(firstToBeExcluded))(navigationPath.segments);

        if (navigationPath.selectedSegmentId === firstToBeExcluded.document.resource.id) { // TODO should be: if selectedSegmentId is not contained in the surviving segments
            shortenedNavigationPath.selectedSegmentId = undefined;
        }

        return shortenedNavigationPath;
    }


    private static segmentNotPresentInOldNavPath(segmentId: string, oldNavPath: NavigationPath) {

        return !segmentId || oldNavPath.segments.map(toResourceId).includes(segmentId);
    }
}
