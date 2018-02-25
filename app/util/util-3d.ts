import * as THREE from 'three';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';


/**
 * @author Thomas Kleinke
 */

export const has3DPointGeometry = (document: IdaiFieldDocument): boolean => {

    return document.resource.geometry != undefined &&
        document.resource.geometry.type == 'Point' &&
        document.resource.geometry.coordinates != undefined &&
        document.resource.geometry.coordinates.length == 3;
};


export const has3DLineGeometry = (document: IdaiFieldDocument): boolean => {

    return document.resource.geometry != undefined &&
        document.resource.geometry.type == 'LineString' &&
        document.resource.geometry.coordinates != undefined &&
        !document.resource.geometry.coordinates.find(point => point.length != 3);
};


export const has3DPolygonGeometry = (document: IdaiFieldDocument): boolean => {

    return document.resource.geometry != undefined &&
        document.resource.geometry.type == 'Polygon' &&
        document.resource.geometry.coordinates != undefined &&
        !document.resource.geometry.coordinates
            .find(path => path.find((point: number[]) => point.length != 3));
};


export const getPointVector = (coordinates: number[]): THREE.Vector3 => {

    return new THREE.Vector3(coordinates[0], coordinates[2], -coordinates[1]);
};


export const addOffset = (point: THREE.Vector3, offset: THREE.Vector3): THREE.Vector3 => {

    return new THREE.Vector3(point.x + offset.x, point.y + offset.y, point.z + offset.z);
};


export const subtractOffset = (point: THREE.Vector3, offset: THREE.Vector3): THREE.Vector3 => {

    return new THREE.Vector3(point.x - offset.x, point.y - offset.y, point.z - offset.z);
};