import * as THREE from 'three';

const TWEEN = require('tweenjs');

const ANIMATION_DURATION_IN_MILLISECONDS: number = 300;


/**
 * @author Thomas Kleinke
 */
export abstract class CameraManager {

    private cameraAnimation: {
        targetPosition: THREE.Vector3,
        targetQuaternion: THREE.Quaternion,
        zoom: number,
        progress: number
    }|undefined;


    public abstract initialize(canvasWidth: number, canvasHeight: number): void;


    public abstract getCamera(): THREE.PerspectiveCamera|THREE.OrthographicCamera;


    public abstract resize(canvasWidth: number, canvasHeight: number): void;


    public abstract drag(x: number, z: number): void;


    public abstract zoom(value: number, camera?: THREE.Camera): void;


    public abstract zoomSmoothly(value: number): void;


    public abstract focusMesh(mesh: THREE.Mesh, cameraRotation: number): void;


    public startAnimation(targetPosition: THREE.Vector3, targetQuaternion: THREE.Quaternion,
                          targetZoom: number, linear: boolean = false) {

        if (this.cameraAnimation) return;

        this.cameraAnimation = {
            targetPosition: targetPosition,
            targetQuaternion: targetQuaternion,
            zoom: this.getCamera().zoom,
            progress: 0
        };

        new TWEEN.Tween(this.cameraAnimation)
            .to({ progress: 1, zoom: targetZoom }, ANIMATION_DURATION_IN_MILLISECONDS)
            .easing(linear ? TWEEN.Easing.Linear.None : TWEEN.Easing.Circular.In)
            .start();
    }


    public isAnimationRunning(): boolean {

        return this.cameraAnimation != undefined;
    }


    public animate() {

        if (!this.cameraAnimation) return;

        TWEEN.update();

        this.getCamera().position.lerp(
            this.cameraAnimation.targetPosition,
            this.cameraAnimation.progress
        );

        this.getCamera().quaternion.slerp(
            this.cameraAnimation.targetQuaternion,
            this.cameraAnimation.progress
        );

        this.getCamera().zoom = this.cameraAnimation.zoom;
        this.getCamera().updateProjectionMatrix();

        if (this.cameraAnimation.progress == 1) this.cameraAnimation = undefined;
    }


    protected static updatePerspectiveCameraAspect(camera: THREE.PerspectiveCamera, canvasWidth: number,
                                                   canvasHeight: number) {

        camera.aspect = canvasWidth / canvasHeight;
        camera.updateProjectionMatrix();
    }


    protected static computeDistanceForZoomToFit(camera: THREE.PerspectiveCamera,
                                                 boundingSphere: THREE.Sphere): number {

        const fovInRadians: number = camera.fov * (Math.PI / 180);
        const size = boundingSphere.radius;

        return Math.abs(size / Math.sin(fovInRadians / 2));
    }
}