import {Observer} from 'rxjs/Observer';
import {Observable} from 'rxjs/Observable';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {ResourcesState} from './resources-state';
import {NavigationPath} from './navigation-path';
import {ModelUtil} from '../../../core/model/model-util';
import {IdaiFieldDocumentReadDatastore} from '../../../core/datastore/idai-field-document-read-datastore';
import {ObserverUtil} from '../../../util/observer-util';
import {differentFrom, takeUntil, takeWhile} from 'tsfun';
import {
    isSegmentOf,
    NavigationPathInternal,
    NavigationPathSegment,
    toDocument,
    toResourceId
} from './navigation-path-internal';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class NavigationPathManager {

    private navigationPathObservers: Array<Observer<NavigationPath>> = [];


    constructor(private resourcesState: ResourcesState,
                private datastore: IdaiFieldDocumentReadDatastore) {}


    public navigationPathNotifications = (): Observable<NavigationPath> =>
        ObserverUtil.register(this.navigationPathObservers);


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

        this.resourcesState.setNavigationPathInternal(

            NavigationPathManager.makeNewNavigationPath(
                await this.validateAndRepair(
                    this.resourcesState.getNavigationPathInternal()
                ),
                document
            )
        );

        this.notify();
    }


    public async rebuildNavigationPath() {

        await this.moveInto(this.getNavigationPath().rootDocument);
    }


    public setMainTypeDocument(selectedMainTypeDocumentResource: IdaiFieldDocument|undefined) {

        if (selectedMainTypeDocumentResource) {
            this.resourcesState.setMainTypeDocument(selectedMainTypeDocumentResource);
        }

        this.notify();
    }


    public async updateNavigationPathForDocument(document: IdaiFieldDocument) {

        if (!this.isPartOfNavigationPath(document)) {
            await this.createNavigationPathForDocument(document);
        }
    }


    public getNavigationPath(): NavigationPath {

        if (this.resourcesState.isInOverview()) return NavigationPath.empty();
        if (!this.resourcesState.getMainTypeDocument()) return NavigationPath.empty();

        return {
            elements: this.resourcesState.getNavigationPathInternal().elements.map(toDocument),
            rootDocument: this.resourcesState.getNavigationPathInternal().rootDocument
        }
    }


    private notify() {

        ObserverUtil.notify(this.navigationPathObservers, this.getNavigationPath());
    }


    private isPartOfNavigationPath(document: IdaiFieldDocument): boolean {

        const navigationPath = this.getNavigationPath();

        if (navigationPath.rootDocument && ModelUtil.hasRelationTarget(document, 'liesWithin',
                navigationPath.rootDocument.resource.id)) {
            return true;
        }

        const mainTypeDocument = this.resourcesState.getMainTypeDocument();

        return (!navigationPath.rootDocument && mainTypeDocument != undefined
                && ModelUtil.hasRelationTarget(document, 'isRecordedIn',
                    mainTypeDocument.resource.id )
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
            await this.moveInto(undefined);
        } else {
            this.setNavigationPath({ elements: elements, rootDocument: elements[elements.length - 1]});
        }
    }


    private async findInvalidSegment(navigationPath: NavigationPathInternal): Promise<NavigationPathSegment|undefined> {

        for (let segment of navigationPath.elements) {
            if (!await this.isValidSegment(segment, navigationPath.elements)) {
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
        })).totalCount != 0;
    }


    private hasValidRelation(segment: NavigationPathSegment, segments: Array<NavigationPathSegment>): boolean {

        const index: number = segments.indexOf(segment);
        const mainTypeDocument = this.resourcesState.getMainTypeDocument();

        return (index == 0)
            ? mainTypeDocument != undefined && ModelUtil.hasRelationTarget(segment.document,
                'isRecordedIn', mainTypeDocument.resource.id)
            : ModelUtil.hasRelationTarget(segment.document,
                'liesWithin', segments[index - 1].document.resource.id);
    }


    private setNavigationPath(newNavigationPath: NavigationPath) {

        const currentNavigationPath = this.resourcesState.getNavigationPathInternal();

        this.resourcesState.setNavigationPathInternal({

            elements: this.rootDocIncludedInCurrentNavigationPath(newNavigationPath)
                ? currentNavigationPath.elements
                : NavigationPathManager.makeNavigationPathElements(
                    newNavigationPath,
                    currentNavigationPath
                ),

            rootDocument: newNavigationPath.rootDocument,
            q: currentNavigationPath.q,
            types: currentNavigationPath.types
        });

        this.notify();
    }


    private rootDocIncludedInCurrentNavigationPath(newNavigationPath: NavigationPath) {

        return !newNavigationPath.rootDocument ||
            this.resourcesState.getNavigationPathInternal().elements.map(toResourceId)
                .includes(newNavigationPath.rootDocument.resource.id as string);
    }


    private async validateAndRepair(navigationPath: NavigationPathInternal): Promise<NavigationPathInternal> {

        const invalidSegment = await this.findInvalidSegment(navigationPath);

        return invalidSegment
            ? {
                elements: takeWhile(differentFrom(invalidSegment))(navigationPath.elements),
                rootDocument: navigationPath.rootDocument != invalidSegment.document
                    ? navigationPath.rootDocument
                    : undefined,
                q: navigationPath.q,
                types: navigationPath.types
            }
            : navigationPath;
    }


    private static makeNavigationPathElements(newNavigationPath: NavigationPath,
                                       currentNavigationPath: NavigationPathInternal) {


        return newNavigationPath.elements.reduce((elements, document) => {

                const index = currentNavigationPath.elements
                    .map(toResourceId).indexOf(document.resource.id);

                return elements.concat([(index > -1 ?
                        currentNavigationPath.elements[index] :
                        {document: document}
                    )]);

            }, Array<NavigationPathSegment>())
    }


    private static makeNewNavigationPath(
        oldNavigationPath: NavigationPathInternal,
        newRootDocument: IdaiFieldDocument|undefined): NavigationPathInternal {

        return {
            elements: newRootDocument
                ? this.rebuildElements(
                    oldNavigationPath.elements,
                    oldNavigationPath.rootDocument,
                    newRootDocument)
                : oldNavigationPath.elements,
            rootDocument: newRootDocument,
            q: oldNavigationPath.q,
            types: oldNavigationPath.types
        };
    }


    private static rebuildElements(oldSegments: Array<NavigationPathSegment>,
                                   oldRootDocument: IdaiFieldDocument|undefined,
                                   newRootDocument: IdaiFieldDocument): Array<NavigationPathSegment> {

        return oldSegments.map(toDocument).includes(newRootDocument)
            ? oldSegments
            : (oldRootDocument
                    ? takeUntil(isSegmentOf(oldRootDocument))(oldSegments)
                    : []
                ).concat([{document: newRootDocument}]);
    }
}
