import {Component, OnInit} from "@angular/core";
import {ActivatedRoute, Params, Router} from "@angular/router";
import {ReadDatastore} from "idai-components-2/idai-components-2";
import {ObjectList} from "./object-list"

@Component({
    moduleId: module.id,
    templateUrl: '../../templates/document-view-wrapper.html'
})
/**
 * @author Daniel de Oliveira
 */
export class DocumentViewWrapperComponent implements  OnInit{

    private document;

    ngOnInit() {
        this.route.params.forEach((params: Params) => {
            this.datastore.get(params['id']).then(document=> {
                this.document = document;
                this.objectList.setSelected(document);
            })
        });
    }

    constructor(
        private route:ActivatedRoute,
        private datastore:ReadDatastore,
        private objectList: ObjectList,
        private router: Router // used in template
    )
    { }
}