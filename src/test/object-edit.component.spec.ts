import {describe,expect,it,xit, inject, beforeEachProviders} from 'angular2/testing';
import {ObjectEditComponent} from '../app/components/object-edit.component'
import {Datastore} from '../app/services/datastore'
import {IndexeddbDatastore} from '../app/services/indexeddb-datastore'
import {provide} from "angular2/core";
import {IdaiFieldObject} from "../app/model/idai-field-object";
import {Observable} from "rxjs/Observable";
import {Messages} from "../app/services/messages";
import {SimpleChange} from "angular2/core";

class MockTestDatastore {

    private testObject : IdaiFieldObject = undefined;

    public getTestObject() : IdaiFieldObject {
        return this.testObject;
    }

    create(object:IdaiFieldObject) : Promise<string> {
        this.testObject = object;
        return new Promise<string>((resolve, reject) => {
            resolve("ok");
        });
    }
}

class MockMessagesService {
    deleteMessages() {}
}

/**
 * @author Daniel M. de Oliveira
 */
export function main() {
    describe('ObjectEditComponent', () => {

        beforeEachProviders(() => [
            ObjectEditComponent,
            provide(Datastore, {useClass: MockTestDatastore}),
            provide(Messages, {useClass: MockMessagesService})

        ]);

        it('should create a non existing object on changing object', inject([ObjectEditComponent, Datastore],
            (objectEditComponent: ObjectEditComponent, mockDatastore: Datastore) => {

            var change = new SimpleChange(
                { "identifier": "ob2", "title": "Boba Fett", "synced": 0, "valid" : true  },
                {"identifier": "ob1", "title": "Obi One Kenobi", "synced": 0, "valid" : true });

            objectEditComponent.onKey({});
            objectEditComponent.ngOnChanges({
                    selectedObject: change
            });

            expect((<MockTestDatastore> mockDatastore).getTestObject().identifier).toBe("ob2");
        }));

        it('should not create an object when not valid', inject([ObjectEditComponent, Datastore],
            (objectEditComponent: ObjectEditComponent, mockDatastore: Datastore) => {

                var change = new SimpleChange(
                    { "identifier": "ob2", "title": "Boba Fett", "synced": 0, "valid" : false },
                    {"identifier": "ob1", "title": "Obi One Kenobi", "synced": 0, "valid" : true });

                objectEditComponent.onKey({});
                objectEditComponent.ngOnChanges({
                    selectedObject: change
                });

                expect((<MockTestDatastore> mockDatastore).getTestObject()).toBe(undefined);
            }));

    });
}