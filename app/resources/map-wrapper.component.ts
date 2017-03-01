import {Component, OnInit, OnDestroy} from "@angular/core";
import {Router, ActivatedRoute, Params} from "@angular/router";
import {ListingComponent} from "./listing.component";
import {ReadDatastore} from "idai-components-2/datastore";
import {PersistenceManager} from "idai-components-2/persist";
import {ConfigLoader} from "idai-components-2/configuration";
import {IdaiFieldDocument} from "../model/idai-field-document";
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

    private activeDoc: IdaiFieldDocument;
    private activeType: string;
    private activeTypeLabel: string;
    private docs: IdaiFieldDocument[];
    private menuMode: string; // view | geometryEdit
    private editMode: string; // polygon | point | none

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private datastore: ReadDatastore,
        private listingComponent: ListingComponent,
        private configLoader: ConfigLoader,
        private persistenceManager: PersistenceManager
    ) {
    }

    public selectDocument(documentToJumpTo: IdaiFieldDocument) {

        if (documentToJumpTo) {
            document.getElementById('resource-' + documentToJumpTo.resource.identifier)
                .scrollIntoView({ behavior: 'smooth' });
            this.router.navigate(['resources', { id: documentToJumpTo.resource.id }]);
        } else {
            this.router.navigate(['resources']);
        }
    }

    private getRouteParams(callback): Promise<any> {

        return this.route.params.forEach((params: Params) => {
            var type = undefined;
            var id = undefined;
            if (params['id'] && params['id'].indexOf('new') == 0) {
                type = params['id'].substring(4);
                console.debug("new doc of type:",type);
            } else {
                id = params['id'];
            }
            callback(params['menuMode'], params['editMode'], id, type);

        })
    }

    private setMenuMode(menuMode) {
        if (menuMode) {
            this.menuMode = menuMode;
        } else {
            this.menuMode = "view";
        }
    }

    private setEditMode(editMode) {
        if (editMode) {
            this.editMode = editMode;
            this.removeEmptyDocument();
        } else {
            this.editMode = "none";
        }
    }
    
    private setActiveDoc(id) {
        if (id) {
            this.datastore.get(id).then(document=> {
                this.activeDoc = document as IdaiFieldDocument;
                this.activeType = this.activeDoc.resource.type;
                this.configLoader.getProjectConfiguration().then(projectConfiguration => {
                    this.activeTypeLabel = projectConfiguration.getLabelForType(this.activeType); 
                });
                this.listingComponent.setSelected(<IdaiFieldDocument>document);
            });
        } else {
            this.activeDoc = null;
            this.listingComponent.setSelected(null);
        }   
    }

    ngOnInit(): void {

        this.listingComponent.getDocuments().subscribe(result => {
           this.docs = result as IdaiFieldDocument[];
        });

        this.getRouteParams(function(menuMode, editMode, id, type){

            this.setMenuMode(menuMode);
            this.setEditMode(editMode);

            if (type) {
                this.listingComponent.createNewDocument(type);
            } else {
                this.setActiveDoc(id);
            }

        }.bind(this)).catch(err=>console.log("MapWrapperComponent.ngOnInit caught err after calling getRouteParams: ",err));
    }
    


    private selectedDocIsNew() : boolean {
        return (this.listingComponent.getSelected().resource.id == undefined);
    }

    /**
     * @param geometry <coce>null</code> indicates geometry 
     *   should get deleted, <code>undefined</code> indicates editing operation aborted.
     */
    public quitEditing(geometry: IdaiFieldGeometry) {

        if (geometry) {
            this.listingComponent.getSelected().resource.geometries = [ geometry ];
        } else if (geometry === null) { 
            delete this.listingComponent.getSelected().resource.geometries;
        }

        if (this.selectedDocIsNew()) {
            
            if (geometry === undefined) {
                this.router.navigate(['resources'])
            } else {
                this.router.navigate(['resources', 'selected', 'edit']);
            }
            
        } else {
            
            if (geometry !== undefined) this.save();
            this.router.navigate(['resources', {id: this.listingComponent.getSelected().resource.id}]);
        }
    }
    
    ngOnDestroy(): void {

        this.removeEmptyDocument();
    }

    private removeEmptyDocument() {
        
        var selectedDocument = this.listingComponent.getSelected();
        if (selectedDocument && !selectedDocument.resource.id && !selectedDocument.resource.geometries) {
            this.listingComponent.remove(selectedDocument);
        }
    }

    private save() {

        this.persistenceManager.setOldVersion(this.listingComponent.getSelected());

        this.persistenceManager.persist(this.listingComponent.getSelected()).then(
            () => {
                this.listingComponent.getSelected()['synced'] = 0;
            },
            err => { console.log(err); });
    }
}
