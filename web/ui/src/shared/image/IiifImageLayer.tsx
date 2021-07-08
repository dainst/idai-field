import L from 'leaflet';
import { GridLayer, withLeaflet, TileLayerProps } from 'react-leaflet';
import 'leaflet-iiif';


class IiifImageLayer extends GridLayer<TileLayerProps, L.TileLayer> {

    public createLeafletElement(props: TileLayerProps): L.TileLayer {
        this.leafletElement = L.tileLayer.iiif(props.url, this.getOptions(props));
        return this.leafletElement;
    }

    public updateLeafletElement(fromProps: TileLayerProps, toProps: TileLayerProps) {
        super.updateLeafletElement(fromProps, toProps);
        if (toProps.url !== fromProps.url) {
            this.leafletElement.setUrl(toProps.url);
        }
    }
}

export default withLeaflet<TileLayerProps>(IiifImageLayer);
