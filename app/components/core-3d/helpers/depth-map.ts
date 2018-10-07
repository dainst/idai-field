import * as THREE from 'three';
import {Observable, Observer} from 'rxjs';

const getDepthInWorldSpace = require('read-depth');


/**
 * @author Thomas Kleinke
 */
export class DepthMap {

    public static readonly NO_DEPTH_MAPPING_LAYER: number = 1;

    private material: THREE.MeshDepthMaterial;
    private renderTarget: THREE.WebGLRenderTarget;

    private observers: Array<Observer<void>> = [];


    constructor(private renderer: THREE.WebGLRenderer,
                private scene: THREE.Scene,
                private camera: THREE.PerspectiveCamera|THREE.OrthographicCamera) {

        this.material = DepthMap.createMaterial();
        this.renderTarget = this.createRenderTarget();
    }


    public update() {

        const defaultRenderTarget: THREE.RenderTarget = this.renderer.getRenderTarget();

        this.startRenderingToDepthMap();
        this.renderer.render(this.scene, this.camera, this.renderTarget);
        this.stopRenderingToDepthMap(defaultRenderTarget);

        this.notifyObservers();
    }


    public setSize(width: number, height: number) {

        this.renderTarget.setSize(width, height);
    }


    public getDepth(position: THREE.Vector2): number {

        const buffer: Uint8Array = new Uint8Array(4);

        this.renderer.readRenderTargetPixels(this.renderTarget, position.x,
            this.renderTarget.height - position.y, 1, 1, buffer);

        return getDepthInWorldSpace(buffer, this.camera.near, this.camera.far);
    }


    public updateNotification(): Observable<void> {

        return new Observable<void>((observer: Observer<any>) => {
            this.observers.push(observer);
        });
    }


    private notifyObservers() {

        this.observers.forEach(observer => observer.next(undefined));
    }


    private startRenderingToDepthMap() {

        this.renderer.setRenderTarget(this.renderTarget);
        this.scene.overrideMaterial = this.material;
        this.camera.layers.disable(DepthMap.NO_DEPTH_MAPPING_LAYER);
    }


    private stopRenderingToDepthMap(defaultRenderTarget: THREE.RenderTarget) {

        this.renderer.setRenderTarget(defaultRenderTarget);
        this.scene.overrideMaterial = null as any;
        this.camera.layers.enable(DepthMap.NO_DEPTH_MAPPING_LAYER);
    }


    private createRenderTarget(): THREE.WebGLRenderTarget {

        return new THREE.WebGLRenderTarget(
            this.renderer.domElement.width,
            this.renderer.domElement.height
        );
    }


    private static createMaterial(): THREE.MeshDepthMaterial {

        return new THREE.MeshDepthMaterial({
            depthPacking: THREE.RGBADepthPacking,
            side: THREE.DoubleSide
        } as THREE.MeshDepthMaterialParameters);
    }
}