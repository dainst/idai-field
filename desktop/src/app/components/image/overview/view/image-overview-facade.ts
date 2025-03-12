import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Injectable } from '@angular/core';
import { clone, equal, Map }  from 'tsfun';
import { ImageDocument, Named, Query, ProjectConfiguration, FileInfo, ImageStore,
    ImageVariant } from 'idai-field-core';
import { ImagesState } from './images-state';
import { ImageDocumentsManager } from './image-documents-manager';
import { RemoteImageStore } from '../../../../services/imagestore/remote-image-store';
import { SettingsProvider } from '../../../../services/settings/settings-provider';
import { ImageDownloadModalComponent } from '../../download/image-download-modal.component';
import { MenuContext } from '../../../../services/menu-context';
import { AngularUtility } from '../../../../angular/angular-utility';
import { Menus } from '../../../../services/menus';


/**
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 */
@Injectable()
export class ImageOverviewFacade {

    private currentOffset: number = 0;
    private maxRows: number = 5;
    private maxNrImagesPerRow: number = 12;
    private minNrImagesPerRow: number = 2;
    private imageFileInfos: Map<FileInfo>;
    private remoteImageFileInfos: Map<FileInfo>;


    constructor(private imageDocumentsManager: ImageDocumentsManager,
                private imagesState: ImagesState,
                private projectConfiguration: ProjectConfiguration,
                private imageStore: ImageStore,
                private remoteImageStore: RemoteImageStore,
                private settingsProvider: SettingsProvider,
                private menuService: Menus,
                private modalService: NgbModal) {}


    public getMaxNrImagesPerRow = () => this.maxNrImagesPerRow;

    public getMinNrImagesPerRow = () => this.minNrImagesPerRow;

    public select = (document: ImageDocument) => this.imageDocumentsManager.select(document);

    public toggleSelected = (document: ImageDocument, multiSelect?: boolean) =>
        this.imageDocumentsManager.toggleSelected(document, multiSelect);

    public getDocuments = (): Array<ImageDocument> => this.imageDocumentsManager.getDocuments();

    public getTotalDocumentCount = (): number => this.imageDocumentsManager.getTotalDocumentCount();

    public remove = (document: ImageDocument) => this.imageDocumentsManager.remove(document);

    public getSelected = (): Array<ImageDocument> => this.imageDocumentsManager.getSelected();

    public clearSelection = () => this.imageDocumentsManager.clearSelection();

    public getCustomConstraints = (): { [name: string]: string } => this.imagesState.getCustomConstraints();

    public getNrImagesPerRow = (): number => this.imagesState.getNrImagesPerRow();

    public getDepictsRelationsSelected = () => this.imageDocumentsManager.getDepictsRelationsSelected();

    public getQuery = (): Query => this.imagesState.getQuery();


    public async initialize() {

        await this.imagesState.load();
        if (!this.imagesState.getQuery()) this.imagesState.setQuery(this.getDefaultQuery());
        this.setQueryConstraints();
        await this.fetchDocuments();

        this.settingsProvider.settingsChangesNotifications().subscribe(async () => {
            await this.updateImageFileInfos();
        });
    }


    public async increaseNrImagesPerRow() {

        if (this.getNrImagesPerRow() < this.getMaxNrImagesPerRow()) {
            await this.imagesState.setNrImagesPerRow(this.getNrImagesPerRow() + 1);
            this.currentOffset = 0;
            await this.fetchDocuments();
        }
    }


    public async decreaseNrImagesPerRow() {

        if (this.getNrImagesPerRow() > this.getMinNrImagesPerRow()) {
            await this.imagesState.setNrImagesPerRow(this.getNrImagesPerRow() - 1);
            this.currentOffset = 0;
            await this.fetchDocuments();
        }
    }


    public async setNrImagesPerRow(size: number) {

        if (size >= this.getMinNrImagesPerRow() && size <= this.getMaxNrImagesPerRow()) {
            await this.imagesState.setNrImagesPerRow(size);
            this.currentOffset = 0;
            await this.fetchDocuments();
        }
    }


    public getPageCount() {

        return Math.ceil(this.getTotalDocumentCount() / this.getNrImagesPerPage());
    }


    public getCurrentPage() {

        return this.currentOffset / this.getNrImagesPerPage() + 1;
    }


    public async turnPage() {

        if (!this.canTurnPage()) return;

        this.imageDocumentsManager.clearSelection();
        this.currentOffset = this.currentOffset + this.getNrImagesPerPage();
        await this.fetchDocuments();
    }


    public async turnPageBack() {

        if (!this.canTurnPageBack()) return;

        this.currentOffset = this.currentOffset - this.getNrImagesPerPage();
        if (this.currentOffset < 0) this.currentOffset = 0;
        await this.fetchDocuments();
    
    }


    public canTurnPage() {

        const nextPageOffset = this.currentOffset + this.getNrImagesPerPage();
        return nextPageOffset < this.getTotalDocumentCount();
    }


    public canTurnPageBack() {

        return this.currentOffset > 0;
    }


    public setCustomConstraints(customConstraints: { [name: string]: string }) {

        if (equal(this.imagesState.getCustomConstraints(), customConstraints)) return;

        this.currentOffset = 0;

        this.imagesState.setCustomConstraints(customConstraints);
        this.setQueryConstraints();

        this.fetchDocuments();
    }


    public setQueryString(q: string) {

        this.currentOffset = 0;

        const query = this.imagesState.getQuery();
        query.q = q;
        this.imagesState.setQuery(query);

        this.fetchDocuments();
    }


    public setCategoryFilters(categories: string[]) {

        this.currentOffset = 0;

        const query = this.imagesState.getQuery();
        query.categories = categories;
        this.imagesState.setQuery(query);

        this.fetchDocuments();
    }


    public async fetchDocuments() {

        await this.imageDocumentsManager.fetchDocuments(
            this.getLimit(),
            this.currentOffset
        );
        await this.updateImageFileInfos();
    }


    public getDefaultQuery(): Query {

        return {
            q: '',
            categories: this.projectConfiguration.getImageCategories().map(Named.toName)
        };
    }


    public getDownloadableImages(): Array<ImageDocument> {

        if (!this.imageFileInfos) return [];

        return this.getSelected().filter(document => {
            return !this.imageFileInfos[document.resource.id]
                && this.remoteImageFileInfos[document.resource.id];
        });
    }


    public getExportableImages(): Array<ImageDocument> {

        if (!this.imageFileInfos) return [];

        return this.getSelected().filter(document => this.imageFileInfos[document.resource.id]);
    }


    public async downloadImages() {
    
        this.menuService.setContext(MenuContext.MODAL);

        const modalRef: NgbModalRef = this.modalService.open(
            ImageDownloadModalComponent, { keyboard: false, animation: false }
        );
        modalRef.componentInstance.images = this.getDownloadableImages();

        try {
            await modalRef.result;
        } catch(err) {
            // DownloadImageModal has been canceled
        } finally {
            this.menuService.setContext(MenuContext.DEFAULT);
            AngularUtility.blurActiveElement();
            await this.updateImageFileInfos();
        }
    }


    private getLimit() {

        return this.getNrImagesPerRow() * this.maxRows - 1 /* drop area */;
    }


    private getNrImagesPerPage() {

        return this.maxRows * this.getNrImagesPerRow() - 1;
    }


    private setQueryConstraints() {

        this.imagesState.getQuery().constraints = clone(this.getCustomConstraints());
    }


    private async updateImageFileInfos() {

        this.imageFileInfos = await this.imageStore.getFileInfos(
            this.settingsProvider.getSettings().selectedProject,
            [ImageVariant.ORIGINAL]
        );

        this.remoteImageFileInfos = await this.remoteImageStore.getFileInfos(
            this.settingsProvider.getSettings().selectedProject,
            [ImageVariant.ORIGINAL]
        );
    }
}
