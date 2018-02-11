import * as THREE from 'three';


/**
 * @author Thomas Kleinke
 */
export class Viewer3D {

    private renderer: THREE.WebGLRenderer;
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;


    constructor(private containerElement: HTMLElement) {

        this.initialize();
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


    public add(scene: THREE.Scene|THREE.Mesh) {

        this.scene.add(scene);
    }


    public remove(scene: THREE.Scene|THREE.Mesh) {

        this.scene.remove(scene);
    }


    public removeAll() {

        this.scene.children.filter(child => child instanceof THREE.Scene || child instanceof THREE.Mesh)
            .forEach(child => this.scene.remove(child));
    }


    public getScreenCoordinates(position: THREE.Vector3): THREE.Vector2|undefined {

        const canvas: HTMLCanvasElement = this.renderer.domElement;
        const projectedPosition: THREE.Vector3 = position.clone().project(this.camera);

        const screenCoordinates: THREE.Vector2 = new THREE.Vector2();
        screenCoordinates.x
            = Math.round((projectedPosition.x + 1) * canvas.width  / 2) + canvas.getBoundingClientRect().left;
        screenCoordinates.y
            = Math.round((-projectedPosition.y + 1) * canvas.height / 2) + canvas.getBoundingClientRect().top;

        return this.isInCanvas(screenCoordinates) ? screenCoordinates : undefined;
    }


    private initialize() {

        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.containerElement.appendChild(this.renderer.domElement);

        this.addLight();

        this.camera = this.createCamera();
    }


    private addLight() {

        this.scene.add(new THREE.HemisphereLight(0xf9edd9, 0x000000, 1));
    }


    private createCamera(): THREE.PerspectiveCamera {

        const camera = new THREE.PerspectiveCamera(75,
            this.containerElement.clientWidth / this.containerElement.clientHeight, 0.1, 1000);

        camera.position.set(0, 3, 0);
        camera.lookAt(new THREE.Vector3(0, 0, 0));

        return camera;
    }


    private animate() {

        if (!this.renderer) return;

        this.resize();

        requestAnimationFrame(this.animate.bind(this));

        this.renderer.render(this.scene, this.camera);
    }


    private resize() {

        const rendererElement: HTMLElement = this.renderer.domElement;

        const width: number = this.containerElement.clientWidth;
        const height: number = this.containerElement.clientHeight;

        if (rendererElement.clientWidth !== width || rendererElement.clientHeight !== height) {
            this.renderer.setSize(width, height, false);
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
        }
    }


    private isInCanvas(screenCoordinates: THREE.Vector2): boolean {

        const canvas: HTMLCanvasElement = this.renderer.domElement;

        return screenCoordinates.x > canvas.getBoundingClientRect().left
            && screenCoordinates.x < canvas.getBoundingClientRect().right
            && screenCoordinates.y > canvas.getBoundingClientRect().top
            && screenCoordinates.y < canvas.getBoundingClientRect().bottom;
    }
}