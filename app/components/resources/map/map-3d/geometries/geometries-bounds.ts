import * as THREE from 'three';
import {Observer} from 'rxjs/Observer';
import {Observable} from 'rxjs/Observable';


const GEOMETRIES_BOUNDS_OFFSET: number = 1;


/**
 * @author Thomas Kleinke
 */
export class GeometriesBounds {

    private points: Array<THREE.Vector3>|undefined;
    private meshes: Array<THREE.Mesh>|undefined;

    private observers: Array<Observer<void>> = [];
    private notified: boolean = false;


    public setPoints(points: Array<THREE.Vector3>) {

        this.points = points;
        if (!this.notified) this.notifyIfInitialized();
    }


    public setMeshes(meshes: Array<THREE.Mesh>) {

        this.meshes = meshes;
        if (!this.notified) this.notifyIfInitialized();
    }


    public getBounds(): THREE.Box3 {

        const bounds: THREE.Box3 = new THREE.Box3;

        if (this.points) this.points.forEach(point => bounds.expandByPoint(point));
        if (this.meshes) this.meshes.forEach(mesh => bounds.expandByObject(mesh));

        bounds.expandByScalar(GEOMETRIES_BOUNDS_OFFSET);

        return bounds;
    }


    public reset() {

        this.points = undefined;
        this.meshes = undefined;
        this.notified = false;
    }


    public initializationNotification(): Observable<void> {

        return new Observable<void>((observer: Observer<any>) => {
            this.observers.push(observer);
        });
    }


    private notifyIfInitialized() {

        if (this.points && this.meshes) {
            this.notified = true;
            this.notifyObservers();
        }
    }


    private notifyObservers() {

        this.observers.forEach(observer => observer.next(undefined));
    }
}