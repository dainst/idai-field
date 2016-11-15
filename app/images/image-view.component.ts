import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {ReadDatastore} from 'idai-components-2/datastore'
import {ImageBase} from './image-base';

@Component({
    moduleId: module.id,
    templateUrl: './image-view.html'
})

/**
 * @author Daniel de Oliveira
 */
export class ImageViewComponent extends ImageBase implements OnInit {

    constructor(
        route: ActivatedRoute,
        datastore: ReadDatastore
    ) {
        super(route,datastore);
    }

    ngOnInit() {
        this.fetchDoc();
    }
}
