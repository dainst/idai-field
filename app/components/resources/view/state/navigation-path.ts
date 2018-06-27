import {Document} from 'idai-components-2/core';
import {IdaiFieldDocument} from 'idai-components-2/field';
import {ObjectUtil} from '../../../../util/object-util';
import {ViewContext} from './view-context';
import {differentFrom, isSegmentWith, NavigationPathSegment, toResourceId} from './navigation-path-segment';
import {takeUntil, takeWhile} from 'tsfun';
import {ModelUtil} from '../../../../core/model/model-util';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export interface NavigationPath {

    hierarchyContext: ViewContext;
    flatContext: ViewContext;

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
            hierarchyContext: ViewContext.empty(),
            flatContext: ViewContext.empty()
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

        const updatedNavigationPath = ObjectUtil.cloneObject(navPath);

        if (newSelectedSegmentDoc) {
            updatedNavigationPath.segments = rebuildElements(
                navPath.segments,
                navPath.selectedSegmentId,
                newSelectedSegmentDoc);
        }
        updatedNavigationPath.selectedSegmentId = newSelectedSegmentDoc ? newSelectedSegmentDoc.resource.id : undefined;

        return updatedNavigationPath;
    }


    export function setSelectedDocument(navPath: NavigationPath, displayHierarchy: boolean, document: IdaiFieldDocument|undefined) {

        const clone = ObjectUtil.cloneObject(navPath);
        getViewContext(clone, displayHierarchy).selected = document;
        return clone;
    }


    export function getSelectedDocument(navPath: NavigationPath, displayHierarchy: boolean): IdaiFieldDocument|undefined {

        return getViewContext(navPath, displayHierarchy).selected;
    }


    export function setQueryString(navPath: NavigationPath, displayHierarchy: boolean, q: string) {

        const clone = ObjectUtil.cloneObject(navPath);
        getViewContext(clone, displayHierarchy).q = q;
        return clone;
    }


    export function getQuerySring(navPath: NavigationPath, displayHierarchy: boolean) {

        return getViewContext(navPath, displayHierarchy).q;
    }


    export function setTypeFilters(navPath: NavigationPath, displayHierarchy: boolean, types: string[]) {

        const clone = ObjectUtil.cloneObject(navPath);
        getViewContext(clone, displayHierarchy).types = types;
        return clone;
    }


    export function getTypeFilters(navPath: NavigationPath, displayHierarchy: boolean) {

        return getViewContext(navPath, displayHierarchy).types;
    }


    export function shorten(navPath: NavigationPath, firstToBeExcluded: NavigationPathSegment): NavigationPath {

        const shortenedNavigationPath = ObjectUtil.cloneObject(navPath);
        shortenedNavigationPath.segments = takeWhile(differentFrom(firstToBeExcluded))(navPath.segments);

        if (navPath.selectedSegmentId === firstToBeExcluded.document.resource.id) { // TODO should be: if selectedSegmentId is not contained in the surviving segments
            shortenedNavigationPath.selectedSegmentId = undefined;
        }

        return shortenedNavigationPath;
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

            segments.unshift( {document: currentSegmentDoc, q: '', types: []});
        }
        return segments;
    }


    export function replaceSegmentsIfNecessary(navPath:NavigationPath,
        newSegments: NavigationPathSegment[],
        newSelectedSegmentId: string): NavigationPath {

        const updatedNavigationPath = ObjectUtil.cloneObject(navPath);

        if (!NavigationPath.segmentNotPresent(navPath, newSelectedSegmentId)) updatedNavigationPath.segments = newSegments;

        updatedNavigationPath.selectedSegmentId = newSelectedSegmentId;
        return updatedNavigationPath;
    }



    function getViewContext(navPath: NavigationPath, displayHierarchy: boolean): ViewContext {

        if (!displayHierarchy) return navPath.flatContext;

        return !displayHierarchy
            ? navPath.flatContext
            : navPath.selectedSegmentId
                ? getSelectedSegment(navPath)
                : navPath.hierarchyContext;
    }


    function rebuildElements(oldSegments: Array<NavigationPathSegment>,
                             oldSelectedSegmentId: string|undefined,
                             newSelectedSegmentDoc: IdaiFieldDocument): Array<NavigationPathSegment> {

        return oldSegments.map(toResourceId).includes(newSelectedSegmentDoc.resource.id)
            ? oldSegments
            : (oldSelectedSegmentId
                    ? takeUntil(isSegmentWith(oldSelectedSegmentId))(oldSegments)
                    : []
            ).concat([{document: newSelectedSegmentDoc, q: '', types: []}]);
    }
}