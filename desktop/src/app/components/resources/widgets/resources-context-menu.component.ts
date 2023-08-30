import { Component, ElementRef, EventEmitter, Input, OnChanges, Output, ViewChild } from '@angular/core';
import { to } from 'tsfun';
import { FieldDocument, Named, ProjectConfiguration, Document } from 'idai-field-core';
import { ResourcesContextMenu } from './resources-context-menu';
import { ContextMenuOrientation } from '../../widgets/context-menu';
import { MoveUtility } from '../../../components/resources/move-utility';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { MenuContext } from '../../../services/menu-context';
import { QrCodeModalComponent } from './qrcode-modal';
import { Menus } from '../../../services/menus';
import { SettingsProvider } from '../../../services/settings/settings-provider';


export type ResourcesContextMenuAction = 'edit'|'move'|'delete'|'create-qrcode'|'edit-images'|'create-polygon'|'create-line-string'
    |'create-point'|'edit-geometry';

@Component({
    selector: 'resources-context-menu',
    templateUrl: './resources-context-menu.html'
})
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 * @author Danilo Guzzo
 */
export class ResourcesContextMenuComponent implements OnChanges {
    @ViewChild('documentInfo', { static: false }) documentInfoElement: ElementRef;

    @Input() contextMenu: ResourcesContextMenu;
    @Input() showViewOption: boolean = false;
    @Input() document: Document;

    @Output() onSelectAction: EventEmitter<ResourcesContextMenuAction>
        = new EventEmitter<ResourcesContextMenuAction>();
    

    public orientation: ContextMenuOrientation = 'top';
    public project: string;
    

    constructor(
        private projectConfiguration: ProjectConfiguration,
        private modalService: NgbModal,
        private menus: Menus,
        private settingsProvider: SettingsProvider
   ) {
    this.project = this.settingsProvider.getSettings().selectedProject;
   }

    public selectAction = (action: ResourcesContextMenuAction) => this.onSelectAction.emit(action);

    public getBottomPosition = (yPosition: number) => ResourcesContextMenu.getBottomPosition(yPosition);


    ngOnChanges() {

        this.orientation = ResourcesContextMenu.computeOrientation(this.contextMenu.position?.y);
    }


    public areAnyOptionsAvailable(): boolean {

        return this.isDeleteOptionAvailable()
            || this.isEditOptionAvailable()
            || this.isCreateGeometryOptionAvailable()
            || this.isEditGeometryOptionAvailable()
            || this.isMoveOptionAvailable()
            || this.isEditImagesOptionAvailable();
    }


    public isEditImagesOptionAvailable(): boolean {

        return this.contextMenu.documents.length === 1 && !this.isReadonly();
    }


    public isEditOptionAvailable(): boolean {

        return this.contextMenu.documents.length === 1 && !this.isReadonly();
    }


    public isDeleteOptionAvailable(): boolean {

        return this.contextMenu.documents.length > 0 &&
            (!this.isReadonly() || this.projectConfiguration.getTypeCategories()
                .map(to(Named.NAME))
                .includes(this.contextMenu.documents[0].resource.category));
    }


    public isCreateGeometryOptionAvailable(): boolean {

        if (this.isReadonly()) return false;
        return this.contextMenu.documents.length === 1
            && this.projectConfiguration.isGeometryCategory(
                this.contextMenu.documents[0].resource.category)
            && !this.contextMenu.documents[0].resource.geometry;
    }


    public isEditGeometryOptionAvailable(): boolean {

        if (this.isReadonly()) return false;
        return this.contextMenu.documents.length === 1
            && this.projectConfiguration.isGeometryCategory(
                this.contextMenu.documents[0].resource.category)
            && this.contextMenu.documents[0].resource.geometry !== undefined;
    }


    public isMoveOptionAvailable(): boolean {

        if (this.isReadonly() || this.contextMenu.documents.length === 0) return false;

        return MoveUtility.getAllowedTargetCategories(
            this.contextMenu.documents as Array<FieldDocument>, this.projectConfiguration
        ).length > 0;
    }


    private isReadonly(): boolean {

        return this.contextMenu.documents.find(document => document.project !== undefined) !== undefined;
    }

    
    public async openQRCodeModal() {

        try {
            // sets the area within which this object acts
            this.menus.setContext(MenuContext.MODAL);
            // Opens a new modal window with the specified content and supplied options
            const modalRef: NgbModalRef = this.modalService.open(
                QrCodeModalComponent, { animation: false, backdrop: 'static' }
            );
            /* "get componentInstance" is a promise that is resolved when the modal is closed and calls 
                the project, documentID and identifier 
             */
            modalRef.componentInstance.project = this.project;
            modalRef.componentInstance.documentId = this.document._id;
            modalRef.componentInstance.identifier = this.document.resource.identifier;

            // calls the method render() to generate the Qr-Code
            modalRef.componentInstance.render();
            return true;
        } catch (e) {
            console.error(e)
            return false;
        } finally {
            this.menus.setContext(MenuContext.DEFAULT);
        }
    }
}
