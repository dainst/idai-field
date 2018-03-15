import * as THREE from 'three';
import {IdaiFieldDocument, IdaiFieldGeometry} from 'idai-components-2/idai-field-model';
import {ProjectConfiguration} from 'idai-components-2/configuration';
import {Viewer3D} from '../../../../../core/3d/viewer-3d';
import {MeshGeometry} from './mesh-geometry';
import {DepthMap} from '../../../../../core/3d/depth-map';
import {getPointVector} from '../../../../../util/util-3d';

const {MeshLine, MeshLineMaterial} = require('three.meshline');


/**
 * @author Thomas Kleinke
 */

export class LineBuilder {

    constructor(private viewer: Viewer3D,
                private projectConfiguration: ProjectConfiguration) {}


    public buildLine(document: IdaiFieldDocument): MeshGeometry {

        const position: THREE.Vector3 = LineBuilder.getPosition(document);

        const geometry: THREE.Geometry
            = this.createGeometry((document.resource.geometry as IdaiFieldGeometry).coordinates, position);

        return {
            mesh: this.createMesh(document, geometry, position),
            raycasterObject: LineBuilder.createRaycasterObject(geometry, position),
            document: document
        };
    }


    private createGeometry(coordinates: number[][], position: THREE.Vector3): THREE.Geometry {

        const geometry: THREE.Geometry = new THREE.Geometry();

        coordinates.forEach(point => {
            geometry.vertices.push(getPointVector(point).sub(position));
        });

        geometry.computeLineDistances();

        return geometry;
    }


    private createMesh(document: IdaiFieldDocument, geometry: THREE.Geometry,
                       position: THREE.Vector3): THREE.Mesh {

        const line = new MeshLine();
        line.setGeometry(geometry);

        const material: THREE.Material = this.createMaterial(document);

        const mesh: THREE.Mesh = new THREE.Mesh(line.geometry, material);
        mesh.position.set(position.x, position.y, position.z);
        mesh.layers.set(DepthMap.NO_DEPTH_MAPPING_LAYER);

        return mesh;
    }


    private createMaterial(document: IdaiFieldDocument): THREE.Material {

        return new MeshLineMaterial({
            resolution: new THREE.Vector2(this.viewer.getRenderer().getSize().width,
                this.viewer.getRenderer().getSize().height),
            near: this.viewer.getCamera().near,
            far: this.viewer.getCamera().far,
            sizeAttenuation: false,
            lineWidth: 3,
            color: new THREE.Color(this.projectConfiguration.getColorForType(document.resource.type))
        });
    }


    private static createRaycasterObject(geometry: THREE.Geometry, position: THREE.Vector3): THREE.Object3D {

        const rayCasterMaterial: THREE.LineDashedMaterial = new THREE.LineDashedMaterial({
            dashSize: 0,
            gapSize: 10
        });

        const raycasterObject: THREE.Object3D = new THREE.Line(geometry, rayCasterMaterial);
        raycasterObject.position.set(position.x, position.y, position.z);

        return raycasterObject;
    }


    private static getPosition(document: IdaiFieldDocument): THREE.Vector3 {

        const firstPoint: number[] = (document.resource.geometry as IdaiFieldGeometry).coordinates[0];

        return getPointVector(firstPoint);
    }
}