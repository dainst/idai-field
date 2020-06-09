import {assoc} from 'tsfun';

export function createMockProjectConfiguration(): any {

    const projectConfiguration = jasmine.createSpyObj('projectConfiguration',
        ['getCategoriesArray']);

    const defaultFieldConfiguration =  {
        name: '',
        groups: [{ fields: {
            identifier: {},
            shortDescription: {},
        }}]
    };

    projectConfiguration.getCategoriesArray.and.returnValue([
        assoc('name', 'category1', defaultFieldConfiguration),
        assoc('name', 'category2', defaultFieldConfiguration),
        assoc('name', 'category3', defaultFieldConfiguration),
        assoc('name', 'Find', defaultFieldConfiguration),
        assoc('name', 'Type', defaultFieldConfiguration),
    ]);

    return projectConfiguration;
}
