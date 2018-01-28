import * as THREE from 'three';
import {ModelUtility} from './model-utility';


/**
 * @author Thomas Kleinke
 */
export class ModelImporter {

    public static importColladaModel(colladaModel: THREE.ColladaModel): THREE.Scene {

        const scene: THREE.Scene = colladaModel.scene;
        const mesh: THREE.Mesh = ModelUtility.getMesh(scene);

        mesh.geometry = this.smoothGeometry(mesh.geometry);
        this.setPositionToCenter(mesh);

        scene.children = [mesh];

        return scene;
    }


    private static smoothGeometry(geometry: THREE.Geometry|THREE.BufferGeometry): THREE.BufferGeometry {

        if (geometry instanceof THREE.BufferGeometry) geometry = this.makeGeometry(geometry);

        geometry.computeFaceNormals();
        geometry.mergeVertices();
        geometry.computeVertexNormals();

        return new THREE.BufferGeometry().fromGeometry(geometry);
    }


    private static makeGeometry(bufferGeometry: THREE.BufferGeometry): THREE.Geometry {

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

        for (var i = 0; i < uv.length; i += 6) {
            result[0].push([
                new THREE.Vector2(uv[i], uv[i + 1]),
                new THREE.Vector2(uv[i + 2], uv[i + 3]),
                new THREE.Vector2(uv[i + 4], uv[i + 5])
            ]);
        }

        return result;
    }


    private static setPositionToCenter(mesh: THREE.Mesh) {

        mesh.geometry.computeBoundingSphere();

        const center: THREE.Vector3 = mesh.geometry.boundingSphere.center;

        mesh.position.set(center.x, center.y, center.z);
        mesh.geometry.translate(-center.x, -center.y, -center.z);
    }
}