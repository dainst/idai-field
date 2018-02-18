import * as THREE from 'three';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {ProjectConfiguration} from 'idai-components-2/configuration';
import {Viewer3D} from '../../../../core/3d/viewer-3d';
import {Map3DMeshGeometry} from './map-3d-mesh-geometry';
import {Map3DLineBuilder} from './map-3d-line-builder';
import {has3DLineGeometry, has3DPolygonGeometry} from '../../../../util/util-3d';


/**
 * @author Thomas Kleinke
 */
export class Map3DMeshGeometryManager {

    private meshGeometries: { [resourceId: string]: Map3DMeshGeometry } = {};

    private lineBuilder: Map3DLineBuilder;


    constructor(private viewer: Viewer3D,
                projectConfiguration: ProjectConfiguration) {

        this.lineBuilder = new Map3DLineBuilder(viewer, projectConfiguration);
    }


    public async update(documents: Array<IdaiFieldDocument>) {

        await this.viewer.waitForSizeAdjustment();

        const geometryDocuments: Array<IdaiFieldDocument>
            = Map3DMeshGeometryManager.getMeshGeometryDocuments(documents);

        this.getGeometriesToAdd(geometryDocuments).forEach(document => this.add(document));
        this.getGeometriesToRemove(geometryDocuments).forEach(document => this.remove(document));
    }


    public getRaycasterObjects(): Array<THREE.Object3D> {

        return Object.values(this.meshGeometries).map(line => line.raycasterObject);
    }


    public getDocument(raycasterObject: THREE.Object3D): IdaiFieldDocument|undefined {

        const geometry: Map3DMeshGeometry|undefined
            = Object.values(this.meshGeometries).find(line => line.raycasterObject == raycasterObject);

        return geometry ? geometry.document: undefined;
    }


    public getMesh(document: IdaiFieldDocument): THREE.Mesh|undefined {

        const geometry: Map3DMeshGeometry|undefined = this.meshGeometries[document.resource.id as string];

        return geometry ? geometry.mesh : undefined;
    }


    private add(document: IdaiFieldDocument) {

        const geometry: Map3DMeshGeometry|undefined = this.createMeshGeometry(document);

        if (!geometry) return;

        this.meshGeometries[document.resource.id as string] = geometry;

        this.viewer.add(geometry.mesh);
        if (geometry.raycasterObject != geometry.mesh) this.viewer.add(geometry.raycasterObject);
    }


    private remove(document: IdaiFieldDocument) {

        const geometry: Map3DMeshGeometry|undefined = this.meshGeometries[document.resource.id as string];
        if (!geometry) return;

        this.viewer.remove(geometry.mesh);
        if (geometry.raycasterObject != geometry.mesh) this.viewer.remove(geometry.raycasterObject);

        delete this.meshGeometries[document.resource.id as string];
    }


    private createMeshGeometry(document: IdaiFieldDocument): Map3DMeshGeometry|undefined {

        if (!document.resource.geometry) return undefined;

        switch(document.resource.geometry.type) {
            case 'LineString':
                return this.lineBuilder.buildLine(document);

            case 'Polygon':
                // TODO Implement
                break;
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


    private static getMeshGeometryDocuments(documents: Array<IdaiFieldDocument>): Array<IdaiFieldDocument> {

        return documents.filter(document => {
            return has3DLineGeometry(document) || has3DPolygonGeometry(document);
        });
    }
}