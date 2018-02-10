import * as THREE from 'three';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';


/**
 * @author Thomas Kleinke
 */
export interface Object3D {

    resourceId: string;
    document: IdaiFieldDocument;    // TODO Remove
    mesh: THREE.Mesh;
    visible: boolean;
}