import * as THREE from 'three';
import {DepthMap} from './depth-map';


/**
 * @author Thomas Kleinke
 */
export class VisibilityHelper {


    public static isInCameraViewFrustum(point: THREE.Vector3,
                                 camera: THREE.PerspectiveCamera|THREE.OrthographicCamera): boolean {

        const clonedCamera: THREE.Camera = camera.clone();

        const viewFrustum: THREE.Frustum = new THREE.Frustum().setFromMatrix(
            new THREE.Matrix4().multiplyMatrices(
                clonedCamera.projectionMatrix,
                clonedCamera.matrixWorldInverse
            )
        );

        return viewFrustum.containsPoint(point);
    }


    public static isVisible(pointInWorldSpace: THREE.Vector3, pointOnCanvas: THREE.Vector2,
                     camera: THREE.PerspectiveCamera|THREE.OrthographicCamera,
                     depthMap: DepthMap): boolean {

        if (!depthMap.isReady()) return false;

        const clonedCamera: THREE.PerspectiveCamera|THREE.OrthographicCamera = camera.clone();
        const distanceToIntersection: number = this.getDistanceToNearestIntersection(pointOnCanvas, depthMap);

        if (distanceToIntersection == clonedCamera.near) return true;

        const distanceToMarkerPosition: number
            = VisibilityHelper.getDistanceToMarkerPosition(pointInWorldSpace, clonedCamera);

        if (distanceToIntersection > distanceToMarkerPosition) {
            return true;
        } else {
            return (distanceToMarkerPosition > 50 && (distanceToMarkerPosition - distanceToIntersection) < 1);
        }
    }


    private static getDistanceToNearestIntersection(point: THREE.Vector2, depthMap: DepthMap): number {

        return depthMap.getDepth(new THREE.Vector2(point.x, point.y));
    }


    private static getDistanceToMarkerPosition(point: THREE.Vector3,
                                               camera: THREE.PerspectiveCamera|THREE.OrthographicCamera): number {

        return this.getNearFrustumPlane(camera).distanceToPoint(point);
    }


    private static getNearFrustumPlane(camera: THREE.PerspectiveCamera|THREE.OrthographicCamera): THREE.Plane {

        const normal: THREE.Vector3 = camera.getWorldDirection().normalize();
        const planeAtOrigin: THREE.Plane = new THREE.Plane(normal);

        return new THREE.Plane(normal, -planeAtOrigin.distanceToPoint(camera.position) - camera.near);
    }
}