import { Position } from 'geojson';
import { Document, FieldGeometry, ImageGeoreference } from 'idai-field-core';
import { GeometryBoundings } from '../../types';

type extractFunc =
  | ((geometry: Position[]) => [number[], number[]])
  | ((geometry: Position[][]) => [number[], number[]]);
type GeometryBoundingsNull = GeometryBoundings | null;

export const getGeometryBoundings = (
  geometryDocs: Document[],
  layerDocs: Document[]
): GeometryBoundingsNull =>
  getMinMaxCoords(
    geometryDocs.map((doc) => doc.resource.geometry),
    layerDocs.map((doc) => doc.resource.georeference)
  );

const getMinMaxCoords = (
  geometries: FieldGeometry[],
  georeferences: ImageGeoreference[]
): GeometryBoundingsNull => {
  const georeferencesMinMax = getMinMaxGeoreferenceCoords(georeferences);
  const geometriesMinMax = getMinMaxGeometryCoords(geometries);

  if (!georeferencesMinMax && !geometriesMinMax) return null;
  if (!georeferencesMinMax) return geometriesMinMax;
  if (!geometriesMinMax) return georeferencesMinMax;

  return {
    minX: Math.min(georeferencesMinMax.minX, geometriesMinMax.minX),
    maxX: Math.max(georeferencesMinMax.maxX, geometriesMinMax.maxX),
    minY: Math.min(georeferencesMinMax.minY, geometriesMinMax.minY),
    maxY: Math.max(georeferencesMinMax.maxY, geometriesMinMax.maxY),
  };
};

const getMinMaxGeoreferenceCoords = (
  georeferences: ImageGeoreference[]
): GeometryBoundings | null => {
  if (!georeferences.length) return null;

  const xCoords: number[] = [];
  const yCoords: number[] = [];
  georeferences.forEach((geoRef) => {
    const {
      topRightCoordinates,
      topLeftCoordinates,
      bottomRightCoordinates,
      bottomLeftCoordinates,
    } = getLayerCoordinates(geoRef);
    xCoords.push(
      topRightCoordinates[0],
      topLeftCoordinates[0],
      bottomLeftCoordinates[0],
      bottomRightCoordinates[0]
    );
    yCoords.push(
      topRightCoordinates[1],
      topLeftCoordinates[1],
      bottomLeftCoordinates[1],
      bottomRightCoordinates[1]
    );
  });

  return {
    minX: Math.min(...xCoords),
    minY: Math.min(...yCoords),
    maxX: Math.max(...xCoords),
    maxY: Math.max(...yCoords),
  };
};

export const getMinMaxGeometryCoords = (
  geometries: FieldGeometry[]
): GeometryBoundings | null => {
  if (!geometries.length) return null;

  const xCoords: number[] = [];
  const yCoords: number[] = [];
  geometries.forEach((geo) => {
    switch (geo.type) {
      case 'Polygon':
      case 'MultiLineString': {
        const [x, y] = extractCoordsPositions2d(geo.coordinates);
        xCoords.push(...x);
        yCoords.push(...y);
        break;
      }
      case 'Point':
        xCoords.push(geo.coordinates[0]);
        yCoords.push(geo.coordinates[1]);
        break;
      case 'MultiPoint':
      case 'LineString': {
        const [x, y] = extractCoordsPositions(geo.coordinates);
        xCoords.push(...x);
        yCoords.push(...y);
        break;
      }
      case 'MultiPolygon': {
        const [x, y] = extractCoordsPositions3d(geo.coordinates);
        xCoords.push(...x);
        yCoords.push(...y);
        break;
      }
      default:
        throw TypeError('No valid GeoJSON type');
    }
  });
  return {
    minX: Math.min(...xCoords),
    minY: Math.min(...yCoords),
    maxX: Math.max(...xCoords),
    maxY: Math.max(...yCoords),
  };
};

export const extractCoordsPositions3d = (
  geometries: Position[][][]
): [number[], number[]] => extractCoords(geometries, extractCoordsPositions2d);

export const extractCoordsPositions2d = (
  geometries: Position[][]
): [number[], number[]] => extractCoords(geometries, extractCoordsPositions);

const extractCoords = (
  geometries: Position[][] | Position[][][],
  extractFunc: extractFunc
): [number[], number[]] => {
  const xCoords: number[] = [];
  const yCoords: number[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  geometries.forEach((geo: any) => {
    xCoords.push(...extractFunc(geo)[0]);
    yCoords.push(...extractFunc(geo)[1]);
  });
  return [xCoords, yCoords];
};

export const extractCoordsPositions = (
  geometries: Position[]
): [number[], number[]] => {
  const xCoords: number[] = [];
  const yCoords: number[] = [];
  geometries.forEach((geo) => {
    xCoords.push(geo[0]);
    yCoords.push(geo[1]);
  });
  return [xCoords, yCoords];
};

/**
 * Maps value from range [oldMin,oldMax] to range [newMin,newMax]
 * @returns value between newMin and newMax
 */
// eslint-disable-next-line max-len
export const mapValueToNewRange = (
  newMax: number,
  newMin: number,
  value: number,
  oldMax: number,
  oldMin: number
): number =>
  ((newMax - newMin) * (value - oldMin)) / (oldMax - oldMin) + newMin;

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const arrayDim = (array: any, dim: number = 0): number => {
  if (Array.isArray(array)) return arrayDim(array[0], dim + 1);
  else return dim;
};
/* eslint-enable @typescript-eslint/explicit-module-boundary-types */

interface LayerCoordinates extends ImageGeoreference {
  bottomRightCoordinates: [number, number];
}
/**
 * Compute missing bottomRightCoordinates of ImageGeoreference type.
 * Missing coordinate can be found by bisection of diagonals AD and CB
 *   A ------- B
 *    |       |
 *    |       |
 *   C -------- D
 *
 * Furthermore, exchange corrdinates so that Coordinates Tuple has [xCoord, yCoord].
 *  ImageGeoreference coming from PouchDB has following order in Coords [yCorrd, xCoord]
 * @param georeference Georeference coming from PouchDB
 */
export const getLayerCoordinates = (
  georeference: ImageGeoreference
): LayerCoordinates => {
  const topLeftCoordinates = exchangeXYCoordinates(
    georeference.topLeftCoordinates
  );
  const topRightCoordinates = exchangeXYCoordinates(
    georeference.topRightCoordinates
  );
  const bottomLeftCoordinates = exchangeXYCoordinates(
    georeference.bottomLeftCoordinates
  );
  const bottomRightCoordinates: [number, number] = [0, 0];

  //Compute midpoint:
  const midPointX = (topRightCoordinates[0] + bottomLeftCoordinates[0]) / 2;
  const midPointY = (topRightCoordinates[1] + bottomLeftCoordinates[1]) / 2;

  //Get bottomRightCoordinates
  bottomRightCoordinates[0] = midPointX * 2 - topLeftCoordinates[0];
  bottomRightCoordinates[1] = midPointY * 2 - topLeftCoordinates[1];

  return {
    topLeftCoordinates,
    topRightCoordinates,
    bottomLeftCoordinates,
    bottomRightCoordinates,
  };
};

const exchangeXYCoordinates = (coord: [number, number]): [number, number] => [
  coord[1],
  coord[0],
];
