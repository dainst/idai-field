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

        const georeference: IdaiFieldGeoreference = await this.getGeoreference(imageResourceId);

        const geometry: THREE.Geometry = new THREE.Geometry();

        geometry.vertices.push(Layer2DMeshBuilder.getVertex(georeference.bottomLeftCoordinates));
        geometry.vertices.push(Layer2DMeshBuilder.getVertex(georeference.topLeftCoordinates));
        geometry.vertices.push(Layer2DMeshBuilder.getVertex(georeference.topRightCoordinates));
        geometry.vertices.push(Layer2DMeshBuilder.getBottomRightVertex(georeference));

        geometry.faces.push(new THREE.Face3(0, 2, 1));
        geometry.faces.push(new THREE.Face3(0, 3, 2));

        geometry.computeFaceNormals();
        geometry.computeVertexNormals();

        geometry.faceVertexUvs[0].push([
            new THREE.Vector2(0, 0),
            new THREE.Vector2(1, 1),
            new THREE.Vector2(0, 1)
        ]);

        geometry.faceVertexUvs[0].push([
            new THREE.Vector2(0, 0),
            new THREE.Vector2(1, 0),
            new THREE.Vector2(1, 1)
        ]);

        const material: THREE.MeshPhongMaterial = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            map: new THREE.TextureLoader().load(this.getFilePath(imageResourceId)),
        });

        return new THREE.Mesh(geometry, material);
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