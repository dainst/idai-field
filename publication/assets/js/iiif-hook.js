

import IIIF from 'ol/source/IIIF.js';
import IIIFInfo from 'ol/format/IIIFInfo.js';
import Map from 'ol/Map.js';
import TileLayer from 'ol/layer/Tile.js';
import View from 'ol/View.js';


export default getIIIFHook = () => {
    return {
        layer: null,
        map: null,

        mounted() {
            this.initialize()
        },

        async initialize() {
            this.layer = new TileLayer();
            this.map = new Map({
                layers: [this.layer],
                target: this.el.getAttribute("id")
            })

            const imageInfo = await (await fetch(this.el.getAttribute("url"))).json()

            const options = new IIIFInfo(imageInfo).getTileSourceOptions();
            options.zDirection = -1;
            const iiifTileSource = new IIIF(options);
            this.layer.setSource(iiifTileSource);
            this.map.setView(
                new View({
                    resolutions: iiifTileSource.getTileGrid().getResolutions(),
                    extent: iiifTileSource.getTileGrid().getExtent(),
                    constrainOnlyCenter: true,
                }),
            );
            this.map.getView().fit(iiifTileSource.getTileGrid().getExtent());
        }
    }
}
