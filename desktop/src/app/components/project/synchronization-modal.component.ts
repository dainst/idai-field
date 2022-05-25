import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FileSyncPreferences, ImageVariant } from 'idai-field-core';
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


    constructor(public activeModal: NgbActiveModal,
                private settingsProvider: SettingsProvider,
                private settingsService: SettingsService) { }


    async ngOnInit() {

        this.settings = this.settingsProvider.getSettings();

        if (!this.settings.syncTargets[this.settings.selectedProject]) {
            this.settings.syncTargets[this.settings.selectedProject] = {
                address: '',
                password: '',
                isSyncActive: false,
                activeFileSync: [
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


    public onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') {
            this.activeModal.close();
        }
    }


    public async toggleSync() {

        this.syncTarget.isSyncActive = !this.syncTarget.isSyncActive;
    }


    public async toggleThumbnailImageSync() {

        if (!this.syncTarget.activeFileSync
            .map(preference => preference.variant)
            .includes(ImageVariant.THUMBNAIL)) {
            this.syncTarget.activeFileSync.push({
                upload: true,
                download: true,
                variant: ImageVariant.THUMBNAIL
            });
        } else {
            this.syncTarget.activeFileSync = this.syncTarget.activeFileSync
            .filter(
                (preference: FileSyncPreferences) => preference.variant !== ImageVariant.THUMBNAIL
            );
        }
    }


    public isThumbnailImageSyncActive() {

        return this.syncTarget.activeFileSync
            .map(preference => preference.variant)
            .includes(ImageVariant.THUMBNAIL);
    }


    public async toggleOriginalImageUpload() {

        if (!this.syncTarget.activeFileSync
            .map(preference => preference.variant)
            .includes(ImageVariant.ORIGINAL)) {

            this.syncTarget.activeFileSync.push({
                upload: true,
                download: false,
                variant: ImageVariant.ORIGINAL
            });
        } else {

            const previousPreference = this.syncTarget.activeFileSync.find(
                preference => preference.variant === ImageVariant.ORIGINAL
            );

            const updatedPreferences = {
                upload: !previousPreference.upload,
                download: previousPreference.download,
                variant: ImageVariant.ORIGINAL
            };

            this.syncTarget.activeFileSync = this.syncTarget.activeFileSync
                .filter(
                    (preference: FileSyncPreferences) => preference.variant !== ImageVariant.ORIGINAL
                );

            if (updatedPreferences.upload === true || updatedPreferences.download === true) {
                this.syncTarget.activeFileSync.push(updatedPreferences);
            }
        }
    }


    public isOriginalImageUploadSyncActive() {

        const current = this.syncTarget.activeFileSync.find(preference => preference.variant === ImageVariant.ORIGINAL);
        if (current !== undefined) {
            return current.upload;
        }

        return false;
    }


    public async toggleOriginalImageDownload() {

        if (!this.syncTarget.activeFileSync
            .map(preference => preference.variant)
            .includes(ImageVariant.ORIGINAL)) {

            this.syncTarget.activeFileSync.push({
                upload: false,
                download: true,
                variant: ImageVariant.ORIGINAL
            });
        } else {

            const previousPreference = this.syncTarget.activeFileSync.find(
                preference => preference.variant === ImageVariant.ORIGINAL
            );

            const updatedPreferences = {
                upload: previousPreference.upload,
                download: !previousPreference.download,
                variant: ImageVariant.ORIGINAL
            };

            this.syncTarget.activeFileSync = this.syncTarget.activeFileSync
                .filter(
                    (preference: FileSyncPreferences) => preference.variant !== ImageVariant.ORIGINAL
                );

            if (updatedPreferences.upload === true || updatedPreferences.download === true) {
                this.syncTarget.activeFileSync.push(updatedPreferences);
            }
        }
    }


    public isOriginalImageDownloadSyncActive() {

        const current = this.syncTarget.activeFileSync.find(preference => preference.variant === ImageVariant.ORIGINAL);
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
}
