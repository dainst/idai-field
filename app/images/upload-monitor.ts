/**
 * @author Daniel de Oliveira
 */
export class UploadMonitor {

    private uploadActive: boolean = false;

    public setUploadActive(val: boolean) {

        this.uploadActive = val;
    }

    public getUploadActive(): boolean {

        return this.uploadActive;
    }
}