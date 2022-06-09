import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FileSyncPreference, ImageStore, ImageSyncService, ImageVariant } from 'idai-field-core';
import { RemoteImageStore } from '../../services/imagestore/remote-image-store';
import { Settings, SyncTarget } from '../../services/settings/settings';
import { SettingsProvider } from '../../services/settings/settings-provider';
import { SettingsService } from '../../services/settings/settings-service';


@Component({
    selector: 'synchronization-modal',
    templateUrl: './synchronization-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    }
})
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class SynchronizationModalComponent implements OnInit {

    public settings: Settings;
    public syncTarget: SyncTarget;

    public thumbnailImageSizesMsg = '';
    public originalImageDownloadSizeMsg = '';
    public originalImageUploadSizeMsg = '';

    constructor(public activeModal: NgbActiveModal,
                private imageStore: ImageStore,
                private remoteImageStore: RemoteImageStore,
                private settingsProvider: SettingsProvider,
                private settingsService: SettingsService) { }


    async ngOnInit() {

        this.settings = this.settingsProvider.getSettings();

        if (!this.settings.syncTargets[this.settings.selectedProject]) {
            this.settings.syncTargets[this.settings.selectedProject] = {
                address: '',
                password: '',
                isSyncActive: false,
                fileSyncPreferences: [
                    {
                        upload: true,
                        download: true,
                        variant: ImageVariant.THUMBNAIL
                    }
                ]
            };
        }
        this.syncTarget = this.settings.syncTargets[this.settings.selectedProject];

        this.getFileSizes();
    }


    public onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') {
            this.activeModal.close();
        }
    }


    public async toggleSync() {

        this.syncTarget.isSyncActive = !this.syncTarget.isSyncActive;
    }


    public async toggleThumbnailImageSync() {

        if (!this.syncTarget.fileSyncPreferences
            .map(preference => preference.variant)
            .includes(ImageVariant.THUMBNAIL)) {
            this.syncTarget.fileSyncPreferences.push({
                upload: true,
                download: true,
                variant: ImageVariant.THUMBNAIL
            });
        } else {
            this.syncTarget.fileSyncPreferences = this.syncTarget.fileSyncPreferences
            .filter(
                (preference: FileSyncPreference) => preference.variant !== ImageVariant.THUMBNAIL
            );
        }
    }


    public isThumbnailImageSyncActive() {

        return this.syncTarget.fileSyncPreferences
            .map(preference => preference.variant)
            .includes(ImageVariant.THUMBNAIL);
    }


    public async toggleOriginalImageUpload() {

        if (!this.syncTarget.fileSyncPreferences
            .map(preference => preference.variant)
            .includes(ImageVariant.ORIGINAL)) {

            this.syncTarget.fileSyncPreferences.push({
                upload: true,
                download: false,
                variant: ImageVariant.ORIGINAL
            });
        } else {

            const previousPreference = this.syncTarget.fileSyncPreferences.find(
                preference => preference.variant === ImageVariant.ORIGINAL
            );

            const updatedPreferences = {
                upload: !previousPreference.upload,
                download: previousPreference.download,
                variant: ImageVariant.ORIGINAL
            };

            this.syncTarget.fileSyncPreferences = this.syncTarget.fileSyncPreferences
                .filter(
                    (preference: FileSyncPreference) => preference.variant !== ImageVariant.ORIGINAL
                );

            if (updatedPreferences.upload === true || updatedPreferences.download === true) {
                this.syncTarget.fileSyncPreferences.push(updatedPreferences);
            }
        }
    }


    public isOriginalImageUploadSyncActive() {

        const current = this.syncTarget.fileSyncPreferences.find(preference => preference.variant === ImageVariant.ORIGINAL);
        if (current !== undefined) {
            return current.upload;
        }

        return false;
    }


    public async toggleOriginalImageDownload() {

        if (!this.syncTarget.fileSyncPreferences
            .map(preference => preference.variant)
            .includes(ImageVariant.ORIGINAL)) {

            this.syncTarget.fileSyncPreferences.push({
                upload: false,
                download: true,
                variant: ImageVariant.ORIGINAL
            });
        } else {

            const previousPreference = this.syncTarget.fileSyncPreferences.find(
                preference => preference.variant === ImageVariant.ORIGINAL
            );

            const updatedPreferences = {
                upload: previousPreference.upload,
                download: !previousPreference.download,
                variant: ImageVariant.ORIGINAL
            };

            this.syncTarget.fileSyncPreferences = this.syncTarget.fileSyncPreferences
                .filter(
                    (preference: FileSyncPreference) => preference.variant !== ImageVariant.ORIGINAL
                );

            if (updatedPreferences.upload === true || updatedPreferences.download === true) {
                this.syncTarget.fileSyncPreferences.push(updatedPreferences);
            }
        }
    }


    public isOriginalImageDownloadSyncActive() {

        const current = this.syncTarget.fileSyncPreferences.find(preference => preference.variant === ImageVariant.ORIGINAL);
        if (current !== undefined) {
            return current.download;
        }

        return false;
    }


    public async apply() {

        try {
            this.settings = await this.settingsService.updateSettings(this.settings);
        } catch (err) {
            return console.error(err);
        }

        this.syncTarget = this.settings.syncTargets[this.settings.selectedProject];
        await this.settingsService.setupSync();

        this.activeModal.close();
    }


    private async getFileSizes() {

        try {
            this.updateThumbnailSizesInfo();
            this.updateOriginalImageSizesInfo();

        } catch {

            console.log('Credentials for syncing still seem to be invalid.');
            this.thumbnailImageSizesMsg = '';
            this.originalImageDownloadSizeMsg = '';
            this.originalImageUploadSizeMsg = '';
        }
    }


    private async updateThumbnailSizesInfo() {

        if (this.thumbnailImageSizesMsg === '') {
            this.thumbnailImageSizesMsg = `⏳`;
        }

        const [downloadSize, uploadSize] = await this.getDiff(ImageVariant.THUMBNAIL);

        const thumbnailDownloadSizeMsg = ImageStore.byteCountToDescription(downloadSize);
        const thumbnailUploadSizeMsg = ImageStore.byteCountToDescription(uploadSize);
        this.thumbnailImageSizesMsg = `(⬇${thumbnailDownloadSizeMsg} / ⬆${thumbnailUploadSizeMsg})`;
    }

    private async updateOriginalImageSizesInfo() {
        if (this.originalImageDownloadSizeMsg === '') {
            this.originalImageDownloadSizeMsg = `⏳`;
        }
        if (this.originalImageUploadSizeMsg === '') {
            this.originalImageUploadSizeMsg = `⏳`;
        }

        const [downloadSize, uploadSize] = await this.getDiff(ImageVariant.ORIGINAL);

        this.originalImageDownloadSizeMsg = `(⬇${ImageStore.byteCountToDescription(downloadSize)})`;
        this.originalImageUploadSizeMsg = `(⬆${ImageStore.byteCountToDescription(uploadSize)})`;
    }


    private async getDiff(variant: ImageVariant): Promise<[number, number]> {

        const [localData, remoteData] = await Promise.all([
            this.imageStore.getFileInfos(
                this.settings.selectedProject,
                [variant]
            ),
            this.remoteImageStore.getFileInfosUsingCredentials(
                this.syncTarget.address,
                this.syncTarget.password,
                this.settings.selectedProject,
                [variant]
            )
        ]);

        const diff = await ImageSyncService.evaluateDifference(
            localData,
            remoteData,
            variant
        );

        const downloadSize = ImageStore.getFileSizeSums(diff.missingLocally)[variant];
        const uploadSize = ImageStore.getFileSizeSums(diff.missingRemotely)[variant];

        return [downloadSize, uploadSize];
    }
}
