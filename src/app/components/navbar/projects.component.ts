import {Component, OnInit} from '@angular/core';
import {NavbarComponent} from './navbar.component';
import {SettingsProvider} from '../../core/settings/settings-provider';


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


    constructor(private settingsProvider: SettingsProvider,
                private navbarComponent: NavbarComponent) {}


    public openModal = () => this.navbarComponent.openProjectsModal();


    ngOnInit() {

        this.selectedProject = this.settingsProvider.getSettings().selectedProject;
    }
}
