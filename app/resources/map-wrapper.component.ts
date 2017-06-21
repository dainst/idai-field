import {Component, OnInit, Input} from '@angular/core';
import {ResourcesComponent} from './resources.component';
import {PersistenceManager} from 'idai-components-2/persist';
import {IdaiFieldDocument, IdaiFieldGeometry} from 'idai-components-2/idai-field-model';
import {Messages} from 'idai-components-2/messages';
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
export class MapWrapperComponent implements OnInit {

    @Input() selectedDocument: IdaiFieldDocument;
    @Input() editMode: boolean = false;

    private docs: IdaiFieldDocument[];

    constructor(
        private resourcesComponent: ResourcesComponent,
        private persistenceManager: PersistenceManager,
        private settingsService: SettingsService,
        private messages: Messages
    ) { }

    ngOnInit(): void {

        this.resourcesComponent.getDocuments().subscribe(result => {
           this.docs = result as IdaiFieldDocument[];
        });
    }

    private selectedDocIsNew(): boolean {
        return (this.resourcesComponent.getSelected().resource.id == undefined);
    }

    public select(document: IdaiFieldDocument) {

        this.resourcesComponent.select(document);
        this.resourcesComponent.setScrollTarget(document);
    }

    /**
     * @param geometry
     *   <code>null</code> indicates geometry should get deleted.
     *   <code>undefined</code> indicates editing operation aborted.
     */
    public quitEditing(geometry: IdaiFieldGeometry) {

        let selectedDoc = this.resourcesComponent.getSelected();
        if (geometry) {
            selectedDoc.resource.geometry = geometry;
        } else if (geometry === null) { 
            delete selectedDoc.resource.geometry;
        }

        if (this.selectedDocIsNew()) {
            if (geometry !== undefined) {
                this.resourcesComponent.editDocument();
            } else {
                this.resourcesComponent.endEditGeometry();
                this.resourcesComponent.remove(selectedDoc);
            }
        } else {
            this.resourcesComponent.endEditGeometry();
            if (geometry !== undefined) this.save();
        }
    }

    private save() {

        this.persistenceManager.setOldVersions([this.resourcesComponent.getSelected()]);
        this.persistenceManager.persist(this.resourcesComponent.getSelected(), this.settingsService.getUsername()).then(
            () => {
                this.resourcesComponent.getSelected()['synced'] = 0;
            }, msgWithParams => this.messages.add(msgWithParams));
    }
}
