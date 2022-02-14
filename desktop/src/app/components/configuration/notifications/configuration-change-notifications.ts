import { Injectable } from '@angular/core';
import { nop } from 'tsfun';
import { ChangesStream } from 'idai-field-core';
import { MenuContext } from '../../../services/menu-context';
import { Menus } from '../../../services/menus';
import { Modals } from '../../../services/modals';
import { ConfigurationChangeNotificationModalComponent } from './configuration-change-notification-modal.component';


/**
 * @author Thomas Kleinke
 */
@Injectable()
export class ConfigurationChangeNotifications {

    private configurationChanged: boolean = false;


    constructor(private menus: Menus,
                private modals: Modals,
                private changesStream: ChangesStream) {}


    public initialize() {

        this.changesStream.remoteConfigurationChangesNotifications().subscribe(() => this.triggerNotification());

        this.menus.menuContextNotifications().subscribe(menuContext => {
            if (this.configurationChanged && this.menus.getContext() === MenuContext.DEFAULT) {
                this.openNotificationModal();
            }
        });
    }


    private triggerNotification() {

         if (this.menus.getContext() === MenuContext.DEFAULT) {
            this.openNotificationModal();
         } else {
            this.configurationChanged = true;
         }
    }


    private async openNotificationModal() {

        const [result] = this.modals.make<ConfigurationChangeNotificationModalComponent>(
            ConfigurationChangeNotificationModalComponent,
            MenuContext.MODAL
        );

        await this.modals.awaitResult(result, nop, nop);
    }
}
