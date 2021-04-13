import { Location } from '@angular/common';
import { Injectable } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DatastoreErrors } from 'idai-field-core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Document } from 'idai-field-core';
import { Observable, Observer } from 'rxjs';
import { ProjectCategories } from '../core/configuration/project-categories';
import { ProjectConfiguration } from '../core/configuration/project-configuration';
import { ViewFacade } from '../core/resources/view/view-facade';
import { SettingsProvider } from '../core/settings/settings-provider';
import { MenuContext, MenuService } from './menu-service';
import { ProjectsModalComponent } from './navbar/projects-modal.component';


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
                private projectConfiguration: ProjectConfiguration,
                private modalService: NgbModal,
                private settingsProvider: SettingsProvider,
                private menuService: MenuService) {}


    // For ResourcesComponent
    public routeParams(route: ActivatedRoute) {

        return Observable.create((observer: Observer<any>) => {
            this.setRoute(route, observer);
        });
    }


    public async jumpToOperationView(operation: Document) {

        await this.router.navigate(['resources', operation.resource.id]);
    }


    public async jumpToResource(documentToSelect: Document,
                                comingFromOutsideResourcesComponent: boolean = false) {

        if (comingFromOutsideResourcesComponent) this.currentRoute = undefined;

        if (documentToSelect.resource.category === 'Project') {
            return this.openProjectsModal();
        } else if (this.projectConfiguration.isSubcategory(documentToSelect.resource.category, 'Image')) {
            await this.jumpToImageCategoryResource(documentToSelect, comingFromOutsideResourcesComponent);
        } else {
            await this.jumpToFieldCategoryResource(documentToSelect, comingFromOutsideResourcesComponent);
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


    public async openProjectsModal(openConflictResolver: boolean = false) {

        this.menuService.setContext(MenuContext.PROJECTS);

        const ref: NgbModalRef = this.modalService.open(ProjectsModalComponent, { keyboard: false });
        ref.componentInstance.selectedProject = this.settingsProvider.getSettings().selectedProject;
        ref.componentInstance.openConflictResolver = openConflictResolver;

        try {
            await ref.result;
        } catch(err) {
            // Projects modal has been canceled
        } finally {
            this.menuService.setContext(MenuContext.DEFAULT);
        }
    }


    private async jumpToImageCategoryResource(documentToSelect: Document,
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


    private async jumpToFieldCategoryResource(documentToSelect: Document,
                                              comingFromOutsideResourcesComponent: boolean = false) {

        const viewName: 'project'|'types'|string = this.getViewName(documentToSelect);

        if (comingFromOutsideResourcesComponent || viewName !== this.viewFacade.getView()) {
            await this.router.navigate(['resources', viewName, documentToSelect.resource.id]);
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


    private getViewName(document: Document): 'project'|'types'|string {

        return ProjectCategories.getOverviewCategoryNames(this.projectConfiguration.getCategoryForest()).includes(document.resource.category)
            ? 'project'
            : ProjectCategories.getTypeCategoryNames().includes(document.resource.category)
                ? 'types'
                : document.resource.relations['isRecordedIn'][0];
    }
}
