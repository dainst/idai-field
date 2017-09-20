import {CanDeactivate} from '@angular/router';
import {UploadMonitor} from './upload-monitor';
import {Injectable} from '@angular/core';

@Injectable()
/**
 * @author Daniel de Oliveira
 */
export class ImagesCanDeactivateGuard implements CanDeactivate<boolean> {

    constructor(private uploadMonitor: UploadMonitor) {

    }

    canDeactivate() {

        return !this.uploadMonitor.getUploadActive();
    }
}