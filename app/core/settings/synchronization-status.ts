import {Injectable} from '@angular/core';


@Injectable()
/**
 * @author Thomas Kleinke
 */
export class SynchronizationStatus {

    private connected: boolean = false;

    public isConnected = (): boolean => this.connected;

    public setConnected = (connected: boolean) => this.connected = connected;
}