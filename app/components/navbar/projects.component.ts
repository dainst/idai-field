import {Component, OnInit} from '@angular/core';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {SettingsService} from '../../core/settings/settings-service';
import {ProjectsModalComponent} from './projects-modal.component';


@Component({
    selector: 'projects',
    moduleId: module.id,
    templateUrl: './projects.html'
})
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class ProjectsComponent implements OnInit {

    public selectedProject: string;


    constructor(private settingsService: SettingsService,
                private modalService: NgbModal) {
    }


    ngOnInit() {

        this.selectedProject = this.settingsService.getSelectedProject();
    }


    public openModal() {

        const ref: NgbModalRef = this.modalService.open(ProjectsModalComponent, { keyboard: false });
        ref.componentInstance.selectedProject = this.selectedProject;
    }
}