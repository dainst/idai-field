import {Injectable} from '@angular/core';
import * as THREE from 'three';
import {SettingsService} from '../../../../../../core/settings/settings-service';
import {AppState} from '../../../../../../core/settings/app-state';
import {IdaiFieldImageDocumentReadDatastore} from '../../../../../../core/datastore/idai-field-image-document-read-datastore';
import {IdaiFieldImageDocument} from '../../../../../../core/model/idai-field-image-document';
import {IdaiFieldGeoreference} from '../../../../../../core/model/idai-field-georeference';
import {getPointVector} from '../../../../../../util/util-3d';


@Injectable()
/**
 * @author Thomas Kleinke
 */
export class Layer2DMeshBuilder {

    constructor(private settingsService: SettingsService,
                private appState: AppState,
                private datastore: IdaiFieldImageDocumentReadDatastore) {}


    public async build(imageResourceId: string): Promise<THREE.Mesh> {

        const georeference: IdaiFieldGeoreference = await this.getGeoreference(imageResourceId);
        const position: THREE.Vector3 = Layer2DMeshBuilder.getPosition(georeference);

        const geometry: THREE.Geometry = await Layer2DMeshBuilder.createGeometry(georeference, position);
        const material: THREE.Material = this.createMaterial(imageResourceId);

        return Layer2DMeshBuilder.createMesh(geometry, material, position);
    }


    private async getGeoreference(imageResourceId: string): Promise<IdaiFieldGeoreference> {

        const imageDocument: IdaiFieldImageDocument = await this.datastore.get(imageResourceId);
        return imageDocument.resource.georeference as IdaiFieldGeoreference;
    }


    private createMaterial(imageResourceId: string): THREE.Material {

        return new THREE.MeshPhongMaterial({
            color: 0xffffff,
            map: new THREE.TextureLoader().load(this.getFilePath(imageResourceId)),
        });
    }


    private getFilePath(imageResourceId: string): string {

        return this.appState.getImagestorePath()
            + this.settingsService.getSelectedProject()
            + '/' + imageResourceId;
    }


    private static getPosition(georeference: IdaiFieldGeoreference): THREE.Vector3 {

        return Layer2DMeshBuilder.getVector(georeference.bottomLeftCoordinates);
    }


    private static async createGeometry(georeference: IdaiFieldGeoreference,
                                        offset: THREE.Vector3): Promise<THREE.Geometry> {

        const geometry: THREE.Geometry = new THREE.Geometry();

        geometry.vertices = await this.createVertices(georeference, offset);
        geometry.faces = this.createFaces();
        geometry.faceVertexUvs[0] = this.createFaceVertexUvs();

        geometry.computeFaceNormals();
        geometry.computeVertexNormals();

        return geometry;
    }


    private static createMesh(geometry: THREE.Geometry, material: THREE.Material, position: THREE.Vector3) {

        const mesh: THREE.Mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(position.x, position.y, position.z);

        return mesh;
    }


    private static async createVertices(georeference: IdaiFieldGeoreference,
                                        offset: THREE.Vector3): Promise<Array<THREE.Vector3>> {

        const vertices: Array<THREE.Vector3> = [];

        vertices.push(Layer2DMeshBuilder.getVector(georeference.bottomLeftCoordinates).sub(offset));
        vertices.push(Layer2DMeshBuilder.getVector(georeference.topLeftCoordinates).sub(offset));
        vertices.push(Layer2DMeshBuilder.getVector(georeference.topRightCoordinates).sub(offset));
        vertices.push(Layer2DMeshBuilder.getBottomRightVector(georeference).sub(offset));

        return vertices;
    }


    private static createFaces(): Array<THREE.Face3> {

        const faces: Array<THREE.Face3> = [];

        faces.push(new THREE.Face3(0, 2, 1));
        faces.push(new THREE.Face3(0, 3, 2));

        return faces;
    }


    private static createFaceVertexUvs(): Array<Array<THREE.Vector2>> {

        const faceVertexUvs: Array<Array<THREE.Vector2>> = [];

        faceVertexUvs.push([
            new THREE.Vector2(0, 0),
            new THREE.Vector2(1, 1),
            new THREE.Vector2(0, 1)
        ]);

        faceVertexUvs.push([
            new THREE.Vector2(0, 0),
            new THREE.Vector2(1, 0),
            new THREE.Vector2(1, 1)
        ]);

        return faceVertexUvs;
    }


    private static getVector(coordinates: number[]): THREE.Vector3 {

        return getPointVector([
            coordinates[1],
            coordinates[0],
            0
        ]);
    }


    private static getBottomRightVector(georeference: IdaiFieldGeoreference): THREE.Vector3 {

        return getPointVector([
            georeference.topRightCoordinates[1],
            georeference.bottomLeftCoordinates[0],
            0
        ]);
    }
}