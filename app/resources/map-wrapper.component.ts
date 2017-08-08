import {Component, OnInit, Input} from '@angular/core';
import {ResourcesComponent} from './resources.component';
import {PersistenceManager} from 'idai-components-2/persist';
import {IdaiFieldDocument, IdaiFieldGeometry} from 'idai-components-2/idai-field-model';
import {Messages} from 'idai-components-2/messages';
import {SettingsService} from '../settings/settings-service';
import {Loading} from '../widgets/loading';

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
        public loading: Loading,
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

    private selectedDocumentIsNew(): boolean {
        return !this.selectedDocument.resource.id;
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

        if (geometry) {
            this.selectedDocument.resource.geometry = geometry;
        } else if (geometry === null || !this.selectedDocument.resource.geometry.coordinates
                || this.selectedDocument.resource.geometry.coordinates.length == 0) {
            delete this.selectedDocument.resource.geometry;
        }

        if (this.selectedDocumentIsNew()) {
            if (geometry !== undefined) {
                this.resourcesComponent.editDocument();
            } else {
                this.resourcesComponent.endEditGeometry();
                this.resourcesComponent.remove(this.selectedDocument);
            }
        } else {
            this.resourcesComponent.endEditGeometry();
            if (geometry !== undefined) this.save();
        }
    }

    private save() {

        this.persistenceManager.setOldVersions([this.selectedDocument]);
        this.persistenceManager.persist(this.selectedDocument, this.settingsService.getUsername())
            .catch(msgWithParams => this.messages.add(msgWithParams));
    }

}
