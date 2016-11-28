import {Injectable} from '@angular/core';

@Injectable()
export class MapState {
    
    private zoom: number;
    private center: L.LatLng;
    private activeLayersIds: Array<string>;
    
    
    public setCenter(center) {
        this.center = center;
    }

    public getCenter(): L.LatLng {
        return this.center;
    }
    
    public setZoom(zoom: number) {
        this.zoom = zoom;
    }
    
    public getZoom(): number {
        return this.zoom;
    }

    public setActiveLayersIds(activeLayersIds: Array<string>) {
        this.activeLayersIds = activeLayersIds;
    }

    public getActiveLayersIds(): Array<string> {
        return this.activeLayersIds;
    }
}