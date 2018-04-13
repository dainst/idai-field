import * as THREE from 'three';


/**
 * @author Thomas Kleinke
 */
export class SceneManager {

    private scene: THREE.Scene = SceneManager.createScene();


    public getScene(): THREE.Scene {

        return this.scene;
    }


    public getMeshes(): Array<THREE.Mesh> {

        return this.scene.children
            .filter(child => child instanceof THREE.Mesh) as Array<THREE.Mesh>;
    }


    public add(scene: THREE.Object3D) {

        this.scene.add(scene);
    }


    public remove(scene: THREE.Object3D) {

        this.scene.remove(scene);
    }


    public removeAll() {

        this.scene.children.filter(child => child instanceof THREE.Scene || child instanceof THREE.Mesh)
            .forEach(child => this.scene.remove(child));
    }


    private static createScene(): THREE.Scene {

        const scene: THREE.Scene = new THREE.Scene();
        this.addLights(scene);

        return scene;
    }


    private static addLights(scene: THREE.Scene) {

        scene.add(new THREE.HemisphereLight(0xffffff, 0x000000, 0.8));

        const directionalLight: THREE.DirectionalLight = new THREE.DirectionalLight(0xffffff, 0.2);
        directionalLight.position.set(0, 1, 1);
        scene.add(directionalLight);
    }
}