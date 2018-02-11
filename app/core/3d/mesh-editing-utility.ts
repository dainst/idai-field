import * as THREE from 'three';

/**
 * @author Thomas Kleinke
 */
export class MeshEditingUtility {

    public static performDefaultAdjustments(mesh: THREE.Mesh, scene: THREE.Scene) {

        MeshEditingUtility.smoothGeometry(mesh);
        MeshEditingUtility.applySceneMatrix(mesh, scene);
        MeshEditingUtility.setPositionToCenterOfGeometry(mesh);
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


    private static smoothGeometry(mesh: THREE.Mesh) {

        const geometry: THREE.Geometry = mesh.geometry instanceof THREE.BufferGeometry ?
            this.makeGeometryFromBufferGeometry(mesh.geometry) :
            mesh.geometry;

        geometry.computeFaceNormals();
        geometry.mergeVertices();
        geometry.computeVertexNormals();

        mesh.geometry = new THREE.BufferGeometry().fromGeometry(geometry);
    }


    private static applySceneMatrix(mesh: THREE.Mesh, scene: THREE.Scene) {

        scene.updateMatrix();
        mesh.geometry.applyMatrix(scene.matrix);
    }


    private static setPositionToCenterOfGeometry(mesh: THREE.Mesh) {

        mesh.geometry.computeBoundingSphere();

        const center: THREE.Vector3 = mesh.geometry.boundingSphere.center;

        mesh.position.set(center.x, center.y, center.z);
        mesh.geometry.translate(-center.x, -center.y, -center.z);
    }


    private static makeGeometryFromBufferGeometry(bufferGeometry: THREE.BufferGeometry): THREE.Geometry {

        const geometry = new THREE.Geometry();
        geometry.vertices = this.getVertices(bufferGeometry);
        geometry.faces = this.getFaces(geometry.vertices);
        geometry.faceVertexUvs = this.getUV(bufferGeometry);
        geometry.uvsNeedUpdate = true;

        return geometry;
    }


    private static getVertices(bufferGeometry: THREE.BufferGeometry): Array<THREE.Vector3> {

        const attribute = bufferGeometry.getAttribute('position');
        const vertices = attribute.array;

        const result: Array<THREE.Vector3> = [];

        for (let i = 0; i < vertices.length; i += 3) {
            result.push(new THREE.Vector3(vertices[i], vertices[i + 1], vertices[i + 2]));
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
}