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


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class NavigationPathManager {

    private navigationPathObservers: Array<Observer<FlatNavigationPath>> = [];


    constructor(private resourcesState: ResourcesState,
                private datastore: IdaiFieldDocumentReadDatastore) {}


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

        this.resourcesState.setNavigationPath(

            NavigationPath.setNewSelectedSegmentDoc(
                await this.validateAndRepair(this.resourcesState.getNavigationPath()),
                document
            )
        );

        this.notify();
    }


    public async rebuildNavigationPath() {

        const selectedSegmentDoc = this.getFlatNavigationPath().segments
            .find(_ => _.resource.id === this.getFlatNavigationPath().selectedSegmentId);

        await this.moveInto(selectedSegmentDoc);
    }


    public setMainTypeDocument(selectedMainTypeDocumentResourceId: string|undefined) {

        if (selectedMainTypeDocumentResourceId) {
            this.resourcesState.setMainTypeDocument(selectedMainTypeDocumentResourceId);
        }

        this.notify();
    }


    public async updateNavigationPathForDocument(document: IdaiFieldDocument) {

        if (!this.isPartOfNavigationPath(document)) {
            await this.createNavigationPathForDocument(document);
        }
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

        const elements: Array<IdaiFieldDocument> = [];

        let currentResourceId = ModelUtil.getRelationTargetId(document, 'liesWithin', 0);
        while (currentResourceId) {
            const currentDocument: IdaiFieldDocument = await this.datastore.get(currentResourceId);
            elements.unshift(currentDocument);
            currentResourceId = ModelUtil.getRelationTargetId(currentDocument, 'liesWithin', 0);
        }

        if (elements.length == 0) {
            await this.moveInto(undefined);
        } else {
            this.setNavigationPath({
                segments: elements,
                selectedSegmentId: elements[elements.length - 1].resource.id
            });
        }
    }


    private async findInvalidSegment(navigationPath: NavigationPath): Promise<NavigationPathSegment|undefined> {

        for (let segment of navigationPath.segments) {
            if (!await this.isValidSegment(segment, navigationPath.segments)) {
                return segment;
            }
        }

        return undefined;
    }


    private async isValidSegment(segment: NavigationPathSegment,
                                 segments: Array<NavigationPathSegment>): Promise<boolean> {

        return await this.hasExistingDocument(segment)
            && this.hasValidRelation(segment, segments);
    }


    private async hasExistingDocument(segment: NavigationPathSegment): Promise<boolean> {

        return (await this.datastore.find({
            q: '',
            constraints: { 'id:match': segment.document.resource.id }
        })).totalCount !== 0;
    }


    private hasValidRelation(segment: NavigationPathSegment, segments: Array<NavigationPathSegment>): boolean {

        const index: number = segments.indexOf(segment);
        const mainTypeDocumentResourceId = this.resourcesState.getMainTypeDocumentResourceId();

        return (index === 0)
            ? mainTypeDocumentResourceId !== undefined && Document.hasRelationTarget(segment.document,
                'isRecordedIn', mainTypeDocumentResourceId)
            : Document.hasRelationTarget(segment.document,
                'liesWithin', segments[index - 1].document.resource.id);
    }


    private setNavigationPath(newNavigationPath: FlatNavigationPath) {

        const currentNavigationPath = this.resourcesState.getNavigationPath();
        const newNavigationPathInternal = ObjectUtil.cloneObject(currentNavigationPath);

        if (!this.rootDocIncludedInCurrentNavigationPath(newNavigationPath)) {
            newNavigationPathInternal.segments =  NavigationPathManager.makeNavigationPathElements(
                newNavigationPath,
                currentNavigationPath
            );
        }
        newNavigationPathInternal.selectedSegmentId = newNavigationPath.selectedSegmentId;

        this.resourcesState.setNavigationPath(newNavigationPathInternal);
        this.notify();
    }


    private rootDocIncludedInCurrentNavigationPath(newNavigationPath: FlatNavigationPath) {

        return !newNavigationPath.selectedSegmentId ||
            this.resourcesState.getNavigationPath().segments.map(toResourceId)
                .includes(newNavigationPath.selectedSegmentId);
    }


    private async validateAndRepair(navigationPath: NavigationPath): Promise<NavigationPath> {

        const invalidSegment = await this.findInvalidSegment(navigationPath);
        if (!invalidSegment) return navigationPath;

        const repairedNavigationPath = ObjectUtil.cloneObject(navigationPath);

        repairedNavigationPath.segments = takeWhile(differentFrom(invalidSegment))(navigationPath.segments);

        if (navigationPath.selectedSegmentId === invalidSegment.document.resource.id) {
            repairedNavigationPath.selectedSegmentId = undefined;
        }

        return repairedNavigationPath;
    }


    private static makeNavigationPathElements(newNavigationPath: FlatNavigationPath,
                                       currentNavigationPath: NavigationPath) {


        return newNavigationPath.segments.reduce((elements, document) => {

                const index = currentNavigationPath.segments
                    .map(toResourceId).indexOf(document.resource.id);

                return elements.concat([(index > -1 ?
                        currentNavigationPath.segments[index] :
                        { document: document, q: '', types: [] }
                    )]);

            }, Array<NavigationPathSegment>());
    }
}
