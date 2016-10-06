import {Component, OnInit, OnDestroy} from '@angular/core';
import {Router, ActivatedRoute, Params} from "@angular/router";
import {OverviewComponent} from "./overview.component";
import {Document} from "idai-components-2/idai-components-2";
import {ReadDatastore, ProjectConfiguration, ConfigLoader} from "idai-components-2/idai-components-2";
import {IdaiFieldGeometry} from "../model/idai-field-geometry";

@Component({
    moduleId: module.id,
    templateUrl: './map-wrapper.html'
})

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 */
export class MapWrapperComponent implements OnInit, OnDestroy {

    private activeDoc;
    private activeType;
    private docs;
    private projectConfiguration: ProjectConfiguration;
    private editMode: string; // polygon | point | none

    constructor(
        private router: Router,
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

            if (params['editMode']) {
                this.editMode = params['editMode'];
                this.removeEmptyDocument();
            } else {
                this.editMode = "none";
            }

            if (params['id']) {
                if (params['id'].indexOf('new') > -1) {
                    var type = params['id'].substring(params['id'].indexOf(":") + 1);
                    this.overviewComponent.createNewDocument(type);
                } else {
                    this.datastore.get(params['id']).then(document => {
                        this.activeDoc = document;
                        this.activeType = this.projectConfiguration.getLabelForType(document.resource.type);
                        this.overviewComponent.setSelected(<Document>document);
                    });
                }
            } else {
                this.activeDoc = null;
                this.overviewComponent.setSelected(null);
            }
        });

    }
    
    public selectDocument(document: Document) {
        
        if (document) {
            this.router.navigate(['resources', { id: document.resource.id }]);
        } else {
            this.router.navigate(['resources']);
        }
    }
    
    public quitEditing(geometry: IdaiFieldGeometry) {
        
        if (geometry) {
            this.overviewComponent.getSelected().resource.geometries = [ geometry ];
        }

        this.router.navigate(['resources', 'selected', 'edit']);
    }
    
    ngOnDestroy(): void {

        this.removeEmptyDocument();
    }

    private removeEmptyDocument() {
        
        var selectedDocument = this.overviewComponent.getSelected();
        if (selectedDocument && !selectedDocument.resource.id && !selectedDocument.resource.geometries) {
            this.overviewComponent.remove(selectedDocument);
        }
    }
}
