export function createMockProjectConfiguration(): any {

    const projectConfiguration = jasmine.createSpyObj('projectConfiguration',
        ['getCategoriesMap']);

    const defaultFieldConfiguration =  {
        groups: [{ fields: {
            identifier: {},
            shortDescription: {},
        }}]
    };

    projectConfiguration.getCategoriesMap.and.returnValue({
        category1: defaultFieldConfiguration,
        category2: defaultFieldConfiguration,
        category3: defaultFieldConfiguration,
        Find: defaultFieldConfiguration,
        Type: defaultFieldConfiguration
    });

    return projectConfiguration;
}