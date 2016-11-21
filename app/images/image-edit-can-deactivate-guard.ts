import { Injectable }           from '@angular/core';
import { CanDeactivate,
    ActivatedRouteSnapshot,
    RouterStateSnapshot }  from '@angular/router';
import {DocumentEditChangeMonitor} from "idai-components-2/documents";
import { ImageEditNavigationComponent } from './image-edit-navigation.component';
import { CanDeactivateGuardBase} from '../common/can-deactivate-guard-base';

/**
 * @author Daniel de Oliveira
 */
@Injectable()
export class ImageEditCanDeactivateGuard
    extends CanDeactivateGuardBase
    implements CanDeactivate<ImageEditNavigationComponent> {

    constructor (private documentEditChangeMonitor:DocumentEditChangeMonitor) {super();}
    
    canDeactivate(
        component: ImageEditNavigationComponent,
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): Promise<boolean> | boolean {
        
        return this.resolveOrShowModal(component,function() {
            return (!this.documentEditChangeMonitor.isChanged());
        }.bind(this));
    }
}
