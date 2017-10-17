import {Component, Input} from '@angular/core';
import {ResourcesComponent} from './resources.component';
import {PersistenceManager} from 'idai-components-2/persist';
import {
    IdaiFieldDocument,
    IdaiFieldGeometry
} from 'idai-components-2/idai-field-model';
import {Messages} from 'idai-components-2/messages';
import {SettingsService} from '../settings/settings-service';
import {Loading} from '../widgets/loading';
import {ViewFacade} from './service/view-facade';

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
            this.viewFacade.setSelectedDocument(document);
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
            this.viewFacade.getSelectedDocument().resource.geometry = geometry;
        } else if (geometry === null || !this.viewFacade.getSelectedDocument().resource.geometry.coordinates
                || this.viewFacade.getSelectedDocument().resource.geometry.coordinates.length == 0) {
            delete this.viewFacade.getSelectedDocument().resource.geometry;
        }

        if (this.selectedDocumentIsNew()) {
            if (geometry !== undefined) {
                this.resourcesComponent.editDocument();
            } else {
                this.resourcesComponent.isEditingGeometry = false;
                this.viewFacade.remove(this.viewFacade.getSelectedDocument());
            }
        } else {
            this.resourcesComponent.isEditingGeometry = false;
            if (geometry !== undefined) this.save();
        }
    }


    private save() {

        this.persistenceManager.setOldVersions([this.viewFacade.getSelectedDocument()]);
        this.persistenceManager.persist(this.viewFacade.getSelectedDocument(), this.settingsService.getUsername())
            .catch(msgWithParams => this.messages.add(msgWithParams));
    }

}
