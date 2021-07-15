import { update } from 'tsfun';


export function createMockProjectConfiguration(): any {

    const projectConfiguration = jasmine.createSpyObj(
        'projectConfiguration',
        ['getCategoryForest']
    );

    const defaultFieldConfiguration = {
        name: '',
        groups: [{
            fields: [
                {
                    name: 'identifier',
                    fulltextIndexed: true
                },
                {
                    name: 'shortDescription',
                    fulltextIndexed: true
                }
            ]
        }]
    };

    projectConfiguration.getCategoryForest.and.returnValue([
        { item: update('name', 'category1', defaultFieldConfiguration), trees: [] },
        { item: update('name', 'category2', defaultFieldConfiguration), trees: [] },
        { item: update('name', 'category3', defaultFieldConfiguration), trees: [] },
        { item: update('name', 'Find', defaultFieldConfiguration), trees: [] },
        { item: update('name', 'Type', defaultFieldConfiguration), trees: [] }
    ]);

    return projectConfiguration;
}
