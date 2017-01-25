import {ImageGridBuilder} from "../../app/images/image-grid-builder";

/**
 * @author Daniel de Oliveira
 */
export function main() {
    describe('ImageGridBuilder', () => {

        var imageGridBuilder;

        beforeEach(function () {
            var mockMessages = jasmine.createSpyObj('mockMessages', [ 'addWithParams' ]);
            var blobProxyMock = {
                getBlobUrl: function() {
                    return {
                        then: function(callback) {
                            callback("url");
                            return {
                                catch: function(callback) {
                                    callback("err")
                                }
                            }
                        }
                    }
                }
            };

            imageGridBuilder = new ImageGridBuilder(
                <any> blobProxyMock ,mockMessages, true);

        });

        it('should keep the aspect ration of an image', (done)=> {


            var documents = [{
                    id: "o1",
                    resource: {
                        id: "o1",
                        identifier:"ob1",
                        shortDescription:"name",
                        height: "1",
                        width: "2",
                        filename: "abc"
                    }

                }];
                imageGridBuilder.calcGrid(documents,4,800).then(rows=>{
                    expect(rows[0][0].calculatedWidth).toBe(
                        rows[0][0].calculatedHeight * 2
                    );
                    done();
                });
            }
        );


        it('should throw when nrOfColumns not integer', () => {

            expect(function(){imageGridBuilder.calcGrid([],4.1,0)}).toThrow();
        });
    })
}
