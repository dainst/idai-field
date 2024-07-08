import { Injectable } from '@angular/core';
import { Observable, Observer } from 'rxjs';
import { ObserverUtil } from 'idai-field-core';
import { MenuContext } from './menu-context';

const remote = globalThis.require('@electron/remote');


@Injectable()
/**
 * @author Thomas Kleinke
 */
export class Menus {

    private context: MenuContext;
    private menuContextObservers: Array<Observer<MenuContext>> = [];


    public menuContextNotifications =
        (): Observable<MenuContext> => ObserverUtil.register(this.menuContextObservers);

    public getContext = () => this.context;


    public setContext(context: MenuContext) {

        this.context = context;
        if (remote) remote.getGlobal('setMenuContext')(context);
        ObserverUtil.notify(this.menuContextObservers, context);
    }
}
