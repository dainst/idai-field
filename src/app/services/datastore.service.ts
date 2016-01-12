import {OBJECTS} from './sample-objects';
import {Injectable} from 'angular2/core';

@Injectable()
export class DatastoreService {

    getObjects() {
        return OBJECTS;
    }
}