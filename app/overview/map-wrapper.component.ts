import {Component,OnInit} from '@angular/core';
import {ActivatedRoute,Params} from "@angular/router";
import {OverviewComponent} from "./overview.component";
import {Document} from "idai-components-2/idai-components-2";
import {ReadDatastore, ProjectConfiguration, ConfigLoader} from "idai-components-2/idai-components-2";

@Component({
    moduleId: module.id,
    templateUrl: './map-wrapper.html'
})

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 */
export class MapWrapperComponent implements OnInit {

    private activeDoc;
    private activeType;
    private docs;
    private projectConfiguration: ProjectConfiguration;

    constructor(
        private route: ActivatedRoute,
        private datastore: ReadDatastore,
        private overviewComponent: OverviewComponent,
        private configLoader: ConfigLoader
    ) {
        this.configLoader.configuration().subscribe((result) => {
            if(result.error == undefined) {
                this.projectConfiguration = result.projectConfiguration;
            }
        });
    }

    ngOnInit(): void {

        this.overviewComponent.getDocuments().subscribe(result => {
           this.docs = result;
        });

        this.route.params.forEach((params: Params) => {
            if (params['id']) {
                this.datastore.get(params['id']).then(document => {
                    this.activeDoc = document;
                    this.activeType = this.projectConfiguration.getLabelForType(document.resource.type);
                    this.overviewComponent.setSelected(<Document>document);
                });
            } else {
                this.activeDoc = null;
                this.overviewComponent.setSelected(null);
            }
        });

    }
}
