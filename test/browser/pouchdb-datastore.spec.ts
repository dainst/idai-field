import {PouchdbDatastore} from "../../app/datastore/pouchdb-datastore";

/**
 * @author Daniel de Oliveira
 */
export function main() {
    xdescribe('PouchdbDatastore', () => {

        var datastore : PouchdbDatastore;

        var object = {
            "resource" : {
                "identifier": "ob1",
                "title": "Title",
                "type": "Object",
                "synced": 0,
                "valid": true
            }
        };

        beforeEach(
            function () {
                datastore = new PouchdbDatastore();
            }
        );

        it('should revert id on failed creation',
            function (done) {

                var object2 = JSON.parse(JSON.stringify(object));

                datastore.create(object).then(() => {
                    console.log(object);
                    return datastore.create(object2).then(
                        () => {
                            console.log(object2);
                            fail(); done();
                        },
                        () => {
                            expect(object2["id"]).toBe(undefined); done()
                        }
                    );
                }, err => fail(err));

            }
        );
    })
}