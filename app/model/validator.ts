import {Injectable} from "@angular/core";
import {M} from "../m";
import {IdaiFieldDocument} from "./idai-field-document";
import {ConfigLoader} from "../../node_modules/idai-components-2/idai-components-2";
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


        this.configLoader.configuration().subscribe((result)=>{
            if(result.error == undefined) {
                this.projectConfiguration = result.projectConfiguration;
                this.relationsConfiguration = result.relationsConfiguration;
            } else {
                // TODO Meldung geben/zeigen wenn es ein Problem mit der Configuration gibt
                //this.messages.add(result.error.msgkey);
            }
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

        if (resource.id) {

            if (!this.validateType(resource)) {
                validationReport.valid = false;
                validationReport.errorMessage = M.VALIDATION_ERROR_INVALIDTYPE;
                validationReport.errorData.push(resource.identifier);
                validationReport.errorData.push("\"" + resource.type + "\"");
                return validationReport;
            }

            var invalidFields;
            if (invalidFields = this.validateFields(resource)) {
                validationReport.valid = false;
                validationReport.errorMessage = 
                    invalidFields.length == 1 ? M.VALIDATION_ERROR_INVALIDFIELD : M.VALIDATION_ERROR_INVALIDFIELDS;
                validationReport.errorData.push(resource.type);
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

        if (!resource.type) return false;

        var types = this.projectConfiguration.getTypes();

        for (var i in types) {
            if (types[i].name == resource.type) return true;
        }

        return false;
    }

    /**
     * 
     * @param resource
     * @returns {string[]} the names of invalid fields if one ore more of the fields are invalid, otherwise
     * <code>undefined</code>
     */
    private validateFields(resource: any): string[] {

        var projectFields = this.projectConfiguration.getFields(resource.type);
        var relationFields = this.relationsConfiguration.getRelationFields();
        var defaultFields = [ { name: "id" }, { name: "type" }, { name: "relations" }, { name: "geometries" } ];

        var fields = projectFields.concat(relationFields).concat(defaultFields);

        var invalidFields = [];

        for (var resourceField in resource) {
            if (resource.hasOwnProperty(resourceField)) {
                var fieldFound = false;
                for (var i in fields) {
                    if (fields[i].name == resourceField) {
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