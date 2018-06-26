import {Observer} from 'rxjs/Observer';
import {Observable} from 'rxjs/Observable';
import {Document} from 'idai-components-2/core';
import {IdaiFieldDocument} from 'idai-components-2/field';
import {ResourcesState} from './resources-state';
import {FlatNavigationPath} from './navpath/flat-navigation-path';
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

    private navigationPathObservers: Array<Observer<FlatNavigationPath>> = [];
    private segmentValidator: SegmentValidator;

    constructor(private resourcesState: ResourcesState,
                private datastore: IdaiFieldDocumentReadDatastore) {

        this.segmentValidator = new SegmentValidator(datastore);
    }


    public navigationPathNotifications = (): Observable<FlatNavigationPath> =>
        ObserverUtil.register(this.navigationPathObservers);


    public setDisplayHierarchy(displayHierarchy: boolean) {

        this.resourcesState.setDisplayHierarchy(displayHierarchy);
        this.notify();
    }


    /**
     * Moves the 'root' within or adds a 'root' to a navigation path.
     *
     * Let's say document1 corresponds to segment1 etc.
     * and we have a navigation path with an optional root (V)
     *
     *               V
     * SEGMENT1, SEGMENT2, SEGMENT3
     *
     * moveInto(document4) changes the situation to
     * 
     *                             V
     * NP: SEGMENT1, SEGMENT2, SEGMENT4
     *
     * from there, moveInto(document5) changes the situation to
     *
     *                                   V
     * SEGMENT1, SEGMENT2, SEGMENT4, SEGMENT5
     *
     * from there, moveInto(document1) changes the situation to
     *
     *     V
     * SEGMENT1, SEGMENT2, SEGMENT4, SEGMENT5
     *
     * from there, moveInto(undefined) changes the situation to
     *
     * (NO ROOT)
     * SEGMENT1, SEGMENT2, SEGMENT4, SEGMENT5
     *
     * @param document set undefined to make rootElement of navigation path undefined
     */
    public async moveInto(document: IdaiFieldDocument|undefined) {

        const invalidSegment = await this.segmentValidator.findInvalidSegment(
            this.resourcesState.getMainTypeDocumentResourceId(), this.resourcesState.getNavigationPath());
        const validatedNavigationPath = invalidSegment
            ? NavigationPathManager.repair(this.resourcesState.getNavigationPath(), invalidSegment)
            : this.resourcesState.getNavigationPath();

        const updatedNavigationPath = NavigationPath.setNewSelectedSegmentDoc(validatedNavigationPath, document);
        this.resourcesState.setNavigationPath(updatedNavigationPath);
        this.notify();
    }


    public async rebuildNavigationPath() {

        await this.moveInto(FlatNavigationPath.getSelectedSegmentDoc(this.getFlatNavigationPath()));
    }


    public setMainTypeDocument(selectedMainTypeDocumentResourceId: string|undefined) {

        if (selectedMainTypeDocumentResourceId) this.resourcesState.setMainTypeDocument(selectedMainTypeDocumentResourceId);
        this.notify();
    }


    public async updateNavigationPathForDocument(document: IdaiFieldDocument) {

        if (!this.isPartOfNavigationPath(document)) await this.createNavigationPathForDocument(document);
    }


    public getFlatNavigationPath(): FlatNavigationPath {

        if (this.resourcesState.isInOverview()) return NavigationPath.empty();
        if (!this.resourcesState.getMainTypeDocumentResourceId()) return NavigationPath.empty();

        return NavigationPath.toFlatNavigationPath(this.resourcesState.getNavigationPath());
    }


    private notify() {

        ObserverUtil.notify(this.navigationPathObservers, this.getFlatNavigationPath());
    }


    private isPartOfNavigationPath(document: IdaiFieldDocument): boolean {

        const navigationPath = this.getFlatNavigationPath();

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


    private static repair(navigationPath: NavigationPath,
                          invalidSegment: NavigationPathSegment): NavigationPath {

        const repairedNavigationPath = ObjectUtil.cloneObject(navigationPath);

        repairedNavigationPath.segments = takeWhile(differentFrom(invalidSegment))(navigationPath.segments);

        if (navigationPath.selectedSegmentId === invalidSegment.document.resource.id) {
            repairedNavigationPath.selectedSegmentId = undefined;
        }

        return repairedNavigationPath;
    }


    private static segmentNotPresentInOldNavPath(segmentId: string, oldNavPath: NavigationPath) {

        return !segmentId || oldNavPath.segments.map(toResourceId).includes(segmentId);
    }
}
