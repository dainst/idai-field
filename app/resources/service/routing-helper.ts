import {Injectable} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Location} from '@angular/common';
import {Observable} from 'rxjs/Observable';
import {Document} from 'idai-components-2/core';
import {ImageTypeUtility} from '../../docedit/image-type-utility';
import {ViewFacade} from '../view/view-facade';
import {Loading} from '../../widgets/loading';
import {GeneralRoutingHelper} from '../../common/general-routing-helper';

@Injectable()
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 */
export class RoutingHelper {

    private currentRoute;


    constructor(private router: Router,
                private viewFacade: ViewFacade,
                private location: Location,
                private imageTypeUtility: ImageTypeUtility,
                private loading: Loading,
                private generalRoutingHelper: GeneralRoutingHelper
    ) {
    }


    // For ResourcesComponent
    public routeParams(route: ActivatedRoute) {

        return Observable.create(observer => {
            this.setRoute(route, observer);
        });
    }


    // Currently used from SidebarListComponent
    public jumpToMainTypeHomeView(document: Document) {

        const viewName = this.viewFacade.getMainTypeHomeViewName(document.resource.type);
        if (viewName == this.viewFacade.getCurrentViewName()) return;

        this.router.navigate(['resources', viewName, document.resource.id]).then(() => {
            this.viewFacade.selectMainTypeDocument(document);
        });
    }


    // Currently used from DocumentViewSidebar and ImageViewComponent
    public jumpToRelationTarget(documentToSelect: Document, tab?: string,
                                comingFromOutsideOverviewComponent: boolean = false) {

        if (this.imageTypeUtility.isImageType(documentToSelect.resource.type)) {
            this.jumpToImageTypeRelationTarget(documentToSelect);
        } else {
            this.jumpToResourceTypeRelationTarget(
                documentToSelect, tab, comingFromOutsideOverviewComponent);
        }
    }


    private jumpToImageTypeRelationTarget(documentToSelect: Document) {

        const selectedDocument = this.viewFacade.getSelectedDocument();

        if (this.currentRoute && selectedDocument.resource && selectedDocument.resource.id) {
            this.currentRoute += '/' + selectedDocument.resource.id + '/show/images';
        }
        this.router.navigate(
            ['images', documentToSelect.resource.id, 'show', 'relations'],
            { queryParams: { from: this.currentRoute } }
        );
    }


    private async jumpToResourceTypeRelationTarget(
        documentToSelect: Document,
        tab?: string,
        comingFromOutsideOverviewComponent: boolean = false) {

        const viewName = await this.viewFacade.getMainTypeHomeViewName(
            await this.generalRoutingHelper.getMainTypeNameForDocument(documentToSelect));

        if (comingFromOutsideOverviewComponent ||
            viewName != this.viewFacade.getCurrentViewName()) {

            if (tab) {
                return this.router.navigate(['resources', viewName,
                    documentToSelect.resource.id, 'view', tab]);
            } else {
                return this.router.navigate(['resources', viewName,
                    documentToSelect.resource.id]);
            }
        } else {

            this.viewFacade.setSelectedDocument(documentToSelect)
        }
    }


    // For ResourcesComponent
    private setRoute(route: ActivatedRoute, observer) { // we need a setter because the route must come from the componenent it is bound to

        route.params.subscribe(params => {

            this.currentRoute = undefined;
            if (params['view']) this.currentRoute = 'resources/' + params['view'];

            this.location.replaceState('resources/' + params['view']);

            this.loading.start();
            this.viewFacade.setupView(params['view'], params['id'])
                .then(() => {this.loading.stop(); observer.next(params);})
                .catch(msgWithParams => {
                    if (msgWithParams) console.error(
                        "got msgWithParams in GeneralRoutingHelper#setRoute: ",msgWithParams);
                });
        });
    }
}