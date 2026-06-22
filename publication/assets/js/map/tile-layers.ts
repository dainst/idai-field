import { Extent, createEmpty, extend } from "ol/extent.js";
import Map from "ol/Map.js";
import { TileImage } from "ol/source.js";
import TileGrid from "ol/tilegrid/TileGrid";
import TileLayer from "ol/layer/Tile.js";

import { ViewHook } from "../../../deps/phoenix_live_view/assets/js/phoenix_live_view";
import { PhxTarget } from "../../../deps/phoenix_live_view/assets/js/phoenix_live_view/view_hook";

const tileSize = 256;

export interface TileLayerMetadata {
  geo_reference: {
    bottomLeftCoordinates: number[];
    topLeftCoordinates: number[];
    topRightCoordinates: number[];
  };
  height: number;
  width: number;
  identifier: string;
  uuid: string;
  visible: boolean;
}

export default class PublicationTileLayers {
  hook: ViewHook;
  map: Map;
  projectKey: string;
  draftDate: string;
  projectLayerGroup: TileLayer<TileImage>[];
  projectLayerGroupExtent: Extent;

  documentLayerGroup: TileLayer<TileImage>[];
  documentLayerGroupExtent: Extent;

  preferenceReportTarget: PhxTarget;

  constructor(hook: ViewHook, map: Map, projectKey: string, draftDate: string) {
    this.hook = hook;
    this.map = map;
    this.projectKey = projectKey;
    this.draftDate = draftDate;

    this.projectLayerGroup = [];
    this.projectLayerGroupExtent = createEmpty();

    this.documentLayerGroup = [];
    this.documentLayerGroupExtent = createEmpty();

    const hookId = this.hook.el.getAttribute("id");

    this.hook.handleEvent(`set-preference-target-${hookId}`, ({ id }) => {
      // `id` here matches the tile selection live component's id, the event is
      // being sent by the component to make itself known.
      this.preferenceReportTarget = document.getElementById(id);
    });

    this.hook.handleEvent(
      `set-document-layers-${hookId}`,
      ({ document_layers }) => {
        this.setProjectLayers(document_layers);
      },
    );

    this.hook.handleEvent(
      `set-project-layers-${hookId}`,
      ({ project_layers }) => {
        this.setProjectLayers(project_layers);
      },
    );

    this.hook.handleEvent(
      `set-layer-visibility-${hookId}`,
      ({ uuid, visibility }) => {
        this.toggleLayerVisibility(uuid, visibility);
      },
    );
  }

  public setProjectLayers(projectLayersMetadata: TileLayerMetadata[]) {
    this.projectLayerGroup = [];
    this.projectLayerGroupExtent = createEmpty();

    this.setLayerGroup(
      projectLayersMetadata,
      this.projectLayerGroup,
      this.projectLayerGroupExtent,
    );
  }

  public setDocumentLayers(documentLayersMetadata: TileLayerMetadata[]) {
    this.documentLayerGroup = [];
    this.documentLayerGroupExtent = createEmpty();

    this.setLayerGroup(
      documentLayersMetadata,
      this.documentLayerGroup,
      this.documentLayerGroupExtent,
    );
  }

  public getLayers() {
    return {
      project: this.projectLayerGroup,
      document: this.documentLayerGroup,
    };
  }

  public getExtents() {
    return {
      project: this.projectLayerGroupExtent,
      document: this.documentLayerGroupExtent,
    };
  }

  public toggleLayerVisibility(uuid: string, visibility: boolean) {
    const layer = this.map
      .getLayers()
      .getArray()
      .find((layer) => {
        const properties = layer.getProperties();
        return properties["uuid"] && properties["uuid"] == uuid;
      });
    if (layer) {
      layer.setVisible(visibility);
      localStorage.setItem(
        getVisibilityKey(this.projectKey, layer.getProperties()["uuid"]),
        `${visibility}`,
      );
    }
  }

  private setLayerGroup(
    featuresMetadata: TileLayerMetadata[],
    group: TileLayer<TileImage>[],
    extent: Extent,
  ) {
    for (let metadata of featuresMetadata) {
      const layer = createTileLayer(metadata, this.projectKey);

      group.push(layer);

      const preference = localStorage.getItem(
        getVisibilityKey(this.projectKey, metadata.uuid),
      );

      let visible = null;

      if (preference == "true") {
        visible = true;
      } else if (preference == "false") {
        visible = false;
      }

      if (visible != null) {
        layer.setVisible(visible);
        this.hook.pushEventTo(
          // Do not send the information about the user's visibility preference to the map hook element,
          // instead this is sent directly to the tile selection live component.
          this.preferenceReportTarget,
          "visibility-preference",
          {
            uuid: metadata.uuid,
            show: visible,
          },
        );
      }

      extent = extend(extent, layer.getExtent());
      this.map.addLayer(layer);
    }

    // Update the Z indicices for all layers, the more nuanced document-level layers should be displayed
    // above project-level layers.
    const layerCount =
      this.documentLayerGroup.length + this.projectLayerGroup.length;
    const combined = this.documentLayerGroup.concat(this.projectLayerGroup);
    for (let i = 0; i < layerCount; i++) {
      combined[i].setZIndex(layerCount - i - 200);
    }
  }
}

function createTileLayer(metadata: TileLayerMetadata, projectKey: string) {
  const extent = [
    metadata.geo_reference.bottomLeftCoordinates[1],
    metadata.geo_reference.bottomLeftCoordinates[0],
    metadata.geo_reference.topRightCoordinates[1],
    metadata.geo_reference.topRightCoordinates[0],
  ];

  const pathTemplate = `/api/image/tile/${projectKey}/${metadata.uuid}/{z}/{x}/{y}`;

  const resolutions = getResolutions(
    extent,
    tileSize,
    metadata.width,
    metadata.height,
  );

  const source = new TileImage({
    tileGrid: new TileGrid({
      extent,
      origin: [extent[0], extent[3]],
      resolutions,
      tileSize,
    }),
    tileUrlFunction: (tileCoord) => {
      return pathTemplate
        .replace("{z}", String(tileCoord[0]))
        .replace("{x}", String(tileCoord[1]))
        .replace("{y}", String(tileCoord[2]));
    },
  });

  return new TileLayer({
    source: source,
    extent,
    visible: metadata.visible,
    properties: {
      uuid: metadata.uuid,
    },
  });
}

function getVisibilityKey(projectKey: string, layerName: string) {
  return `layer-visibility-${projectKey}/${layerName}`;
}

function getResolutions(
  extent: number[],
  tileSize: number,
  width: number,
  height: number,
) {
  const portraitFormat = height > width;

  const result = [];
  const layerSize =
    extent[portraitFormat ? 3 : 2] - extent[portraitFormat ? 1 : 0];
  const imageSize = portraitFormat ? height : width;

  let scale = 1;
  while (tileSize < imageSize / scale) {
    result.push((layerSize / imageSize) * scale);
    scale *= 2;
  }
  result.push((layerSize / imageSize) * scale);

  return result.reverse();
}
