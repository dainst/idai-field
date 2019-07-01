import * as THREE from 'three';
import {FieldDocument} from 'idai-components-2';


/**
 * @author Thomas Kleinke
 */
export interface MeshGeometry {

    mesh: THREE.Mesh,
    raycasterObject: THREE.Object3D,
    document: FieldDocument,
    type: 'polygon'|'line'
}