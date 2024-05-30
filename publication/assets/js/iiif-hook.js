

import IIIF from 'ol/source/IIIF.js';
import IIIFInfo from 'ol/format/IIIFInfo.js';
import Map from 'ol/Map.js';
import TileLayer from 'ol/layer/Tile.js';
import View from 'ol/View.js';
import { FullScreen, defaults as defaultControls } from 'ol/control.js';

export default getIIIFHook = () => {
    return {
        layer: null,
        map: null,

        mounted() {
            this.initialize()
        },

        async initialize() {
            const response = await fetch(this.el.getAttribute("url"));
            if (response.status == 404) {
                this.el.innerHTML = "No image data";
                return;
            }

            this.layer = new TileLayer();
            this.map = new Map({
                controls: defaultControls().extend([new FullScreen()]),
                layers: [this.layer],
                target: this.el.getAttribute("id")
            })

            const imageInfo = await (response).json()

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
