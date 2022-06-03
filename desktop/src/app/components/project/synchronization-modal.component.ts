import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FileInfo, FileSyncPreference, ImageSyncService, ImageVariant } from 'idai-field-core';
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
export class SynchronizationModalComponent implements OnInit, OnDestroy  {

    public settings: Settings;
    public syncTarget: SyncTarget;

    public thumbnailImageSizesMsg = '';
    public originalImageDownloadSizeMsg = '';
    public originalImageUploadSizeMsg = '';

    private sizeDiffChecker: ReturnType<typeof setTimeout>;
    private sizeDiffCheckInterval = 10000;

    constructor(public activeModal: NgbActiveModal,
                private imageSync: ImageSyncService,
                private settingsProvider: SettingsProvider,
                private settingsService: SettingsService) { }


    async ngOnInit() {

        this.settings = this.settingsProvider.getSettings();

        this.getFileSizes();

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

    }

    async ngOnDestroy() {
        clearTimeout(this.sizeDiffChecker);
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

    private rescheduleFileSizesEvaluation() {
        this.sizeDiffChecker = setTimeout(this.getFileSizes.bind(this), this.sizeDiffCheckInterval);
    }

    private async getFileSizes() {
        try {

            if (this.thumbnailImageSizesMsg === '') {
                this.thumbnailImageSizesMsg = `(⏲)`;
            }
            if (this.originalImageDownloadSizeMsg === '') {
                this.originalImageDownloadSizeMsg = `(⏲)`;
            }
            if (this.originalImageUploadSizeMsg === '') {
                this.originalImageUploadSizeMsg = `(⏲)`;
            }

            const diffThumbnailImages = await this.imageSync.evaluateDifference(this.settings.selectedProject, ImageVariant.THUMBNAIL);
            const diffOriginalImages = await this.imageSync.evaluateDifference(this.settings.selectedProject, ImageVariant.ORIGINAL);


            const thumbnailDownloadSize = this.getFileSizeSums(diffThumbnailImages.missingLocally);
            const thumbnailUploadSize = this.getFileSizeSums(diffThumbnailImages.missingRemotely);
            const thumbnailDownloadSizeMsg = this.byteCountToDescription(thumbnailDownloadSize.thumbnail_image);
            const thumbnailUploadSizeMsg = this.byteCountToDescription(thumbnailUploadSize.thumbnail_image)
            this.thumbnailImageSizesMsg = `(⬇${thumbnailDownloadSizeMsg} / ⬆${thumbnailUploadSizeMsg})`;

            const originalDownloadSize = this.getFileSizeSums(diffOriginalImages.missingLocally);
            const originalUploadSize = this.getFileSizeSums(diffOriginalImages.missingRemotely);
            this.originalImageDownloadSizeMsg = `(⬇${this.byteCountToDescription(originalDownloadSize.original_image)})`
            this.originalImageUploadSizeMsg = `(⬆${this.byteCountToDescription(originalUploadSize.original_image)})`

        } catch {

            console.log('Credentials for syncing still seem to be invalid.');
            this.thumbnailImageSizesMsg = '';
            this.originalImageDownloadSizeMsg = '';
            this.originalImageUploadSizeMsg = '';
        }

        this.rescheduleFileSizesEvaluation();
    }

    private getFileSizeSums(files: { [uuid: string]: FileInfo}): {[variantName in ImageVariant]: number} {
        const sums: {[variantName in ImageVariant]: number} = {
            thumbnail_image: 0,
            original_image: 0
        };
        for (const fileInfo of Object.values(files)) {
            for (const variant of fileInfo.variants) {
                sums[variant.name] += variant.size;
            }
        }
        return sums;
    }

    private byteCountToDescription(byteCount: number) {
        byteCount = byteCount * 0.00000095367;
        let unitTypeOriginal = 'mb';

        if (byteCount > 1000) {
            byteCount = byteCount * 0.00097656;
            unitTypeOriginal = 'gb';
        }

        return `${byteCount.toFixed(2)} ${unitTypeOriginal}`;
    }
}
