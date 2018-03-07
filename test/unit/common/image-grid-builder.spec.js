"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var image_grid_builder_1 = require("../../../app/components/imagegrid/image-grid-builder");
/**
 * @author Daniel de Oliveira
 */
describe('ImageGridBuilder', function () {
    var imageGridBuilder;
    var documents = [{
            id: 'o1',
            resource: {
                id: 'o1',
                identifier: 'ob1',
                shortDescription: 'name',
                height: '1',
                width: '2',
                originalFilename: 'abc'
            }
        }];
    beforeEach(function () {
        imageGridBuilder = new image_grid_builder_1.ImageGridBuilder();
    });
    it('should keep the aspect ration of an image', function () {
        var rows = imageGridBuilder.calcGrid(documents, 4, 800);
        expect(rows[0][0].calculatedWidth).toBe(rows[0][0].calculatedHeight * 2);
    });
    it('should throw when nrOfColumns not integer', function () {
        expect(function () { imageGridBuilder.calcGrid([], 4.1, 0); }).toThrow();
    });
});
//# sourceMappingURL=image-grid-builder.spec.js.map