import { Component } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Menus } from '../../services/menus';
import { FileInfo, ImageStore, ImageVariant, FileSyncPreference, PouchdbDatastore, SyncService } from 'idai-field-core';
import { M } from '../messages/m';
import { Messages } from '../messages/messages';
import { DownloadProjectProgressModalComponent } from './download-project-progress-modal.component';
import { TabManager } from '../../services/tabs/tab-manager';
import { SettingsService } from '../../services/settings/settings-service';
import { MenuContext } from '../../services/menu-context';
import { reloadAndSwitchToHomeRoute } from '../../services/reload';
import { SettingsProvider } from '../../services/settings/settings-provider';
import { RemoteImageStore } from '../../services/imagestore/remote-image-store';
import { AngularUtility } from '../../angular/angular-utility';

const PouchDB = window.require('pouchdb-browser');
const address = window.require('address');

const CREDENTIALS_TIMER_INTERVAL: number = 500;


@Component({
    templateUrl: './download-project.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    },
    standalone: false
})
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 * @author Simon Hohl
 */
export class DownloadProjectComponent {

    public url: string = '';
    public projectIdentifier: string = '';
    public password: string = '';
    public syncThumbnailImages: boolean = true;
    public syncOriginalImages: boolean = false;
    public overwriteProject: boolean = false;
    public loadingImagesSize: boolean = false;
    public originalImagesSize: string = '';
    public thumbnailImagesSize: string = '';

    private cancelling: boolean = false;
    private fileDownloadPromises: Array<Promise<void>> = [];
    private credentialsTimer: ReturnType<typeof setTimeout>;
    private getFileSizesStart: Date;


    constructor(private messages: Messages,
                private syncService: SyncService,
                private settingsService: SettingsService,
                private settingsProvider: SettingsProvider,
                private modalService: NgbModal,
                private menuService: Menus,
                private tabManager: TabManager,
                private imageStore: ImageStore,
                private remoteImageStore: RemoteImageStore,
                private pouchdbDatastore: PouchdbDatastore,
                private decimalPipe: DecimalPipe) {}

    
    public checkCredentialsCompleteness = () => this.getUrl() && this.getProjectIdentifier() && this.getPassword();


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && this.menuService.getContext() === MenuContext.DEFAULT) {
            await this.tabManager.openActiveTab();
        }
    }


    public async onStartClicked() {

        this.menuService.setContext(MenuContext.MODAL);

        const progressModalRef: NgbModalRef = this.modalService.open(
            DownloadProjectProgressModalComponent,
            { backdrop: 'static', keyboard: false, animation: false }
        );

        progressModalRef.componentInstance.databaseProgressPercent = 0;
        progressModalRef.componentInstance.filesProgressPercent = -1;
        progressModalRef.componentInstance.cancelFunction = () => this.cancel(progressModalRef);

        const destroyExisting: boolean = this.overwriteProject
            || !this.settingsProvider.getSettings().dbs.includes(this.getProjectIdentifier());

        try {
            const databaseSteps: number = await this.getUpdateSequence();
            if (databaseSteps === 0) {
                await this.cancel(progressModalRef);
                return this.messages.add([M.INITIAL_SYNC_INVALID_CREDENTIALS]);
            }

            const preferences: Array<FileSyncPreference> = this.getSelectedFileSyncPreferences();

            const fileList = preferences.length > 0
                ? await this.remoteImageStore.getFileInfosUsingCredentials(
                    this.getUrl(),
                    this.getPassword(),
                    this.getProjectIdentifier(),
                    preferences.map(preference => preference.variant)
                ) : undefined;

            await this.syncDatabase(progressModalRef, databaseSteps, destroyExisting);
            progressModalRef.componentInstance.databaseProgressPercent = 100;
    
            if (fileList) {
                progressModalRef.componentInstance.filesProgressPercent = 0;

                // This ensures that the CSS transition in DownloadProjectProgressModal runs smoothly
                await AngularUtility.refresh(2000);

                if (this.overwriteProject) await this.imageStore.deleteData(this.getProjectIdentifier());
                await this.syncFiles(progressModalRef, fileList);
                progressModalRef.componentInstance.filesProgressPercent = 100;
            }

            await AngularUtility.refresh(1000);

            this.settingsService.addProject(
                this.getProjectIdentifier(),
                {
                    isSyncActive: true,
                    address: this.getUrl(),
                    password: this.getPassword(),
                    fileSyncPreferences: preferences
                }
            ).then(() => {
                reloadAndSwitchToHomeRoute();
            });
        } catch (e) {
            if (e === 'DB not empty') {
                this.messages.add([M.INITIAL_SYNC_DB_NOT_EMPTY]);
            } else if (e === 'unauthorized') {
                this.messages.add([M.INITIAL_SYNC_INVALID_CREDENTIALS]);
            } else if (e === 'invalidCredentials') {
                this.messages.add([M.INITIAL_SYNC_INVALID_CREDENTIALS]);
            } else if (e && e.response && e.response.status === 401) {
                this.messages.add([M.INITIAL_SYNC_INVALID_CREDENTIALS]);
            } else if (e === 'canceled') {
                console.log('Download cancelled.');
            } else {
                await this.cancel(progressModalRef);
                this.messages.add([M.INITIAL_SYNC_COULD_NOT_START_GENERIC_ERROR]);
                console.error('Error while downloading project', e);
            }

            if (e !== 'canceled') this.closeModal(progressModalRef);
        }
    }


    public onCredentialsChanged() {

        if (this.credentialsTimer) clearTimeout(this.credentialsTimer);
        this.credentialsTimer = setTimeout(this.getFileSizes.bind(this), CREDENTIALS_TIMER_INTERVAL);
    }


    private async getFileSizes() {

        const startDate = new Date();
        this.getFileSizesStart = startDate;

        this.originalImagesSize = '';
        this.thumbnailImagesSize = '';

        if (!this.checkCredentialsCompleteness()) return;

        this.loadingImagesSize = true;

        try {
            const fileList = await this.remoteImageStore.getFileInfosUsingCredentials(
                this.getUrl(),
                this.getPassword(),
                this.getProjectIdentifier(),
                [ImageVariant.ORIGINAL, ImageVariant.THUMBNAIL]
            );

            const sizes = ImageStore.getFileSizeSums(fileList);

            if (this.getFileSizesStart === startDate) {
                this.originalImagesSize = `(${ImageStore.byteCountToDescription(
                    sizes.original_image, (value) => this.decimalPipe.transform(value)
                )})`;
                this.thumbnailImagesSize = `(${ImageStore.byteCountToDescription(
                    sizes.thumbnail_image, (value) => this.decimalPipe.transform(value)
                )})`;
            }
        } catch {
            this.originalImagesSize = '';
            this.thumbnailImagesSize = '';
        } finally {
            this.loadingImagesSize = false;
        }
    }


    private getSelectedFileSyncPreferences(): FileSyncPreference[] {

        const result = [];

        if (this.syncThumbnailImages) {
            result.push({
                upload: true,
                download: true,
                variant: ImageVariant.THUMBNAIL
            });
        }

        if (this.syncOriginalImages) {
            result.push({
                upload: true,
                download: true,
                variant: ImageVariant.ORIGINAL
            });
        }

        return result;
    }


    private async syncDatabase(progressModalRef: NgbModalRef, databaseSteps: number,
                               destroyExisting: boolean): Promise<void> {

        return new Promise(async (resolve, reject) => {
            try {
                (await this.syncService.startReplication(
                    this.getUrl(), this.getPassword(), this.getProjectIdentifier(), databaseSteps, destroyExisting
                )).subscribe({
                    next: lastSequence => {
                        const databaseProgress: number = DownloadProjectComponent.parseSequenceNumber(lastSequence);
                        progressModalRef.componentInstance.setDatabaseProgressPercent(
                            Math.min((databaseProgress / databaseSteps * 100), 100)
                        );
                    },
                    error: err => reject(err),
                    complete: () => resolve()
                });
            } catch (e) {
                reject(e);
            }
        });
    }


    private async syncFiles(progressModalRef: NgbModalRef, files: { [uuid: string]: FileInfo }): Promise<void> {

        let counter: number = 0;
        const fileCount: number = Object.keys(files).length;
        const batchSize: number = fileCount > 100 ? 20 : 1;

        try {
            const uuids: string[] = Object.keys(files);

            const batches: string[][] = [];
            for (let i = 0; i < uuids.length; i += batchSize) {
                const chunk: string[] = uuids.slice(i, i + batchSize);
                batches.push(chunk);
            }

            for (const batch of batches) {
                if (this.cancelling) throw 'canceled';

                this.fileDownloadPromises = [];

                for (const uuid of batch) {
                    if (files[uuid].deleted) {
                        this.imageStore.remove(uuid, this.getProjectIdentifier());
                        continue;
                    }

                    for (const variant of files[uuid].variants) {
                        if ([ImageVariant.ORIGINAL, ImageVariant.THUMBNAIL].includes(variant.name)) {
                            this.fileDownloadPromises.push(
                                this.remoteImageStore.getDataUsingCredentials(
                                    this.getUrl(), this.getPassword(), uuid, variant.name, this.getProjectIdentifier()
                                ).then((data) => {
                                    return this.imageStore.store(uuid, data, this.getProjectIdentifier(), variant.name);
                                })
                            );
                        }
                    }
                }

                await Promise.all(this.fileDownloadPromises);

                if (this.cancelling) throw 'canceled';

                counter += batch.length;
                const progressValue = ((counter / fileCount) * 100);
                progressModalRef.componentInstance.filesProgressPercent = progressValue;
            }
        } catch (e) {
            throw (e);
        }
    }


    private async cancel(progressModalRef: NgbModalRef) {

        if (this.cancelling) return;

        try {
            this.cancelling = true;
            this.syncService.stopReplication();
            await this.pouchdbDatastore.destroyDb(this.getProjectIdentifier());
            await Promise.all(this.fileDownloadPromises);
        } catch (err) {
        } finally {
            await this.imageStore.deleteData(this.getProjectIdentifier());
            this.cancelling = false;
            this.closeModal(progressModalRef);
        }
    }


    private async getUpdateSequence(): Promise<number> {

        let info;

        try {
            info = await new PouchDB(
                SyncService.generateUrl(this.getUrl(), this.getProjectIdentifier()),
                {
                    skip_setup: true,
                    auth: {
                        username: this.getProjectIdentifier(),
                        password: this.getPassword()
                    }
                }
            ).info();
        } catch (err) {
            throw 'invalidCredentials';
        }

        // tslint:disable-next-line: no-string-throw
        if (('error' in info && info.error === 'unauthorized') || info.status === 401) throw 'unauthorized';

        return info.doc_count === 0 ? 0 : DownloadProjectComponent.parseSequenceNumber(info.update_seq);
    }


    private getUrl(): string {

        const url: string = this.url?.trim();

        // Prevent trying to download project from own database
        return url.replace('http://', '').replace(':3000', '') === address.ip()
            ? '.'
            : url;
    }


    private getProjectIdentifier(): string {

        return this.projectIdentifier?.trim();
    }


    private getPassword(): string {

        return this.password?.trim();
    }


    private closeModal(modalRef: NgbModalRef) {

        modalRef.close();
        this.menuService.setContext(MenuContext.DEFAULT);
        AngularUtility.blurActiveElement();
    }


    private static parseSequenceNumber(updateSequence: number | string): number {

        return Number.parseInt((updateSequence + '').split('-')[0], 10);
    }
}
