import * as THREE from 'three';
import earcut from 'earcut';
import {IdaiFieldDocument, IdaiFieldGeometry} from 'idai-components-2/idai-field-model';
import {ProjectConfiguration} from 'idai-components-2/configuration';
import {MeshGeometry} from './mesh-geometry';
import {DepthMap} from '../../../../../core/3d/depth-map';
import {MeshPreparationUtility} from '../../../../../core/3d/mesh-preparation-utility';
import {getPointVector} from '../../../../../util/util-3d';


/**
 * @author Thomas Kleinke
 */
export class PolygonBuilder {

    constructor(private projectConfiguration: ProjectConfiguration) {}


    public buildPolygon(document: IdaiFieldDocument, selected: boolean): MeshGeometry {

        const mesh: THREE.Mesh = this.createMesh(document, selected);

        return {
            mesh: mesh,
            raycasterObject: mesh,
            document: document,
            type: 'polygon'
        };
    }


    private createMesh(document: IdaiFieldDocument, selected: boolean): THREE.Mesh {

        const position: THREE.Vector3 = PolygonBuilder.getPosition(document);
        const geometry: THREE.Geometry = PolygonBuilder.createGeometry(document, position);
        const material: THREE.Material = this.createMaterial(document, selected);

        const mesh: THREE.Mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(position.x, position.y, position.z);

        MeshPreparationUtility.centerGeometry(mesh);

        mesh.layers.set(DepthMap.NO_DEPTH_MAPPING_LAYER);
        mesh.add(this.createOutline(document, geometry));

        return mesh;
    }


    private createMaterial(document: IdaiFieldDocument, selected: boolean): THREE.Material {

        return new THREE.MeshPhongMaterial({
            color: this.projectConfiguration.getColorForType(document.resource.type),
            side: THREE.DoubleSide,
            transparent: true,
            opacity: selected ? 0.8 : 0.4
        });
    }


    private createOutline(document: IdaiFieldDocument, geometry: THREE.Geometry): THREE.LineSegments {

        const edgesGeometry: THREE.EdgesGeometry
            = new THREE.EdgesGeometry(new THREE.BufferGeometry().fromGeometry(geometry), 180);

        const edgesMaterial: THREE.LineBasicMaterial = new THREE.LineBasicMaterial({
            color: this.projectConfiguration.getColorForType(document.resource.type)
        });

        const outline: THREE.LineSegments = new THREE.LineSegments(edgesGeometry, edgesMaterial);
        outline.layers.set(DepthMap.NO_DEPTH_MAPPING_LAYER);

        return outline;
    }


    private static createGeometry(document: IdaiFieldDocument, position: THREE.Vector3): THREE.Geometry {

        const geometry: THREE.Geometry = new THREE.Geometry();
        geometry.vertices = PolygonBuilder.getVertices(document, position);
        geometry.faces = PolygonBuilder.getFaces(document);
        geometry.computeVertexNormals();
        geometry.computeFaceNormals();

        return geometry;
    }


    private static getPosition(document: IdaiFieldDocument): THREE.Vector3 {

        const firstPoint: number[] = (document.resource.geometry as IdaiFieldGeometry).coordinates[0][0];

        return getPointVector(firstPoint);
    }


    private static getVertices(document: IdaiFieldDocument, position: THREE.Vector3): Array<THREE.Vector3> {

        return PolygonBuilder
            .getPointVectors((document.resource.geometry as IdaiFieldGeometry).coordinates)
            .map(point => point.sub(position));
    }


    private static getPointVectors(coordinates: number[][][]): Array<THREE.Vector3> {

        const pointVectors: Array<THREE.Vector3> = [];

        coordinates[0].forEach(point => {
            pointVectors.push(getPointVector(point));
        });

        return pointVectors;
    }


    private static getFaces(document: IdaiFieldDocument): Array<THREE.Face3> {

        const {vertices} = earcut.flatten((document.resource.geometry as IdaiFieldGeometry).coordinates);
        const faceIndices: number[] = earcut(vertices, undefined, 3);
        const faces: Array<THREE.Face3> = [];

        for (let i = 0; i < faceIndices.length; i += 3) {
            faces.push(new THREE.Face3(faceIndices[i], faceIndices[i + 1], faceIndices[i + 2]));
        }

        return faces;
    }
}