import {Component, OnInit, OnDestroy} from '@angular/core';
import {Router, ActivatedRoute, Params} from '@angular/router';
import {ResourcesComponent} from './resources.component';
import {ReadDatastore} from 'idai-components-2/datastore';
import {PersistenceManager} from 'idai-components-2/persist';
import {ConfigLoader} from 'idai-components-2/configuration';
import {IdaiFieldDocument, IdaiFieldGeometry} from 'idai-components-2/idai-field-model';
import {SettingsService} from '../settings/settings-service';

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
        private resourcesComponent: ResourcesComponent,
        private configLoader: ConfigLoader,
        private persistenceManager: PersistenceManager,
        private settingsService: SettingsService
    ) {
    }

    public selectDocument(documentToJumpTo: IdaiFieldDocument) {

        if (documentToJumpTo) {
            if (this.docs.indexOf(documentToJumpTo) == -1) {
                this.resourcesComponent.queryChanged({q: '', type: 'resource', prefix: true}).then(
                    () => {
                        this.scrollToDocument(documentToJumpTo);
                        this.router.navigate(['resources', { id: documentToJumpTo.resource.id }]);
                    }
                )
            } else {
                this.scrollToDocument(documentToJumpTo);
                this.router.navigate(['resources', {id: documentToJumpTo.resource.id}]);
            }
        } else {
            this.router.navigate(['resources']);
        }
    }

    private scrollToDocument(doc) {

        let element = document.getElementById('resource-' + doc.resource.identifier);
        if (element) element.scrollIntoView({ behavior: 'smooth' });
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
                this.resourcesComponent.setSelected(<IdaiFieldDocument>document);
            });
        } else {
            this.activeDoc = null;
            this.resourcesComponent.setSelected(null);
        }   
    }

    ngOnInit(): void {

        this.resourcesComponent.getDocuments().subscribe(result => {
           this.docs = result as IdaiFieldDocument[];
        });

        this.getRouteParams(function(menuMode, editMode, id, type){

            this.setMenuMode(menuMode);
            this.setEditMode(editMode);

            if (type) {
                this.resourcesComponent.createNewDocument(type);
            } else {
                this.setActiveDoc(id);
            }

        }.bind(this)).catch(err=>console.log("MapWrapperComponent.ngOnInit caught err after calling getRouteParams: ",err));
    }
    


    private selectedDocIsNew() : boolean {
        return (this.resourcesComponent.getSelected().resource.id == undefined);
    }

    /**
     * @param geometry <coce>null</code> indicates geometry 
     *   should get deleted, <code>undefined</code> indicates editing operation aborted.
     */
    public quitEditing(geometry: IdaiFieldGeometry) {

        if (geometry) {
            this.resourcesComponent.getSelected().resource.geometry = geometry;
        } else if (geometry === null) { 
            delete this.resourcesComponent.getSelected().resource.geometry;
        }

        if (this.selectedDocIsNew()) {
            
            if (geometry === undefined) {
                this.router.navigate(['resources'])
            } else {
                this.router.navigate(['resources', 'selected', 'edit']);
            }
            
        } else {
            
            if (geometry !== undefined) this.save();
            this.router.navigate(['resources', {id: this.resourcesComponent.getSelected().resource.id}]);
        }
    }
    
    ngOnDestroy(): void {

        this.removeEmptyDocument();
    }

    private removeEmptyDocument() {
        
        var selectedDocument = this.resourcesComponent.getSelected();
        if (selectedDocument && !selectedDocument.resource.id && !selectedDocument.resource.geometry) {
            this.resourcesComponent.remove(selectedDocument);
        }
    }

    private save() {

        this.persistenceManager.setOldVersions([this.resourcesComponent.getSelected()]);

        this.persistenceManager.persist(this.resourcesComponent.getSelected(), this.settingsService.getUserName()).then(
            () => {
                this.resourcesComponent.getSelected()['synced'] = 0;
            },
            err => { console.log(err); });
    }
}
