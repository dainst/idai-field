import {Component, OnInit} from '@angular/core';
import {SettingsService} from '../../core/settings/settings-service';
import {NavbarComponent} from './navbar.component';


@Component({
    selector: 'projects',
    templateUrl: './projects.html'
})
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class ProjectsComponent implements OnInit {

    public selectedProject: string;


    constructor(private settingsService: SettingsService,
                private navbarComponent: NavbarComponent) {}


    public openModal = () => this.navbarComponent.openProjectsModal();


    ngOnInit() {

        this.selectedProject = this.settingsService.getSelectedProject();
    }
}
