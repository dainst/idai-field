import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ImageVariant } from 'idai-field-core';
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
                private settingsService: SettingsService) {}


    async ngOnInit() {

        this.settings = this.settingsProvider.getSettings();

        if (!this.settings.syncTargets[this.settings.selectedProject]) {
            this.settings.syncTargets[this.settings.selectedProject] = {
                address: '',
                password: '',
                isSyncActive: false,
                activeFileSync: []
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

        if (this.syncTarget.isSyncActive) {
            this.syncTarget.activeFileSync = [ImageVariant.THUMBNAIL];
        } else {
            this.syncTarget.activeFileSync = [];
        }
    }


    public async toggleThumbnailImageSync() {

        if (!this.syncTarget.activeFileSync.includes(ImageVariant.THUMBNAIL)) {
            this.syncTarget.activeFileSync.push(ImageVariant.THUMBNAIL);
        } else {
            this.syncTarget.activeFileSync = this.syncTarget.activeFileSync.filter(
                (val: ImageVariant) => val !== ImageVariant.THUMBNAIL
            );
        }
    }


    public isThumbnailImageSyncActive() {

        return this.syncTarget.activeFileSync.includes(ImageVariant.THUMBNAIL);
    }


    public async toggleOriginalImageSync() {

        if (!this.syncTarget.activeFileSync.includes(ImageVariant.ORIGINAL)) {
            this.syncTarget.activeFileSync.push(ImageVariant.ORIGINAL);
        } else {
            this.syncTarget.activeFileSync = this.syncTarget.activeFileSync.filter((val: ImageVariant) => val !== ImageVariant.ORIGINAL);
        }
    }


    public isOriginalImageSyncActive() {
        
        return this.syncTarget.activeFileSync.includes(ImageVariant.ORIGINAL);
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
