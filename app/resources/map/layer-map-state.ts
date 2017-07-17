import {Injectable} from '@angular/core';

@Injectable()
export class LayerMapState {

    private activeLayersIds: Array<string>;

    public setActiveLayersIds(activeLayersIds: Array<string>) {
        this.activeLayersIds = activeLayersIds;
    }

    public getActiveLayersIds(): Array<string> {
        return this.activeLayersIds;
    }

    public removeFromActiveLayersIds(layerId: string) {

        let index = this.activeLayersIds.indexOf(layerId);
        if (index > -1) {
            this.activeLayersIds.splice(index, 1);
        }
    }
}