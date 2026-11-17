import Map from "ol/Map.js";
import View from "ol/View.js";
import OSM from "ol/source/OSM.js";
import TileLayer from "ol/layer/Tile.js";

import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";

import GeoJSON from "ol/format/GeoJSON.js";

import { Style, Icon } from "ol/style.js";

import { fromLonLat } from "ol/proj";

let color = null;
let color_highlight = null;
let icon_dimension = 40;

export default getWorldMapHook = () => {
    return {
        highlighted: null,
        map: null,
        color: null,
        hover_color: null,

        mounted() {
            this.initialize();

            this.handleEvent(
                `map-set-features-${this.el.id}`,
                ({ features: features }) => this.setFeatures(features),
            );
            this.handleEvent(`map-clear-highlights-${this.el.id}`, () =>
                this.clearHighlight(),
            );
            this.handleEvent(
                `map-highlight-feature-${this.el.id}`,
                ({ feature_id }) => {
                    const feature = this.map
                        .getAllLayers()
                        .find(function (layer) {
                            // Find first VectorLayer (implicit assumption: there is only one)
                            return layer instanceof VectorLayer;
                        })
                        .getSource()
                        .getFeatures()
                        .find(function (feature) {
                            // Find the first feature whose `id` property matches the requested one.
                            return feature.getProperties().id == feature_id;
                        });

                    this.setHighlight(feature);
                },
            );
        },

        initialize() {
            const _this = this;

            color = this.el.getAttribute("color");
            color_highlight = this.el.getAttribute("color_highlight");

            this.map = new Map({
                layers: [new TileLayer({ source: new OSM() })],
                view: new View({
                    center: [
                        this.el.getAttribute("centerLon"),
                        this.el.getAttribute("centerLat"),
                    ],
                    zoom: this.el.getAttribute("zoom"),
                }),
                target: this.el.getAttribute("id"),
            });

            this.map.on("click", function (evt) {
                features = _this.map.forEachFeatureAtPixel(
                    evt.pixel,
                    function (feature) {
                        _this.pushEvent(
                            feature.getProperties()["click_event"],
                            { id: feature.getProperties()["id"] },
                        );
                    },
                );
            });

            this.map.on("pointermove", function (e) {
                _this.clearHighlight();

                _this.map.forEachFeatureAtPixel(e.pixel, function (feature) {
                    _this.setHighlight(feature);
                });
            });
        },

        setFeatures(features) {
            if (features.length === 0) return;

            const _this = this;

            const geojson = new GeoJSON().readFeatures(
                {
                    type: "FeatureCollection",
                    features: features,
                },
                {
                    dataProjection: "EPSG:4326",
                    featureProjection: "EPSG:3857",
                },
            );

            const vectorSource = new VectorSource({
                features: geojson,
            });

            const vectorLayer = new VectorLayer({
                source: vectorSource,
                style: this.default_style,
            });

            this.map
                .getAllLayers()
                .filter(function (layer) {
                    return layer instanceof VectorLayer;
                })
                .map(function (layer) {
                    _this.map.removeLayer(layer);
                });

            this.map.addLayer(vectorLayer);

            if (features.length > 1) {
                const extent = vectorSource.getExtent();
                this.map.getView().fit(extent, { padding: [50, 50, 50, 50] });
            } else if (
                features.length == 1 &&
                features[0].geometry.type == "Point"
            ) {
                this.map
                    .getView()
                    .setCenter(fromLonLat(features[0].geometry.coordinates));
                this.map.getView().setZoom(5);
            }
        },

        clearHighlight() {
            if (this.highlighted !== null) {
                this.highlighted.setStyle(this.default_style());
                this.pushEvent(
                    this.highlighted.getProperties()["hover_event"],
                    null,
                );
                this.highlighted = null;
            }
        },

        setHighlight(feature) {
            feature.setStyle(this.highlight_style());

            this.highlighted = feature;

            this.pushEvent(
                feature.getProperties()["hover_event"],
                feature.getProperties()["id"],
            );
        },

        default_style() {
            return new Style({
                image: new Icon({
                    color: color,
                    anchor: [0.5, icon_dimension],
                    width: icon_dimension,
                    height: icon_dimension,
                    anchorXUnits: "fraction",
                    anchorYUnits: "pixels",
                    src: "images/map-pin.svg",
                }),
            });
        },

        highlight_style() {
            return new Style({
                image: new Icon({
                    color: color_highlight,
                    anchor: [0.5, icon_dimension],
                    width: icon_dimension,
                    height: icon_dimension,
                    anchorXUnits: "fraction",
                    anchorYUnits: "pixels",
                    src: "images/map-pin.svg",
                }),
            });
        },
    };
};
