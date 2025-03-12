import { Injectable } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Map } from 'tsfun';
import { FileInfo, ImageDocument, ImageStore, ImageVariant } from 'idai-field-core';
import { MenuContext } from '../menu-context';
import { Menus } from '../menus';
import { SettingsProvider } from '../settings/settings-provider';
import { RemoteImageStore } from './remote-image-store';
import { AngularUtility } from '../../angular/angular-utility';
import { ImageDownloadModalComponent } from '../../components/image/download/image-download-modal.component';
import { ImageExportModalComponent } from '../../components/image/export/image-export-modal.component';


@Injectable()
/**
  * @author Thomas Kleinke
 */
export class ImageToolLauncher {

    private imageFileInfos: Map<FileInfo>;
    private remoteImageFileInfos: Map<FileInfo>;


    constructor(private modalService: NgbModal,
                private menuService: Menus,
                private settingsProvider: SettingsProvider,
                private imageStore: ImageStore,
                private remoteImageStore: RemoteImageStore) {

        this.settingsProvider.settingsChangesNotifications().subscribe(async () => {
            await this.update();
        });
    }


    public async update() {

        this.imageFileInfos = await this.imageStore.getFileInfos(
            this.settingsProvider.getSettings().selectedProject,
            [ImageVariant.ORIGINAL]
        );

        this.remoteImageFileInfos = await this.remoteImageStore.getFileInfos(
            this.settingsProvider.getSettings().selectedProject,
            [ImageVariant.ORIGINAL]
        );
    }


    public isDownloadPossible(images: Array<ImageDocument>): boolean {

        return this.getDownloadableImages(images).length > 0;
    }


    public isExportPossible(images: Array<ImageDocument>): boolean {

        return this.getExportableImages(images).length > 0;
    }
    

    public async downloadImages(images: Array<ImageDocument>) {
        
        const currentContent: MenuContext = this.menuService.getContext();
        this.menuService.setContext(MenuContext.IMAGE_TOOL_MODAL);

        const modalRef: NgbModalRef = this.modalService.open(
            ImageDownloadModalComponent, { keyboard: false, animation: false }
        );
        modalRef.componentInstance.images = this.getDownloadableImages(images);

        try {
            await modalRef.result;
        } catch(err) {
            // DownloadImageModal has been canceled
        } finally {
            this.menuService.setContext(currentContent);
            AngularUtility.blurActiveElement();
            await this.update();
        }
    }


    public async exportImages(images: Array<ImageDocument>) {
    
        const currentContent: MenuContext = this.menuService.getContext();
        this.menuService.setContext(MenuContext.IMAGE_TOOL_MODAL);

        const modalRef: NgbModalRef = this.modalService.open(
            ImageExportModalComponent, { keyboard: false, animation: false }
        );
        modalRef.componentInstance.images = this.getExportableImages(images);

        try {
            await modalRef.result;
        } catch(err) {
            // ExportImageModal has been canceled
        } finally {
            this.menuService.setContext(currentContent);
            AngularUtility.blurActiveElement();
        }
    }


    private getDownloadableImages(images: Array<ImageDocument>): Array<ImageDocument> {

        if (!this.imageFileInfos) return [];

        return images.filter(document => {
            return !this.imageFileInfos[document.resource.id]
                && this.remoteImageFileInfos[document.resource.id];
        });
    }


    private getExportableImages(images: Array<ImageDocument>): Array<ImageDocument> {

        if (!this.imageFileInfos) return [];

        return images.filter(document => this.imageFileInfos[document.resource.id]);
    }
}
