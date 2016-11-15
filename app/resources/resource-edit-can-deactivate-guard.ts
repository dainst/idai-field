import { Injectable }           from '@angular/core';
import { CanDeactivate,
    ActivatedRouteSnapshot,
    RouterStateSnapshot }  from '@angular/router';
import {DocumentEditChangeMonitor} from "idai-components-2/documents";
import { ResourceEditNavigationComponent } from './resource-edit-navigation.component';

@Injectable()
export class ResourceEditCanDeactivateGuard implements CanDeactivate<ResourceEditNavigationComponent> {

    private _resolve;

    constructor (private documentEditChangeMonitor:DocumentEditChangeMonitor) {}

    public proceed() {
        this._resolve(true);
    }

    public cancel() {
        this._resolve(false);
    }


    canDeactivate(
        component: ResourceEditNavigationComponent,
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): Promise<boolean> | boolean {

        return new Promise<boolean>((resolve_)=>{

            if (!this.documentEditChangeMonitor.isChanged()) {
                if (component.mode=='new') {
                    component.discard();
                }
                return resolve_(true);
            }

            this._resolve=resolve_;

            component.showModal();
        });
    }
}
