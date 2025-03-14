import { Injectable } from '@angular/core';
import { DecimalPipe } from '@angular/common';
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
                private remoteImageStore: RemoteImageStore,
                private decimalPipe: DecimalPipe) {

        this.settingsProvider.settingsChangesNotifications().subscribe(async () => {
            await this.update();
        });
    }


    public downloadNotifications = (): Observable<void> => ObserverUtil.register(this.downloadObservers);


    public async update() {

        const project: string = this.settingsProvider.getSettings().selectedProject;

        this.originalFileInfos = await this.imageStore.getFileInfos(project, [ImageVariant.ORIGINAL]);
        this.thumbnailFileInfos = await this.imageStore.getFileInfos(project, [ImageVariant.THUMBNAIL]);
        this.remoteOriginalFileInfos = await this.remoteImageStore.getFileInfos(project, [ImageVariant.ORIGINAL]);
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
            ObserverUtil.notify(this.downloadObservers, undefined);
            this.update();
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


    public getDownloadSizeLabel(images: Array<ImageDocument>): string {

        const downloadSize: number = this.getDownloadSize(images);
        return this.getFileSizeLabel(downloadSize);
    }


    private getDownloadSize(images: Array<ImageDocument>): number {

        return images.reduce((result, image) => {
            const id: string = image.resource.id;
            if (!this.originalFileInfos[id] && this.remoteOriginalFileInfos[id]) {
                result += this.remoteOriginalFileInfos[id].variants.find(variant => {
                    return variant.name === ImageVariant.ORIGINAL;
                })?.size;
            }
            if (!this.thumbnailFileInfos[id] && this.remoteThumbnailFileInfos[id]) {
                result += this.remoteThumbnailFileInfos[id].variants.find(variant => {
                    return variant.name === ImageVariant.THUMBNAIL;
                })?.size;
            }
            return result;
        }, 0);
    }


    // TODO Use utility function
    private getFileSizeLabel(byteCount: number) {

        byteCount = byteCount * 0.00000095367;
        let unitTypeOriginal = 'MB';

        if (byteCount > 1000) {
            byteCount = byteCount * 0.00097656;
            unitTypeOriginal = 'GB';
        }

        return `${this.decimalPipe.transform(byteCount.toFixed(2))} ${unitTypeOriginal}`;
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
