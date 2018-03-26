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

        if (this.textured) {
            this.setWhiteMaterial();
        } else {
            this.mesh.material = this.meshMaterial;
        }

        this.textured = !this.textured;
    }


    public toggleSmoothShading() {

        this.smoothShading = !this.smoothShading;

        if (Array.isArray(this.mesh.material)) {
            this.mesh.material.forEach(material => {
                MeshOptionsMenuComponent.setFlatShading(material, !this.smoothShading);
            });
        } else {
            MeshOptionsMenuComponent.setFlatShading(this.mesh.material, !this.smoothShading);
        }
    }


    private setWhiteMaterial() {

        this.mesh.material = new THREE.MeshPhongMaterial({ color: 0xffffff });
    }


    private static setFlatShading(material: THREE.Material, flatShading: boolean) {

        material.flatShading = flatShading;
        material.needsUpdate = true;
    }

}