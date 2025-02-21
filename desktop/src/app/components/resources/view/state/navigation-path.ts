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


    export function getSelectedSegment(path: NavigationPath): NavigationPathSegment {

        return path.segments
            .find(on(['document', 'resource', 'id'], is(path.selectedSegmentId))) as NavigationPathSegment;
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
     * setNewSelectedSegmentDoc(path, document4) changes the situation to
     *
     *                             V
     * NP: SEGMENT1, SEGMENT2, SEGMENT4
     *
     * from there, setNewSelectedSegmentDoc(path, document5) changes the situation to
     *
     *                                   V
     * SEGMENT1, SEGMENT2, SEGMENT4, SEGMENT5
     *
     * from there, setNewSelectedSegmentDoc(path, document1) changes the situation to
     *
     *     V
     * SEGMENT1, SEGMENT2, SEGMENT4, SEGMENT5
     *
     * from there, setNewSelectedSegmentDoc(path, undefined) changes the situation to
     *
     * (NO SELECTED SEGMENT)
     * SEGMENT1, SEGMENT2, SEGMENT4, SEGMENT5
     *
     * @return a new path object with updated state
     */
    export function setNewSelectedSegmentDoc(navigationPath: NavigationPath,
                                             newSelectedSegmentDoc: FieldDocument|undefined): NavigationPath {

        if (newSelectedSegmentDoc) {
            navigationPath.segments = rebuildElements(
                navigationPath.segments,
                navigationPath.selectedSegmentId,
                newSelectedSegmentDoc
            );
        }

        navigationPath.selectedSegmentId = newSelectedSegmentDoc
            ? newSelectedSegmentDoc.resource.id
            : undefined;

        return navigationPath;
    }


    export function setSelectedDocument(path: NavigationPath, document: FieldDocument|undefined) {

        getViewContext(path).selected = document;
    }


    export function getSelectedDocument(path: NavigationPath): FieldDocument|undefined {

        return getViewContext(path).selected;
    }


    export function setQueryString(path: NavigationPath, q: string) {

        getViewContext(path).q = q;
    }


    export function getQueryString(path: NavigationPath): string {

        return getViewContext(path).q;
    }


    export function setCategoryFilters(path: NavigationPath, categories: string[]) {

        getViewContext(path).categories = categories;
    }


    export function getCategoryFilters(path: NavigationPath): string[] {

        return getViewContext(path).categories;
    }


    export function shorten(path: NavigationPath, firstToBeExcluded: NavigationPathSegment): NavigationPath {

        const oldPath: NavigationPath = NavigationPath.clone(path);
        path.segments = takeWhile(differentFrom(firstToBeExcluded), oldPath.segments);

        if (path.selectedSegmentId) {
            const stillSelectedSegment: NavigationPathSegment = path.segments.find(segment => {
                return segment.document.resource.id === path.selectedSegmentId;
            });
            if (!stillSelectedSegment) path.selectedSegmentId = undefined;
        }

        return path;
    }


    export function segmentNotPresent(path: NavigationPath, segmentId: string) {

        return !segmentId || path.segments.map(toResourceId).includes(segmentId);
    }


    export function findInvalidSegment(operationId: string|undefined, path: NavigationPath,
                                       validNonRecordedInCategories: string[],
                                       exists: (_: string) => boolean): NavigationPathSegment|undefined {

        for (let segment of path.segments) {
            if (!NavigationPathSegment.isValid(
                operationId, segment, path.segments, validNonRecordedInCategories, exists
            )) {
                return segment;
            }
        }

        return undefined;
    }


    export function isPartOfNavigationPath(document: FieldDocument, path: NavigationPath,
                                           operationId: string|undefined): boolean {

        if (path.selectedSegmentId && Document.hasRelationTarget(document, 'liesWithin', path.selectedSegmentId)) {
            return true;
        }

        return (!path.selectedSegmentId && operationId !== undefined
            && Document.hasRelationTarget(document, 'isRecordedIn',operationId)
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


    export function replaceSegmentsIfNecessary(path: NavigationPath, newSegments: Array<NavigationPathSegment>,
                                               newSelectedSegmentId: string): NavigationPath {

        if (!NavigationPath.segmentNotPresent(path, newSelectedSegmentId)) {
            path.segments = newSegments;
        }

        path.selectedSegmentId = newSelectedSegmentId;
        return path;
    }


    /*
     * @returns The next segment in the given navigation path following the currently selected segment
     */
    export function getNextSegment(path: NavigationPath) {

        if (!path.segments.length) return undefined;

        const selectedSegment: NavigationPathSegment = NavigationPath.getSelectedSegment(path);
        const index: number = path.segments.indexOf(selectedSegment);

        return index === path.segments.length - 1
            ? undefined
            : index === -1
                ? path.segments[0]
                : path.segments[index + 1];
    }


    function getViewContext(path: NavigationPath): ViewContext {

        return path.selectedSegmentId
                ? getSelectedSegment(path)
                : path.basicContext;
    }


    function rebuildElements(oldSegments: Array<NavigationPathSegment>, oldSelectedSegmentId: string|undefined,
                             newSelectedSegmentDoc: FieldDocument): Array<NavigationPathSegment> {

        return oldSegments.map(toResourceId).includes(newSelectedSegmentDoc.resource.id)
            ? oldSegments
            : (oldSelectedSegmentId
                    ? takeUntil(on(['document', 'resource', 'id'], is(oldSelectedSegmentId)))(oldSegments)
                    : []
            ).concat([{ document: newSelectedSegmentDoc, q: '', categories: [] }]) as NavigationPathSegment[];
    }
}
