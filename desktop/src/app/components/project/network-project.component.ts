import { Component } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Menus } from '../../services/menus';
import {
    FileInfo,
    ImageStore,
    ImageVariant,
    SyncService
} from 'idai-field-core';
import { M } from '../messages/m';
import { Messages } from '../messages/messages';
import { NetworkProjectProgressModalComponent } from './network-project-progress-modal.component';
import { TabManager } from '../../services/tabs/tab-manager';
import { SettingsService } from '../../services/settings/settings-service';
import { MenuContext } from '../../services/menu-context';
import { reloadAndSwitchToHomeRoute } from '../../services/reload';
import { SettingsProvider } from '../../services/settings/settings-provider';
import { RemoteImageStore } from '../../services/imagestore/remote-image-store';

const PouchDB = typeof window !== 'undefined' ? window.require('pouchdb-browser') : require('pouchdb-node');


@Component({
    templateUrl: './network-project.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    }
})
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class NetworkProjectComponent {

    public url = '';
    public projectName = '';
    public password = '';
    public syncThumbnailImages = true;
    public syncOriginalImages = false;

    private cancelling = false;
    private fileDownloadPromises = [];

    constructor(
        private messages: Messages,
        private syncService: SyncService,
        private settingsService: SettingsService,
        private settingsProvider: SettingsProvider,
        private modalService: NgbModal,
        private menuService: Menus,
        private tabManager: TabManager,
        private imageStore: ImageStore,
        private remoteImageStore: RemoteImageStore
    ) { }


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && this.menuService.getContext() === MenuContext.DEFAULT) {
            await this.tabManager.openActiveTab();
        }
    }

    public async onStartClicked() {

        this.menuService.setContext(MenuContext.MODAL);

        const progressModalRef: NgbModalRef = this.modalService.open(
            NetworkProjectProgressModalComponent,
            { backdrop: 'static', keyboard: false }
        );

        progressModalRef.componentInstance.progressPercent = 0;
        progressModalRef.result.catch(async (canceled) => {

            try {
                this.cancelling = true;
                this.syncService.stopReplication();
                await Promise.all(this.fileDownloadPromises);
            } catch (err) {
            } finally {
                await this.imageStore.deleteData(this.projectName);
                this.cancelling = false;
                this.closeModal(progressModalRef);
            }
        });

        let databaseSteps: number;

        const destroyExisting: boolean = !this.settingsProvider.getSettings().dbs.includes(this.projectName);

        try {

            databaseSteps = await this.getUpdateSequence();

            const fileList = await this.remoteImageStore.getFileInfosUsingCredentials(
                this.url,
                this.password,
                this.projectName,
                this.getSelectedFileSync()
            );

            const overallSteps = databaseSteps + Object.keys(fileList).length;

            const databasePercentile = databaseSteps / overallSteps;

            await this.syncDatabase(progressModalRef, databaseSteps, databasePercentile, destroyExisting);
            await this.syncFiles(progressModalRef, 1 - databasePercentile, fileList);

            this.settingsService.addProject(
                this.projectName,
                {
                    isSyncActive: true,
                    address: this.url,
                    password: this.password,
                    activeFileSync: this.getSelectedFileSync()
                }
            ).then(() => {
                this.closeModal(progressModalRef);
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
            }
            else {
                this.messages.add([M.INITIAL_SYNC_COULD_NOT_START_GENERIC_ERROR]);
                console.error('Error while downloading project', e);
            }

            this.closeModal(progressModalRef);
        }
    }

    private getSelectedFileSync(): ImageVariant[] {
        const result = [];

        if (this.syncThumbnailImages) result.push(ImageVariant.THUMBNAIL);
        if (this.syncOriginalImages) result.push(ImageVariant.ORIGINAL);

        return result;
    }

    private async syncDatabase(
        progressModalRef: NgbModalRef,
        updateSequence: number,
        overallPercentile: number,
        destroyExisting: boolean
    ): Promise<void> {
        return new Promise(async (res, rej) => {
            try {
                (await this.syncService.startReplication(
                    this.url, this.password, this.projectName, updateSequence, destroyExisting
                )).subscribe({
                    next: lastSequence => {
                        const lastSequenceNumber: number = NetworkProjectComponent.parseSequenceNumber(lastSequence);
                        progressModalRef.componentInstance.progressPercent = Math.min(
                            (lastSequenceNumber / updateSequence * 100 * overallPercentile), 100
                        );
                    },
                    error: err => {
                        rej(err);
                    },
                    complete: () => {
                        res();
                    }
                });
            } catch (e) {
                rej(e);
            }
        });
    }

    private async syncFiles(
        progressModalRef: NgbModalRef,
        targetPercentile: number,
        files: { [uuid: string]: FileInfo }
    ): Promise<void> {

        let counter = 0;
        const fileCount = Object.keys(files).length;
        const batchSize = 20;

        const startValue = progressModalRef.componentInstance.progressPercent;

        try {
            const uuids = Object.keys(files);

            const batches = [];
            for (let i = 0; i < uuids.length; i += batchSize) {
                const chunk = uuids.slice(i, i + batchSize);
                batches.push(chunk);
            }

            for (const batch of batches) {

                if (this.cancelling) throw 'canceled';

                this.fileDownloadPromises = [];

                for (const uuid of batch) {

                    for (const type of files[uuid].types) {
                        if ([ImageVariant.ORIGINAL, ImageVariant.THUMBNAIL].includes(type)) {
                            this.fileDownloadPromises.push(
                                this.remoteImageStore.getDataUsingCredentials(
                                    this.url, this.password, uuid, type, this.projectName
                                ).then((data) => {
                                    return this.imageStore.store(uuid, data, this.projectName, type);
                                })
                            );
                        }
                    }
                }

                await Promise.all(this.fileDownloadPromises);

                if (this.cancelling) throw 'canceled';

                counter += batch.length;
                const progressValue = startValue + ((counter / fileCount) * 100 * targetPercentile);
                progressModalRef.componentInstance.progressPercent = progressValue;
            }
        } catch (e) {
            throw (e);
        }
    }


    private async getUpdateSequence(): Promise<number> {
        const info = await new PouchDB(
            SyncService.generateUrl(this.url, this.projectName),
            {
                skip_setup: true,
                auth: {
                    username: this.projectName,
                    password: this.password
                }
            }
        ).info();

        // tslint:disable-next-line: no-string-throw
        if (('error' in info && info.error === 'unauthorized') || info.status === 401) throw 'unauthorized';

        return NetworkProjectComponent.parseSequenceNumber(info.update_seq);
    }


    private closeModal(modalRef: NgbModalRef) {

        modalRef.close();
        this.menuService.setContext(MenuContext.DEFAULT);
    }


    private static parseSequenceNumber(updateSequence: number | string): number {

        return Number.parseInt((updateSequence + '').split('-')[0], 10);
    }
}
