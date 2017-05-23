import {Injectable} from '@angular/core';
import {MapState} from 'idai-components-2/idai-field-map';

@Injectable()
export class LayerMapState extends MapState {

    private activeLayersIds: Array<string>;

    public setActiveLayersIds(activeLayersIds: Array<string>) {
        this.activeLayersIds = activeLayersIds;
    }

    public getActiveLayersIds(): Array<string> {
        return this.activeLayersIds;
    }
}