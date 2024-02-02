import { Component } from '@angular/core';
import { MenuModalLauncher } from '../../services/menu-modal-launcher';
import { SettingsProvider } from '../../services/settings/settings-provider';
import { ProjectLabelProvider } from '../../services/project-label-provider';


@Component({
    selector: 'projects',
    templateUrl: './projects.html'
})
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class ProjectsComponent {

    public username: string;


    constructor(private settingsProvider: SettingsProvider,
                private menuModalLauncher: MenuModalLauncher,
                private projectLabelProvider: ProjectLabelProvider) {

        this.username = this.settingsProvider.getSettings().username;
        this.settingsProvider.settingsChangesNotifications().subscribe((settings) => {
            this.username = settings.username;
        });
    }


    public getProjectLabel = () => this.projectLabelProvider.getProjectLabel();

    public openModal = () => this.menuModalLauncher.editProject();

    public openUsernameModal = () => this.menuModalLauncher.openUpdateUsernameModal();
}
