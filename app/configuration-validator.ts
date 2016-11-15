import {M} from "./m";
import {ProjectConfiguration} from "../node_modules/idai-components-2/idai-components-2";

interface ConfigurationValidationResult {
    errors : string[]
}

export class ConfigurationValidator {
    private errors : string[]
    private projectConfig : ProjectConfiguration;

    constructor(private mandatoryFields) { }

    private validateMandatoryFields () {
        var typesList = this.projectConfig.getTypesList();
        
        this.mandatoryFields.forEach(mandatoryField => {
            typesList.forEach(type => {
                var mandatoryFieldFoundAt = -1;
                type.getFields().forEach(function (field, index) {
                    if(field.name == mandatoryField.name) {
                        // if necessary, move mandatory field to right index
                        if ((mandatoryFieldFoundAt = index) != mandatoryField.index)
                            type.fields.splice(mandatoryField.index, 0, type.fields.splice(mandatoryFieldFoundAt, 1)[0]);
                        return;
                    }
                });
                // if mandatory field was not found add it
                if (mandatoryFieldFoundAt == -1) {
                    type.fields.splice(mandatoryField.index, 0, mandatoryField);
                }
            })
        })
    }
    
    public validate(
        projectConfiguration: ProjectConfiguration):
            ConfigurationValidationResult {

        this.projectConfig = projectConfiguration;
        this.errors = [];

        if(!this.projectConfig.getTypesMap()["image"])
            this.errors.push(M.CONFIG_VALIDATION_IMAGE_MISSING);

        this.validateMandatoryFields();
        
        return {
            errors:  this.errors
        }
    }
}
