import { ConfigurationDocument } from '../model';
import { ConfigLoader } from './boot/config-loader';
import { BuiltInConfiguration } from './built-in-configuration';
import { ProjectConfiguration } from '../services/project-configuration';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class AppConfigurator {

    constructor(private configLoader: ConfigLoader) {}


    public async go(customConfigurationName: string|undefined,
                    configurationDocument: ConfigurationDocument): Promise<ProjectConfiguration> {

        const builtInConfiguration: BuiltInConfiguration = new BuiltInConfiguration(customConfigurationName);

        return this.configLoader.go(
            builtInConfiguration.commonFields,
            builtInConfiguration.builtInCategories,
            builtInConfiguration.builtInRelations,
            builtInConfiguration.builtInFields,
            configurationDocument
        );
    }
}
