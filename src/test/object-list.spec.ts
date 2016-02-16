import {describe,expect,it,xit, inject, beforeEachProviders} from 'angular2/testing';
import {provide} from "angular2/core";
import {IdaiFieldObject} from "../app/model/idai-field-object";
import {ObjectList} from "../app/services/object-list";
import {Datastore} from "../app/services/datastore";
import {Messages} from "../app/services/messages";

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
    describe('ObjectList', () => {

        beforeEachProviders(() => [
            ObjectList,
            provide(Datastore, {useClass: MockTestDatastore}),
            provide(Messages, {useClass: MockMessagesService})

        ]);

        it('should create a non existing object on changing object', inject([ObjectList, Datastore],
            (objectList:ObjectList, mockDatastore:Datastore) => {

                var selectFirst : IdaiFieldObject =
                    { "identifier": "ob4", "title": "Luke Skywalker", "synced": 0, "valid": true };
                var selectThen : IdaiFieldObject =
                    { "identifier": "ob5", "title": "Boba Fett", "synced": 0, "valid": true };

                objectList.setSelectedObject(selectFirst);
                objectList.setChanged();
                objectList.setSelectedObject(selectThen); // it will try to save selectFirst now.

                expect((<MockTestDatastore> mockDatastore).getTestObject()).toBe(selectFirst);
            })
        );

        // TODO
        it('should update an existing object on changing object', inject([ObjectList, Datastore],
            (objectList:ObjectList, mockDatastore:Datastore) => {
                // expect(actual).getTestObject()).toBe(expected);
            })
        );

        // TODO
        it('should restore a non existing object on changing object if not valid', inject([ObjectList, Datastore],
            (objectList:ObjectList, mockDatastore:Datastore) => {
                // expect(actual)).toBe(expected);
            })
        );



    });
}