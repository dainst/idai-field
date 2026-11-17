import { ProjectConfiguration } from '../services/project-configuration';
import { getConfigurationName } from './project-configuration-names';
import { Forest } from '../tools/forest';
import { AppConfigurator } from './app-configurator';
import { ConfigurationDocument } from '../model/document/configuration-document';
import { CategoryForm } from '../model/configuration/category-form';


/**
 * @author Thomas Kleinke
 */
export class ConfigurationSerializer {

    constructor(private appConfigurator: AppConfigurator) {}


    public async getConfigurationAsJSON(projectIdentifier: string, configurationDocument: ConfigurationDocument) {

        const projectConfiguration: ProjectConfiguration = await this.appConfigurator.go(
            getConfigurationName(projectIdentifier),
            configurationDocument,
            true
        );

        return {
            projectLanguages: this.getLanguages(configurationDocument),
            categories: this.getCategories(projectConfiguration)
        };
    }


    private getCategories(projectConfiguration: ProjectConfiguration): Forest<CategoryForm> {

        return Forest.map((category: CategoryForm) => {
            delete category.children;
            delete category.parentCategory;
            return category;
        }, projectConfiguration.getCategories());
    }


    private getLanguages(configurationDocument: ConfigurationDocument): string[] {

        return configurationDocument.resource.projectLanguages ?? [];
    }
}
