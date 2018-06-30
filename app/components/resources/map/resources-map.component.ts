import {Component, Input} from '@angular/core';
import {Document, Messages} from 'idai-components-2/core';
import {IdaiFieldDocument, IdaiFieldGeometry} from 'idai-components-2/field';
import {ResourcesComponent} from '../resources.component';
import {Loading} from '../../../widgets/loading';
import {ViewFacade} from '../view/view-facade';
import {PersistenceManager} from '../../../core/persist/persistence-manager';
import {UsernameProvider} from '../../../core/settings/username-provider';
import {SettingsService} from '../../../core/settings/settings-service';
import {NavigationPath} from '../view/state/navigation-path';


@Component({
    selector: 'resources-map',
    moduleId: module.id,
    templateUrl: './resources-map.html'
})
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 */
export class ResourcesMapComponent {

    @Input() activeTab: string;

    private parentDocuments: Array<Document>;


    constructor(
        public loading: Loading,
        public viewFacade: ViewFacade,
        public resourcesComponent: ResourcesComponent,
        private persistenceManager: PersistenceManager,
        private usernameProvider: UsernameProvider,
        private settingsService: SettingsService,
        private messages: Messages
    ) {
        this.parentDocuments = this.getParentDocuments(this.viewFacade.getNavigationPath());

        this.viewFacade.navigationPathNotifications().subscribe(path => {
            this.parentDocuments = this.getParentDocuments(path);
        });
    }


    public getIsRecordedInTarget() {

        return this.resourcesComponent.getSelectedOperationTypeDocument() !== undefined
            ? this.resourcesComponent.getSelectedOperationTypeDocument()
            : this.settingsService.getProjectDocument()
    }


    public async select(document: IdaiFieldDocument|undefined) {

        this.resourcesComponent.setScrollTarget(document);

        if (document) {
            await this.viewFacade.setSelectedDocument(document);
        } else {
            this.viewFacade.deselect();
        }
    }


    /**
     * @param geometry
     *   <code>null</code> indicates geometry should get deleted.
     *   <code>undefined</code> indicates editing operation aborted.
     */
    public quitEditing(geometry: IdaiFieldGeometry) {

        const selectedDoc = this.viewFacade.getSelectedDocument();
        if (!selectedDoc) return;
        if (!selectedDoc.resource.geometry) return;

        if (geometry) {
            selectedDoc.resource.geometry = geometry;
        } else if (geometry === null || !selectedDoc.resource.geometry.coordinates
                || selectedDoc.resource.geometry.coordinates.length == 0) {
            delete selectedDoc.resource.geometry;
        }

        if (this.selectedDocumentIsNew()) {
            if (geometry !== undefined) {
                const selectedDoc = this.viewFacade.getSelectedDocument();
                if (selectedDoc) this.resourcesComponent.editDocument(selectedDoc);
            } else {
                this.resourcesComponent.isEditingGeometry = false;
                this.viewFacade.remove(selectedDoc);
            }
        } else {
            this.resourcesComponent.isEditingGeometry = false;
            if (geometry !== undefined) this.save();
        }
    }


    private save() {

        const selectedDoc = this.viewFacade.getSelectedDocument();
        if (!selectedDoc) return;

        this.persistenceManager.persist(selectedDoc, this.usernameProvider.getUsername())
            .catch(msgWithParams => this.messages.add(msgWithParams));
    }


    private selectedDocumentIsNew(): boolean {

        const selectedDoc = this.viewFacade.getSelectedDocument();
        if (!selectedDoc) return false;

        return !selectedDoc.resource.id;
    }


    private getParentDocuments(navigationPath: NavigationPath): Array<Document> {

        if (!this.viewFacade.getDisplayHierarchy() && this.viewFacade.getBypassOperationTypeSelection()) {
            return this.viewFacade.getOperationTypeDocuments();
        }

        if (!navigationPath.selectedSegmentId) {
            const isRecordedInTarget: Document|undefined = this.getIsRecordedInTarget();
            return isRecordedInTarget ? [isRecordedInTarget] : [];
        }

        const segment = navigationPath.segments
            .find(_ => _.document.resource.id === navigationPath.selectedSegmentId);

        return segment ? [segment.document] : [];
    }
}
