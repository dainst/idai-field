import { Component } from '@angular/core';
import { WarningsService } from '../../../services/warnings/warnings-service';


@Component({
    selector: 'taskbar-warnings',
    templateUrl: './taskbar-warnings.html'
})
/**
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class TaskbarWarningsComponent {

    constructor(private warningsService: WarningsService) {}


    public getTotalWarningsCount = () => this.warningsService.filters ? this.warningsService.filters[0]?.count : 0;

    public openModal = () => this.warningsService.openModal();
}
