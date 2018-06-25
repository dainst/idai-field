import {IdaiFieldDocument} from 'idai-components-2/field';
import {NavigationPathBase} from './navigation-path';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export interface NavigationPathInternal extends NavigationPathBase<NavigationPathSegment> {

    qWithHierarchy: string;
    qWithoutHierarchy: string;
    typesWithHierarchy: string[];
    typesWithoutHierarchy: string[];
    selected?: IdaiFieldDocument; // TODO separate with/without hierarchy
}


export interface NavigationPathSegment {

    document: IdaiFieldDocument; // nav path document
    q: string;
    types: Array<string>;
    selected?: IdaiFieldDocument; // selected doc in list
}


export module NavigationPathInternal {

    export function setSelectedDocument(navigationPath: NavigationPathInternal, document: IdaiFieldDocument|undefined) {

        withNavPath(
            navigationPath,
            navPath => getRootSegment(navPath).selected = document,
            navPath => navPath.selected = document,
            navPath => navPath.selected = document
        );
    }


    export function getSelectedDocument(navigationPath: NavigationPathInternal) {

        return withNavPath(
            navigationPath,
            navPath => getRootSegment(navPath).selected,
            navPath => navPath.selected,
            navPath => navPath.selected
        );
    }


    export function setQueryString(navigationPath: NavigationPathInternal, q: string) {

        withNavPath(
            navigationPath,
            navPath => getRootSegment(navPath).q = q,
            navPath => navPath.qWithHierarchy = q,
            navPath => navPath.qWithoutHierarchy = q
        );
    }


    export function getQuerySring(navigationPath: NavigationPathInternal) {

        return withNavPath(
            navigationPath,
            navPath => getRootSegment(navPath).q,
            navPath => navPath.qWithHierarchy,
            navPath => navPath.qWithoutHierarchy
        );
    }


    export function setTypeFilters(navigationPath: NavigationPathInternal, types: string[]) {

        withNavPath(
            navigationPath,
            navPath => getRootSegment(navPath).types = types,
            navPath => navPath.typesWithHierarchy = types,
            navPath => navPath.typesWithoutHierarchy = types
        );
    }


    export function getTypeFilters(navigationPath: NavigationPathInternal) {

        return withNavPath(
            navigationPath,
            navPath => getRootSegment(navPath).types,
            navPath => navPath.typesWithHierarchy,
            navPath => navPath.typesWithoutHierarchy
        );
    }


    function withNavPath(
        navigationPath: NavigationPathInternal,
        doWhenHierarchyIsDisplayedAndRootExists: (n: NavigationPathInternal) => any,
        doWhenHierarchyIsDisplayedAndRootDoesNotExist: (n: NavigationPathInternal) => any,
        doWhenHierarchyIsNotDisplayed: (n: NavigationPathInternal) => any) {

        return !navigationPath.displayHierarchy
            ? doWhenHierarchyIsNotDisplayed(navigationPath)
            : navigationPath.rootDocument
                ? doWhenHierarchyIsDisplayedAndRootExists(navigationPath)
                : doWhenHierarchyIsDisplayedAndRootDoesNotExist(navigationPath);
    }


    function getRootSegment(navigationPath: NavigationPathInternal) {

        return navigationPath.elements.find(element =>
            element.document.resource.id ==
            (navigationPath.rootDocument as IdaiFieldDocument).resource.id) as NavigationPathSegment;
    }
}


export const isSegmentOf
    = (document: IdaiFieldDocument) => (segment: NavigationPathSegment) => document == segment.document;


export const toDocument = (segment: NavigationPathSegment) => segment.document;


export const toResourceId = (seg: NavigationPathSegment) => seg.document.resource.id;