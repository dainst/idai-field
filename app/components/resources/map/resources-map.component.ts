import {Component, Input} from '@angular/core';
import {Messages, FieldDocument, FieldGeometry} from 'idai-components-2';
import {ResourcesComponent} from '../resources.component';
import {Loading} from '../../../widgets/loading';
import {ViewFacade} from '../view/view-facade';
import {PersistenceManager} from '../../../core/model/persistence-manager';
import {UsernameProvider} from '../../../core/settings/username-provider';
import {SettingsService} from '../../../core/settings/settings-service';
import {NavigationPath} from '../view/state/navigation-path';
import {ContextMenuAction} from './context-menu.component';


@Component({
    selector: 'resources-map',
    moduleId: module.id,
    templateUrl: './resources-map.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)',
        '(window:contextmenu)': 'handleClick($event, true)'
    }
})
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 */
export class ResourcesMapComponent {

    @Input() activeTab: string;

    public parentDocument: FieldDocument|undefined;
    public contextMenuPosition: { x: number, y: number }|undefined;
    public relationsMenuPosition: { x: number, y: number }|undefined;

    public contextMenuDocument: FieldDocument|undefined;
    public relationsMenuDocument: FieldDocument|undefined;


    constructor(
        public loading: Loading,
        public viewFacade: ViewFacade,
        public resourcesComponent: ResourcesComponent,
        private persistenceManager: PersistenceManager,
        private usernameProvider: UsernameProvider,
        private settingsService: SettingsService,
        private messages: Messages
    ) {
        this.parentDocument = this.getParentDocument(this.viewFacade.getNavigationPath());

        this.viewFacade.navigationPathNotifications().subscribe(path => {
            this.closeContextMenu();
            this.parentDocument = this.getParentDocument(path);
        });

        this.resourcesComponent.listenToClickEvents().subscribe(event => this.handleClick(event));
    }


    public getProjectDocument = () => this.settingsService.getProjectDocument();


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


    public openContextMenu(event: MouseEvent, document: FieldDocument) {

        if (!document.resource.id) return this.closeContextMenu();

        this.contextMenuPosition = { x: event.clientX, y: event.clientY };
        this.contextMenuDocument = document;
    }


    public openRelationsMenu(event: MouseEvent, document: FieldDocument) {

        if (!document.resource.id) return this.closeRelationsMenu();

        this.relationsMenuPosition = { x: event.clientX, y: event.clientY };
        this.relationsMenuDocument = document;
    }


    public closeContextMenu() {

        this.contextMenuPosition = undefined;
        this.contextMenuDocument = undefined;
    }


    public closeRelationsMenu() {

        this.relationsMenuPosition = undefined;
        this.relationsMenuDocument = undefined;
    }


    public async performContextMenuAction(action: ContextMenuAction) {

        if (!this.contextMenuDocument) return;
        const document: FieldDocument = this.contextMenuDocument;

        this.closeContextMenu();

        switch (action) {
            case 'edit':
                await this.resourcesComponent.editDocument(document);
                break;
            case 'move':
                await this.resourcesComponent.moveDocument(document);
                break;
            case 'delete':
                await this.resourcesComponent.deleteDocument(document);
                break;
            case 'edit-geometry':
                await this.viewFacade.setSelectedDocument(document.resource.id);
                this.resourcesComponent.isEditingGeometry = true;
                break;
            case 'create-polygon':
                console.log("here")
                await this.viewFacade.setSelectedDocument(document.resource.id);
                this.resourcesComponent.createGeometry('Polygon');
                break;
            case 'create-line-string':
                await this.viewFacade.setSelectedDocument(document.resource.id);
                this.resourcesComponent.createGeometry('LineString');
                break;
            case 'create-point':
                await this.viewFacade.setSelectedDocument(document.resource.id);
                this.resourcesComponent.createGeometry('Point');
                break;
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


    public isDocumentSelected() {
        
        const selectedDocument = this.viewFacade.getSelectedDocument();
        return selectedDocument && selectedDocument.resource.id;
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


    private handleClick(event: any, rightClick: boolean = false) {

        if (!this.contextMenuPosition && !this.relationsMenuPosition) return;

        let target = event.target;
        let inside: boolean = false;

        do {
            if (target.id === 'context-menu'
                    || (rightClick && target.id && target.id.startsWith('resource-'))) {
                inside = true;
                break;
            }
            target = target.parentNode;
        } while (target);

        if (!inside) {
            this.closeRelationsMenu();
            this.closeContextMenu();
        }
    }
}
