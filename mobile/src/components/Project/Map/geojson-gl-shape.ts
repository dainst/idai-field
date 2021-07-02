
import { Position } from 'geojson';
import { Document, ProjectConfiguration } from 'idai-field-core';
import { Matrix4 } from 'react-native-redash';
import {
    BufferGeometry, CircleGeometry, DoubleSide, Line,
    LineBasicMaterial, Mesh, MeshBasicMaterial, Object3D, Scene, Shape, ShapeGeometry, Vector2
} from 'three';
import { processTransform2d } from './geo-svg';
import { pointRadius, strokeWidth } from './geo-svg/constants';


interface ShapeFunction<T extends Position | Position[] | Position[][] | Position[][][]>{
    // eslint-disable-next-line max-len
    (matrix: Matrix4,scene: Scene, config: ProjectConfiguration, document: Document, coordinates: T, isSelected: boolean): void;
}


// eslint-disable-next-line max-len
export const multiPolygonToShape: ShapeFunction<Position[][][]> = (matrix, scene, config, document, coordinates, isSelected) =>
    coordinates.forEach( polygon => polygonToShape(matrix, scene, config, document, polygon, isSelected));


export const polygonToShape: ShapeFunction<Position[][]> = (matrix, scene,config, document,coordinates,isSelected) => {
    
    if(!coordinates) return;

    const color = config.getColorForCategory(document.resource.category);
    const shape = new Shape();
    let object: Object3D;

    coordinates.forEach((ringCoords, i) => {
        if(i === 0){
            ringCoords.forEach((pos: Position, i: number) => {
                const [x,y] = processTransform2d(matrix,pos);
                if(i === 0) shape.moveTo(x ,y );
                else shape.lineTo(x ,y );});
        }
    });
    
    if(isSelected){
        const material = new MeshBasicMaterial({
            color,
            opacity: 0.7,
            side: DoubleSide, depthWrite: false
        });
        const geo = new ShapeGeometry(shape);
        object = new Mesh(geo, material);
       
    } else { //outline
        shape.autoClose = true;
        const points = shape.getPoints();
        const geometryPoints = new BufferGeometry().setFromPoints( points );
        object = new Line( geometryPoints,
            new LineBasicMaterial( { color, linewidth: strokeWidth } ) );

    }
    addObjectInfo(object,document);
    scene.add(object);
};


export const lineStringToShape: ShapeFunction<Position[]> = (matrix, scene, config, document, coordinates) => {

    if(!coordinates) return;

    const points: Vector2[] = [];
    const material = new LineBasicMaterial({
        color: config.getColorForCategory(document.resource.category),
        linewidth: strokeWidth
    });
   
    coordinates.forEach(point => {
        const [x,y] = processTransform2d(matrix,point);
        points.push(new Vector2(x,y));
    });
    const geo = new BufferGeometry().setFromPoints(points);
    const line = new Line(geo, material);
    addObjectInfo(line, document);
    scene.add(line);
};

// eslint-disable-next-line max-len
export const multiPointToShape: ShapeFunction<Position[]> = (matrix, scene, config, document, coordinates, isSelected) =>
    coordinates.forEach(point => pointToShape(matrix, scene, config, document, point, isSelected));


export const pointToShape: ShapeFunction<Position> =
    (matrix, scene, config, document, coordinates): void => {

    if(!coordinates) return;
  
    const [x,y] = processTransform2d(matrix,coordinates);
    
    
    const radius = pointRadius;
    const segments = 30; //<-- Increase or decrease for more resolution
    
    const circleGeometry = new CircleGeometry( radius, segments );
    circleGeometry.translate(x ,y ,0);
    const circle = new Mesh(
        circleGeometry,
        new MeshBasicMaterial({ color: config.getColorForCategory(document.resource.category) }) );
    addObjectInfo(circle, document);
    scene.add( circle );


};

const addObjectInfo = (object: Object3D, doc: Document) => {
    object.name = doc.resource.identifier;
    object.uuid = doc.resource.id;
};