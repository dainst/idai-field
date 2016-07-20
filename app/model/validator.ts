import {Injectable} from "@angular/core";
import {M} from "../m";
import {IdaiFieldDocument} from "./idai-field-document";
import {Utils, ConfigLoader} from "../../node_modules/idai-components-2/idai-components-2";
import {ProjectConfiguration, RelationsConfiguration} from "../../node_modules/idai-components-2/idai-components-2";

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
@Injectable()
export class Validator {

    private projectConfiguration: ProjectConfiguration;
    private relationsConfiguration: RelationsConfiguration;

    constructor(private configLoader: ConfigLoader) {
        this.configLoader.projectConfiguration().subscribe((projectConfiguration) => {
            this.projectConfiguration = projectConfiguration;
        });

        this.configLoader.relationsConfiguration().subscribe((relationsConfiguration) => {
            this.relationsConfiguration = relationsConfiguration;
        });
    }

    /**
     * @param doc
     * @returns {any} the validation report containing the error message as key of m and possibly additional data
     * (e. g. the name of an invalid field)
     */
    public validate(doc: IdaiFieldDocument): any {

        var validationReport = {
            valid: true,
            errorMessage: undefined,
            errorData: []
        };
        
        var resource = doc['resource'];

        if (!this.validateIdentifier(resource)) {
            validationReport.valid = false;
            validationReport.errorMessage = M.VALIDATION_ERROR_IDMISSING;
            return validationReport;
        }

        if (resource['@id']) {

            if (!this.validateType(resource)) {
                validationReport.valid = false;
                validationReport.errorMessage = M.VALIDATION_ERROR_INVALIDTYPE;
                validationReport.errorData.push(resource.identifier);
                validationReport.errorData.push("\"" + Utils.getTypeFromId(resource['@id']) + "\"");
                return validationReport;
            }

            var invalidFields;
            if (invalidFields = this.validateFields(resource)) {
                validationReport.valid = false;
                validationReport.errorMessage = 
                    invalidFields.length == 1 ? M.VALIDATION_ERROR_INVALIDFIELD : M.VALIDATION_ERROR_INVALIDFIELDS;
                validationReport.errorData.push(resource.identifier);
                validationReport.errorData.push(invalidFields.join(", "));
                return validationReport;
            }
        }

        return validationReport;
    }

    /**
     * 
     * @param resource
     * @returns {boolean} true if the identifier of the resource is valid, otherwise false
     */
    private validateIdentifier(resource: any): boolean {
        
        return resource.identifier && resource.identifier.length > 0;
    }

    /**
     * 
     * @param resource
     * @returns {boolean} true if the type of the resource is valid, otherwise false
     */
    private validateType(resource: any): boolean {

        var type = Utils.getTypeFromId(resource['@id']);

        return this.projectConfiguration.getTypes().indexOf(type) > -1;
    }

    /**
     * 
     * @param resource
     * @returns {string[]} the names of invalid fields if one ore more of the fields are invalid, otherwise
     * <code>undefined</code>
     */
    private validateFields(resource: any): string[] {

        var projectFields = this.projectConfiguration.getFields(Utils.getTypeFromId(resource['@id']));
        var relationFields = this.relationsConfiguration.getRelationFields();
        var defaultFields = [ { field: "@id" }, { field: "type" } ];

        var fields = projectFields.concat(relationFields).concat(defaultFields);
        
        var invalidFields = [];

        for (var resourceField in resource) {
            if (resource.hasOwnProperty(resourceField)) {
                var fieldFound = false;
                for (var i in fields) {
                    if (fields[i].field == resourceField) {
                        fieldFound = true;
                        break;
                    }
                }
                if (!fieldFound) {
                    invalidFields.push("\"" + resourceField + "\"");
                }
            }
        }
        
        if (invalidFields.length > 0)
            return invalidFields;
        else
            return undefined;
    }
}