/**
 * @author Daniel de Oliveira
 */
export class CanDeactivateGuardBase {

    protected _resolve;

    public proceed() {
        this._resolve(true);
    }

    public cancel() {
        this._resolve(false);
    }

    protected resolveOrShowModal(component,callback : () => boolean) : Promise<boolean> {
        return new Promise<boolean>((resolve)=>{
            if (callback()) return resolve(true);
            
            this._resolve=resolve;
            component.showModal();
        });
    }
}