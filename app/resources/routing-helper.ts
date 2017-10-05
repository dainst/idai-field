import {ActivatedRoute, Router} from '@angular/router';
import {Location} from '@angular/common';
import {Document} from 'idai-components-2/core';
import {ViewUtility} from "../common/view-utility";
import {Injectable} from "@angular/core";

@Injectable()
/**
 * @author Daniel de Oliveira
 */
export class RoutingHelper {

    private currentRoute = undefined;

    constructor(private router: Router,
                private location: Location,
                private viewUtility: ViewUtility) {

    }

    public setRoute(route: ActivatedRoute) { // we need a setter because the route must come from the componenent it is bound to

        route.params.subscribe(params => {

            this.currentRoute = undefined;
            if (params['view']) this.currentRoute = 'resources/' + params['view'];

            this.location.replaceState('resources/' + params['view']);
        })
    }

    public jumpToImageTypeRelationTarget(selectedDocument: Document, documentToSelect: Document) {

        if (this.currentRoute && selectedDocument.resource
            && selectedDocument.resource.id) {

            this.currentRoute += '/' + selectedDocument.resource.id + '/show/images';
        }
        this.router.navigate(
            ['images', documentToSelect.resource.id, 'show', 'relations'],
            { queryParams: { from: this.currentRoute } }
        );
    }

    public jumpToResourceTypeRelationTarget(vName, cb, documentToSelect: Document, tab?: string) {

        this.viewUtility.getViewNameForDocument(documentToSelect)
            .then(viewName => {
                if (viewName != vName) {
                    if (tab) {
                        return this.router.navigate(['resources', viewName,
                            documentToSelect.resource.id, 'view', tab]);
                    } else {
                        return this.router.navigate(['resources', viewName,
                            documentToSelect.resource.id]);
                    }
                } else {
                    cb(documentToSelect);
                }
            });
    }

    // granted this does not make too much sense here. but the indirection helps us to
    // to remove the viewUtility dependency from the resources component. viewUtility.getMainTypeDocumentLabel could
    // also be static and maybe we find a better place for that method.
    public getMainTypeDocumentLabel(document) {

        return this.viewUtility.getMainTypeDocumentLabel(document);
    }
}