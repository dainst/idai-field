import {Injectable} from '@angular/core';

@Injectable()
export class MapState {
    
    private zoom : number;
    private center;
    
    
    public setCenter(center) {
        this.center = center;
    }
    
    public setZoom(zoom) : number {
        this.zoom = zoom;
    }
    
    public getCenter() {
        return this.center;
    }
    
    public getZoom() : number {
        return this.zoom;
    }
}