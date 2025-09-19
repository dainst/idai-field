import { NgbPopover } from '@ng-bootstrap/ng-bootstrap';
import { AngularUtility } from '../../angular/angular-utility';
import { ComponentHelpers } from '../component-helpers';


/**
 * @author Thomas Kleinke
 */
export abstract class ConfigurationInfoProvider {

    private configurationInfoPopover: NgbPopover;
    private listener: any;


    public async openPopover(popover: NgbPopover) {

        await AngularUtility.refresh();
        this.configurationInfoPopover = popover;
        this.configurationInfoPopover.open();
        this.initializeListeners();
    }


    public closePopover() {

        if (this.configurationInfoPopover) this.configurationInfoPopover.close();
        this.configurationInfoPopover = undefined;
        this.removeListeners();
    }


    private initializeListeners() {
    
        this.listener = this.onMouseEvent.bind(this);
        window.addEventListener('click', this.listener, true);
        window.addEventListener('scroll', this.listener, true);
        window.addEventListener('contextmenu', this.listener, true);
        window.addEventListener('resize', this.listener, true);
    }


    protected removeListeners() {

        if (this.listener) {
            window.removeEventListener('click', this.listener, true);
            window.removeEventListener('scroll', this.listener, true);
            window.removeEventListener('contextmenu', this.listener, true);
            window.removeEventListener('resize', this.listener, true);
            this.listener = undefined;
        }
    }


    private onMouseEvent(event: MouseEvent) {

        if (!ComponentHelpers.isInside(event.target, target => target.localName === 'configuration-info')) {
            this.closePopover();
        }
    }
}
