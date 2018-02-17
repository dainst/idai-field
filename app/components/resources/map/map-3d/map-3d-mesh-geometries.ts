import * as THREE from 'three';
import {IdaiFieldDocument, IdaiFieldGeometry} from 'idai-components-2/idai-field-model';
import {ProjectConfiguration} from 'idai-components-2/configuration';
import {Viewer3D} from '../../../../core/3d/viewer-3d';
import {has3DLineGeometry, has3DPolygonGeometry, getPointVector} from '../../../../util/util-3d';

const {MeshLine, MeshLineMaterial} = require('three.meshline');


export interface Map3DLine {

    mesh: THREE.Mesh,
    raycasterLine: THREE.Line,
    document: IdaiFieldDocument
}


/**
 * @author Thomas Kleinke
 */
export class Map3DMeshGeometries {

    private lines: { [resourceId: string]: Map3DLine } = {};


    constructor(private viewer: Viewer3D,
                private projectConfiguration: ProjectConfiguration) {}


    public showGeometries(documents: Array<IdaiFieldDocument>) {

        const geometryDocuments: Array<IdaiFieldDocument>
            = Map3DMeshGeometries.getMeshGeometryDocuments(documents);

        this.getGeometriesToAdd(geometryDocuments).forEach(document => this.add(document));
        this.getGeometriesToRemove(geometryDocuments).forEach(document => this.remove(document));
    }


    public getRaycasterObjects(): Array<THREE.Object3D> {

        return Object.values(this.lines).map(line => line.raycasterLine);
    }


    public getDocument(raycasterLine: THREE.Object3D): IdaiFieldDocument|undefined {

        const line: Map3DLine|undefined
            = Object.values(this.lines).find(line => line.raycasterLine == raycasterLine);

        return line ? line.document: undefined;
    }


    public getMesh(document: IdaiFieldDocument): THREE.Mesh|undefined {

        const line: Map3DLine|undefined = this.lines[document.resource.id as string];

        return line ? line.mesh : undefined;
    }


    private add(document: IdaiFieldDocument) {

        if (!document.resource.geometry) return;

        switch(document.resource.geometry.type) {
            case 'LineString':
                this.addLine(document);
                break;

            case 'Polygon':
                // TODO Implement
                break;
        }
    }


    private remove(document: IdaiFieldDocument) {

        if (!document.resource.geometry) return;

        switch(document.resource.geometry.type) {
            case 'LineString':
                this.removeLine(document);
                break;

            case 'Polygon':
                // TODO Implement
                break;
        }
    }


    private addLine(document: IdaiFieldDocument) {

        const line: Map3DLine = this.createLine(document);
        this.lines[document.resource.id as string] = line;

        this.viewer.add(line.raycasterLine);
        this.viewer.add(line.mesh);
    }


    private removeLine(document: IdaiFieldDocument) {

        const line: Map3DLine|undefined = this.lines[document.resource.id as string];
        if (!line) return;

        this.viewer.remove(line.raycasterLine);
        this.viewer.remove(line.mesh);

        line.mesh.geometry.dispose();

        delete this.lines[document.resource.id as string];
    }


    private createLine(document: IdaiFieldDocument): Map3DLine {

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
            raycasterLine: raycasterLine,
            document: document
        };
    }


    private getGeometriesToAdd(documents: Array<IdaiFieldDocument>): Array<IdaiFieldDocument> {

        return documents.filter(document => {
            return !Object.keys(this.lines).includes(document.resource.id as string);
        });
    }


    private getGeometriesToRemove(documents: Array<IdaiFieldDocument>): Array<IdaiFieldDocument> {

        return Object.values(this.lines).filter(line => {
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