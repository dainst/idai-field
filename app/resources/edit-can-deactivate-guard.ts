import { Injectable }           from '@angular/core';
import { CanDeactivate,
    ActivatedRouteSnapshot,
    RouterStateSnapshot }  from '@angular/router';
import {DocumentEditChangeMonitor} from "idai-components-2/documents";
import { EditNavigationComponent } from './edit-navigation.component';
import { CanDeactivateGuardBase} from '../common/can-deactivate-guard-base';

/**
 * @author Daniel de Oliveira
 */
@Injectable()
export class EditCanDeactivateGuard
    extends CanDeactivateGuardBase
    implements CanDeactivate<EditNavigationComponent> {
    
    constructor (private documentEditChangeMonitor:DocumentEditChangeMonitor) {super();}

    canDeactivate(
        component: EditNavigationComponent,
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): Promise<boolean> | boolean {

        return this.resolveOrShowModal(component,function() {
            
            if (this.documentEditChangeMonitor.isChanged()) return false;
                
            if (component.mode=='new') {
                component.restore().then(()=>{
                    return true;
                }).catch(()=>{
                    return false;
                });
            } else {
                return true;
            }

        }.bind(this));
    }
}
