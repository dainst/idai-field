import * as THREE from 'three';


/**
 * @author Thomas Kleinke
 */
export class ModelUtility {

    public static getMesh(scene: THREE.Scene): THREE.Mesh {

        return scene.children.find(object => object instanceof THREE.Mesh) as THREE.Mesh;
    }
}