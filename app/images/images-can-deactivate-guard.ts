import {CanDeactivate} from '@angular/router';

/**
 * @author Daniel de Oliveira
 */
export class ImagesCanDeactivateGuard implements CanDeactivate<boolean> {

    canDeactivate() {
        // console.log("AlwaysAuthGuard");
        return true;
    }
}