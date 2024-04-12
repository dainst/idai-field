import IIIF from 'ol/source/IIIF.js';
import IIIFInfo from 'ol/format/IIIFInfo.js';
import Map from 'ol/Map.js';
import TileLayer from 'ol/layer/Tile.js';
import View from 'ol/View.js';
import { createEmpty, extend, getCenter } from 'ol/extent.js';


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
                try {
                    let currentLayer = new TileLayer()
                    const raw = await fetch(`/api/iiif/image/iiif/3/${project}%2F${relation["resource"]["id"]}.jp2/info.json`)
                    const imageInfo = await raw.json()

                    console.log(relation)

                    let options = new IIIFInfo(imageInfo).getTileSourceOptions();

                    const geoReference = relation["resource"]["georeference"]

                    options.extent = [
                        geoReference.bottomLeftCoordinates[1],
                        geoReference.bottomLeftCoordinates[0],
                        geoReference.topRightCoordinates[1],
                        geoReference.topRightCoordinates[0]
                    ];

                    const source = new IIIF(options)

                    currentLayer.setSource(source);
                    this.map.addLayer(currentLayer);

                    aggregatedExtent = extend(aggregatedExtent, source.getTileGrid().getExtent());

                } catch {
                    console.error(`Image server does not know UUID '${relation["resource"]["id"]}', unable to setup background layer.`)
                }
            }

            this.map.setView(
                new View({
                    extent: aggregatedExtent,
                    center: getCenter(aggregatedExtent),
                })
            );
            this.map.getView().fit(aggregatedExtent, { padding: [100, 100, 100, 100], constrainResolution: false, size: this.map.getSize() })
        }
    }
}