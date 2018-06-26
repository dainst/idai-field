import {IdaiFieldDocument} from 'idai-components-2/field';
import {ObjectUtil} from '../../../../util/object-util';
import {NavigationPathContext} from './navigation-path-context';
import {isSegmentWith, NavigationPathSegment, toResourceId} from './navigation-path-segment';
import {takeUntil} from 'tsfun';


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

    export function empty() {

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


    export function setNewSelectedSegmentDoc(
        oldNavigationPath: NavigationPath,
        newSelectedSegmentDoc: IdaiFieldDocument|undefined): NavigationPath {

        const newNavigationPath = ObjectUtil.cloneObject(oldNavigationPath);

        if (newSelectedSegmentDoc) {
            newNavigationPath.segments = rebuildElements(
                oldNavigationPath.segments,
                oldNavigationPath.selectedSegmentId,
                newSelectedSegmentDoc);
        }
        newNavigationPath.selectedSegmentId = newSelectedSegmentDoc ? newSelectedSegmentDoc.resource.id : undefined;

        return newNavigationPath;
    }


    export function setSelectedDocument(
        navigationPath: NavigationPath,
        displayHierarchy: boolean,
        document: IdaiFieldDocument|undefined) {

        getContext(navigationPath, displayHierarchy).selected = document;
    }


    export function getSelectedDocument(
        navigationPath: NavigationPath,
        displayHierarchy: boolean): IdaiFieldDocument|undefined {

        return getContext(navigationPath, displayHierarchy).selected;
    }


    export function setQueryString(
        navigationPath: NavigationPath,
        displayHierarchy: boolean,
        q: string) {

        getContext(navigationPath, displayHierarchy).q = q;
    }


    export function getQuerySring(
        navigationPath: NavigationPath,
        displayHierarchy: boolean) {

        return getContext(navigationPath, displayHierarchy).q;
    }


    export function setTypeFilters(
        navigationPath: NavigationPath,
        displayHierarchy: boolean,
        types: string[]) {

        getContext(navigationPath, displayHierarchy).types = types;
    }


    export function getTypeFilters(
        navigationPath: NavigationPath,
        displayHierarchy: boolean) {

        return getContext(navigationPath, displayHierarchy).types;
    }


    function getContext(
        navigationPath: NavigationPath,
        displayHierarchy: boolean): NavigationPathContext {

        if (!displayHierarchy) return navigationPath.flatContext;

        return !displayHierarchy
            ? navigationPath.flatContext
            : navigationPath.selectedSegmentId
                ? getSelectedSegment(navigationPath)
                : navigationPath.hierarchyContext;
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