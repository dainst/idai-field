import {describe,expect,it,xit, inject, beforeEachProviders} from 'angular2/testing';
import {provide} from "angular2/core";
import {IdaiFieldObject} from "../app/model/idai-field-object";
import {ObjectList} from "../app/services/object-list";
import {Datastore} from "../app/services/datastore";
import {Messages} from "../app/services/messages";


/**
 * @author Daniel M. de Oliveira
 */
export function main() {
    describe('ObjectList', () => {

        beforeEachProviders(() => [
            //ObjectList,
            provide(Messages, {useClass: Messages})

        ]);

        it('should create a non existing object on changing object',
            inject([ Messages],
            ( mockMessageService:Messages) => {

                var mockDatastore   = jasmine.createSpyObj('someObject', [ 'create' ]);
                mockDatastore.create.and.callFake(function() {
                    return new Promise((resolve, reject) => { resolve('ok')});;
                });

                var objectList = new ObjectList(mockDatastore,mockMessageService);

                var selectFirst : IdaiFieldObject =
                    { "identifier": "ob4", "title": "Luke Skywalker", "synced": 0, "valid": true };
                var selectThen : IdaiFieldObject =
                    { "identifier": "ob5", "title": "Boba Fett", "synced": 0, "valid": true };

                objectList.setSelectedObject(selectFirst);
                objectList.setChanged();
                objectList.setSelectedObject(selectThen); // it will try to save selectFirst now.

                expect((<Datastore> mockDatastore).create).toHaveBeenCalledWith(selectFirst);
            })
        );

        // TODO
        //it('should update an existing object on changing object',

        // TODO
        //it('should restore a non existing object on changing object if not valid',

        // TODO
        //it('should mark an object invalid when storing not successful',

    });
}