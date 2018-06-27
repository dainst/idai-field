import {IdaiFieldDocument} from 'idai-components-2/field';
import {ObjectUtil} from '../../../../util/object-util';
import {NavigationPathContext} from './navigation-path-context';
import {differentFrom, isSegmentWith, NavigationPathSegment, toResourceId} from './navigation-path-segment';
import {takeUntil, takeWhile} from 'tsfun';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export interface NavigationPath {

    hierarchyContext: NavigationPathContext;
    flatContext: NavigationPathContext;

    segments: Array<NavigationPathSegment>;

    /**
     * The selected segment is 'identified' by this id.
     * It corresponds with segment[_].document.resource.id.
     */
    selectedSegmentId?: string;
}


export module NavigationPath {

    export function empty() { // TODO specify return type

        return {
            segments: [],
            hierarchyContext: { q: '', types: []},
            flatContext: { q: '', types: []}
        };
    }


    export function getSelectedSegment(navigationPath: NavigationPath) {

        return navigationPath.segments.find(element =>
            element.document.resource.id === navigationPath.selectedSegmentId) as NavigationPathSegment;
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
     * @param navigationPath
     * @param newSelectedSegmentDoc
     * @return a new path object with updated state
     */
    export function setNewSelectedSegmentDoc(
        navigationPath: NavigationPath,
        newSelectedSegmentDoc: IdaiFieldDocument|undefined): NavigationPath {

        const updatedNavigationPath = ObjectUtil.cloneObject(navigationPath);

        if (newSelectedSegmentDoc) {
            updatedNavigationPath.segments = rebuildElements(
                navigationPath.segments,
                navigationPath.selectedSegmentId,
                newSelectedSegmentDoc);
        }
        updatedNavigationPath.selectedSegmentId = newSelectedSegmentDoc ? newSelectedSegmentDoc.resource.id : undefined;

        return updatedNavigationPath;
    }


    export function setSelectedDocument(navPath: NavigationPath, displayHierarchy: boolean, document: IdaiFieldDocument|undefined) {

        const clone = ObjectUtil.cloneObject(navPath);
        getContext(clone, displayHierarchy).selected = document;
        return clone;
    }


    export function getSelectedDocument(navPath: NavigationPath, displayHierarchy: boolean): IdaiFieldDocument|undefined {

        return getContext(navPath, displayHierarchy).selected;
    }


    export function setQueryString(navPath: NavigationPath, displayHierarchy: boolean, q: string) {

        const clone = ObjectUtil.cloneObject(navPath);
        getContext(clone, displayHierarchy).q = q;
        return clone;
    }


    export function getQuerySring(navPath: NavigationPath, displayHierarchy: boolean) {

        return getContext(navPath, displayHierarchy).q;
    }


    export function setTypeFilters(navPath: NavigationPath, displayHierarchy: boolean, types: string[]) {

        const clone = ObjectUtil.cloneObject(navPath);
        getContext(clone, displayHierarchy).types = types;
        return clone;
    }


    export function getTypeFilters(navPath: NavigationPath, displayHierarchy: boolean) {

        return getContext(navPath, displayHierarchy).types;
    }


    export function shorten(navigationPath: NavigationPath, firstToBeExcluded: NavigationPathSegment): NavigationPath {

        const shortenedNavigationPath = ObjectUtil.cloneObject(navigationPath);
        shortenedNavigationPath.segments = takeWhile(differentFrom(firstToBeExcluded))(navigationPath.segments);

        if (navigationPath.selectedSegmentId === firstToBeExcluded.document.resource.id) { // TODO should be: if selectedSegmentId is not contained in the surviving segments
            shortenedNavigationPath.selectedSegmentId = undefined;
        }

        return shortenedNavigationPath;
    }


    export function segmentNotPresent(navPath: NavigationPath, segmentId: string) {

        return !segmentId || navPath.segments.map(toResourceId).includes(segmentId);
    }


    export async function findInvalidSegment(
        mainTypeDocumentResourceId: string|undefined,
        navigationPath: NavigationPath,
        hasExisting: (_: string) => Promise<boolean>): Promise<NavigationPathSegment|undefined> {

        for (let segment of navigationPath.segments) {
            if (!await NavigationPathSegment.isValid(
                    mainTypeDocumentResourceId,
                    segment,
                    navigationPath.segments,
                    hasExisting)) {

                return segment;
            }
        }

        return undefined;
    }


    function getContext(navPath: NavigationPath, displayHierarchy: boolean): NavigationPathContext {

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