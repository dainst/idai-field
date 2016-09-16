import {Component,OnInit} from '@angular/core';
import {ActivatedRoute,Params,Router,ActivatedRouteSnapshot} from '@angular/router';
import {IndexeddbDatastore} from "../datastore/indexeddb-datastore";

@Component({
    moduleId: module.id,
    templateUrl: '../../templates/document-edit-wrapper.html'
})

export class DocumentEditWrapperComponent implements  OnInit{

    private document: any;

    ngOnInit() {

        console.log("--fetched a doc from datastore",this.route);

        this.route.params.forEach((params: Params) => {

                console.log("i---d:", params['id']);

                this.datastore.get(params['id']).then(document=> {

                    console.log("----fe-tched the doc from datastore",document);

                    this.document = document;

                })
        });
    }

    constructor(
        private datastore: IndexeddbDatastore,
        private route: ActivatedRoute)
    {}
}