import { takeWhile, on, is, takeUntil } from 'tsfun';
import { Document, FieldDocument } from 'idai-field-core';
import { ViewContext } from './view-context';
import { differentFrom, NavigationPathSegment, toResourceId } from './navigation-path-segment';
import { ModelUtil } from '../../../../model/model-util';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export interface NavigationPath {

    readonly basicContext: ViewContext; // used when no segment selected
    segments: Array<NavigationPathSegment>;

    /**
     * The selected segment is 'identified' by this id.
     * It corresponds with segment[_].document.resource.id.
     */
    selectedSegmentId?: string;
}


export module NavigationPath {

    export function empty(): NavigationPath {

        return {
            segments: [],
            basicContext: ViewContext.empty(),
        };
    }


    export function clone(navigationPath: NavigationPath): NavigationPath {

        return Document.clone(navigationPath as any) as any;
    }


    export function getSelectedSegment(navPath: NavigationPath): NavigationPathSegment {

        return navPath.segments
            .find(on(['document', 'resource', 'id'], is(navPath.selectedSegmentId))) as NavigationPathSegment;
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
     * @return a new path object with updated state
     */
    export function setNewSelectedSegmentDoc(navigationPath: NavigationPath,
                                             newSelectedSegmentDoc: FieldDocument|undefined): NavigationPath {

        if (newSelectedSegmentDoc) {
            (navigationPath as any).segments = rebuildElements(
                navigationPath.segments,
                navigationPath.selectedSegmentId,
                newSelectedSegmentDoc);
        }

        (navigationPath as any).selectedSegmentId = newSelectedSegmentDoc
            ? newSelectedSegmentDoc.resource.id
            : undefined;

        return navigationPath;
    }


    export function setSelectedDocument(navPath: NavigationPath, document: FieldDocument|undefined) {

        getViewContext(navPath).selected = document;
    }


    export function getSelectedDocument(navPath: NavigationPath): FieldDocument|undefined {

        return getViewContext(navPath).selected;
    }


    export function setQueryString(navPath: NavigationPath, q: string) {

        getViewContext(navPath).q = q;
    }


    export function getQueryString(navPath: NavigationPath): string {

        return getViewContext(navPath).q;
    }


    export function setCategoryFilters(navPath: NavigationPath, categories: string[]) {

        getViewContext(navPath).categories = categories;
    }


    export function getCategoryFilters(navPath: NavigationPath): string[] {

        return getViewContext(navPath).categories;
    }


    export function shorten(navPath: NavigationPath, firstToBeExcluded: NavigationPathSegment): NavigationPath {

        const oldNavPath = NavigationPath.clone(navPath);
        navPath.segments
            = takeWhile(differentFrom(firstToBeExcluded), oldNavPath.segments);

        if (navPath.selectedSegmentId) {

            const stillSelectedSegment = navPath.segments
                .find(_ => _.document.resource.id === navPath.selectedSegmentId);

            if (!stillSelectedSegment) navPath.selectedSegmentId = undefined;
        }

        return navPath;
    }


    export function segmentNotPresent(navPath: NavigationPath, segmentId: string) {

        return !segmentId || navPath.segments.map(toResourceId).includes(segmentId);
    }


    export function findInvalidSegment(operationId: string|undefined, navPath: NavigationPath,
                                       validNonRecordedInCategories: string[],
                                       exists: (_: string) => boolean): NavigationPathSegment|undefined {

        for (let segment of navPath.segments) {
            if (!NavigationPathSegment.isValid(
                operationId, segment, navPath.segments, validNonRecordedInCategories, exists
            )) {
                return segment;
            }
        }

        return undefined;
    }


    export function isPartOfNavigationPath(document: FieldDocument, navPath: NavigationPath,
                                           operationId: string|undefined): boolean {

        if (navPath.selectedSegmentId && Document.hasRelationTarget(document, 'liesWithin',
                navPath.selectedSegmentId)) {
            return true;
        }

        return (!navPath.selectedSegmentId && operationId !== undefined
            && Document.hasRelationTarget(document, 'isRecordedIn',
                operationId)
            && !Document.hasRelations(document, 'liesWithin'));
    }


    export async function makeSegments(document: Document, get: (_: string) => Promise<FieldDocument>,
                                       documentAsContext: boolean = false): Promise<Array<NavigationPathSegment>> {

        const segments: Array<NavigationPathSegment> = [];

        let currentResourceId: string|undefined = documentAsContext
            ? document.resource.id
            : ModelUtil.getRelationTargetId(document, 'liesWithin', 0);
        while (currentResourceId) {
            const currentSegmentDoc = await get(currentResourceId);
            currentResourceId = ModelUtil.getRelationTargetId(currentSegmentDoc, 'liesWithin', 0);
            segments.unshift( { document: currentSegmentDoc, q: '', categories: [] });
        }

        return segments;
    }


    export function replaceSegmentsIfNecessary(navPath: NavigationPath,
                                               newSegments: Array<NavigationPathSegment>,
                                               newSelectedSegmentId: string): NavigationPath {

        if (!NavigationPath.segmentNotPresent(navPath, newSelectedSegmentId)) {
            navPath.segments = newSegments;
        }

        navPath.selectedSegmentId = newSelectedSegmentId;
        return navPath;
    }


    function getViewContext(navPath: NavigationPath): ViewContext {

        return navPath.selectedSegmentId
                ? getSelectedSegment(navPath)
                : navPath.basicContext;
    }


    function rebuildElements(oldSegments: Array<NavigationPathSegment>,
                             oldSelectedSegmentId: string|undefined,
                             newSelectedSegmentDoc: FieldDocument): Array<NavigationPathSegment> {

        return oldSegments.map(toResourceId).includes(newSelectedSegmentDoc.resource.id)
            ? oldSegments
            : (oldSelectedSegmentId
                    ? takeUntil(on(['document', 'resource', 'id'], is(oldSelectedSegmentId)))(oldSegments)
                    : []
            ).concat([{ document: newSelectedSegmentDoc, q: '', categories: [] }]) as NavigationPathSegment[];
    }
}
