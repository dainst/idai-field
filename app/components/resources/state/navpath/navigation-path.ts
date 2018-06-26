import {IdaiFieldDocument} from 'idai-components-2/field';
import {NavigationPathBase} from './navigation-path-base';
import {ObjectUtil} from '../../../../util/object-util';
import {NavigationPathContext} from './navigation-path-context';
import {isSegmentOf, NavigationPathSegment, toDocument} from './navigation-path-segment';
import {takeUntil} from 'tsfun';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export interface NavigationPath extends NavigationPathBase<NavigationPathSegment> {

    hierarchyContext: NavigationPathContext;
    flatContext: NavigationPathContext;
    selected?: IdaiFieldDocument; // TODO separate with/without hierarchy
}


export module NavigationPath {


    export function empty() {

        return {
            segments: [],
            hierarchyContext: { q: '', types: []},
            flatContext: { q: '', types: []}
        };
    }


    export function shallowCopy(navPath: NavigationPath) {

        const newNavPath = ObjectUtil.cloneObject(navPath);
        newNavPath.segments = navPath.segments;
        return newNavPath;
    }


    export function setNewSelectedSegmentDoc(
        oldNavigationPath: NavigationPath,
        newSelectedSegmentDoc: IdaiFieldDocument|undefined): NavigationPath {

        const newNavigationPath = NavigationPath.shallowCopy(oldNavigationPath);

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

        withNavPath(
            navigationPath,
            displayHierarchy,
            navPath => getRootSegment(navPath).selected = document,
            navPath => navPath.selected = document,
            navPath => navPath.selected = document
        );
    }


    export function getSelectedDocument(
        navigationPath: NavigationPath,
        displayHierarchy: boolean) {

        return withNavPath(
            navigationPath,
            displayHierarchy,
            navPath => getRootSegment(navPath).selected,
            navPath => navPath.selected,
            navPath => navPath.selected
        );
    }


    export function setQueryString(
        navigationPath: NavigationPath,
        displayHierarchy: boolean,
        q: string) {

        withNavPath(
            navigationPath,
            displayHierarchy,
            navPath => getRootSegment(navPath).q = q,
            navPath => navPath.hierarchyContext.q = q,
            navPath => navPath.flatContext.q = q
        );
    }


    export function getQuerySring(
        navigationPath: NavigationPath,
        displayHierarchy: boolean) {

        return withNavPath(
            navigationPath,
            displayHierarchy,
            navPath => getRootSegment(navPath).q,
            navPath => navPath.hierarchyContext.q,
            navPath => navPath.flatContext.q
        );
    }


    export function setTypeFilters(
        navigationPath: NavigationPath,
        displayHierarchy: boolean,
        types: string[]) {

        withNavPath(
            navigationPath,
            displayHierarchy,
            navPath => getRootSegment(navPath).types = types,
            navPath => navPath.hierarchyContext.types = types,
            navPath => navPath.flatContext.types = types
        );
    }


    export function getTypeFilters(
        navigationPath: NavigationPath,
        displayHierarchy: boolean) {

        return withNavPath(
            navigationPath,
            displayHierarchy,
            navPath => getRootSegment(navPath).types,
            navPath => navPath.hierarchyContext.types,
            navPath => navPath.flatContext.types
        );
    }


    function withNavPath(
        navigationPath: NavigationPath,
        displayHierarchy: boolean,
        doInHierarchyContextWhenRootExists: (n: NavigationPath) => any,
        doInHierarchyContextWhenRootNotExist: (n: NavigationPath) => any,
        doInFlatContext: (n: NavigationPath) => any) {

        return !displayHierarchy
            ? doInFlatContext(navigationPath)
            : navigationPath.selectedSegmentId
                ? doInHierarchyContextWhenRootExists(navigationPath)
                : doInHierarchyContextWhenRootNotExist(navigationPath);
    }


    function getRootSegment(navigationPath: NavigationPath) {

        return navigationPath.segments.find(element =>
            element.document.resource.id === navigationPath.selectedSegmentId) as NavigationPathSegment;
    }


    function rebuildElements(oldSegments: Array<NavigationPathSegment>,
                             oldSelectedSegmentId: string|undefined,
                             newSelectedSegmentDoc: IdaiFieldDocument): Array<NavigationPathSegment> {

        return oldSegments.map(toDocument).includes(newSelectedSegmentDoc)
            ? oldSegments
            : (oldSelectedSegmentId
                    ? takeUntil(isSegmentOf(oldSelectedSegmentId))(oldSegments)
                    : []
            ).concat([{document: newSelectedSegmentDoc, q: '', types: []}]);
    }
}