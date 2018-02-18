import * as THREE from 'three';
import {IdaiFieldDocument, IdaiFieldGeometry} from 'idai-components-2/idai-field-model';
import {ProjectConfiguration} from 'idai-components-2/configuration';
import {Viewer3D} from '../../../../core/3d/viewer-3d';
import {Map3DMeshGeometry} from './map-3d-mesh-geometry';
import {getPointVector} from '../../../../util/util-3d';

const {MeshLine, MeshLineMaterial} = require('three.meshline');


/**
 * @author Thomas Kleinke
 */

export class Map3DLineBuilder {

    constructor(private viewer: Viewer3D,
                private projectConfiguration: ProjectConfiguration) {}


    public buildLine(document: IdaiFieldDocument): Map3DMeshGeometry {

        const geometry: THREE.Geometry = this.createGeometry(document);

        return {
            mesh: this.createMesh(document, geometry),
            raycasterObject: this.createRaycasterObject(geometry),
            document: document
        };
    }


    private createGeometry(document: IdaiFieldDocument): THREE.Geometry {

        const geometry: THREE.Geometry = new THREE.Geometry();
        (document.resource.geometry as IdaiFieldGeometry).coordinates.forEach(point => {
            geometry.vertices.push(getPointVector(point));
        });

        geometry.computeLineDistances();

        return geometry;
    }


    private createMesh(document: IdaiFieldDocument, geometry: THREE.Geometry): THREE.Mesh {

        const line = new MeshLine();
        line.setGeometry(geometry);

        const material: THREE.Material = this.createMaterial(document);

        return new THREE.Mesh(line.geometry, material);
    }


    private createMaterial(document: IdaiFieldDocument): THREE.Material {

        return new MeshLineMaterial({
            resolution: new THREE.Vector2(this.viewer.getRenderer().getSize().width,
                this.viewer.getRenderer().getSize().height),
            near: this.viewer.getCamera().near,
            far: this.viewer.getCamera().far,
            sizeAttenuation: false,
            lineWidth: 10,
            color: new THREE.Color(this.projectConfiguration.getColorForType(document.resource.type))
        });
    }


    private createRaycasterObject(geometry: THREE.Geometry): THREE.Object3D {

        const rayCasterMaterial: THREE.LineDashedMaterial = new THREE.LineDashedMaterial({
            dashSize: 0,
            gapSize: 10
        });

        return new THREE.Line(geometry, rayCasterMaterial);
    }
}