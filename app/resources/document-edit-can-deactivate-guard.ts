import { Injectable }           from '@angular/core';
import { CanDeactivate,
    ActivatedRouteSnapshot,
    RouterStateSnapshot }  from '@angular/router';
import {DocumentEditChangeMonitor} from "idai-components-2/idai-components-2";
import { DocumentEditNavigationComponent } from './document-edit-navigation.component';

@Injectable()
export class DocumentEditCanDeactivateGuard implements CanDeactivate<DocumentEditNavigationComponent> {

    private _resolve;

    constructor (private documentEditChangeMonitor:DocumentEditChangeMonitor) {}

    public proceed() {
        this._resolve(true);
    }

    public cancel() {
        this._resolve(false);
    }


    canDeactivate(
        component: DocumentEditNavigationComponent,
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
