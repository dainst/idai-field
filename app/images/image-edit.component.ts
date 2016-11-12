import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Params} from '@angular/router';
import {ReadDatastore} from 'idai-components-2/idai-components-2';
import {ImageBase} from './image-base';

@Component({
    moduleId: module.id,
    templateUrl: './image-edit.html'
})

/**
 * @author Daniel de Oliveira
 */
export class ImageEditComponent extends ImageBase implements OnInit {

    constructor(
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
}
