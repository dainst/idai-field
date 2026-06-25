import { ChangeDetectorRef, Component } from '@angular/core';


@Component({
    selector: 'closing-modal',
    templateUrl: './closing-modal.html',
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export class ClosingModalComponent {

    public mode: 'closeApp'|'closeProject';
    public backupInfoVisible: boolean = false;

    constructor(private changeDetectorRef: ChangeDetectorRef) {}


    public showBackupInfo() {

        this.backupInfoVisible = true;
        this.changeDetectorRef.detectChanges();
    }
}
