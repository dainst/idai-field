import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { reloadAndSwitchToHomeRoute } from '../../core/common/reload';
import { StateSerializer } from '../../core/common/state-serializer';
import { SettingsProvider } from '../../core/settings/settings-provider';
import { SettingsService } from '../../core/settings/settings-service';
import { M } from '../messages/m';
import { Messages } from '../messages/messages';


@Component({
    selector: 'delete-project-modal',
    templateUrl: './delete-project-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)',
    }
})

/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class DeleteProjectModalComponent {

    public confirmDeletionProjectName: string;


    constructor(public activeModal: NgbActiveModal,
                private stateSerializer: StateSerializer,
                private settingsService: SettingsService,
                private settingsProvider: SettingsProvider,
                private messages: Messages) {}


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') this.activeModal.dismiss('cancel');
    }


    public getProjectName = () => this.settingsProvider.getSettings().selectedProject;


    public async confirmDeletion() {

        if (!this.checkConfirmDeletionProjectName()) return;

        await this.performDeletion();
        this.activeModal.close();
    }


    public checkConfirmDeletionProjectName(): boolean {

        return this.getProjectName() === this.confirmDeletionProjectName;
    }


    private async performDeletion() {

        if (!this.canDeleteProject()) return;

        try {
            await this.stateSerializer.delete('resources-state');
            await this.stateSerializer.delete('matrix-state');
            await this.stateSerializer.delete('tabs-state');
        } catch (err) {
            // Ignore state file deletion errors
        }

        await this.settingsService.deleteProject(this.getProjectName());

        reloadAndSwitchToHomeRoute();
    }


    private canDeleteProject() {

        if (this.settingsProvider.getSettings().dbs.length < 2) {
            this.messages.add([M.RESOURCES_ERROR_ONE_PROJECT_MUST_EXIST]);
            return false;
        } else {
            return true;
        }
    }
}
