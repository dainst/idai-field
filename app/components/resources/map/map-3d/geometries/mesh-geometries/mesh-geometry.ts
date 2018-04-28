import * as THREE from 'three';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';


/**
 * @author Thomas Kleinke
 */
export interface MeshGeometry {

    mesh: THREE.Mesh,
    raycasterObject: THREE.Object3D,
    document: IdaiFieldDocument,
    type: 'polygon'|'line'
}