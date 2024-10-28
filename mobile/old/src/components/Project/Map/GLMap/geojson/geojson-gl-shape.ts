/* eslint-disable @typescript-eslint/no-var-requires */
import { TextureLoader } from 'expo-three';
import { Position } from 'geojson';
import {
  Document,
  FieldGeometry,
  FieldGeometryType,
  ImageGeoreference,
  ProjectConfiguration,
} from 'idai-field-core';
import { Matrix4 } from 'react-native-redash';
import {
  BufferGeometry,
  CircleGeometry,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  Scene,
  Shape,
  ShapeBufferGeometry,
  ShapeGeometry,
  ShapeUtils,
  Vector2,
} from 'three';
import {
  highlightedColor,
  highlightedStrokeWidth,
  lineRenderingOrder,
  pointRenderingOrder,
  strokeWidth,
} from '../constants';
import { getLayerCoordinates, processTransform2d } from '../cs-transform';
import { arrayDim } from '../cs-transform/document-to-world/utils/cs-transform-utils';
import { defaultPointRadius } from './../constants';

interface ShapeFunction<
  T extends Position | Position[] | Position[][] | Position[][][]
> {
  (
    matrix: Matrix4,
    scene: Scene,
    config: ProjectConfiguration,
    document: Document,
    coordinates: T,
    radius?: number
  ): void;
}

export interface ObjectData {
  isSelected: boolean;
  type: FieldGeometryType;
  coords: Shape[] | Position[];
}

export enum ObjectChildValues {
  selected = 'selected',
  notSelected = 'notSelected',
}

export const updateDocumentInScene = (
  document: Document,
  documentToWorldMatrix: Matrix4,
  scene: Scene,
  config: ProjectConfiguration
): void => {
  removeDocumentFromScene(document.resource.id, scene);
  addDocumentToScene(document, documentToWorldMatrix, scene, config);
};

export const removeDocumentFromScene = (docId: string, scene: Scene): void => {
  const parent = scene.getObjectByProperty('uuid', docId);
  if (parent) scene.remove(parent);
};

export const addDocumentToScene = (
  doc: Document,
  documentToWorldMatrix: Matrix4,
  scene: Scene,
  config: ProjectConfiguration
): void => {
  if (!documentToWorldMatrix) return;
  const geometry = doc.resource.geometry as FieldGeometry;

  switch (geometry.type) {
    case 'Polygon':
    case 'MultiPolygon':
      polygonToShape(
        documentToWorldMatrix,
        scene,
        config,
        doc,
        geometry.coordinates
      );
      break;
    case 'LineString':
    case 'MultiLineString':
      lineStringToShape(
        documentToWorldMatrix,
        scene,
        config,
        doc,
        geometry.coordinates
      );
      break;
    case 'Point':
    case 'MultiPoint':
      pointToShape(
        documentToWorldMatrix,
        scene,
        config,
        doc,
        geometry.coordinates
      );
      break;
  }
};

export const polygonToShape: ShapeFunction<Position[][] | Position[][][]> = (
  matrix,
  scene,
  config,
  document,
  coordinates
) => {
  if (!coordinates) return;

  const color =
    config.getCategory(document.resource.category)?.color || 'black';
  const shapes: Shape[] = [];
  const parent = new Object3D();

  if (isPosition2d(coordinates))
    shapes.push(geoJsonPolyToShape(matrix, coordinates));
  else if (isPosition3d(coordinates))
    coordinates.forEach((polygon) =>
      shapes.push(geoJsonPolyToShape(matrix, polygon))
    );

  // selected Child
  const material = new MeshBasicMaterial({
    color,
    opacity: 0.6,
  });
  shapes.forEach((shape) => {
    const geo = new ShapeGeometry(shape);
    const selected = new Mesh(geo, material);
    selected.name = ObjectChildValues.selected;
    selected.visible = false;
    // render polygons with small area first
    selected.renderOrder = -Math.abs(
      Math.floor(ShapeUtils.area(shape.getPoints()))
    );
    parent.add(selected);
  });

  // not selected Child
  shapes.forEach((shape) =>
    parent.add(getLineFromShape(shape, color, false, true))
  );

  addObjectInfo(parent, document, shapes);
  scene.add(parent);
};

const geoJsonPolyToShape = (matrix: Matrix4, polygon: Position[][]): Shape => {
  const shape = new Shape();
  polygon.forEach((ringCoords, i) => {
    if (i === 0) {
      ringCoords.forEach((pos: Position, i: number) => {
        const [x, y] = processTransform2d(matrix, pos);
        if (i === 0) shape.moveTo(x, y);
        else shape.lineTo(x, y);
      });
    }
  });
  return shape;
};

export const lineStringToShape: ShapeFunction<Position[] | Position[][]> = (
  matrix,
  scene,
  config,
  document,
  coordinates
) => {
  if (!coordinates) return;

  const parent = new Object3D();
  const color =
    config.getCategory(document.resource.category)?.color || 'black';
  const shapes: Shape[] = [];

  if (isPosition1d(coordinates))
    shapes.push(geoJsonLineToShape(matrix, coordinates));
  else
    coordinates.forEach((lineString) =>
      shapes.push(geoJsonLineToShape(matrix, lineString))
    );

  // selected Child
  shapes.forEach((shape) =>
    parent.add(getLineFromShape(shape, color, true, false))
  );

  // not selected Child
  shapes.forEach((shape) =>
    parent.add(getLineFromShape(shape, color, false, false))
  );

  addObjectInfo(parent, document, shapes);
  scene.add(parent);
};

const geoJsonLineToShape = (
  matrix: Matrix4,
  coordinates: Position[]
): Shape => {
  const shape = new Shape();
  coordinates.forEach((point, i) => {
    const [x, y] = processTransform2d(matrix, point);
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  });
  return shape;
};

const getLineFromShape = (
  shape: Shape,
  color: string,
  isSelected: boolean,
  autoClose: boolean,
  linewidth = strokeWidth
): Line => {
  shape.autoClose = autoClose ? true : false;
  const geo = new BufferGeometry().setFromPoints(shape.getPoints());
  const material = new LineBasicMaterial({
    color: color,
    linewidth,
    opacity: isSelected ? 1 : 0.7,
  });

  const line = new Line(geo, material);
  line.name = isSelected
    ? ObjectChildValues.selected
    : ObjectChildValues.notSelected;
  line.visible = isSelected ? false : true;
  line.renderOrder = lineRenderingOrder;
  return line;
};

export const pointToShape: ShapeFunction<Position | Position[]> = (
  matrix,
  scene,
  config,
  document,
  coordinates,
  radius?: number
): void => {
  if (!coordinates) return;

  const name = 'pointParent';
  let pointParent = scene.getObjectByName(name);
  if (!pointParent) {
    pointParent = new Object3D();
    pointParent.name = name;
    scene.add(pointParent);
  }
  pointParent.userData = { radius: radius || defaultPointRadius };

  const parent = new Object3D();
  const color =
    config.getCategory(document.resource.category)?.color || 'black';
  const points: Position[] = [];

  if (isPostion(coordinates))
    points.push(processTransform2d(matrix, coordinates));
  else
    coordinates.forEach((coords) =>
      points.push(processTransform2d(matrix, coords))
    );

  // selected Child
  points.forEach((point) =>
    parent.add(getCricleFromCoord(scene, point, true, color))
  );

  // not selected Child
  points.forEach((point) =>
    parent.add(getCricleFromCoord(scene, point, false, color))
  );

  addObjectInfo(parent, document, points);
  //scene.add(parent);
  pointParent.add(parent);
};

const getCricleFromCoord = (
  scene: Scene,
  pos: Position,
  isSelected: boolean,
  color: string
): Mesh => {
  const radius =
    (scene.getObjectByName('pointParent')?.userData.radius as number) ||
    defaultPointRadius;
  const segments = 30; //<-- Increase or decrease for more resolution
  const circleGeometry = new CircleGeometry(radius, segments);
  const [x, y] = pos;
  circleGeometry.translate(x, y, 0);

  const material = new MeshBasicMaterial({
    color,
    opacity: isSelected ? 1 : 0.7,
  });
  const circle = new Mesh(circleGeometry, material);
  circle.name = isSelected
    ? ObjectChildValues.selected
    : ObjectChildValues.notSelected;
  circle.visible = isSelected ? false : true;
  circle.renderOrder = pointRenderingOrder;
  return circle;
};

export const updatePointRadiusOfScene = (
  geoDocuments: Document[],
  documentToWorldMatrix: Matrix4,
  config: ProjectConfiguration,
  scene: Scene,
  radius: number
): void => {
  const name = 'pointParent';
  const pointParent = scene.getObjectByName(name);

  if (!pointParent) return;
  scene.remove(pointParent);

  geoDocuments.forEach((doc) => {
    const geometry = doc.resource.geometry as FieldGeometry;
    if (geometry.type === 'Point' || geometry.type === 'MultiPoint')
      pointToShape(
        documentToWorldMatrix,
        scene,
        config,
        doc,
        geometry.coordinates,
        radius
      );
  });
};

const addObjectInfo = (
  object: Object3D,
  doc: Document,
  coords: Shape[] | Position[]
) => {
  object.name = doc.resource.identifier;
  object.uuid = doc.resource.id;
  const userData: ObjectData = {
    isSelected: false,
    type: doc.resource.geometry.type,
    coords,
  };
  object.userData = userData;
};

const isPostion = (coords: Position | Position[]): coords is Position =>
  arrayDim(coords) === 1;
const isPosition1d = (
  coords: Position[] | Position[][] | Position
): coords is Position[] => arrayDim(coords) === 2;
const isPosition2d = (
  coords: Position[][] | Position[][][]
): coords is Position[][] => arrayDim(coords) === 3;
const isPosition3d = (
  coords: Position[][] | Position[][][]
): coords is Position[][][] => arrayDim(coords) === 4;

export const addlocationPointToScene = (
  matrix: Matrix4,
  scene: Object3D,
  coordinates: Position
): void => {
  const [x, y] = processTransform2d(matrix, coordinates);
  const location = 'location';

  const point = scene.getObjectByName(location);
  if (point) {
    point.translateX(x);
    point.translateY(y);
    return;
  }

  const color = 'blue';
  const radius = defaultPointRadius;
  const segments = 30; //<-- Increase or decrease for more resolution

  const circleGeometry = new CircleGeometry(radius, segments);
  circleGeometry.translate(x, y, 0);
  const locationPoint = new Mesh(
    circleGeometry,
    new MeshBasicMaterial({ color })
  );
  locationPoint.name = location;

  scene.add(locationPoint);
};

export const addHighlightedDocToScene = (docId: string, scene: Scene): void => {
  const data = getUserData(docId, scene);
  if (!data) return;

  const name = 'highlighted';
  let parent = scene.getObjectByName(name);
  if (parent) scene.remove(parent);

  parent = new Object3D();
  parent.name = name;

  if (isShapeArray(data.coords, data.type)) {
    const closeShape = data.type === 'Polygon' || data.type === 'MultiPolygon';
    data.coords.forEach((coord) =>
      parent?.add(
        getLineFromShape(
          coord,
          highlightedColor,
          false,
          closeShape,
          highlightedStrokeWidth
        )
      )
    );
  } else
    data.coords.forEach((coord) =>
      parent?.add(getCricleFromCoord(scene, coord, false, highlightedColor))
    );

  scene.add(parent);
};

const isShapeArray = (
  coords: Shape[] | Position[],
  type: FieldGeometryType
): coords is Shape[] =>
  type === 'Polygon' ||
  type === 'MultiPolygon' ||
  type === 'LineString' ||
  type === 'MultiLineString';

const getUserData = (docId: string, scene: Scene): ObjectData | undefined =>
  scene.getObjectByProperty('uuid', docId)?.userData as ObjectData;

export const addLayerToScene = (
  doc: Document,
  documentToWorldMatrix: Matrix4,
  scene: Scene
): void => {
  const georeference = doc.resource.georeference as ImageGeoreference;
  if (!georeference) throw new Error('No georeference!');
  const {
    topLeftCoordinates,
    topRightCoordinates,
    bottomLeftCoordinates,
    bottomRightCoordinates,
  } = getLayerCoordinates(georeference);

  const topLeftTrans = processTransform2d(
    documentToWorldMatrix,
    topLeftCoordinates
  );
  const topRightTrans = processTransform2d(
    documentToWorldMatrix,
    topRightCoordinates
  );
  const bottomLeftTrans = processTransform2d(
    documentToWorldMatrix,
    bottomLeftCoordinates
  );
  const bottomRightTrans = processTransform2d(
    documentToWorldMatrix,
    bottomRightCoordinates
  );

  const shape = new Shape();
  shape.moveTo(...(bottomLeftTrans as [number, number]));
  shape.lineTo(...(bottomRightTrans as [number, number]));
  shape.lineTo(...(topRightTrans as [number, number]));
  shape.lineTo(...(topLeftTrans as [number, number]));
  shape.closePath();

  const width = new Vector2(...bottomRightTrans).distanceTo(
    new Vector2(...bottomLeftTrans)
  );
  const height = new Vector2(...topLeftTrans).distanceTo(
    new Vector2(...bottomLeftTrans)
  );
  //TODO: Change TextureLoader to also load images from image server
  const texture = new TextureLoader().load(
    doc.resource.id === 'o25'
      ? require('../../../../../../../assets/images/o25.png')
      : require('../../../../../../../assets/images/o26.png')
  );
  texture.repeat.set(Math.pow(width, -1), Math.pow(height, -1));
  texture.offset.set(-bottomLeftTrans[0] / width, -bottomLeftTrans[1] / height);

  const material = new MeshBasicMaterial({ map: texture });
  const layerObject = new Mesh(new ShapeBufferGeometry(shape), material);
  layerObject.renderOrder = -Infinity; //top put all layers behind other polygons
  layerObject.name = doc.resource.identifier;
  layerObject.uuid = doc.resource.id;
  layerObject.visible = false;

  scene.add(layerObject);
};
