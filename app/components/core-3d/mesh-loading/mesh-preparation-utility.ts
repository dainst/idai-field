import {Injectable} from '@angular/core';
import * as THREE from 'three';
import {MeshLoadingProgress} from './mesh-loading-progress';


@Injectable()
/**
 * @author Thomas Kleinke
 */
export class MeshPreparationUtility {

    constructor(private meshLoadingProgress: MeshLoadingProgress) {}


    public performDefaultAdjustments(mesh: THREE.Mesh, group: THREE.Group): Promise<any> {

        return new Promise<any>(async resolve => {

            const position: THREE.Vector3 = MeshPreparationUtility.getPosition(mesh);

            const geometry: THREE.Geometry = await this.performAdjustment(1,
                MeshPreparationUtility.makeGeometryFromBufferGeometry.bind(MeshPreparationUtility),
                mesh, position);

            await this.performAdjustment(2,
                MeshPreparationUtility.setGeometry.bind(MeshPreparationUtility), mesh, geometry);

            await this.performAdjustment(3,
                MeshPreparationUtility.applyGroupMatrix.bind(MeshPreparationUtility), mesh, position, group);

            await this.performAdjustment(4,
                MeshPreparationUtility.centerGeometry.bind(MeshPreparationUtility), mesh);

            await this.performAdjustment(5,
                MeshPreparationUtility.createBackSideMesh.bind(MeshPreparationUtility), mesh);

            mesh.position.add(position);

            resolve();
        });
    }


    public static centerGeometry(mesh: THREE.Mesh) {

        mesh.geometry.computeBoundingSphere();
        mesh.geometry.computeBoundingBox();

        const center: THREE.Vector3 = mesh.geometry.boundingSphere.center.clone();
        mesh.position.add(center);

        mesh.geometry.translate(-center.x, -center.y, -center.z);
    }


    private async performAdjustment(stepNumber: number, adjustmentFunction: Function, mesh: THREE.Mesh,
                                    parameter1?: any, parameter2?: any): Promise<any> {

        return new Promise<any>(resolve => {

            setTimeout(() => {
                const result: any = adjustmentFunction(mesh, parameter1, parameter2);
                this.meshLoadingProgress.setPreparationProgress(mesh.name, stepNumber, 5);
                resolve(result);
            });
        });
    }


    private static makeGeometryFromBufferGeometry(mesh: THREE.Mesh, offset: THREE.Vector3): THREE.Geometry {

        const bufferGeometry: THREE.BufferGeometry = mesh.geometry as THREE.BufferGeometry;

        const geometry = new THREE.Geometry();
        geometry.vertices = this.getVertices(bufferGeometry, offset);
        geometry.faces = this.getFaces(bufferGeometry, geometry.vertices);
        geometry.faceVertexUvs = this.getUVs(bufferGeometry);
        geometry.uvsNeedUpdate = true;

        return geometry;
    }


    private static setGeometry(mesh: THREE.Mesh, geometry: THREE.Geometry) {

        if (!this.hasVertexNormals(geometry)) this.computeNormals(geometry);

        mesh.geometry = new THREE.BufferGeometry().fromGeometry(geometry);
    }


    private static createBackSideMesh(mesh: THREE.Mesh): THREE.Mesh {

        const backSideMesh = new THREE.Mesh();
        backSideMesh.geometry = mesh.geometry;
        backSideMesh.material = new THREE.MeshPhongMaterial({
            color: new THREE.Color(0x333333),
            side: THREE.BackSide
        });

        mesh.add(backSideMesh);

        return backSideMesh;
    }


    private static applyGroupMatrix(mesh: THREE.Mesh, position: THREE.Vector3, group: THREE.Group) {

        group.updateMatrix();

        mesh.geometry.applyMatrix(group.matrix);
        position.applyMatrix4(group.matrix);
    }


    private static getVertices(bufferGeometry: THREE.BufferGeometry,
                               offset: THREE.Vector3): Array<THREE.Vector3> {

        const positions = bufferGeometry.getAttribute('position').array;
        const result: Array<THREE.Vector3> = [];

        for (let i = 0; i < positions.length; i += 3) {
            const x: number = positions[i] - offset.x;
            const y: number = positions[i + 1] - offset.y;
            const z: number = positions[i + 2] - offset.z;

            result.push(new THREE.Vector3(x, y, z));
        }

        return result;
    }


    private static getFaces(bufferGeometry: THREE.BufferGeometry, vertices: Array<THREE.Vector3>): Array<THREE.Face3> {

        const normalsAttribute = bufferGeometry.getAttribute('normal');
        const normals = normalsAttribute ? normalsAttribute.array : undefined;
        const faces: Array<THREE.Face3> = [];

        for (let i = 0; i < vertices.length; i += 3) {
            const vertexNormals: Array<THREE.Vector3>|undefined = normals ? [
                new THREE.Vector3(normals[i * 3], normals[i * 3 + 1], normals[i * 3 + 2]),
                new THREE.Vector3(normals[i * 3 + 3], normals[i * 3 + 4], normals[i * 3 + 5]),
                new THREE.Vector3(normals[i * 3 + 6], normals[i * 3 + 7], normals[i * 3 + 8])
            ] : undefined;
            const face: THREE.Face3 = new THREE.Face3(i, i + 1, i + 2, vertexNormals);
            face.materialIndex = this.getMaterialIndex(i, bufferGeometry.groups);
            faces.push(face);
        }

        return faces;
    }


    private static getMaterialIndex(firstFaceIndex: number, groups: Array<any>): number {

        const group = groups.find(group => {
            return firstFaceIndex >= group.start && firstFaceIndex < group.start + group.count;
        });

        return group.materialIndex;
    }


    private static getUVs(bufferGeometry: THREE.BufferGeometry): Array<Array<Array<THREE.Vector2>>> {

        const attribute = bufferGeometry.getAttribute('uv');
        const uvs = attribute.array;

        const result: Array<Array<Array<THREE.Vector2>>> = [[]];

        for (let i = 0; i < uvs.length; i += 6) {
            result[0].push([
                new THREE.Vector2(uvs[i], uvs[i + 1]),
                new THREE.Vector2(uvs[i + 2], uvs[i + 3]),
                new THREE.Vector2(uvs[i + 4], uvs[i + 5])
            ]);
        }

        return result;
    }


    private static getPosition(mesh: THREE.Mesh): THREE.Vector3 {

        const vertices: any = (mesh.geometry as THREE.BufferGeometry).getAttribute('position').array;

        return new THREE.Vector3(vertices[0], vertices[1], vertices[2]);
    }


    private static hasVertexNormals(geometry: THREE.Geometry): boolean {

        return geometry.faces &&
            geometry.faces.length > 0 &&
            geometry.faces[0].vertexNormals &&
            geometry.faces[0].vertexNormals.length > 0;
    }


    private static computeNormals(geometry: THREE.Geometry) {

        geometry.mergeVertices();
        geometry.computeFaceNormals();
        geometry.computeVertexNormals();
    }
}