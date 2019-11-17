import * as THREE from 'three';
import earcut from 'earcut';
import {FieldDocument, FieldGeometry} from 'idai-components-2';
import {MeshGeometry} from './mesh-geometry';
import {DepthMap} from '../../../../../core-3d/helpers/depth-map';
import {MeshPreparationUtility} from '../../../../../core-3d/mesh-loading/mesh-preparation-utility';
import {getPointVector} from '../../../../../../util/util-3d';
import {ProjectConfiguration} from '../../../../../../core/configuration/project-configuration';


/**
 * @author Thomas Kleinke
 */
export class PolygonBuilder {

    constructor(private projectConfiguration: ProjectConfiguration) {}


    public buildPolygon(document: FieldDocument, selected: boolean): MeshGeometry {

        const mesh: THREE.Mesh = this.createMesh(document, selected);

        return {
            mesh: mesh,
            raycasterObject: mesh,
            document: document,
            type: 'polygon'
        };
    }


    private createMesh(document: FieldDocument, selected: boolean): THREE.Mesh {

        const position: THREE.Vector3 = PolygonBuilder.getPosition(document);
        const geometry: THREE.BufferGeometry = PolygonBuilder.createGeometry(document, position);
        const material: THREE.Material = this.createMaterial(document, selected);

        const mesh: THREE.Mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(position.x, position.y, position.z);

        MeshPreparationUtility.center(mesh);

        mesh.layers.set(DepthMap.NO_DEPTH_MAPPING_LAYER);
        mesh.add(this.createOutline(document, geometry));

        return mesh;
    }


    private createMaterial(document: FieldDocument, selected: boolean): THREE.Material {

        return new THREE.MeshLambertMaterial({
            color: this.projectConfiguration.getColorForType(document.resource.type),
            side: THREE.DoubleSide,
            flatShading: true,
            transparent: true,
            opacity: selected ? 0.8 : 0.4
        });
    }


    private createOutline(document: FieldDocument, geometry: THREE.BufferGeometry): THREE.LineSegments {

        const edgesGeometry: THREE.EdgesGeometry
            = new THREE.EdgesGeometry(geometry, 180);

        const edgesMaterial: THREE.LineBasicMaterial = new THREE.LineBasicMaterial({
            color: this.projectConfiguration.getColorForType(document.resource.type)
        });

        const outline: THREE.LineSegments = new THREE.LineSegments(edgesGeometry, edgesMaterial);
        outline.layers.set(DepthMap.NO_DEPTH_MAPPING_LAYER);

        return outline;
    }


    private static createGeometry(document: FieldDocument, position: THREE.Vector3)
            : THREE.BufferGeometry {

        const geometry: THREE.Geometry = new THREE.Geometry();
        geometry.vertices = PolygonBuilder.getVertices(document, position);
        geometry.faces = PolygonBuilder.getFaces(document);
        geometry.computeFaceNormals();
        geometry.computeVertexNormals();

        return new THREE.BufferGeometry().fromGeometry(geometry);
    }


    private static getPosition(document: FieldDocument): THREE.Vector3 {

        const firstPoint: number[] = (document.resource.geometry as FieldGeometry).coordinates[0][0];

        return getPointVector(firstPoint);
    }


    private static getVertices(document: FieldDocument, position: THREE.Vector3): Array<THREE.Vector3> {

        return PolygonBuilder
            .getPointVectors((document.resource.geometry as FieldGeometry).coordinates)
            .map(point => point.sub(position));
    }


    private static getPointVectors(coordinates: number[][][]): Array<THREE.Vector3> {

        const pointVectors: Array<THREE.Vector3> = [];

        coordinates[0].forEach(point => {
            pointVectors.push(getPointVector(point));
        });

        return pointVectors;
    }


    private static getFaces(document: FieldDocument): Array<THREE.Face3> {

        const {vertices} = earcut.flatten((document.resource.geometry as FieldGeometry).coordinates);
        const faceIndices: number[] = earcut(vertices, undefined, 3);
        const faces: Array<THREE.Face3> = [];

        for (let i = 0; i < faceIndices.length; i += 3) {
            faces.push(new THREE.Face3(faceIndices[i], faceIndices[i + 1], faceIndices[i + 2]));
        }

        return faces;
    }
}