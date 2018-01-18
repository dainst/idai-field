import {Observer} from 'rxjs/Observer';
import {Observable} from 'rxjs/Observable';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {Query} from 'idai-components-2/datastore';
import {ResourcesState} from './resources-state';
import {NavigationPath} from '../navigation-path';
import {ModelUtil} from '../../../core/model/model-util';
import {IdaiFieldDocumentReadDatastore} from '../../../core/datastore/idai-field-document-read-datastore';

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 */
export class ViewManager {

    private mainTypeLabel: string;
    private activeDocumentViewTab: string|undefined;

    private navigationPathObservers: Array<Observer<NavigationPath>> = [];


    constructor(
        private resourcesState: ResourcesState,
        private datastore: IdaiFieldDocumentReadDatastore) {
    }


    public isInOverview() {

        return this.resourcesState.getView() == 'project';
    }


    public getViewName() {

        return this.resourcesState.getView();
    }


    public getMainTypeLabel() {

        return this.mainTypeLabel;
    }


    public getCurrentFilterType()  {

        const filterTypes = this.getFilterTypes();
        if (!filterTypes) return undefined;

        return (filterTypes.length > 0 ?
            filterTypes[0] : undefined);
    }


    public getActiveDocumentViewTab(): string|undefined {

        return this.activeDocumentViewTab;
    }


    public setActiveDocumentViewTab(activeDocumentViewTab: string|undefined) {

        this.activeDocumentViewTab = activeDocumentViewTab;
    }


    public getViewType() {

        if (this.isInOverview()) return 'Project';
        return this.resourcesState.getTypeForName(this.resourcesState.getView());
    }


    public getActiveLayersIds(mainTypeDocumentResourceId: string): string[] {

        return this.resourcesState.getActiveLayersIds();
    }


    public setActiveLayersIds(mainTypeDocumentResourceId: string, activeLayersIds: string[]) {

        this.resourcesState.setActiveLayersIds(activeLayersIds);
    }


    public removeActiveLayersIds(mainTypeDocumentId: string|undefined) {

        if (mainTypeDocumentId)
            this.resourcesState.removeActiveLayersIds();
    }


    public getQuery(): Query {

        let constraints: any = {};

        if (this.resourcesState.getNavigationPath() &&
            (this.resourcesState.getNavigationPath() as any).rootDocument
        ){
            constraints['liesWithin:contain'] = (this.resourcesState.getNavigationPath() as any).rootDocument.resource.id;
        } else {
            constraints['liesWithin:exist'] = 'UNKNOWN';
        }

        let query: Query = {
            q: this.resourcesState.getQueryString(),
            constraints: constraints
        };

        if (this.resourcesState.getTypeFilters()) query.types = this.resourcesState.getTypeFilters();

        return query
    }


    public getQueryString() {

        return this.resourcesState.getQueryString();
    }


    public setQueryString(q: string) {

        this.resourcesState.setQueryString(q);
    }


    public getQueryTypes() {

        return this.resourcesState.getTypeFilters();
    }


    // TODO remove redundancy with getQueryTypes
    public getFilterTypes() {

        return this.resourcesState.getTypeFilters();
    }


    public setFilterTypes(filterTypes: any) {

        filterTypes && filterTypes.length > 0 ?
            this.resourcesState.setTypeFilters(filterTypes) :
            this.resourcesState.removeTypeFilters();

        if (filterTypes && filterTypes.length == 0) this.resourcesState.removeTypeFilters();
        this.resourcesState.setTypeFilters(filterTypes);
    }


    public getNavigationPath(mainTypeDocumentId: string): NavigationPath {

        const navigationPath = this.resourcesState.getNavigationPath();
        return navigationPath ? navigationPath : { elements: [] };
    }


    public setNavigationPath(mainTypeDocumentId: string, navigationPath: NavigationPath) {

        this.resourcesState.setNavigationPath(navigationPath);
        this.notifyNavigationPathObservers(mainTypeDocumentId);
    }


    public setLastSelectedOperationTypeDocumentId(selectedMainTypeDocumentResource: IdaiFieldDocument|undefined) {

        if (!selectedMainTypeDocumentResource) return;
        this.resourcesState.setSelectedOperationTypeDocumentId(selectedMainTypeDocumentResource);

        this.notifyNavigationPathObservers(selectedMainTypeDocumentResource.resource.id as string);
    }


    public getLastSelectedOperationTypeDocumentId() {

        return this.resourcesState.getSelectedOperationTypeDocumentId();
    }


    public initialize(defaultMode?: any)  {

        return this.resourcesState.initialize().then(() => {

            this.initializeMode(defaultMode);

            this.activeDocumentViewTab = undefined;
        });
    }


    public setupView(viewName: string, defaultMode: string): Promise<any> {

        return ((!this.resourcesState.getView() || viewName != this.resourcesState.getView())
            ? this.initializeView(viewName)

            // TODO simplify this branch
            : Promise.resolve()).then(() => {
                return this.initialize(defaultMode ? 'map' : undefined);
            });
    }


    public setupNavigationPath(mainTypeDocumentId: string) {

        this.notifyNavigationPathObservers(mainTypeDocumentId);
    }


    public async createNavigationPathForDocument(document: IdaiFieldDocument, mainTypeDocumentId: string) {

        const navigationPath: NavigationPath = { elements: [] };

        let currentResourceId = ModelUtil.getRelationTargetId(document, 'liesWithin', 0);

        while (currentResourceId) {
            const currentDocument: IdaiFieldDocument = await this.datastore.get(currentResourceId);
            navigationPath.elements.unshift(currentDocument);
            if (!navigationPath.rootDocument) navigationPath.rootDocument = currentDocument;

            currentResourceId = ModelUtil.getRelationTargetId(currentDocument, 'liesWithin', 0);
        }

        this.setNavigationPath(mainTypeDocumentId, navigationPath);
        this.notifyNavigationPathObservers(mainTypeDocumentId);
    }


    public navigationPathNotifications(): Observable<NavigationPath> {

        return Observable.create((observer: Observer<NavigationPath>) => {
            this.navigationPathObservers.push(observer);
        });
    }


    private notifyNavigationPathObservers(mainTypeDocumentId: string) {

        if (this.navigationPathObservers) {
            const navigationPath: NavigationPath = this.getNavigationPath(mainTypeDocumentId);

            this.navigationPathObservers.forEach(
                (observer: Observer<NavigationPath>) => observer.next(navigationPath)
            );
        }
    }


    private async initializeView(viewName: string): Promise<any> {

        this.resourcesState.setView(viewName);
        this.mainTypeLabel = (viewName == 'project')
            ? 'Projekt' : this.resourcesState.getLabelForName(viewName);
    }


    private initializeMode(defaultMode?: string) {

        if (defaultMode) {
            return this.resourcesState.setMode(defaultMode);
        }
        if (!this.restoreLastSelectedMode()) {
            this.resourcesState.setMode('map');
        }
    }


    private restoreLastSelectedMode(): boolean {

        const mode = this.resourcesState.getMode();
        return mode != undefined;
    }
}