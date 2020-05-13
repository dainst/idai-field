
/**
 * @author Daniel de Oliveira
 */
describe('PrePreprocessConfigurationValidator',() => {

    /*
    it('reject if isRecordedIn defined for image category', () => {

        const configuration = {
            identifier: 'Conf',
            categories: {
                'Image': {}
            },
            relations: [{
                name: 'isRecordedIn',
                domain: ['Image']
            }]
        };


        const result = new IdaiFieldPrePreprocessConfigurationValidator().validateFieldDefinitions_(configuration);
        expect(result[0][0]).toContain('image category/ isRecordedIn must not be defined manually');
    });


    it('reject if isRecordedIn defined for image subcategory', () => {

        const configuration = {
            identifier: 'Conf',
            categories: {
                'Drawing': { parent: 'Image' }
            },
            relations: [{
                name: 'isRecordedIn',
                domain: ['Drawing']
            }]
        };


        const result = new IdaiFieldPrePreprocessConfigurationValidator().validateFieldDefinitions_(configuration);
        expect(result[0][0]).toContain('image category/ isRecordedIn must not be defined manually');
    });


    it('reject if isRecordedIn defined for operation subcategory', () => {

        const configuration = {
            identifier: 'Conf',
            categories: {
                'A': { parent: 'Operation' }
            },
            relations: [{
                name: 'isRecordedIn',
                domain: ['A']
            }]
        };


        const result = new IdaiFieldPrePreprocessConfigurationValidator().validateFieldDefinitions_(configuration);
        expect(result[0][0]).toContain('operation subcategory as domain category/ isRecordedIn must not be defined manually');
    });


    it('reject if isRecordedIn range not operation subcategory', () => {

        const configuration = {
            identifier: 'Conf',
            categories: {
                'A': {},
                'B': {}
            },
            relations: [{
                name: 'isRecordedIn',
                domain: ['A'],
                range: ['B']
            }]
        };

        const result = new IdaiFieldPrePreprocessConfigurationValidator().validateFieldDefinitions_(configuration);
        expect(result[0][0]).toContain('isRecordedIn - only operation subcategories allowed in range');
    });


    xit('reject if field not allowed in relation', () => {

        const configuration = {
            identifier: 'Conf',
            categories: {
                'A': {}
            },
            relations: [{
                name: 'abc',
                visible: 'true'
            }]
        };

        const result = new IdaiFieldPrePreprocessConfigurationValidator().validateFieldDefinitions_(configuration);
        expect(result[0][0]).toContain('relation field not allowed');
    });*/



});
