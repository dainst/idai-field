import {PouchdbDatastore} from "../../app/datastore/pouchdb-datastore";

/**
 * @author Daniel de Oliveira
 */
export function main() {
    describe('PouchdbDatastore', () => {

        var datastore : PouchdbDatastore;

        var doc = {
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

        // it('should revert id on failed creation',
        it('should not create two documents with the same identifier',
            function (done) {

                var doc2 = JSON.parse(JSON.stringify(doc));

                datastore.create(doc).then(() => {
                    return datastore.create(doc2).then(
                        () => {
                            fail(); done();
                        },
                        () => {
                            //expect(object2["id"]).toBe(undefined);
                            done();
                        }
                    );
                }, err => fail(err));

            }
        );

    })
}