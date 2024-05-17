
import Map from 'ol/Map.js';
import TileLayer from 'ol/layer/Tile.js';
import TileGrid from 'ol/tilegrid/TileGrid';
import View from 'ol/View.js';
import { createEmpty, extend } from 'ol/extent.js';
import { TileImage } from 'ol/source.js';

function getResolutions(
    extent,
    tileSize,
    width, height) {

    const portraitFormat = height > width;

    const result = [];
    const layerSize = extent[portraitFormat ? 3 : 2] - extent[portraitFormat ? 1 : 0];
    const imageSize = portraitFormat ? height : width;

    let scale = 1;
    while (tileSize < imageSize / scale) {
        result.push(layerSize / imageSize * scale);
        scale *= 2;
    }
    result.push(layerSize / imageSize * scale);

    return result.reverse();
};

const tileSize = 256;

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

            counter = 1;

            try {

                for (let relation of relations) {

                    const geoReference = relation["resource"]["georeference"];


                    const extent = [
                        geoReference.bottomLeftCoordinates[1],
                        geoReference.bottomLeftCoordinates[0],
                        geoReference.topRightCoordinates[1],
                        geoReference.topRightCoordinates[0]
                    ];

                    const pathTemplate = `/api/image/tile/${project}/${relation["resource"]["id"]}/{z}/{x}/{y}`;

                    const resolutions = getResolutions(extent, tileSize, relation["resource"]["width"], relation["resource"]["height"])

                    let source = new TileImage({
                        tileGrid: new TileGrid({
                            extent,
                            origin: [extent[0], extent[3]],
                            resolutions,
                            tileSize
                        }),
                        tileUrlFunction: (tileCoord) => {
                            return pathTemplate
                                .replace('{z}', String(tileCoord[0]))
                                .replace('{x}', String(tileCoord[1]))
                                .replace('{y}', String(tileCoord[2]));
                        }
                    });

                    let currentLayer = new TileLayer({
                        source: source,
                        extent
                    });

                    this.map.addLayer(currentLayer);

                    aggregatedExtent = extend(aggregatedExtent, extent);
                    counter += 1;
                }
            } catch (e) {
                console.error(e)
            }

            console.log(aggregatedExtent)
            const view = new View({
                extent: aggregatedExtent
            })

            this.map.setView(view);
            this.map.getView().fit(aggregatedExtent, { padding: [100, 100, 100, 100] })
            this.map.setView(view);
        }
    }
}