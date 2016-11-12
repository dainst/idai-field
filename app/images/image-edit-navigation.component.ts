import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {ReadDatastore} from 'idai-components-2/idai-components-2';
import {ImageBase} from './image-base';

@Component({
    moduleId: module.id,
    templateUrl: './image-edit-navigation.html'
})

/**
 * @author Daniel de Oliveira
 */
export class ImageEditNavigationComponent extends ImageBase implements OnInit {

    constructor(
        private router: Router,
        route: ActivatedRoute,
        datastore: ReadDatastore
    ) {
        super(route,datastore);
    }

    ngOnInit() {
        this.fetchDoc();
    }

    public onSaveSuccess(e) {
        console.debug("on save success",e)
    }

    public onBackButtonClicked() {
        this.router.navigate(['images',this.doc.resource.id,'show']);
    }
}
