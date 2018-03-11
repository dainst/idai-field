import * as THREE from 'three';
import {IdaiFieldDocument, IdaiFieldGeometry} from 'idai-components-2/idai-field-model';
import {ProjectConfiguration} from 'idai-components-2/configuration';
import {MeshGeometry} from './mesh-geometry';
import {DepthMap} from '../../../../../core/3d/depth-map';
import {getPointVector, subtractOffset} from '../../../../../util/util-3d';


/**
 * @author Thomas Kleinke
 */
export class PolygonBuilder {

    constructor(private projectConfiguration: ProjectConfiguration) {}


    public buildPolygon(document: IdaiFieldDocument): MeshGeometry {

        const mesh: THREE.Mesh = this.createMesh(document);

        return {
            mesh: mesh,
            raycasterObject: mesh,
            document: document
        };
    }


    private createMesh(document: IdaiFieldDocument): THREE.Mesh {

        const position: THREE.Vector3 = PolygonBuilder.getPosition(document);
        const geometry: THREE.Geometry = this.createGeometry(document, position);

        const material: THREE.Material = new THREE.MeshPhongMaterial({
            color: this.projectConfiguration.getColorForType(document.resource.type),
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.4
        });

        const mesh: THREE.Mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(position.x, position.y, position.z);
        mesh.layers.set(DepthMap.NO_DEPTH_MAPPING_LAYER);
        mesh.add(this.createOutline(document, geometry));

        return mesh;
    }


    private createGeometry(document: IdaiFieldDocument, position: THREE.Vector3): THREE.Geometry {

        const points: Array<THREE.Vector3> = PolygonBuilder.getPoints(document, position);
        const geometry: THREE.Geometry = new THREE.ShapeGeometry(PolygonBuilder.createShape(points));

        geometry.vertices.forEach(vertex => {
            vertex.z = vertex.y;
            vertex.y = PolygonBuilder.findNearestPoint(new THREE.Vector2(vertex.x, vertex.z), points).y;
        });

        return geometry;
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


    private static createShape(points: Array<THREE.Vector3>): THREE.Shape {

        const shape: THREE.Shape = new THREE.Shape();

        shape.moveTo(points[0].x, points[0].z);

        for (let i = 1; i < points.length; i++) {
            shape.lineTo(points[i].x, points[i].z);
        }

        return shape;
    }


    private static getPosition(document: IdaiFieldDocument): THREE.Vector3 {

        const firstPoint: number[] = (document.resource.geometry as IdaiFieldGeometry).coordinates[0][0];

        return getPointVector(firstPoint);
    }


    private static getPoints(document: IdaiFieldDocument, position: THREE.Vector3): Array<THREE.Vector3> {

        return PolygonBuilder
            .getPointVectors((document.resource.geometry as IdaiFieldGeometry).coordinates)
            .map(point => subtractOffset(point, position));
    }


    private static getPointVectors(coordinates: number[][][]): Array<THREE.Vector3> {

        const pointVectors: Array<THREE.Vector3> = [];

        coordinates[0].forEach(point => {
            pointVectors.push(getPointVector(point));
        });

        return pointVectors;
    }


    private static findNearestPoint(point: THREE.Vector2, points: Array<THREE.Vector3>): THREE.Vector3 {

        let nearestPoint: THREE.Vector3 = points[0];
        let smallestDistance: number;

        points.forEach(p => {
            const point2D: THREE.Vector2 = new THREE.Vector2(p.x, p.z);
            const distance: number = point2D.distanceTo(point);
            if (!smallestDistance || smallestDistance > distance) {
                smallestDistance = distance;
                nearestPoint = p;
            }
        });

        return nearestPoint;
    }
}