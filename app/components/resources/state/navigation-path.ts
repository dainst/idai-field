import {IdaiFieldDocument} from 'idai-components-2/field';
import {NavigationPathBase} from './navigation-path-base';
import {ObjectUtil} from '../../../util/object-util';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export interface NavigationPath extends NavigationPathBase<NavigationPathSegment> {

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


export module NavigationPath {


    export function empty() {

        return {
            elements: [],
            qWithHierarchy: '',
            qWithoutHierarchy: '',
            typesWithHierarchy: [],
            typesWithoutHierarchy: []
        };
    }


    export function shallowCopy(navPath: NavigationPath) {

        const newNavPath = ObjectUtil.cloneObject(navPath);
        newNavPath.elements = navPath.elements;
        newNavPath.rootDocument = navPath.rootDocument;
        return newNavPath;
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
            navPath => navPath.qWithHierarchy = q,
            navPath => navPath.qWithoutHierarchy = q
        );
    }


    export function getQuerySring(
        navigationPath: NavigationPath,
        displayHierarchy: boolean) {

        return withNavPath(
            navigationPath,
            displayHierarchy,
            navPath => getRootSegment(navPath).q,
            navPath => navPath.qWithHierarchy,
            navPath => navPath.qWithoutHierarchy
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
            navPath => navPath.typesWithHierarchy = types,
            navPath => navPath.typesWithoutHierarchy = types
        );
    }


    export function getTypeFilters(
        navigationPath: NavigationPath,
        displayHierarchy: boolean) {

        return withNavPath(
            navigationPath,
            displayHierarchy,
            navPath => getRootSegment(navPath).types,
            navPath => navPath.typesWithHierarchy,
            navPath => navPath.typesWithoutHierarchy
        );
    }


    function withNavPath(
        navigationPath: NavigationPath,
        displayHierarchy: boolean,
        doWhenHierarchyIsDisplayedAndRootExists: (n: NavigationPath) => any,
        doWhenHierarchyIsDisplayedAndRootDoesNotExist: (n: NavigationPath) => any,
        doWhenHierarchyIsNotDisplayed: (n: NavigationPath) => any) {

        return !displayHierarchy
            ? doWhenHierarchyIsNotDisplayed(navigationPath)
            : navigationPath.rootDocument
                ? doWhenHierarchyIsDisplayedAndRootExists(navigationPath)
                : doWhenHierarchyIsDisplayedAndRootDoesNotExist(navigationPath);
    }


    function getRootSegment(navigationPath: NavigationPath) {

        return navigationPath.elements.find(element =>
            element.document.resource.id ==
            (navigationPath.rootDocument as IdaiFieldDocument).resource.id) as NavigationPathSegment;
    }
}


export const isSegmentOf
    = (document: IdaiFieldDocument) => (segment: NavigationPathSegment) => document == segment.document;


export const toDocument = (segment: NavigationPathSegment) => segment.document;


export const toResourceId = (seg: NavigationPathSegment) => seg.document.resource.id;