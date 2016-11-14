import {M} from "./m";
import {ProjectConfiguration} from "../node_modules/idai-components-2/idai-components-2";

interface ConfigurationValidationResult {
    errors : string[]
}

export class ConfigurationValidator {
    
    public validate(projectConfiguration: ProjectConfiguration) : ConfigurationValidationResult {

        var errors : string[] = [];

        if(!projectConfiguration.getTypesMap()["image"]) {
            errors.push(M.CONFIG_VALIDATION_IMAGE_MISSING);
        }
        
        return {
            errors:  errors
        }
    }
}
