import { Injectable } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Observable, Observer } from 'rxjs';
import { Map } from 'tsfun';
import { FileInfo, ImageDocument, ImageStore, ImageVariant, ObserverUtil } from 'idai-field-core';
import { MenuContext } from '../menu-context';
import { Menus } from '../menus';
import { SettingsProvider } from '../settings/settings-provider';
import { RemoteImageStore } from './remote-image-store';
import { AngularUtility } from '../../angular/angular-utility';
import { ImageDownloadRequest,
    ImageDownloadModalComponent } from '../../components/image/download/image-download-modal.component';
import { ImageExportModalComponent } from '../../components/image/export/image-export-modal.component';


@Injectable()
/**
  * @author Thomas Kleinke
 */
export class ImageToolLauncher {

    private originalFileInfos: Map<FileInfo>;
    private remoteOriginalFileInfos: Map<FileInfo>;
    private thumbnailFileInfos: Map<FileInfo>;
    private remoteThumbnailFileInfos: Map<FileInfo>;

    private downloadObservers: Array<Observer<void>> = [];


    constructor(private modalService: NgbModal,
                private menuService: Menus,
                private settingsProvider: SettingsProvider,
                private imageStore: ImageStore,
                private remoteImageStore: RemoteImageStore) {

        this.settingsProvider.settingsChangesNotifications().subscribe(async () => {
            await this.update();
        });
    }


    public downloadNotifications = (): Observable<void> => ObserverUtil.register(this.downloadObservers);


    public async update() {

        const project: string = this.settingsProvider.getSettings().selectedProject;

        this.originalFileInfos = await this.imageStore.getFileInfos(project, [ImageVariant.ORIGINAL]);
        this.remoteOriginalFileInfos = await this.remoteImageStore.getFileInfos(project, [ImageVariant.ORIGINAL]);
        this.thumbnailFileInfos = await this.imageStore.getFileInfos(project, [ImageVariant.THUMBNAIL]);
        this.remoteThumbnailFileInfos = await this.remoteImageStore.getFileInfos(project, [ImageVariant.THUMBNAIL]);
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
        modalRef.componentInstance.downloadRequests = this.getDownloadableImages(images);

        try {
            await modalRef.result;
        } catch(err) {
            // DownloadImageModal has been canceled
        } finally {
            this.menuService.setContext(currentContent);
            AngularUtility.blurActiveElement();
            await this.update();
            ObserverUtil.notify(this.downloadObservers, undefined);
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


    private getDownloadableImages(images: Array<ImageDocument>): Array<ImageDownloadRequest> {

        if (!this.originalFileInfos || !this.remoteOriginalFileInfos
                || !this.thumbnailFileInfos || !this.remoteThumbnailFileInfos) {
            return [];
        }

        return images.filter(image => {
            return !this.originalFileInfos[image.resource.id]
                && this.remoteOriginalFileInfos[image.resource.id];
        }).map(image => {
            return {
                image,
                downloadThumbnail: !this.thumbnailFileInfos[image.resource.id] !== undefined
                    && this.remoteThumbnailFileInfos[image.resource.id] !== undefined
            };
        });
    }


    private getExportableImages(images: Array<ImageDocument>): Array<ImageDocument> {

        if (!this.originalFileInfos) return [];

        return images.filter(document => this.originalFileInfos[document.resource.id]);
    }
}
