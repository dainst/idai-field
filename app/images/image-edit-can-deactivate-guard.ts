import { Injectable }           from '@angular/core';
import { CanDeactivate,
    ActivatedRouteSnapshot,
    RouterStateSnapshot }  from '@angular/router';
import {DocumentEditChangeMonitor} from "idai-components-2/documents";
import { ImageEditNavigationComponent } from './image-edit-navigation.component';

@Injectable()
export class ImageEditCanDeactivateGuard implements CanDeactivate<ImageEditNavigationComponent> {

    private _resolve;

    constructor (private documentEditChangeMonitor:DocumentEditChangeMonitor) {}

    public proceed() {
        this._resolve(true);
    }

    public cancel() {
        this._resolve(false);
    }

    canDeactivate(
        component: ImageEditNavigationComponent,
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): Promise<boolean> | boolean {

        return new Promise<boolean>((resolve_)=>{

            if (!this.documentEditChangeMonitor.isChanged()) {
                return resolve_(true);
            }

            this._resolve=resolve_;

            component.showModal();
        });
    }
}
