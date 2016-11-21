import { Injectable }           from '@angular/core';
import { CanDeactivate,
    ActivatedRouteSnapshot,
    RouterStateSnapshot }  from '@angular/router';
import {DocumentEditChangeMonitor} from "idai-components-2/documents";
import { ResourceEditNavigationComponent } from './resource-edit-navigation.component';
import { CanDeactivateGuardBase} from '../widgets/can-deactivate-guard-base';

/**
 * @author Daniel de Oliveira
 */
@Injectable()
export class ResourceEditCanDeactivateGuard
    extends CanDeactivateGuardBase
    implements CanDeactivate<ResourceEditNavigationComponent> {
    
    constructor (private documentEditChangeMonitor:DocumentEditChangeMonitor) {super();}

    canDeactivate(
        component: ResourceEditNavigationComponent,
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): Promise<boolean> | boolean {

        return this.resolveOrShowModal(component,function() {
            if (!this.documentEditChangeMonitor.isChanged()) {
                if (component.mode=='new') {
                    component.discard();
                }
                return true;
            }
            return false;
        }.bind(this));
    }
}
