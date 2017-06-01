import {Component, OnInit, OnDestroy, Input} from '@angular/core';
import {ResourcesComponent} from './resources.component';
import {ReadDatastore} from 'idai-components-2/datastore';
import {PersistenceManager} from 'idai-components-2/persist';
import {ConfigLoader} from 'idai-components-2/configuration';
import {IdaiFieldDocument, IdaiFieldGeometry} from 'idai-components-2/idai-field-model';
import {SettingsService} from '../settings/settings-service';

@Component({
    selector: 'map-wrapper',
    moduleId: module.id,
    templateUrl: './map-wrapper.html'
})

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 */
export class MapWrapperComponent implements OnInit, OnDestroy {

    @Input() activeDoc: IdaiFieldDocument;
    private activeType: string;
    private activeTypeLabel: string;
    private docs: IdaiFieldDocument[];

    @Input() editMode: boolean = false;

    constructor(
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
                        //this.router.navigate(['resources', { id: documentToJumpTo.resource.id }]);
                    }
                )
            } else {
                this.scrollToDocument(documentToJumpTo);
                //this.router.navigate(['resources', {id: documentToJumpTo.resource.id}]);
            }
        } else {
            //this.router.navigate(['resources']);
        }
    }

    private scrollToDocument(doc) {

        let element = document.getElementById('resource-' + doc.resource.identifier);
        if (element) element.scrollIntoView({ behavior: 'smooth' });
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

    }

    private selectedDocIsNew() : boolean {
        return (this.resourcesComponent.getSelected().resource.id == undefined);
    }

    /**
     * @param geometry <coce>null</code> indicates geometry 
     *   should get deleted, <code>undefined</code> indicates editing operation aborted.
     */
    public quitEditing(geometry: IdaiFieldGeometry) {
        let selectedDoc = this.resourcesComponent.getSelected();
        if (geometry) {
            selectedDoc.resource.geometry = geometry;
        } else if (geometry === null) { 
            delete selectedDoc.resource.geometry;
        }

        if (this.selectedDocIsNew()) {
            this.resourcesComponent.editDocument();
        } else {
            this.resourcesComponent.endEditGeometry();
            if (geometry !== undefined) this.save();

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

        this.persistenceManager.persist(this.resourcesComponent.getSelected(), this.settingsService.getUsername()).then(
            () => {
                this.resourcesComponent.getSelected()['synced'] = 0;
            },
            err => { console.log(err); });
    }


}
