import { Observable, Observer } from 'rxjs';
import { Location } from '@angular/common';
import { Injectable } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Datastore, Document, Named, ProjectConfiguration, DatastoreErrors, ImageDocument,
    ObserverUtil } from 'idai-field-core';
import { ViewFacade } from '../components/resources/view/view-facade';
import { MenuContext } from './menu-context';
import { Menus } from './menus';
import { DoceditComponent } from '../components/docedit/docedit.component';
import { M } from '../components/messages/m';


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
export class Routing {

    private currentRoute: any;

    private selectViaImageLinkObservers: Array<Observer<ImageDocument>> = [];


    constructor(private router: Router,
                private viewFacade: ViewFacade,
                private location: Location,
                private projectConfiguration: ProjectConfiguration,
                private menus: Menus,
                private modalService: NgbModal,
                private datastore: Datastore) {}


    // For ResourcesComponent
    public routeParams(route: ActivatedRoute) {

        return Observable.create((observer: Observer<any>) => {
            this.setRoute(route, observer);
        });
    }


    public selectViaImageLinkNotifications = (): Observable<ImageDocument> =>
        ObserverUtil.register(this.selectViaImageLinkObservers);


    public async jumpToOperationView(operation: Document) {

        await this.router.navigate(['resources', operation.resource.id]);
    }


    /**
     * @throws M.RESOURCES_ERROR_PARENT_OPERATION_UNKNOWN_CATEGORY
     */
    public async jumpToResource(documentToSelect: Document, fromLink: boolean = true) {

        if (!this.router.url.startsWith('/resources/')) this.currentRoute = undefined;

        if (documentToSelect.resource.category === 'Project') {
            await this.editProject();
        } else if (documentToSelect.resource.category === 'Configuration') {
            await this.router.navigate(['configuration']);
        } else if (this.projectConfiguration.isSubcategory(documentToSelect.resource.category, 'Image')) {
            await this.jumpToImageCategoryResource(documentToSelect);
        } else {
            await this.jumpToFieldCategoryResource(documentToSelect, fromLink);
        }
    }


    public async jumpToConflictResolver(document: Document) {

        if (this.projectConfiguration.isSubcategory(document.resource.category, 'Image')) {
            if (this.router.url.includes('images')) {
                // indirect away first to reload the images component, in case you are already there
                await this.router.navigate(['images']);
            }
            return this.router.navigate(['images', 'conflicts', document.resource.id]);
        } else {
            const viewName: 'project'|'types'|string = this.getViewName(document);
            if (this.router.url.includes('resources')) {
                // indirect away first to reload the resources component, in case you are already there
                await this.router.navigate(['resources', viewName]);
            }
            return this.router.navigate(
                ['resources', viewName, document.resource.id, 'edit', 'conflicts']
            );
        }
    }


    private async jumpToImageCategoryResource(documentToSelect: Document) {

        if (!this.router.url.startsWith('/images/')) {
            await this.router.navigate(
                ['images', 'show', documentToSelect.resource.id],
                { queryParams: { from: this.currentRoute } }
            );
        } else {
            ObserverUtil.notify(this.selectViaImageLinkObservers, documentToSelect);
        }
    }


    private async jumpToFieldCategoryResource(documentToSelect: Document, fromLink: boolean) {

        const viewName: 'project'|'types'|'inventory'|string = this.getViewName(documentToSelect);

        if (!['project', 'types', 'inventory'].includes(viewName)) {
            try {
                await this.datastore.get(viewName);
            } catch (errWithParams) {
                if (errWithParams.length === 2 && errWithParams[0] === DatastoreErrors.UNKNOWN_CATEGORY) {
                    throw [M.RESOURCES_ERROR_PARENT_OPERATION_UNKNOWN_CATEGORY, errWithParams[1]];
                } else {
                    throw errWithParams;
                }
            }
        }
        if (!this.router.url.startsWith('/resources/') || viewName !== this.viewFacade.getView()) {
            await this.router.navigate(['resources', viewName, documentToSelect.resource.id]);
        } else {
            await this.viewFacade.setSelectedDocument(documentToSelect.resource.id, true, fromLink);
            if (['types', 'inventory'].includes(viewName)) {
                await this.viewFacade.moveInto(documentToSelect.resource.id, false, fromLink);
            }
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


    private getViewName(document: Document): 'project'|'types'|'inventory'|string {

        return this.projectConfiguration.getOverviewCategories().map(Named.toName).includes(document.resource.category)
            ? 'project'
            : this.projectConfiguration.getTypeManagementCategories()
                    .map(Named.toName).includes(document.resource.category)
                ? 'types'
                : this.projectConfiguration.getInventoryCategories()
                        .map(Named.toName).includes(document.resource.category)
                    ? 'inventory'
                    : document.resource.relations['isRecordedIn'][0];
    }


    private async editProject() {

        this.menus.setContext(MenuContext.DOCEDIT);

        const projectDocument: Document = await this.datastore.get('project');

        const modalRef = this.modalService.open(
            DoceditComponent,
            { size: 'lg', backdrop: 'static', keyboard: false, animation: false }
        );
        modalRef.componentInstance.setDocument(projectDocument);
        modalRef.componentInstance.activeGroup = 'stem';

        try {
            await modalRef.result;
        } catch(err) {
            // Docedit modal has been canceled
        }

        this.menus.setContext(MenuContext.DEFAULT);
    }
}
