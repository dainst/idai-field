import * as THREE from 'three';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {ProjectConfiguration} from 'idai-components-2/configuration';
import {Viewer3D} from '../../../../../core-3d/viewer-3d';
import {MeshGeometry} from './mesh-geometry';
import {LineBuilder} from './line-builder';
import {PolygonBuilder} from './polygon-builder';
import {Map3DCameraManager} from '../../map-3d-camera-manager';
import {has3DLineGeometry, has3DPolygonGeometry} from '../../../../../../util/util-3d';
import {SceneManager} from '../../../../../core-3d/scene-manager';


/**
 * @author Thomas Kleinke
 */
export class MeshGeometryManager {

    private meshGeometries: { [resourceId: string]: MeshGeometry } = {};

    private lineBuilder: LineBuilder;
    private polygonBuilder: PolygonBuilder;


    constructor(private viewer: Viewer3D,
                private cameraManager: Map3DCameraManager,
                private sceneManager: SceneManager,
                projectConfiguration: ProjectConfiguration) {

        this.lineBuilder = new LineBuilder(viewer, cameraManager, projectConfiguration);
        this.polygonBuilder = new PolygonBuilder(projectConfiguration);
    }


    public async update(documents: Array<IdaiFieldDocument>, showLineGeometries: boolean,
                        showPolygonGeometries: boolean) {

        await this.viewer.waitForSizeAdjustment();

        const geometryDocuments: Array<IdaiFieldDocument>
            = MeshGeometryManager.getMeshGeometryDocuments(documents, showLineGeometries,
                showPolygonGeometries);

        this.getGeometriesToAdd(geometryDocuments).forEach(document => this.add(document));
        this.getGeometriesToRemove(geometryDocuments).forEach(document => this.remove(document));
    }


    public async updateSelected(document: IdaiFieldDocument, selected: boolean) {

        // Use timeout to make sure canvas size has been updated
        setTimeout(() => {
            this.remove(document);
            this.add(document, selected);
        }, 20);
    }


    public getMesh(document: IdaiFieldDocument): THREE.Mesh|undefined {

        const geometry: MeshGeometry|undefined = this.meshGeometries[document.resource.id as string];

        return geometry ? geometry.mesh : undefined;
    }


    public getMeshes(): Array<THREE.Mesh> {

        return Object.values(this.meshGeometries).map(geometry => geometry.mesh);
    }


    public getRaycasterObjects(): Array<THREE.Object3D> {

        return Object.values(this.meshGeometries).map(geometry => geometry.raycasterObject);
    }


    public recreateLineGeometries(selectedDocument: IdaiFieldDocument) {

        Object.values(this.meshGeometries)
            .filter(meshGeometry => meshGeometry.type == 'line')
            .forEach(lineGeometry => {
                this.remove(lineGeometry.document);
                this.add(lineGeometry.document, lineGeometry.document == selectedDocument);
            });
    }


    public getDocument(raycasterObject: THREE.Object3D): IdaiFieldDocument|undefined {

        const geometry: MeshGeometry|undefined
            = Object.values(this.meshGeometries).find(line => line.raycasterObject == raycasterObject);

        return geometry ? geometry.document: undefined;
    }


    private add(document: IdaiFieldDocument, selected: boolean = false) {

        const geometry: MeshGeometry|undefined = this.createMeshGeometry(document, selected);

        if (!geometry) return;

        this.meshGeometries[document.resource.id as string] = geometry;

        this.sceneManager.add(geometry.mesh);
        if (geometry.raycasterObject != geometry.mesh) this.sceneManager.add(geometry.raycasterObject);
    }


    private remove(document: IdaiFieldDocument) {

        const geometry: MeshGeometry|undefined = this.meshGeometries[document.resource.id as string];
        if (!geometry) return;

        this.sceneManager.remove(geometry.mesh);
        if (geometry.raycasterObject != geometry.mesh) this.sceneManager.remove(geometry.raycasterObject);

        delete this.meshGeometries[document.resource.id as string];
    }


    private createMeshGeometry(document: IdaiFieldDocument, selected: boolean): MeshGeometry|undefined {

        if (!document.resource.geometry) return undefined;

        switch(document.resource.geometry.type) {
            case 'LineString':
                return this.lineBuilder.buildLine(document, selected);

            case 'Polygon':
                return this.polygonBuilder.buildPolygon(document, selected);
        }
    }


    private getGeometriesToAdd(documents: Array<IdaiFieldDocument>): Array<IdaiFieldDocument> {

        return documents.filter(document => {
            return !Object.keys(this.meshGeometries).includes(document.resource.id as string);
        });
    }


    private getGeometriesToRemove(documents: Array<IdaiFieldDocument>): Array<IdaiFieldDocument> {

        return Object.values(this.meshGeometries).filter(line => {
            return !documents.map(document => document.resource.id)
                .includes(line.document.resource.id as string);
        }).map(line => line.document);
    }


    private static getMeshGeometryDocuments(documents: Array<IdaiFieldDocument>, showLineGeometries: boolean,
                                            showPolygonGeometries: boolean): Array<IdaiFieldDocument> {

        return documents.filter(document => {
            return (showLineGeometries && has3DLineGeometry(document))
                || (showPolygonGeometries && has3DPolygonGeometry(document));
        });
    }
}