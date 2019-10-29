import {Component, Input} from '@angular/core';
import {FieldDocument, FieldGeometry, Messages} from 'idai-components-2';
import {ResourcesComponent} from '../resources.component';
import {Loading} from '../../../widgets/loading';
import {ViewFacade} from '../view/view-facade';
import {PersistenceManager} from '../../../core/model/persistence-manager';
import {UsernameProvider} from '../../../core/settings/username-provider';
import {SettingsService} from '../../../core/settings/settings-service';
import {NavigationPath} from '../view/state/navigation-path';
import {DocumentReadDatastore} from '../../../core/datastore/document-read-datastore';
import {ChangesStream} from '../../../core/datastore/core/changes-stream';


export type PopoverMenu = 'none'|'info'|'children';


@Component({
    selector: 'resources-map',
    moduleId: module.id,
    templateUrl: './resources-map.html',
    host: {'(window:keydown)': 'onKeyDown($event)'}
})
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 */
export class ResourcesMapComponent {

    @Input() activeTab: string;

    public parentDocument: FieldDocument|undefined;
    public coordinateReferenceSystem: string;
    public activePopoverMenu: PopoverMenu = 'none';


    constructor(datastore: DocumentReadDatastore,
                changesStream: ChangesStream,
                public loading: Loading,
                public viewFacade: ViewFacade,
                public resourcesComponent: ResourcesComponent,
                private persistenceManager: PersistenceManager,
                private usernameProvider: UsernameProvider,
                private settingsService: SettingsService,
                private messages: Messages) {

        this.parentDocument = this.getParentDocument(this.viewFacade.getNavigationPath());

        datastore.get('project').then(projectDocument => {
            this.coordinateReferenceSystem = projectDocument.resource.coordinateReferenceSystem;
        });

        changesStream.projectDocumentNotifications().subscribe(projectDocument => {
           this.coordinateReferenceSystem = projectDocument.resource.coordinateReferenceSystem;
        });

        this.viewFacade.navigationPathNotifications().subscribe(path => {
            this.parentDocument = this.getParentDocument(path);
        });
    }


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && !this.resourcesComponent.isModalOpened) {
            if (this.resourcesComponent.isEditingGeometry) {
                await this.quitEditing(undefined);
            } else {
                this.viewFacade.deselect();
            }
        }
    }


    public async select(document: FieldDocument|undefined) {

        this.resourcesComponent.setScrollTarget(document);

        if (document) {
            await this.viewFacade.setSelectedDocument(document.resource.id, false);
        } else {
            this.viewFacade.deselect();
        }
    }


    /**
     * @param geometry
     *   <code>null</code> indicates geometry should get deleted.
     *   <code>undefined</code> indicates editing operation aborted.
     */
    public async quitEditing(geometry: FieldGeometry|undefined) {

        const selectedDocument = this.viewFacade.getSelectedDocument();
        if (!selectedDocument) return;
        if (!selectedDocument.resource.geometry) return;

        if (geometry) {
            selectedDocument.resource.geometry = geometry;
        } else if (geometry === null || !selectedDocument.resource.geometry.coordinates
                || selectedDocument.resource.geometry.coordinates.length == 0) {
            delete selectedDocument.resource.geometry;
        }

        if (this.selectedDocumentIsNew()) {
            if (geometry !== undefined) {
                const selectedDocument = this.viewFacade.getSelectedDocument();
                if (selectedDocument) await this.resourcesComponent.editDocument(selectedDocument);
            } else {
                this.viewFacade.deselect();
                this.resourcesComponent.isEditingGeometry = false;
            }
        } else {
            if (geometry !== undefined) await this.save();
            this.resourcesComponent.isEditingGeometry = false;
        }
    }


    private async save() {

        const selectedDocument = this.viewFacade.getSelectedDocument();
        if (!selectedDocument) return;

        try {
            await this.viewFacade.setSelectedDocument(
                (await this.persistenceManager.persist(selectedDocument, this.usernameProvider.getUsername())).resource.id
            );
        } catch (msgWithParams) {
            this.messages.add(msgWithParams);
        }
    }


    private selectedDocumentIsNew(): boolean {

        const selectedDocument = this.viewFacade.getSelectedDocument();
        if (!selectedDocument) return false;

        return !selectedDocument.resource.id;
    }


    private getParentDocument(navigationPath: NavigationPath): FieldDocument|undefined {

        const currentOperation: FieldDocument|undefined = this.viewFacade.getCurrentOperation();

        if ((this.viewFacade.getBypassHierarchy() || !navigationPath.selectedSegmentId) && currentOperation) {
            return currentOperation;
        }

        const segment = navigationPath.segments
            .find(_ => _.document.resource.id === navigationPath.selectedSegmentId);

        return segment ? segment.document : undefined;
    }
}
