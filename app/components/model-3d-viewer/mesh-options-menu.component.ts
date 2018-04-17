import {Component, Input, OnChanges, Renderer2} from '@angular/core';
import * as THREE from 'three';
import {MenuComponent} from '../../widgets/menu.component';


@Component({
    moduleId: module.id,
    selector: 'mesh-options-menu',
    templateUrl: './mesh-options-menu.html'
})
/**
 * @author Thomas Kleinke
 */
export class MeshOptionsMenuComponent extends MenuComponent implements OnChanges {

    @Input() mesh: THREE.Mesh;

    public textured: boolean = true;
    public smoothShading: boolean = true;

    private meshMaterial: THREE.Material|Array<THREE.Material>;


    constructor(renderer: Renderer2) {

        super(renderer, 'mesh-options-menu-button', 'mesh-options-menu');
    }


    ngOnChanges() {

        if (this.mesh) this.meshMaterial = this.mesh.material;
    }


    public toggleTexture() {

        this.textured = !this.textured;

        if (this.textured) {
            this.setDefaultMaterial();
        } else {
            this.setWhiteMaterial();
        }
    }


    public toggleSmoothShading() {

        this.smoothShading = !this.smoothShading;

        MeshOptionsMenuComponent.setFlatShading(this.mesh.material, !this.smoothShading);
        MeshOptionsMenuComponent.setFlatShading((this.mesh.children[0] as THREE.Mesh).material,
            !this.smoothShading);

        if (this.meshMaterial) {
            MeshOptionsMenuComponent.setFlatShading(this.meshMaterial, !this.smoothShading);
        }
    }


    private setWhiteMaterial() {

        this.mesh.material = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            flatShading: !this.smoothShading
        });
    }


    private setDefaultMaterial() {

        this.mesh.material = this.meshMaterial;
    }


    private static setFlatShading(material: THREE.Material|Array<THREE.Material>, flatShading: boolean) {

        if (Array.isArray(material)) {
            material.forEach(mat => {
                MeshOptionsMenuComponent.setFlatShadingForMaterial(mat, flatShading);
            });
        } else {
            MeshOptionsMenuComponent.setFlatShadingForMaterial(material, flatShading);
        }
    }


    private static setFlatShadingForMaterial(material: THREE.Material, flatShading: boolean) {

        material.flatShading = flatShading;
        material.needsUpdate = true;
    }
}