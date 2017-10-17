import {Component, Input} from '@angular/core';
import {ResourcesComponent} from './resources.component';
import {PersistenceManager} from 'idai-components-2/persist';
import {IdaiFieldDocument, IdaiFieldGeometry} from 'idai-components-2/idai-field-model';
import {Messages} from 'idai-components-2/messages';
import {SettingsService} from '../settings/settings-service';
import {Loading} from '../widgets/loading';
import {ViewManager} from './service/view-manager';
import {MainTypeManager} from './service/main-type-manager';
import {DocumentsManager} from './service/documents-manager';
import {ViewFacade} from "./service/view-facade";

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
export class MapWrapperComponent {

    @Input() activeTab: string;


    constructor(
        public loading: Loading,
        private resourcesComponent: ResourcesComponent,
        private persistenceManager: PersistenceManager,
        private settingsService: SettingsService,
        private messages: Messages,
        private documentsManager: DocumentsManager,
        private viewFacade: ViewFacade
    ) { }


    private selectedDocumentIsNew(): boolean {

        return !this.viewFacade.getSelectedDocument().resource.id;
    }


    public select(document: IdaiFieldDocument, autoScroll: boolean = false) {

        this.resourcesComponent.isEditingGeometry = false;

        if (!document) {
            this.viewFacade.deselect();
        } else {
            this.documentsManager.setSelected(document);
        }

        if (autoScroll) this.resourcesComponent.setScrollTarget(document);
    }


    /**
     * @param geometry
     *   <code>null</code> indicates geometry should get deleted.
     *   <code>undefined</code> indicates editing operation aborted.
     */
    public quitEditing(geometry: IdaiFieldGeometry) {

        if (geometry) {
            this.documentsManager.selectedDocument.resource.geometry = geometry;
        } else if (geometry === null || !this.documentsManager.selectedDocument.resource.geometry.coordinates
                || this.documentsManager.selectedDocument.resource.geometry.coordinates.length == 0) {
            delete this.documentsManager.selectedDocument.resource.geometry;
        }

        if (this.selectedDocumentIsNew()) {
            if (geometry !== undefined) {
                this.resourcesComponent.editDocument();
            } else {
                this.resourcesComponent.isEditingGeometry = false;
                this.documentsManager.remove(this.documentsManager.selectedDocument);
            }
        } else {
            this.resourcesComponent.isEditingGeometry = false;
            if (geometry !== undefined) this.save();
        }
    }


    private save() {

        this.persistenceManager.setOldVersions([this.documentsManager.selectedDocument]);
        this.persistenceManager.persist(this.documentsManager.selectedDocument, this.settingsService.getUsername())
            .catch(msgWithParams => this.messages.add(msgWithParams));
    }

}
