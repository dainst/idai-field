
import Map from 'ol/Map.js';
import View from 'ol/View.js';
import OSM from 'ol/source/OSM.js';
import TileLayer from 'ol/layer/Tile.js';

import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';

import GeoJSON from 'ol/format/GeoJSON.js';

import { Circle, Fill, Stroke, Style, Icon } from 'ol/style.js';

const styles = {
    homeMarker: new Style({
        image: new Icon({
            color: "#000",
            anchor: [0.5, 30],
            anchorXUnits: 'fraction',
            anchorYUnits: 'pixels',
            src: 'images/map-pin.svg',
        })
    }),
}

const stylesHighlighted = {
    homeMarker: new Style({
        image: new Icon({
            color: "rgb(99 102 241)",
            anchor: [0.5, 30],
            anchorXUnits: 'fraction',
            anchorYUnits: 'pixels',
            src: 'images/map-pin.svg',
        })
    }),
}

export default getOpenLayersHook = () => {
    return {
        highlighted: null,
        map: null,

        mounted() {
            this.handleEvent(`map-init-${this.el.id}`, (options) => this.initialize(options));
            this.handleEvent(`map-set-features-${this.el.id}`, (features) => this.setFeatures(features));
            this.handleEvent(`map-highlight-feature-${this.el.id}`, ({ feature_id }) => {
                const feature = this.map.getAllLayers().filter(function (layer) {
                    return layer instanceof VectorLayer
                })[0].getSource().getFeatures().filter(function (feature) {
                    return feature.getProperties().id == feature_id
                })[0];

                this.setHighlight(feature)
            })

            this.handleEvent(`map-clear-highlights-${this.el.id}`, () => {
                this.clearHighlight()
            })
        },

        initialize(opts) {
            if (this.map) return;

            const _this = this;

            this.map = new Map({
                layers: [
                    new TileLayer({ source: new OSM() }),
                ],
                view: new View({
                    center: opts.center,
                    zoom: opts.zoom,
                }),
                target: opts.target
            });

            this.map.on('click', function (evt) {
                features = _this.map.forEachFeatureAtPixel(
                    evt.pixel,
                    function (feature) {
                        _this.pushEvent(feature.getProperties()['click_event'], { id: feature.getProperties()['id'] })
                    }
                )
            });

            this.map.on('pointermove', function (e) {
                _this.clearHighlight();

                _this.map.forEachFeatureAtPixel(e.pixel, function (feature) {
                    _this.setHighlight(feature);
                });
            });
        },

        setFeatures(features) {
            const _this = this;

            const geojson = new GeoJSON().readFeatures({
                type: 'FeatureCollection',
                features: features.features
            }, {
                dataProjection: 'EPSG:4326',
                featureProjection: 'EPSG:3857'
            })

            const vectorSource = new VectorSource({
                features: geojson
            });

            const vectorLayer = new VectorLayer({
                source: vectorSource,
                style: this.styleFunction
            })

            this.map.getAllLayers().filter(function (layer) {
                return layer instanceof VectorLayer
            }).map(function (layer) {
                _this.map.removeLayer(layer)
            })

            this.map.addLayer(vectorLayer);

            const extent = vectorSource.getExtent();

            this.map.getView().fit(extent, { padding: [50, 50, 50, 50] });
        },

        clearHighlight() {
            if (this.highlighted !== null) {
                this.highlighted.setStyle(styles[this.highlighted.getProperties()['style']])
                this.pushEvent(this.highlighted.getProperties()['hover_event'], null)
                this.highlighted = null;
            }
        },

        setHighlight(feature) {
            feature.setStyle(stylesHighlighted[feature.getProperties()['style']]);
            this.highlighted = feature;

            this.pushEvent(feature.getProperties()['hover_event'], feature.getProperties()['id'])
        },

        styleFunction(feature) {
            return styles[feature.getProperties()['style']];
        }
    }
}