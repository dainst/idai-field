import * as THREE from 'three';


/**
 * @author Thomas Kleinke
 */
export abstract class LayerMeshManager {

    public abstract async getMesh(id: string): Promise<THREE.Mesh>;
}