import {Injectable} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Location} from '@angular/common';
import {Observable, Observer} from 'rxjs';
import {Document, DatastoreErrors, FieldDocument} from 'idai-components-2';
import {ViewFacade} from './resources/view/view-facade';
import {TypeUtility} from '../core/model/type-utility';


@Injectable()
/**
 * Centralizes access to the Router.
 * Has knowledge about how to route into as well as route within
 * bigger components like ResourcesComponent (via ViewFacade).
 *
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 */
export class RoutingService {

    private currentRoute: any;


    constructor(private router: Router,
                private viewFacade: ViewFacade,
                private location: Location,
                private typeUtility: TypeUtility) {}


    // For ResourcesComponent
    public routeParams(route: ActivatedRoute) {

        return Observable.create((observer: Observer<any>) => {
            this.setRoute(route, observer);
        });
    }


    public async jumpToOverview() {

        await this.router.navigate(['resources', 'project']);
    }


    public async jumpToOperationView(operation: Document) {

        await this.router.navigate(['resources', operation.resource.id]);
    }


    public async jumpToMatrix(trench: FieldDocument) {

        await this.router.navigate(['matrix', trench.resource.id]);
    }


    public async jumpToResource(documentToSelect: Document, tab?: string,
                                comingFromOutsideResourcesComponent: boolean = false) {

        if (comingFromOutsideResourcesComponent) this.currentRoute = undefined;

        if (this.typeUtility.isSubtype(documentToSelect.resource.type, 'Image')) {
            await this.jumpToImageTypeResource(documentToSelect, comingFromOutsideResourcesComponent);
        } else {
            await this.jumpToFieldTypeResource(documentToSelect, tab, comingFromOutsideResourcesComponent);
        }
    }


    public async jumpToConflictResolver(document: Document) {

        if (this.typeUtility.isSubtype(document.resource.type, 'Image')) {
            return this.router.navigate(['images', document.resource.id, 'edit', 'conflicts']);
        } else {
            const viewName: 'project'|string = this.getViewName(document);
            if (this.router.url.includes('resources')) {
                // indirect away first to reload the resources component, in case you are already there
                await this.router.navigate(['resources', viewName]);
            }
            return this.router.navigate(
                ['resources', viewName, document.resource.id, 'edit', 'conflicts']
            );
        }
    }


    private async jumpToImageTypeResource(documentToSelect: Document,
                                          comingFromOutsideResourcesComponent: boolean) {

        const selectedDocument = this.viewFacade.getSelectedDocument();
        if (selectedDocument) {
            if (this.currentRoute && selectedDocument.resource && selectedDocument.resource.id) {
                this.currentRoute += '/' + selectedDocument.resource.id + '/show/images';
            }
        }

        await this.router.navigate(
            ['images', documentToSelect.resource.id, 'show',
                comingFromOutsideResourcesComponent ? 'fields' : 'relations'],
            { queryParams: { from: this.currentRoute } }
        );
    }


    private async jumpToFieldTypeResource(documentToSelect: Document, tab?: string,
                                          comingFromOutsideResourcesComponent: boolean = false) {

        const viewName: 'project'|string = this.getViewName(documentToSelect);

        if (comingFromOutsideResourcesComponent || viewName !== this.viewFacade.getView()) {
            await this.router.navigate(tab
                ? ['resources', viewName, documentToSelect.resource.id, 'view', tab]
                : ['resources', viewName, documentToSelect.resource.id]);
        } else {
            await this.viewFacade.setSelectedDocument(documentToSelect.resource.id);
        }
    }


    // For ResourcesComponent
    // We need a setter because the route must come from the component it is bound to
    private setRoute(route: ActivatedRoute, observer: Observer<any>) {

        route.params.subscribe(async (params) => {

            this.currentRoute = undefined;
            if (params['view']) this.currentRoute = 'resources/' + params['view'];

            this.location.replaceState('resources/' + params['view']);

            try {
                await this.viewFacade.selectView(params['view']);
                observer.next(params);
            } catch (msgWithParams) {
                if (msgWithParams) {
                    if (msgWithParams.includes(DatastoreErrors.DOCUMENT_NOT_FOUND)) {
                        await this.router.navigate(['resources', 'project']);
                    } else {
                        console.error('Got msgWithParams in GeneralRoutingService#setRoute: ', msgWithParams);
                    }
                }
            }
        });
    }


    private getViewName(document: Document): 'project'|string {

        return this.typeUtility.getOverviewTypeNames().includes(document.resource.type)
            ? 'project'
            : document.resource.relations['isRecordedIn'][0];
    }
}