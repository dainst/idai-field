import {Component} from '@angular/core';
import {MeshLoadingProgress} from './mesh-loading-progress';


@Component({
    moduleId: module.id,
    selector: 'mesh-loading-progress-bar',
    templateUrl: './mesh-loading-progress-bar.html'
})
/**
 * @author Thomas Kleinke
 */
export class MeshLoadingProgressBarComponent {

    public progress: number = -1;


    constructor(meshLoadingProgress: MeshLoadingProgress) {

        meshLoadingProgress.progressNotifications().subscribe(progress => this.progress = progress);
    }


    public isInProgress(): boolean {

        return this.progress >= 0 && this.progress < 100;
    }
}