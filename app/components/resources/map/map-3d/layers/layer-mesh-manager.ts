import * as THREE from 'three';


/**
 * @author Thomas Kleinke
 */
export abstract class LayerMeshManager {

    protected meshes: { [resourceId: string]: THREE.Mesh } = {};

    public abstract async getMesh(id: string): Promise<THREE.Mesh>;
}