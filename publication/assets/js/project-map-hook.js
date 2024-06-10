
import Map from 'ol/Map.js';
import TileLayer from 'ol/layer/Tile.js';
import TileGrid from 'ol/tilegrid/TileGrid';
import View from 'ol/View.js';
import { createEmpty, extend } from 'ol/extent.js';
import { TileImage } from 'ol/source.js';
import { Fill, Stroke, Style } from 'ol/style.js';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import GeoJSON from 'ol/format/GeoJSON.js';
import { asArray } from 'ol/color';

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

const styleFunction = function (feature) {

    const { color, highlighted } = feature.getProperties()
    const [r, g, b, a] = asArray(color)

    let style = new Style({
        stroke: new Stroke({
            color: `rgba(${r}, ${g}, ${b}, ${a})`,
            width: 1,
        })
    })

    if (highlighted) {
        style.setFill(new Fill({
            color: `rgba(${r}, ${g}, ${b}, 0.2)`,
        }));
    }
    else {

        style.setFill(new Fill({
            color: `rgba(${r}, ${g}, ${b}, 0.0)`,
        }));
    }

    return style
};

export default getProjectMapHook = () => {
    return {
        map: null,
        mounted() {
            this.initialize();
            this.handleEvent(
                `map-set-background-layers-${this.el.id}`,
                ({ project_layers: layers, project: project, highlighted_geometry_info: highlightedGeometryInfo, additional_geometry_info: additionalGeometryInfo }) => this.setup(project, layers, highlightedGeometryInfo, additionalGeometryInfo)
            )
        },

        initialize() {
            const _this = this;

            this.map = new Map({
                target: this.el.getAttribute("id"),
                view: new View()
            })
            this.map.on('pointermove', function (e) {
                _this.map.forEachFeatureAtPixel(e.pixel, function (feature) {
                    console.log(feature.getProperties())
                });
            });
        },
        async setup(project, layers, highlightedGeometryInfo, additionalGeometryInfo) {
            let aggregatedExtent = createEmpty();

            try {
                for (let layerDoc of layers) {
                    const geoReference = layerDoc.extent;

                    const extent = [
                        geoReference.bottomLeftCoordinates[1],
                        geoReference.bottomLeftCoordinates[0],
                        geoReference.topRightCoordinates[1],
                        geoReference.topRightCoordinates[0]
                    ];

                    const pathTemplate = `/api/image/tile/${project}/${layerDoc.uuid}/{z}/{x}/{y}`;

                    const resolutions = getResolutions(extent, tileSize, layerDoc.width, layerDoc.height)

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
                }

                const vectorSource = new VectorSource({
                    features: new GeoJSON().readFeatures(highlightedGeometryInfo)
                })

                const vectorLayer = new VectorLayer({
                    source: vectorSource,
                    style: styleFunction,
                });

                // aggregatedExtent = extend(aggregatedExtent, vectorSource.getExtent())

                let extent = vectorSource.getExtent();

                this.map.addLayer(vectorLayer);

                const additionalVectorSource = new VectorSource({
                    features: new GeoJSON().readFeatures(additionalGeometryInfo)
                })

                const additionalVectorLayer = new VectorLayer({
                    source: additionalVectorSource,
                    style: styleFunction,
                });

                this.map.addLayer(additionalVectorLayer);

                const view = new View({
                    extent: aggregatedExtent
                })

                if (extent[0] === Infinity) {
                    // TODO: This is a weird fallback for cases where no highlight is present. This should probably 
                    // first fallback to additionalVectorSource's extent.
                    extent = aggregatedExtent;
                }


                // map.getView().fit(extent, { padding: fitOptions.padding });
                // map.setView(new View({ extent: map.getView().calculateExtent(map.getSize()) }));
                // map.getView().fit(extent, { padding: fitOptions.padding });

                this.map.setView(view);


                this.map.getView().fit(extent, { padding: [10, 10, 10, 10] })
                //this.map.setView(view);
            }
            catch (e) {
                console.error(e)
            }
        }
    }
}