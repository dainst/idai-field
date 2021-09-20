import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Settings, SyncTarget } from '../../core/settings/settings';
import { SettingsProvider } from '../../core/settings/settings-provider';
import { SettingsService } from '../../core/settings/settings-service';
import {  MenuService } from '../menu-service';


@Component({
    selector: 'synchronization-modal',
    templateUrl: './synchronization-modal.html',
    host: {
        '(document:click)': 'handleClick($event)',
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
                private settingsService: SettingsService,
                private menuService: MenuService) {
    }

    
    async ngOnInit() {

        this.settings = this.settingsProvider.getSettings();

        if (!this.settings.syncTargets[this.settings.selectedProject]) {
            this.settings.syncTargets[this.settings.selectedProject] = {
                address: '', password: '', isSyncActive: false
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
        try {
        this.settings = await this.settingsService.updateSettings(this.settings);
        } catch (err) {
            console.error(err);
        }

        this.syncTarget = this.settings.syncTargets[this.settings.selectedProject];
        await this.settingsService.setupSync();
    }
}
