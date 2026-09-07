import { Extent } from "ol/extent";
import Feature from "ol/Feature";
import { Geometry, Polygon } from "ol/geom";
import VectorLayer from "ol/layer/Vector";
import Map from "ol/Map";
import VectorSource from "ol/source/Vector";
import { Fill, Stroke, Style } from "ol/style";
import GeoJSON from "ol/format/GeoJSON.js";
import Draw from "ol/interaction/Draw.js";
import { Coordinate } from "ol/coordinate";

export default class PublicationSelection {
  map: Map;
  source: VectorSource;
  layer: VectorLayer<VectorSource<Feature<Geometry>>>;
  extent: Extent;
  draw: Draw;
  callback: (result: { geometry: Coordinate[][] }) => any;

  /**
   * Attaches OpenLayers draw functionality to the provided map. It starts inactive, waiting
   * for the `startDrawing` function to be called.
   *
   * @param map The OpenLayers map that the selection is attached to.
   * @param drawEndCallback is called once the drawn polygon has been closed.
   */
  constructor(map: Map, drawEndCallback: (result: {geometry: Coordinate[][]}) => any) {
    this.map = map;
    this.callback = drawEndCallback;

    this.source = new VectorSource({
      wrapX: false,
    });

    this.layer = new VectorLayer({
      source: this.source,
      // style for finished polygons
      style: new Style({
        stroke: new Stroke({
          color: `rgba(0, 0, 0, 1)`,
          width: 1,
        }),
        fill: new Fill({
          color: `rgba(255, 255, 255, 0.5)`,
        }),
      }),
      properties: {
        drawLayer: true,
      },
    });

    this.extent = null;
    this.map.addLayer(this.layer);
  }

  /**
   * Will draw the given `geometry` as a selection polygon. Used to draw geo query parameter values
   * on the map if somebody opens a search link containing a geo query.
   *
   * @returns the drawn geometry's map extent.
   */
  public presetSelection(geometry: number[][]) {
    this.source.clear();

    if (geometry != null) {
      const feature = new GeoJSON().readFeature({
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [geometry],
        },
      });

      if (!Array.isArray(feature)) {
        this.source.addFeature(feature);
        this.extent = feature.getGeometry().getExtent();
      }
    } else {
      this.extent = null;
    }

    return this.extent;
  }

  /**
   * @returns the drawn polygon's  map extent.
   */
  public getExtent() {
    return this.extent;
  }

  public startDrawing() {
    this.draw = new Draw({
      source: this.source,
      type: "Polygon",
      // style while drawing polygons
      style: {
        "circle-radius": 5,
        "circle-fill-color": `rgba(255, 0, 0, 1)`,
        "stroke-color": `rgba(0, 0, 0, 1)`,
        "stroke-width": 2,
        "fill-color": `rgba(255, 255, 255, 0.5)`,
      },
    });

    this.draw.once("drawend", ({ feature }) => {
      this.source.clear();
      this.map.removeInteraction(this.draw);
      this.extent = feature.getGeometry().getExtent();

      this.callback({
        geometry: (<Polygon>feature.getGeometry()).getCoordinates(),
      });
    });

    this.map.addInteraction(this.draw);
  }

  public stopDrawing() {
    this.map.removeInteraction(this.draw);
  }
}
