import { Component, Input } from '@angular/core';
import { ChangesStream, Datastore, FieldDocument, FieldGeometry, RelationsManager } from 'idai-field-core';
import { Menus } from '../../../services/menus';
import { NavigationPath } from '../../../components/resources/view/state/navigation-path';
import { ViewFacade } from '../../../components/resources/view/view-facade';
import { Messages } from '../../messages/messages';
import { Loading } from '../../widgets/loading';
import { ResourcesComponent } from '../resources.component';
import { MenuContext } from '../../../services/menu-context';


@Component({
    selector: 'resources-map',
    templateUrl: './resources-map.html',
    host: { '(window:keydown)': 'onKeyDown($event)' },
    standalone: false
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


    constructor(datastore: Datastore,
                changesStream: ChangesStream,
                public loading: Loading,
                public viewFacade: ViewFacade,
                public resourcesComponent: ResourcesComponent,
                private relationsManager: RelationsManager,
                private messages: Messages,
                private menuService: Menus) {

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

        this.menuService.menuContextNotifications().subscribe(menuContext => {
            if (this.isEditing(menuContext)) this.resourcesComponent.popoverMenuOpened = false;
        });
    }


    public isPopoverMenuOpened = () => this.resourcesComponent.popoverMenuOpened;

    public isEditingGeometry = () => this.menuService.getContext() === MenuContext.GEOMETRY_EDIT;

    public isEditing = (menuContext = this.menuService.getContext()) =>
        [MenuContext.GEOMETRY_EDIT, MenuContext.MAP_LAYERS_EDIT].includes(menuContext);

    public isModalOpened = () => this.menuService.getContext() === MenuContext.MODAL
        || this.menuService.getContext() === MenuContext.DOCEDIT;
    
    public getPaddingLeft = () => (this.viewFacade.getSelectedDocument()
        && this.resourcesComponent.popoverMenuOpened) ? 258 : 0;

    public isMapUpdateAllowed = () => this.resourcesComponent.mapUpdateAllowed && this.viewFacade.isReady();


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && !this.isModalOpened()) {
            if (this.isEditingGeometry()) {
                await this.quitEditing(undefined);
            } else {
                this.viewFacade.deselect();
            }
        }
    }


    public async select(document: FieldDocument|undefined, multiSelect: boolean) {

        if (!document) return this.viewFacade.deselect();

        if (!multiSelect || !this.viewFacade.getSelectedDocument()) {
            await this.viewFacade.setSelectedDocument(document.resource.id, false);
        } if (document !== this.viewFacade.getSelectedDocument()) {
            this.resourcesComponent.toggleAdditionalSelected(document, true);
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
                || selectedDocument.resource.geometry.coordinates.length === 0) {
            delete selectedDocument.resource.geometry;
        }

        if (this.selectedDocumentIsNew()) {
            if (geometry !== undefined) {
                const selectedDocument = this.viewFacade.getSelectedDocument();
                if (selectedDocument) await this.resourcesComponent.editDocument(selectedDocument);
            } else {
                this.viewFacade.deselect();
                this.resourcesComponent.quitGeometryEditing();
            }
        } else {
            if (geometry !== undefined) await this.save();
            this.resourcesComponent.quitGeometryEditing();
        }
    }


    private async save() {

        const selectedDocument = this.viewFacade.getSelectedDocument();
        if (!selectedDocument) return;

        try {
            await this.viewFacade.setSelectedDocument(
                (await this.relationsManager.update(selectedDocument)).resource.id
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

        if ((this.viewFacade.isInExtendedSearchMode() || !navigationPath.selectedSegmentId) && currentOperation) {
            return currentOperation;
        }

        const segment = navigationPath.segments
            .find(_ => _.document.resource.id === navigationPath.selectedSegmentId);

        return segment ? segment.document : undefined;
    }
}
