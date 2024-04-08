import IIIF from 'ol/source/IIIF.js';
import IIIFInfo from 'ol/format/IIIFInfo.js';
import Map from 'ol/Map.js';
import TileLayer from 'ol/layer/Tile.js';
import View from 'ol/View.js';
import { createEmpty, extend } from 'ol/extent.js';


export default getProjectMapHook = () => {
    return {
        map: null,
        mounted() {
            this.initialize();
            this.handleEvent(
                `map-set-background-layers-${this.el.id}`,
                ({ layers: layers, project: project }) => this.setupIIIFTiles(project, layers)
            )
        },

        initialize() {
            this.map = new Map({
                target: this.el.getAttribute("id"),
                view: new View()
            })

        },
        async setupIIIFTiles(project, relations) {

            let aggregatedExtent = createEmpty();

            for (let relation of relations) {
                let currentLayer = new TileLayer()
                let imageInfo = await (
                    await fetch(`/api/iiif/image/iiif/3/${project}%2F${relation["resource"]["id"]}.jp2/info.json`)
                ).json()

                let options = new IIIFInfo(imageInfo).getTileSourceOptions();

                const geoReference = relation["resource"]["georeference"]

                options.extent = [
                    geoReference.bottomLeftCoordinates[1],
                    geoReference.bottomLeftCoordinates[0],
                    geoReference.topRightCoordinates[1],
                    geoReference.topRightCoordinates[0]
                ];

                console.log(options)

                const source = new IIIF(options)

                currentLayer.setSource(source);
                this.map.addLayer(currentLayer);

                aggregatedExtent = extend(aggregatedExtent, source.getTileGrid().getExtent());
            }
            this.map.setView(
                new View({
                    extent: aggregatedExtent
                })
            );
            this.map.getView().fit(aggregatedExtent)
        }
    }
}