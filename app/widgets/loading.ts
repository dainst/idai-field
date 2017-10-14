import {Injectable} from '@angular/core';

@Injectable()

/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class Loading { // TODO move this to resources/service. it seems to only be used in the resources package

    public showIcons: boolean = false;

    private loading: number = 0;
    private timeoutReference: number;
    private showIconsDelay: boolean = false;

    public start() {

        this.loading++;
        this.updateIconStatus();
    }

    public stop() {

        this.loading--;
        this.updateIconStatus();
    }

    public setShowIconsDelay(showIconsDelay) {

        this.showIconsDelay = showIconsDelay;
    }

    private updateIconStatus() {

        if (this.showIconsDelay) {
            this.updateIconStatusWithDelay();
        } else {
            this.updateIconStatusWithoutDelay();
        }
    }

    private updateIconStatusWithoutDelay() {

        this.clearTimeout();
        this.showIcons = this.loading > 0;
    }

    private updateIconStatusWithDelay() {

        if (this.loading && !this.timeoutReference) {
            this.timeoutReference = window.setTimeout(() => {
                this.timeoutReference = undefined;
                this.showIcons = true;
            }, 1000);
        } else if (!this.loading) {
            this.clearTimeout();
            this.showIcons = false;
        }
    }

    private clearTimeout() {

        if (this.timeoutReference) {
            window.clearTimeout(this.timeoutReference);
            this.timeoutReference = undefined;
        }
    }
}