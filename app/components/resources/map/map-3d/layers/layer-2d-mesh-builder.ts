import {Injectable} from '@angular/core';
import * as THREE from 'three';
import {SettingsService} from '../../../../../core/settings/settings-service';
import {AppState} from '../../../../../core/settings/app-state';
import {IdaiFieldImageDocumentReadDatastore} from '../../../../../core/datastore/idai-field-image-document-read-datastore';
import {IdaiFieldImageDocument} from '../../../../../core/model/idai-field-image-document';
import {IdaiFieldGeoreference} from '../../../../../core/model/idai-field-georeference';
import {getPointVector} from '../../../../../util/util-3d';


@Injectable()
/**
 * @author Thomas Kleinke
 */
export class Layer2DMeshBuilder {

    constructor(private settingsService: SettingsService,
                private appState: AppState,
                private datastore: IdaiFieldImageDocumentReadDatastore) {}


    public async build(imageResourceId: string): Promise<THREE.Mesh> {

        const geometry: THREE.Geometry = await this.createGeometry(imageResourceId);
        const material: THREE.Material = this.createMaterial(imageResourceId);

        return new THREE.Mesh(geometry, material);
    }


    private async createGeometry(imageResourceId: string): Promise<THREE.Geometry> {

        const geometry: THREE.Geometry = new THREE.Geometry();

        geometry.vertices = await this.createVertices(imageResourceId);
        geometry.faces = Layer2DMeshBuilder.createFaces();
        geometry.faceVertexUvs[0] = Layer2DMeshBuilder.createFaceVertexUvs();

        geometry.computeFaceNormals();
        geometry.computeVertexNormals();

        return geometry;
    }


    private async createVertices(imageResourceId: string): Promise<Array<THREE.Vector3>> {

        const georeference: IdaiFieldGeoreference = await this.getGeoreference(imageResourceId);
        const vertices: Array<THREE.Vector3> = [];

        vertices.push(Layer2DMeshBuilder.getVertex(georeference.bottomLeftCoordinates));
        vertices.push(Layer2DMeshBuilder.getVertex(georeference.topLeftCoordinates));
        vertices.push(Layer2DMeshBuilder.getVertex(georeference.topRightCoordinates));
        vertices.push(Layer2DMeshBuilder.getBottomRightVertex(georeference));

        return vertices;
    }


    private createMaterial(imageResourceId: string): THREE.Material {

        return new THREE.MeshPhongMaterial({
            color: 0xffffff,
            map: new THREE.TextureLoader().load(this.getFilePath(imageResourceId)),
        });
    }


    private async getGeoreference(imageResourceId: string): Promise<IdaiFieldGeoreference> {

        const imageDocument: IdaiFieldImageDocument = await this.datastore.get(imageResourceId);
        return imageDocument.resource.georeference as IdaiFieldGeoreference;
    }


    private getFilePath(imageResourceId: string): string {

        return this.appState.getImagestorePath()
            + this.settingsService.getSelectedProject()
            + '/' + imageResourceId;
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


    private static getVertex(coordinates: number[]): THREE.Vector3 {

        return getPointVector([
            coordinates[1],
            coordinates[0],
            0
        ]);
    }


    private static getBottomRightVertex(georeference: IdaiFieldGeoreference): THREE.Vector3 {

        return getPointVector([
            georeference.topRightCoordinates[1],
            georeference.bottomLeftCoordinates[0],
            0
        ]);
    }
}