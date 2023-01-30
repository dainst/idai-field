import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { reloadAndSwitchToHomeRoute } from '../../services/reload';
import { SettingsProvider } from '../../services/settings/settings-provider';
import { SettingsService } from '../../services/settings/settings-service';
import { StateSerializer } from '../../services/state-serializer';
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

    public projectIdentifier: string;
    public confirmDeletionProjectIdentifier: string;
    public deleteFiles = false;

    private deleting = false;


    constructor(public activeModal: NgbActiveModal,
                private stateSerializer: StateSerializer,
                private settingsService: SettingsService,
                private settingsProvider: SettingsProvider,
                private messages: Messages) {}


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') this.activeModal.dismiss('cancel');
    }


    public async confirmDeletion() {

        if (!this.checkConfirmDeletionProjectIdentifier()) return;

        await this.performDeletion();
    }


    public checkConfirmDeletionProjectIdentifier(): boolean {

        return this.projectIdentifier === this.confirmDeletionProjectIdentifier;
    }


    public isDeleting(): boolean {
        
        return this.deleting;
    }


    private async performDeletion() {

        if (!this.canDeleteProject()) return;

        this.deleting = true;
        const isCurrentProject: boolean = this.projectIdentifier === this.settingsProvider.getSettings().selectedProject;

        try {
            await this.stateSerializer.delete('resources-state');
            await this.stateSerializer.delete('matrix-state');
            await this.stateSerializer.delete('tabs-state');
            await this.stateSerializer.delete('configuration-state');
        } catch (err) {
            // Ignore state file deletion errors
        }

        await this.settingsService.deleteProject(this.projectIdentifier, this.deleteFiles);

        if (isCurrentProject) {
            reloadAndSwitchToHomeRoute();
        } else {
            this.messages.add([M.PROJECTS_DELETE_SUCCESS, this.projectIdentifier]);
            this.activeModal.close();
        }
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
