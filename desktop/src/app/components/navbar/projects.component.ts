import { ChangeDetectorRef, Component } from '@angular/core';
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

    public projectLabel: string;
    public username: string;


    constructor(private settingsProvider: SettingsProvider,
                private menuModalLauncher: MenuModalLauncher,
                private projectLabelProvider: ProjectLabelProvider,
                private changeDetectorRef: ChangeDetectorRef) {

        this.username = this.settingsProvider.getSettings().username;
        this.projectLabel = this.projectLabelProvider.getProjectLabel();

        this.settingsProvider.settingsChangesNotifications().subscribe(settings => {
            this.username = settings.username;
            this.updateProjectLabel();
        });
    }


    public openModal = () => this.menuModalLauncher.editProject();

    public openUsernameModal = () => this.menuModalLauncher.openUpdateUsernameModal();

    public isHighDPIDisplay = () => globalThis.devicePixelRatio > 1;


    private updateProjectLabel() {

        this.projectLabel = this.projectLabelProvider.getProjectLabel();
        this.changeDetectorRef.detectChanges();
    }
}
