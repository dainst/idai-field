import {Document} from 'idai-components-2';
import {IdaiFieldDocument} from 'idai-components-2';
import {clone} from '../../../../util/object-util';
import {ViewContext} from './view-context';
import {differentFrom, NavigationPathSegment, toResourceId} from './navigation-path-segment';
import {takeUntil, takeWhile, on} from 'tsfun';
import {ModelUtil} from '../../../../core/model/model-util';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export interface NavigationPath {

    readonly basicContext: ViewContext; // used when no segment selected
    readonly segments: Array<NavigationPathSegment>;

    /**
     * The selected segment is 'identified' by this id.
     * It corresponds with segment[_].document.resource.id.
     */
    readonly selectedSegmentId?: string;
}


export module NavigationPath {

    export function empty(): NavigationPath {

        return {
            segments: [],
            basicContext: ViewContext.empty(),
        };
    }


    export function getSelectedSegment(navPath: NavigationPath) {

        return navPath.segments.find(element =>
            element.document.resource.id === navPath.selectedSegmentId) as NavigationPathSegment;
    }


    /**
     * Moves the 'selectedSegment' within or adds a 'selectedDocument' to a navigation path.
     *
     * Let's say document1 corresponds to segment1 etc.
     * and we have a navigation path with an optional root (V)
     *
     *               V
     * SEGMENT1, SEGMENT2, SEGMENT3
     *
     * setNewSelectedSegmentDoc(navpah, document4) changes the situation to
     *
     *                             V
     * NP: SEGMENT1, SEGMENT2, SEGMENT4
     *
     * from there, setNewSelectedSegmentDoc(navpath, document5) changes the situation to
     *
     *                                   V
     * SEGMENT1, SEGMENT2, SEGMENT4, SEGMENT5
     *
     * from there, setNewSelectedSegmentDoc(navpath, document1) changes the situation to
     *
     *     V
     * SEGMENT1, SEGMENT2, SEGMENT4, SEGMENT5
     *
     * from there, setNewSelectedSegmentDoc(navpath, undefined) changes the situation to
     *
     * (NO SELECTED SEGMENT)
     * SEGMENT1, SEGMENT2, SEGMENT4, SEGMENT5
     *
     * @param navPath
     * @param newSelectedSegmentDoc
     * @return a new path object with updated state
     */
    export function setNewSelectedSegmentDoc(
        navPath: NavigationPath,
        newSelectedSegmentDoc: IdaiFieldDocument|undefined): NavigationPath {

        const updatedNavigationPath = clone(navPath);

        if (newSelectedSegmentDoc) {
            (updatedNavigationPath as any).segments = rebuildElements(
                navPath.segments,
                navPath.selectedSegmentId,
                newSelectedSegmentDoc);
        }
        (updatedNavigationPath as any).selectedSegmentId = newSelectedSegmentDoc ? newSelectedSegmentDoc.resource.id : undefined;

        return updatedNavigationPath;
    }


    export function setSelectedDocument(navPath: NavigationPath, displayHierarchy: boolean, document: IdaiFieldDocument|undefined) {

        const _clone = clone(navPath);
        (getViewContext(_clone, displayHierarchy) as any).selected = document;
        return _clone;
    }


    export function getSelectedDocument(navPath: NavigationPath, bypassHierarchy: boolean): IdaiFieldDocument|undefined {

        return getViewContext(navPath, bypassHierarchy).selected;
    }


    export function setQueryString(navPath: NavigationPath, bypassHierarchy: boolean, q: string) {

        const _clone = clone(navPath);
        (getViewContext(_clone, bypassHierarchy) as any).q = q;
        return _clone;
    }


    export function getQueryString(navPath: NavigationPath, bypassHierarchy: boolean): string {

        return getViewContext(navPath, bypassHierarchy).q;
    }


    export function setTypeFilters(navPath: NavigationPath, displayHierarchy: boolean, types: string[]) {

        const _clone = clone(navPath);
        (getViewContext(_clone, displayHierarchy) as any).types = types;
        return _clone;
    }


    export function getTypeFilters(navPath: NavigationPath, displayHierarchy: boolean): string[] {

        return getViewContext(navPath, displayHierarchy).types;
    }


    export function shorten(navPath: NavigationPath, firstToBeExcluded: NavigationPathSegment): NavigationPath {

        const shortened = clone(navPath);
        (shortened as any /* cast ok on construction */).segments = takeWhile(differentFrom(firstToBeExcluded))(navPath.segments);

        if (shortened.selectedSegmentId) {

            const stillSelectedSegment = shortened.segments
                .find(_ => _.document.resource.id === shortened.selectedSegmentId);

            if (!stillSelectedSegment) {
                (shortened as any /* cast ok on construction */).selectedSegmentId = undefined;
            }
        }

        return shortened;
    }


    export function segmentNotPresent(navPath: NavigationPath, segmentId: string) {

        return !segmentId || navPath.segments.map(toResourceId).includes(segmentId);
    }


    export async function findInvalidSegment(
        mainTypeDocumentResourceId: string|undefined,
        navPath: NavigationPath,
        exists: (_: string) => Promise<boolean>): Promise<NavigationPathSegment|undefined> {

        for (let segment of navPath.segments) {
            if (!await NavigationPathSegment.isValid(
                    mainTypeDocumentResourceId,
                    segment,
                    navPath.segments,
                    exists)) {

                return segment;
            }
        }

        return undefined;
    }


    export function isPartOfNavigationPath(
        document: IdaiFieldDocument,
        navPath: NavigationPath,
        mainTypeDocumentResourceId: string|undefined): boolean {

        if (navPath.selectedSegmentId && Document.hasRelationTarget(document, 'liesWithin',
                navPath.selectedSegmentId)) {
            return true;
        }

        return (!navPath.selectedSegmentId && mainTypeDocumentResourceId != undefined
            && Document.hasRelationTarget(document, 'isRecordedIn',
                mainTypeDocumentResourceId )
            && !Document.hasRelations(document, 'liesWithin'));
    }


    export async function makeSegments(document: IdaiFieldDocument, get: (_: string) => Promise<IdaiFieldDocument>) {

        const segments: Array<NavigationPathSegment> = [];

        let currentResourceId = ModelUtil.getRelationTargetId(document, 'liesWithin', 0);
        while (currentResourceId) {

            const currentSegmentDoc = await get(currentResourceId);
            currentResourceId = ModelUtil.getRelationTargetId(currentSegmentDoc, 'liesWithin', 0);

            segments.unshift( { document: currentSegmentDoc, q: '', types: []});
        }
        return segments;
    }


    export function replaceSegmentsIfNecessary(navPath:NavigationPath,
        newSegments: NavigationPathSegment[],
        newSelectedSegmentId: string): NavigationPath {

        const updatedNavigationPath = clone(navPath);

        if (!NavigationPath.segmentNotPresent(navPath, newSelectedSegmentId)) (updatedNavigationPath as any).segments = newSegments;

        (updatedNavigationPath as any).selectedSegmentId = newSelectedSegmentId;
        return updatedNavigationPath;
    }



    function getViewContext(navPath: NavigationPath, bypassHierarchy: boolean): ViewContext {

        return navPath.selectedSegmentId
                ? getSelectedSegment(navPath)
                : navPath.basicContext;
    }


    function rebuildElements(oldSegments: Array<NavigationPathSegment>,
                             oldSelectedSegmentId: string|undefined,
                             newSelectedSegmentDoc: IdaiFieldDocument): Array<NavigationPathSegment> {

        return oldSegments.map(toResourceId).includes(newSelectedSegmentDoc.resource.id)
            ? oldSegments
            : (oldSelectedSegmentId
                    ? takeUntil(on('document.resource.id:')(oldSelectedSegmentId))(oldSegments)
                    : []
            ).concat([{ document: newSelectedSegmentDoc, q: '', types: [] }]) as NavigationPathSegment[];
    }
}