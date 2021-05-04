import {
    AppConfigurator,
    ConfigLoader,
    getConfigurationName,
    PouchdbManager,
    ProjectConfiguration
} from 'idai-field-core';
import RequireConfigReader from './require-config-reader';


const loadConfiguration = async (
    pouchdbmanager: PouchdbManager,
    project: string,
    languages: string[],
    username: string
): Promise<ProjectConfiguration> => {

    const customConfigName = getConfigurationName(project);
    const configurator = new AppConfigurator(new ConfigLoader(new RequireConfigReader(), pouchdbmanager));
    return await configurator.go(customConfigName, languages, username);
};

export default loadConfiguration;
