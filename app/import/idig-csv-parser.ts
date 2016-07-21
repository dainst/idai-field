import {Injectable} from "@angular/core";
import {Observable} from "rxjs/Observable";
import {IdaiFieldDocument} from "../model/idai-field-document";
import {Parser,ParserError} from "./parser";

/**
 * @author Sebastian Cuy
 */
@Injectable()
export class IdigCsvParser implements Parser {

    private static MANDATORY_FIELDS:string[] = [ "Identifier_uuid", "Identifier", "Title", "Type" ];
    private static IGNORED_FIELDS:string[] = [ "Contributor", "Coverage", "CoverageSpatial",
        "CoverageSpatialAreaCartesian_double", "CoverageSpatialBoundsCartesian_bbox", "CoverageSpatialCRS",
        "CoverageSpatialCartesian_rpt", "CoverageSpatialElevations_rpt", "CoverageSpatialPoints_rpt",
        "CoverageTemporal", "CoverageTemporalStart", "CoverageTemporal_range", "Creator", "Date", "DateTimeZone",
        "Date_range", "Description", "Format", "FormatDiameter", "FormatDiameter_double", "FormatDimensions",
        "FormatDimensions_double", "FormatHeight", "FormatHeight_double", "FormatLength", "FormatLength_double",
        "FormatLocked", "FormatMaximumDimension", "FormatMaximumDimension_double", "FormatPreservedHeight",
        "FormatPreservedHeight_double", "FormatSidelined", "FormatStatus", "FormatThickness", "FormatThickness_double",
        "FormatTrashed", "FormatWidth", "FormatWidth_double", "Language", "Publisher",
        "Relation", "RelationBelongsTo", "RelationBelongsTo_uuid", "RelationIncludes", "RelationIncludes_uuid",
        "RelationIsAbove", "RelationIsAbove_uuid", "RelationIsBelow", "RelationIsBelow_uuid", "RelationIsCoevalWith",
        "RelationIsCoevalWith_uuid", "Relation_uuid", "Rights", "Source", "Subject" ];

    public parse(content:string):Observable<IdaiFieldDocument> {

        return Observable.create(observer => {
            var result = Papa.parse(content, { header: true, dynamicTyping: true, skipEmptyLines: true });
            result.data.forEach( (object, i) => {
                var valid:any = this.validate(object);
                if (valid === true) {
                    observer.next(this.map(object));
                } else {
                    let error:ParserError = new ParserError();
                    error.lineNumber = i + 1;
                    error.message = valid;
                    observer.error(error);
                }                
            });
            observer.complete();
        });

    }
    
    private validate(object:any):any {
        var result:any = true;
        IdigCsvParser.MANDATORY_FIELDS.forEach( mandatoryField => {
            if (!object[mandatoryField] || 0 === object[mandatoryField].length) {
                result = "Missing mandatory field '" + mandatoryField + "'";
            }
        });
        return result;
    }

    private map(object) {
        var doc:IdaiFieldDocument = {
            resource: {
                '@id': object['Identifier_uuid'],
                identifier: object['Identifier'],
                title: object['Title'],
                type: object['Type']
            },
            id: object['Identifier_uuid'],
            synced: 0
        };
        this.copyFields(object,doc.resource);
        return doc;
    }

    private copyFields(object,resource) {
        Object.keys(object).forEach( field => {
            if (IdigCsvParser.IGNORED_FIELDS.indexOf(field) == -1
                    && IdigCsvParser.MANDATORY_FIELDS.indexOf(field) == -1) {
                resource[field] = object[field];
            }
        });
    }

}