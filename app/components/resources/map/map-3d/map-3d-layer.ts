import * as THREE from 'three';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';


/**
 * @author Thomas Kleinke
 */
export interface Map3DLayer {

    mesh: THREE.Mesh;
    document: IdaiFieldDocument;
    visible: boolean;
}