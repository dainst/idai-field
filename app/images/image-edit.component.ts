import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Params} from '@angular/router';
import {ReadDatastore} from 'idai-components-2/idai-components-2'

@Component({
    moduleId: module.id,
    templateUrl: './image-edit.html'
})

/**
 * @author Daniel de Oliveira
 */
export class ImageEditComponent implements OnInit {

    private doc;

    constructor(
        private route: ActivatedRoute,
        private datastore: ReadDatastore
    ) {
    }

    ngOnInit() {
        this.getRouteParams(function(id){
            this.id=id;
            this.datastore.get(id).then(
                doc=>{
                    console.log("fetched ",doc)
                    this.doc = doc;
                },
                err=>{
                    console.error("Fatal error: could not load document for id ",id);
                });
        }.bind(this));
    }

    private getRouteParams(callback) {
        this.route.params.forEach((params: Params) => {
            callback(params['id']);
        });
    }
}
