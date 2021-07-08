import { TileLayer } from 'leaflet';

declare module 'leaflet' {

    export namespace tileLayer {
        function iiif(url: string, options: TileLayerOptions): TileLayer;
    }
    
}
