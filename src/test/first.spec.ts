import {describe,expect,it,xit, inject, beforeEachProviders} from 'angular2/testing';
import {ObjectEditComponent} from '../app/components/object-edit.component'
import {Datastore} from '../app/services/datastore'
import {IndexeddbDatastore} from '../app/services/indexeddb-datastore'
import {provide} from "angular2/core";
import {IdaiFieldObject} from "../app/model/idai-field-object";
import {Observable} from "rxjs/Observable";


class MockTestDatastore {

    returnHello():string {
        return "hello";
    }
}

export function main() {
    describe('TestDemo', () => {

        beforeEachProviders(() => [
            ObjectEditComponent,
            provide(Datastore, {useClass: MockTestDatastore})
        ]);

        it('should demonstrate some dependency injection', inject([ObjectEditComponent],
            (objectEditComponent: ObjectEditComponent) => {

            expect(objectEditComponent.testAccessDatastore()).toBe('hello');
        }));
    });
}