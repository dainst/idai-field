import { Injectable } from '@angular/core';

import { ConfigurationComponent } from './configuration.component';


@Injectable()
/**
 * @author Thomas Kleinke
 */
export class ConfigurationGuard  {
    
    async canDeactivate(target: ConfigurationComponent): Promise<boolean> {
        
        if (target.changed) {
            return await target.openDiscardChangesModal();
        } else {
            return true;
        }
    }
}
