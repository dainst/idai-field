import * as THREE from 'three';
import {DepthMap} from './depth-map';


/**
 * @author Thomas Kleinke
 */
export class VisibilityHelper {

    constructor(private depthMap: DepthMap,
                private camera: THREE.PerspectiveCamera) {}


    public isInCameraViewFrustum(point: THREE.Vector3): boolean {

        const camera: THREE.PerspectiveCamera = this.camera.clone();

        const viewFrustum: THREE.Frustum = new THREE.Frustum().setFromMatrix(
            new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
        );

        return viewFrustum.containsPoint(point);
    }


    public isVisible(pointInWorldSpace: THREE.Vector3, pointOnCanvas: THREE.Vector2): boolean {

        if (!this.depthMap.isReady()) return false;

        const camera: THREE.PerspectiveCamera = this.camera.clone();
        const distanceToIntersection: number = this.getDistanceToNearestIntersection(pointOnCanvas);

        if (distanceToIntersection == camera.near) return true;

        const distanceToMarkerPosition: number
            = VisibilityHelper.getDistanceToMarkerPosition(pointInWorldSpace, camera);

        if (distanceToIntersection > distanceToMarkerPosition) {
            return true;
        } else {
            return (distanceToMarkerPosition > 50 && (distanceToMarkerPosition - distanceToIntersection) < 1);
        }
    }


    private getDistanceToNearestIntersection(point: THREE.Vector2): number {

        return this.depthMap.getDepth(new THREE.Vector2(point.x, point.y));
    }


    private static getDistanceToMarkerPosition(point: THREE.Vector3,
                                               camera: THREE.PerspectiveCamera): number {

        return this.getNearFrustumPlane(camera).distanceToPoint(point);
    }


    private static getNearFrustumPlane(camera: THREE.PerspectiveCamera): THREE.Plane {

        const normal: THREE.Vector3 = camera.getWorldDirection().normalize();
        const planeAtOrigin: THREE.Plane = new THREE.Plane(normal);

        return new THREE.Plane(normal, -planeAtOrigin.distanceToPoint(camera.position) - camera.near);
    }
}