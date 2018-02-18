import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';


/**
 * @author Thomas Kleinke
 */
export interface Map3DMeshGeometry {

    mesh: THREE.Mesh,
    raycasterObject: THREE.Object3D,
    document: IdaiFieldDocument
}