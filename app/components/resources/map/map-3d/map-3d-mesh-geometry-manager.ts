import * as THREE from 'three';
import {IdaiFieldDocument, IdaiFieldGeometry} from 'idai-components-2/idai-field-model';
import {ProjectConfiguration} from 'idai-components-2/configuration';
import {has3DLineGeometry, has3DPolygonGeometry, getPointVector} from '../../../../util/util-3d';
import {Viewer3D} from '../../../../core/3d/viewer-3d';

const {MeshLine, MeshLineMaterial} = require('three.meshline');


export interface Map3DMeshGeometry {

    mesh: THREE.Mesh,
    raycasterObject: THREE.Object3D,
    document: IdaiFieldDocument
}


/**
 * @author Thomas Kleinke
 */
export class Map3DMeshGeometryManager {

    private meshGeometries: { [resourceId: string]: Map3DMeshGeometry } = {};


    constructor(private viewer: Viewer3D,
        private projectConfiguration: ProjectConfiguration) {}


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
                return this.createLine(document);

            case 'Polygon':
                // TODO Implement
                break;
        }
    }


    private createLine(document: IdaiFieldDocument): Map3DMeshGeometry {

        const geometry = new THREE.Geometry();
        (document.resource.geometry as IdaiFieldGeometry).coordinates.forEach(point => {
            geometry.vertices.push(getPointVector(point));
        });

        geometry.computeLineDistances();

        const rayCasterMaterial = new THREE.LineDashedMaterial({
            dashSize: 0,
            gapSize: 10
        });

        const raycasterLine = new THREE.Line(geometry, rayCasterMaterial);

        const line = new MeshLine();
        line.setGeometry(geometry);

        const material = new MeshLineMaterial({
            resolution: new THREE.Vector2(this.viewer.getRenderer().getSize().width,
                this.viewer.getRenderer().getSize().height),
            near: this.viewer.getCamera().near,
            far: this.viewer.getCamera().far,
            sizeAttenuation: false,
            lineWidth: 10,
            color: new THREE.Color(this.projectConfiguration.getColorForType(document.resource.type))
        });

        const mesh = new THREE.Mesh(line.geometry, material);

        return {
            mesh: mesh,
            raycasterObject: raycasterLine,
            document: document
        };
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