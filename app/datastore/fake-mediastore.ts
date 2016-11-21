import {Observable} from "rxjs/Observable";
import {Mediastore} from 'idai-components-2/datastore';


export class FakeMediastore implements Mediastore {

    private basePath: string = 'store/';
    
    constructor() {
        console.log("fake")
    }
    
    /**
     * @param key the identifier for the data
     * @param data the binary data to be stored
     * @returns {Promise<any>} resolve -> (),
     *   reject -> the error message
     */
    public create(key: string, data: any): Promise<any> {
        return null;
    }

    /**
     * @param key the identifier for the data
     * @returns {Promise<any>} resolve -> (data), the data read with the key,
     *  reject -> the error message
     */
    public read(key: string): Promise<any> {

        return null;
    }

    /**
     * @param key the identifier for the data
     * @param data the binary data to be stored
     * @returns {Promise<any>} resolve -> (),
     *   reject -> the error message
     */
    public update(key: string, data: any): Promise<any> {

        return null;
    }

    /**
     * @param key the identifier for the data to be removed
     * @returns {Promise<any>} resolve -> (),
     *   reject -> the error message
     */
    public remove(key: string): Promise<any> {

        return null;
    }

    /**
     * Subscription enables clients to get notified
     * when files get modified via one of the accessor
     * methods defined here.
     */
    public objectChangesNotifications(): Observable<File> {
        return null;
    }

}