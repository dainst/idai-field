import * as THREE from 'three';

const getDepthInWorldSpace = require('read-depth');


/**
 * @author Thomas Kleinke
 */
export class DepthMap {

    private material: THREE.MeshDepthMaterial;
    private renderTarget: THREE.WebGLRenderTarget;


    constructor(private renderer: THREE.WebGLRenderer,
                private scene: THREE.Scene,
                private camera: THREE.PerspectiveCamera) {

        this.material = DepthMap.createMaterial();
        this.renderTarget = this.createRenderTarget();
    }


    public update() {

        const defaultOverrideMaterial: THREE.Material = this.scene.overrideMaterial;
        const defaultRenderTarget: THREE.RenderTarget = this.renderer.getRenderTarget();

        this.scene.overrideMaterial = this.material;
        this.renderer.setRenderTarget(this.renderTarget);

        if (this.isReady()) this.renderer.render(this.scene, this.camera, this.renderTarget);

        this.scene.overrideMaterial = defaultOverrideMaterial;
        this.renderer.setRenderTarget(defaultRenderTarget);
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


    private isReady(): boolean {

        const webGlContext: WebGLRenderingContext = this.renderer.context;

        return webGlContext.checkFramebufferStatus(webGlContext.FRAMEBUFFER)
            == webGlContext.FRAMEBUFFER_COMPLETE;
    }


    private createRenderTarget(): THREE.WebGLRenderTarget {

        return new THREE.WebGLRenderTarget(
            this.renderer.domElement.width,
            this.renderer.domElement.height
        );
    }


    private static createMaterial(): THREE.MeshDepthMaterial {

        return new THREE.MeshDepthMaterial({
            depthPacking: THREE.RGBADepthPacking
        } as THREE.MeshDepthMaterialParameters);
    }
}