import {Component, OnInit} from "@angular/core";
import {ActivatedRoute, Params, Router} from "@angular/router";
import {ReadDatastore} from "idai-components-2/idai-components-2";
import {OverviewComponent} from "./overview.component"
import {Document} from "idai-components-2/idai-components-2";
import {ConfigLoader} from "idai-components-2/idai-components-2";

@Component({
    moduleId: module.id,
    templateUrl: '../../templates/document-view-wrapper.html'
})
/**
 * @author Daniel de Oliveira
 */
export class DocumentViewWrapperComponent implements  OnInit{

    private document;
    private projectConfiguration;
    private relationsConfiguration;
    private type;

    ngOnInit() {
        this.route.params.forEach((params: Params) => {
            this.datastore.get(params['id']).then(document=> {
                this.document = document;
                this.type = this.projectConfiguration.getLabelForType(this.document.resource.type);
                this.overviewComponent.setSelected(<Document>document);
            })
        });
    }

    constructor(
        private route:ActivatedRoute,
        private datastore:ReadDatastore,
        private overviewComponent: OverviewComponent,
        private router: Router, // used in template,
        private configLoader: ConfigLoader
    ) {
        this.configLoader.configuration().subscribe((result)=>{
            if(result.error == undefined) {
                this.projectConfiguration = result.projectConfiguration;
                this.relationsConfiguration = result.relationsConfiguration;
            } else {
                // TODO Meldung geben/zeigen wenn es ein Problem mit der Configration gibt
                //this.messages.add(result.error.msgkey);
            }
        });
    }
}