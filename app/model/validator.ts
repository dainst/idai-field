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
            validationReport.errorMessage = M.OBJLIST_IDMISSING;
            return validationReport;
        }

        if (resource['@id']) {
            if (!this.validateType(resource)) {
                validationReport.valid = false;
                validationReport.errorMessage = M.VALIDATION_ERROR_INVALIDTYPE;
                validationReport.errorData.push(Utils.getTypeFromId(resource['@id']));
                return validationReport;
            }
            
            var invalidField;
            if (invalidField = this.validateFields(resource)) {
                validationReport.valid = false;
                validationReport.errorMessage = M.VALIDATION_ERROR_INVALIDFIELD;
                validationReport.errorData.push(invalidField);
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
     * @returns {string} the name of the invalid field if one of the fields is invalid, otherwise <code>undefined</code>
     */
    private validateFields(resource: any): string {

        var projectFields = this.projectConfiguration.getFields(Utils.getTypeFromId(resource['@id']));
        var relationFields = this.relationsConfiguration.getRelationFields();
        var defaultFields = [ { field: "@id" }, { field: "type" } ];

        var fields = projectFields.concat(relationFields).concat(defaultFields);

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
                    return resourceField;
                }
            }
        }
        
        return undefined;
    }
}