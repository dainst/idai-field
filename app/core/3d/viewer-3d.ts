import * as THREE from 'three';
import {DepthMap} from './depth-map';
import {CameraManager} from './camera-manager';


/**
 * @author Thomas Kleinke
 */
export class Viewer3D {

    private renderer: THREE.WebGLRenderer;
    private scene: THREE.Scene;

    private depthMap: DepthMap|undefined;

    private resized: boolean = false;
    private notifyForResize: Function;


    constructor(private containerElement: HTMLElement,
                private cameraManager: CameraManager,
                createDepthMap: boolean = false) {

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
        const projectedPosition: THREE.Vector3 = position.clone().project(this.cameraManager.getCamera());

        const canvasCoordinates: THREE.Vector2 = new THREE.Vector2();
        canvasCoordinates.x
            = Math.round((projectedPosition.x + 1) * canvas.width / 2);
        canvasCoordinates.y
            = Math.round((-projectedPosition.y + 1) * canvas.height / 2);

        return canvasCoordinates;
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

        this.cameraManager.initialize(this.renderer.domElement.width, this.renderer.domElement.height);

        if (createDepthMap) {
            this.depthMap = new DepthMap(this.renderer, this.scene, this.cameraManager.getCamera());
        }
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


    private animate() {

        if (!this.renderer) return;

        this.resize();
        this.cameraManager.animate();

        requestAnimationFrame(this.animate.bind(this));

        if (this.depthMap && this.depthMap.isReady()) this.depthMap.update();

        this.renderer.render(this.scene, this.cameraManager.getCamera());
    }


    private resize() {

        const rendererElement: HTMLElement = this.renderer.domElement;

        const width: number = this.containerElement.clientWidth;
        const height: number = this.containerElement.clientHeight;

        if (rendererElement.clientWidth !== width || rendererElement.clientHeight !== height) {
            this.renderer.setSize(width, height, false);
            if (this.depthMap) this.depthMap.setSize(width, height);
            this.cameraManager.resize(width, height);

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