import * as THREE from 'three';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {ProjectConfiguration} from 'idai-components-2/configuration';
import {Viewer3D} from '../../../../../core/3d/viewer-3d';
import {MeshGeometry} from './mesh-geometry';
import {LineBuilder} from './line-builder';
import {PolygonBuilder} from './polygon-builder';
import {has3DLineGeometry, has3DPolygonGeometry} from '../../../../../util/util-3d';


/**
 * @author Thomas Kleinke
 */
export class MeshGeometryManager {

    private meshGeometries: { [resourceId: string]: MeshGeometry } = {};

    private lineBuilder: LineBuilder;
    private polygonBuilder: PolygonBuilder;


    constructor(private viewer: Viewer3D,
                projectConfiguration: ProjectConfiguration) {

        this.lineBuilder = new LineBuilder(viewer, projectConfiguration);
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


    public getRaycasterObjects(): Array<THREE.Object3D> {

        return Object.values(this.meshGeometries).map(line => line.raycasterObject);
    }


    public recreateLineGeometries() {

        Object.values(this.meshGeometries)
            .filter(meshGeometry => meshGeometry.type == 'line')
            .forEach(lineGeometry => {
                this.remove(lineGeometry.document);
                this.add(lineGeometry.document);
            });
    }


    public getDocument(raycasterObject: THREE.Object3D): IdaiFieldDocument|undefined {

        const geometry: MeshGeometry|undefined
            = Object.values(this.meshGeometries).find(line => line.raycasterObject == raycasterObject);

        return geometry ? geometry.document: undefined;
    }


    public getMesh(document: IdaiFieldDocument): THREE.Mesh|undefined {

        const geometry: MeshGeometry|undefined = this.meshGeometries[document.resource.id as string];

        return geometry ? geometry.mesh : undefined;
    }


    private add(document: IdaiFieldDocument) {

        const geometry: MeshGeometry|undefined = this.createMeshGeometry(document);

        if (!geometry) return;

        this.meshGeometries[document.resource.id as string] = geometry;

        this.viewer.add(geometry.mesh);
        if (geometry.raycasterObject != geometry.mesh) this.viewer.add(geometry.raycasterObject);
    }


    private remove(document: IdaiFieldDocument) {

        const geometry: MeshGeometry|undefined = this.meshGeometries[document.resource.id as string];
        if (!geometry) return;

        this.viewer.remove(geometry.mesh);
        if (geometry.raycasterObject != geometry.mesh) this.viewer.remove(geometry.raycasterObject);

        delete this.meshGeometries[document.resource.id as string];
    }


    private createMeshGeometry(document: IdaiFieldDocument): MeshGeometry|undefined {

        if (!document.resource.geometry) return undefined;

        switch(document.resource.geometry.type) {
            case 'LineString':
                return this.lineBuilder.buildLine(document);

            case 'Polygon':
                return this.polygonBuilder.buildPolygon(document);
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