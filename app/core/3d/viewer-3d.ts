import * as THREE from 'three';
import {DepthMap} from './depth-map';

const TWEEN = require('tweenjs');


/**
 * @author Thomas Kleinke
 */
export class Viewer3D {

    private renderer: THREE.WebGLRenderer;
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;

    private depthMap: DepthMap|undefined;

    private resized: boolean = false;
    private notifyForResize: Function;

    private cameraAnimation: {
        targetPosition: THREE.Vector3,
        targetQuaternion: THREE.Quaternion,
        progress: number
    }|undefined;


    constructor(private containerElement: HTMLElement, createDepthMap: boolean = false) {

        this.initialize(createDepthMap);
        this.resize();
        this.animate();
    }


    public destroy() {

        this.renderer.dispose();
        delete this.renderer;
    }


    public getRenderer(): THREE.WebGLRenderer {

        return this.renderer;
    }


    public getScene(): THREE.Scene {

        return this.scene;
    }


    public getCamera(): THREE.PerspectiveCamera {

        return this.camera;
    }


    public getDepthMap(): DepthMap|undefined {

        return this.depthMap;
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


    public getCanvasCoordinates(position: THREE.Vector3): THREE.Vector2 {

        const canvas: HTMLCanvasElement = this.renderer.domElement;
        const projectedPosition: THREE.Vector3 = position.clone().project(this.camera);

        const canvasCoordinates: THREE.Vector2 = new THREE.Vector2();
        canvasCoordinates.x
            = Math.round((projectedPosition.x + 1) * canvas.width / 2);
        canvasCoordinates.y
            = Math.round((-projectedPosition.y + 1) * canvas.height / 2);

        return canvasCoordinates;
    }


    public startCameraAnimation(targetPosition: THREE.Vector3, targetQuaternion: THREE.Quaternion) {

        if (this.cameraAnimation) return;

        this.cameraAnimation = {
            targetPosition: targetPosition,
            targetQuaternion: targetQuaternion,
            progress: 0
        };

        new TWEEN.Tween(this.cameraAnimation)
            .to({ progress: 1 }, 300)
            .easing(TWEEN.Easing.Circular.In)
            .start();
    }


    public isCameraAnimationRunning(): boolean {

        return this.cameraAnimation != undefined;
    }


    public waitForSizeAdjustment(): Promise<void> {

        return new Promise<void>(resolve => {
            if (this.resized) {
                resolve();
            } else {
                this.notifyForResize = resolve;
            }
        });
    }


    private initialize(createDepthMap: boolean) {

        this.renderer = this.createRenderer();
        this.scene = Viewer3D.createScene();
        this.camera = this.createCamera();

        if (createDepthMap) this.depthMap = new DepthMap(this.renderer, this.scene, this.camera);
    }


    private createRenderer(): THREE.WebGLRenderer {

        const renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer({
            antialias: true,
            preserveDrawingBuffer: true
        });
        renderer.setSize(this.containerElement.clientWidth, this.containerElement.clientHeight,
            false);
        this.containerElement.appendChild(renderer.domElement);

        return renderer;
    }


    private createCamera(): THREE.PerspectiveCamera {

        const camera = new THREE.PerspectiveCamera(75,
            this.containerElement.clientWidth / this.containerElement.clientHeight, 0.1, 1000);

        camera.position.set(0, 3, 0);
        camera.lookAt(new THREE.Vector3(0, 0, 0));
        camera.layers.enable(DepthMap.NO_DEPTH_MAPPING_LAYER);

        return camera;
    }


    private animate() {

        if (!this.renderer) return;

        this.resize();
        this.animateCamera();

        requestAnimationFrame(this.animate.bind(this));

        if (this.depthMap && this.depthMap.isReady()) this.depthMap.update();

        this.renderer.render(this.scene, this.camera);
    }


    private animateCamera() {

        if (!this.cameraAnimation) return;

        TWEEN.update();

        this.camera.position.lerp(this.cameraAnimation.targetPosition, this.cameraAnimation.progress);
        this.camera.quaternion.slerp(this.cameraAnimation.targetQuaternion, this.cameraAnimation.progress);

        if (this.cameraAnimation.progress == 1) this.cameraAnimation = undefined;
    }


    private resize() {

        const rendererElement: HTMLElement = this.renderer.domElement;

        const width: number = this.containerElement.clientWidth;
        const height: number = this.containerElement.clientHeight;

        if (rendererElement.clientWidth !== width || rendererElement.clientHeight !== height) {
            this.renderer.setSize(width, height, false);
            if (this.depthMap) this.depthMap.setSize(width, height);

            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();

            this.resized = true;
            if (this.depthMap) this.depthMap.setReady(true);
            if (this.notifyForResize) this.notifyForResize();
        }
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