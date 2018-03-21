import * as THREE from 'three';
import {Viewer3D} from './viewer-3d';
import {CameraManager} from './camera-manager';


/**
 * @author Thomas Kleinke
 */
export class IntersectionHelper {

    constructor(private viewer: Viewer3D,
                private cameraManager: CameraManager) {}


    public getIntersections(position: THREE.Vector2,
                            objectsToCheck: Array<THREE.Object3D>): Array<THREE.Intersection> {

        const raycaster: THREE.Raycaster = IntersectionHelper.createRaycaster();
        raycaster.setFromCamera(this.getNormalizedDeviceCoordinates(position), this.cameraManager.getCamera());

        return raycaster.intersectObjects(objectsToCheck);
    }


    private getNormalizedDeviceCoordinates(position: THREE.Vector2): THREE.Vector2 {

        const renderer: THREE.WebGLRenderer = this.viewer.getRenderer();
        const canvasBoundingClientRect: ClientRect = renderer.domElement.getBoundingClientRect();

        const x: number
            = ((position.x - canvasBoundingClientRect.left) / canvasBoundingClientRect.width) * 2 - 1;
        const y: number
            = -((position.y - canvasBoundingClientRect.top) / canvasBoundingClientRect.height) * 2 + 1;

        return new THREE.Vector2(x, y);
    }


    private static createRaycaster(): THREE.Raycaster {

        const raycaster: THREE.Raycaster = new THREE.Raycaster();
        raycaster.linePrecision = 0.05;

        return raycaster;
    }
}