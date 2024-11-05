import {
  AppConfigurator,
  ConfigLoader,
  ConfigReader,
  getConfigurationName,
  PouchdbDatastore,
  ProjectConfiguration,
  ConfigurationDocument,
} from 'idai-field-core';

const loadConfiguration = async (
  pouchdbDatastore: PouchdbDatastore,
  project: string,
  languages: string[],
  username: string
): Promise<ProjectConfiguration> => {
  const configReader =  new ConfigReader()
  // const customConfigName = getConfigurationName(project);
  const db = pouchdbDatastore.getDb()
 const config = await ConfigurationDocument.getConfigurationDocument((id: string) => db.get(id),configReader,project,username)

  const configurator = new AppConfigurator(
    new ConfigLoader(new ConfigReader())
  );
  return await configurator.go(username, config);
};

export default loadConfiguration;
