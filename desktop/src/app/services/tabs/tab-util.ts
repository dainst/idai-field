import { Tab } from './tab';


/**
 * @author Thomas Kleinke
 */
export module TabUtil {

    export function getTabId(tab: Tab): string {

        return 'navbar-' + tab.routeName + (tab.operationId ? '-' + tab.operationId : '');
    }


    export function getTabRoute(tab: Tab): string {

        return '/' + tab.routeName + (tab.operationId ? '/' + tab.operationId : '');
    }


    export function getTabRouteArray(tab: Tab): string[] {

        return tab.operationId
            ? [tab.routeName, tab.operationId]
            : [tab.routeName];
    }


    export function getTabValuesForRoute(route: string): { routeName: string, operationId?: string } {

        const routeArray: string[] = route.split('/');
        const routeName: string = routeArray[1];
        const operationId: string|undefined = routeArray.length > 2 ? routeArray[2] : undefined;

        return {
            routeName: routeName,
            operationId: operationId,
        }
    }
}