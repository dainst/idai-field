import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import {Settings, SyncTarget} from '../../services/settings/settings';
import {SettingsProvider} from '../../services/settings/settings-provider';
import {SettingsService} from '../../services/settings/settings-service';


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
    public syncThumbnailImages: boolean;
    public syncOriginalImages: boolean;


    constructor(
        public activeModal: NgbActiveModal,
        private settingsProvider: SettingsProvider,
        private settingsService: SettingsService
    ) {}


    async ngOnInit() {

        this.settings = this.settingsProvider.getSettings();

        if (!this.settings.syncTargets[this.settings.selectedProject]) {
            this.settings.syncTargets[this.settings.selectedProject] = {
                address: '', password: '', isSyncActive: false
            };
        }
        this.syncTarget = this.settings.syncTargets[this.settings.selectedProject];
        this.syncThumbnailImages = this.settings.syncThumbnailImages;
        this.syncOriginalImages = this.settings.syncOriginalImages;
    }


    public onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') {
            this.activeModal.close();
        }
    }


    public async toggleSync() {

        this.syncTarget.isSyncActive = !this.syncTarget.isSyncActive;

        if (this.syncTarget.isSyncActive) {
            this.syncThumbnailImages = true;
        } else {
            this.syncThumbnailImages = false;
            this.syncOriginalImages = false;
        }
    }


    public async toggleThumbnailImageSync() {

        this.syncThumbnailImages = !this.syncThumbnailImages;
    }


    public async toggleOriginalImageSync() {

        this.syncOriginalImages = !this.syncOriginalImages;
    }


    public async apply() {

        this.settings.syncThumbnailImages = this.syncThumbnailImages;
        this.settings.syncOriginalImages = this.syncOriginalImages;

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
