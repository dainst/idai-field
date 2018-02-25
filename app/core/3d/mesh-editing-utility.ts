import * as THREE from 'three';
import {MeshLoadingProgress} from '../../components/core-3d/mesh-loading-progress';
import {addOffset} from '../../util/util-3d';


/**
 * @author Thomas Kleinke
 */
export class MeshEditingUtility {

    constructor(private meshLoadingProgress: MeshLoadingProgress) {}


    public performDefaultAdjustments(mesh: THREE.Mesh, scene: THREE.Scene): Promise<any> {

        return new Promise<any>(async resolve => {

            const position: THREE.Vector3 = MeshEditingUtility.getPosition(mesh);

            await this.performAdjustment(1,
                MeshEditingUtility.smoothGeometry.bind(MeshEditingUtility), mesh, position);
            await this.performAdjustment(2,
                MeshEditingUtility.applySceneMatrix.bind(MeshEditingUtility), mesh, position, scene);
            await this.performAdjustment(3,
                MeshEditingUtility.setPositionToCenterOfGeometry.bind(MeshEditingUtility), mesh);

            MeshEditingUtility.applyOffset(mesh, position);

            resolve();
        });
    }


    private async performAdjustment(stepNumber: number, adjustmentFunction: Function, mesh: THREE.Mesh,
                              position?: THREE.Vector3, scene?: THREE.Scene): Promise<void> {

        return new Promise<any>(resolve => {

            setTimeout(() => {
                adjustmentFunction(mesh, position, scene);
                this.meshLoadingProgress.setAdjustingProgress(mesh.name, stepNumber, 3);
                resolve();
            });
        });
    }


    public static createBackSide(mesh: THREE.Mesh) {

        const backSideMesh = new THREE.Mesh();
        backSideMesh.geometry = mesh.geometry.clone();
        backSideMesh.material = new THREE.MeshPhongMaterial({
            color: new THREE.Color(0xffffff),
            side: THREE.BackSide
        });

        mesh.add(backSideMesh);
    }


    public static setWhiteMaterial(mesh: THREE.Mesh) {

        mesh.material = new THREE.MeshPhongMaterial({ color: 0xffffff });
    }


    private static smoothGeometry(mesh: THREE.Mesh, position: THREE.Vector3) {

        const geometry: THREE.Geometry = mesh.geometry instanceof THREE.BufferGeometry ?
            this.makeGeometryFromBufferGeometry(mesh.geometry, position) :
            mesh.geometry;

        geometry.computeFaceNormals();
        geometry.mergeVertices();
        geometry.computeVertexNormals();

        mesh.geometry = new THREE.BufferGeometry().fromGeometry(geometry);
    }


    private static applySceneMatrix(mesh: THREE.Mesh, position: THREE.Vector3, scene: THREE.Scene) {

        scene.updateMatrix();

        mesh.geometry.applyMatrix(scene.matrix);
        position.applyMatrix4(scene.matrix);
    }


    private static applyOffset(mesh: THREE.Mesh, offset: THREE.Vector3) {

        const position: THREE.Vector3 = addOffset(mesh.position, offset);
        mesh.position.set(position.x, position.y, position.z);
    }


    private static setPositionToCenterOfGeometry(mesh: THREE.Mesh) {

        mesh.geometry.computeBoundingSphere();

        const center: THREE.Vector3 = mesh.geometry.boundingSphere.center;

        mesh.position.set(center.x, center.y, center.z);
        mesh.geometry.translate(-center.x, -center.y, -center.z);
    }


    private static makeGeometryFromBufferGeometry(bufferGeometry: THREE.BufferGeometry,
                                                  offset: THREE.Vector3): THREE.Geometry {

        const geometry = new THREE.Geometry();
        geometry.vertices = this.getVertices(bufferGeometry, offset);
        geometry.faces = this.getFaces(geometry.vertices);
        geometry.faceVertexUvs = this.getUV(bufferGeometry);
        geometry.uvsNeedUpdate = true;

        return geometry;
    }


    private static getVertices(bufferGeometry: THREE.BufferGeometry,
                               offset: THREE.Vector3): Array<THREE.Vector3> {

        const attribute = bufferGeometry.getAttribute('position');
        const vertices = attribute.array;

        const result: Array<THREE.Vector3> = [];

        for (let i = 0; i < vertices.length; i += 3) {
            const x: number = vertices[i] - offset.x;
            const y: number = vertices[i + 1] - offset.y;
            const z: number = vertices[i + 2] - offset.z;

            result.push(new THREE.Vector3(x, y, z));
        }

        return result;
    }


    private static getFaces(vertices: Array<THREE.Vector3>): Array<THREE.Face3> {

        const faces: Array<THREE.Face3> = [];

        for (let i = 0; i < vertices.length; i += 3) {
            faces.push(new THREE.Face3(i, i + 1, i + 2));
        }

        return faces;
    }


    private static getUV(bufferGeometry: THREE.BufferGeometry): Array<Array<Array<THREE.Vector2>>> {

        const attribute = bufferGeometry.getAttribute('uv');
        const uv = attribute.array;

        const result: Array<Array<Array<THREE.Vector2>>> = [[]];

        for (let i = 0; i < uv.length; i += 6) {
            result[0].push([
                new THREE.Vector2(uv[i], uv[i + 1]),
                new THREE.Vector2(uv[i + 2], uv[i + 3]),
                new THREE.Vector2(uv[i + 4], uv[i + 5])
            ]);
        }

        return result;
    }


    private static getPosition(mesh: THREE.Mesh): THREE.Vector3 {

        const vertices: any = (mesh.geometry as THREE.BufferGeometry).getAttribute('position').array;

        return new THREE.Vector3(vertices[0], vertices[1], vertices[2]);
    }
}