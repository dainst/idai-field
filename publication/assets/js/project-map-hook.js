import IIIF from 'ol/source/IIIF.js';
import IIIFInfo from 'ol/format/IIIFInfo.js';
import Map from 'ol/Map.js';
import TileLayer from 'ol/layer/Tile.js';
import View from 'ol/View.js';
import { createEmpty, extend, getCenter } from 'ol/extent.js';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style.js';
import { OSM, Vector as VectorSource } from 'ol/source.js';
import GeoJSON from 'ol/format/GeoJSON.js';
import { Vector as VectorLayer } from 'ol/layer.js';
import { Projection } from 'ol/proj';

const image = new CircleStyle({
    radius: 5,
    fill: null,
    stroke: new Stroke({ color: 'red', width: 1 }),
});

const styles = {
    'Point': new Style({
        image: image,
    })
}

const geojsonObject = {
    'type': 'FeatureCollection',
    // 'crs': {
    //     'type': 'name',
    //     'properties': {
    //         'name': 'EPSG:3857',
    //     },
    // },
    'features': [
        {
            'type': 'Feature',
            'geometry': {
                'type': 'Point',
                'coordinates': [
                    1194.25,
                    765.6875
                ],
            },
        },
    ],
};




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
                console.log(relation)
                try {
                    let currentLayer = new TileLayer()
                    const raw = await fetch(`/api/iiif/image/3/${project}%2F${relation["resource"]["id"]}.jp2/info.json`)
                    const imageInfo = await raw.json()

                    let options = new IIIFInfo(imageInfo).getTileSourceOptions();
                    console.log(options)
                    // const geoReference = relation["resource"]["georeference"];

                    // extentWidth = geoReference.topRightCoordinates[1] - geoReference.bottomLeftCoordinates[1];
                    // extentHeight = geoReference.topRightCoordinates[0] - geoReference.bottomLeftCoordinates[0];
                    // options.extent = [
                    //     geoReference.bottomLeftCoordinates[1],
                    //     geoReference.bottomLeftCoordinates[0],
                    //     geoReference.topRightCoordinates[1],
                    //     geoReference.topRightCoordinates[0]
                    // ];

                    // const projection = new Projection({
                    //     units: 'pixels',
                    //     extent: [
                    //         geoReference.bottomLeftCoordinates[1],
                    //         geoReference.bottomLeftCoordinates[0],
                    //         geoReference.topRightCoordinates[1],
                    //         geoReference.topRightCoordinates[0]
                    //     ]
                    // });

                    //                    options.source = projection;
                    const source = new IIIF(options)

                    currentLayer.setSource(source);
                    this.map.addLayer(currentLayer);

                    aggregatedExtent = extend(aggregatedExtent, source.getTileGrid().getExtent());

                } catch {
                    console.error(`Image server does not know UUID '${relation["resource"]["id"]}', unable to setup background layer.`)
                }
            }

            const source = new VectorSource({
                features: new GeoJSON().readFeatures(geojsonObject),
            });

            const layer = new VectorLayer({
                source: source,
                style: styles["Point"],
            });

            this.map.addLayer(layer)
            this.map.setView(
                new View({
                    extent: aggregatedExtent,
                })
            );
            this.map.getView().fit(aggregatedExtent, { padding: [100, 100, 100, 100] })
            console.log(aggregatedExtent);
        }
    }
}