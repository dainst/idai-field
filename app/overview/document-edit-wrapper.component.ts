import {Component, OnInit} from "@angular/core";
import {ActivatedRoute, Params, Router} from "@angular/router";
import {ReadDatastore} from "idai-components-2/idai-components-2";
import {PersistenceService} from "./persistence-service";
import {ObjectList} from "./object-list";

@Component({
    moduleId: module.id,
    templateUrl: '../../templates/document-edit-wrapper.html'
})

export class DocumentEditWrapperComponent implements  OnInit{

    private document: any;
    private mode: string; // new | edit

    ngOnInit() {
∞
        this.route.params.forEach((params: Params) => {
            if (params['id'].indexOf('new')!=-1) {
                this.mode='new';
                this.document=this.objectList.createNewDocument();
            } else {
                this.mode='edit';
                this.datastore.get(params['id']).then(document=> {
                    this.document = document;
                    this.objectList.setSelected(document);
                })
            }
        });
    }

    constructor(
        private datastore: ReadDatastore,
        private route: ActivatedRoute,
        private persistenceService:PersistenceService,
        private router: Router,
        private objectList: ObjectList
    )
    {}
}