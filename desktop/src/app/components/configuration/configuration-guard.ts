import { Injectable } from '@angular/core';
import { CanDeactivate } from '@angular/router';
import { ConfigurationComponent } from './configuration.component';


@Injectable()
/**
 * @author Thomas Kleinke
 */
export class ConfigurationGuard implements CanDeactivate<ConfigurationComponent> {
    
    async canDeactivate(target: ConfigurationComponent): Promise<boolean> {
        
        if (target.changed) {
            return await target.openDiscardChangesModal();
        } else {
            return true;
        }
    }
}
