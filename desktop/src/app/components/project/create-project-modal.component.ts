import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ProjectNameValidation } from '../../model/project-name-validation';
import { reloadAndSwitchToHomeRoute } from '../../services/reload';
import { SettingsProvider } from '../../services/settings/settings-provider';
import { SettingsService } from '../../services/settings/settings-service';
import { Messages } from '../messages/messages';
import { ProjectNameValidatorMsgConversion } from '../messages/project-name-validator-msg-conversion';

const remote = typeof window !== 'undefined' ? window.require('@electron/remote') : undefined;


@Component({
    selector: 'create-project-modal',
    templateUrl: './create-project-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)',
    }
})

/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class CreateProjectModalComponent {

    public projectName: string;


    constructor(public activeModal: NgbActiveModal,
                private settingsService: SettingsService,
                private settingsProvider: SettingsProvider,
                private messages: Messages) {}


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') this.activeModal.dismiss('cancel');
    }


    public async createProject() {

        const validationErrorMessage: string[]|undefined = ProjectNameValidatorMsgConversion.convert(
            ProjectNameValidation.validate(this.projectName, this.settingsProvider.getSettings().dbs)
        );
        if (validationErrorMessage) return this.messages.add(validationErrorMessage as any /* TODO any */);

        await this.settingsService.createProject(
            this.projectName,
            remote.getGlobal('switches') && remote.getGlobal('switches').destroy_before_create
        );

        reloadAndSwitchToHomeRoute();
    }
}
