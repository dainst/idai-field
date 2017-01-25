import {Injectable} from "@angular/core";
import {Observable} from "rxjs/Observable";
import {IdaiFieldDocument} from "../model/idai-field-document";
import {IdaiFieldGeometry} from "../model/idai-field-geometry";
import {Parser,ParserError} from "./parser";
import {M} from "../m";

/**
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
@Injectable()
export class IdigCsvParser implements Parser {

    private static MANDATORY_FIELDS: string[] = ["IdentifierUUID", "Type"];
    private static MANUALLY_MAPPED_FIELDS: string[] = ["Identifier", "Title"];
    private static IGNORED_FIELDS: string[] = ["Contributor", "Coverage", "CoverageSpatial",
        "CoverageSpatialAreaCartesian_double", "CoverageSpatialBoundsCartesian_bbox", "CoverageSpatialCRS",
        "CoverageSpatialCartesian_rpt", "CoverageSpatialElevations_rpt", "CoverageSpatialPoints_rpt",
        "CoverageTemporal", "CoverageTemporalStart", "CoverageTemporal_range", "Creator", "Date", "DateTimeZone",
        "Date_range", "Description", "Format", "FormatDiameter", "FormatDiameter_double", "FormatDimensions",
        "FormatDimensions_double", "FormatHeight", "FormatHeight_double", "FormatLength", "FormatLength_double",
        "FormatLocked", "FormatMaximumDimension", "FormatMaximumDimension_double", "FormatPreservedHeight",
        "FormatPreservedHeight_double", "FormatSidelined", "FormatStatus", "FormatThickness", "FormatThickness_double",
        "FormatTrashed", "FormatWidth", "FormatWidth_double", "Language", "Publisher",
        "Rights", "Source", "Subject", "Buckets", "Category", "Contents", "Context", "CoverageAltitude",
        "CoverageArea", "CoverageCoordinates", "CoverageEarliest", "CoverageEnvelope", "CoverageGeometry",
        "CoverageJSON", "CoverageLatest", "CoveragePosition", "CoverageSerialized", "CoverageTransform",
        "CoverageUTC", "DateEarliest", "DateEarliestISO8601", "DateLatest", "DateLatestISO8601",
        "DateModified", "DateUTC", "Deposit", "FormatImage", "FormatImageHeight", "FormatImageWidth", "Looking",
        "LotContexts", "LotDates", "LotGrid", "LotLevels", "Material", "NotebookPage", "Period", "Phase",
        "RelationAttachments", "RelationIsAfter", "RelationIsAfterUUID", "RelationIsBefore",
        "RelationIsBeforeUUID", "RightsDeleted", "RightsLocked", "RightsSidelined", "RightsStatus",
        "RightsTrashed", "SectionNumber", "Storage"

    ];
    private static RELATION_FIELDS: string[] = [
        "Relation", "Relation_uuid",
        "RelationBelongsTo", "RelationBelongsToUUID", "RelationIncludes", "RelationIncludesUUID",
        "RelationIsAbove", "RelationIsAboveUUID", "RelationIsBelow", "RelationIsBelowUUID", "RelationIsCoevalWith",
        "RelationIsCoevalWithUUID"
    ];
    private static GEOMETRY_FIELD: string = "CoverageUnion";

    public parse(content: string): Observable<IdaiFieldDocument> {

        return Observable.create(observer => {

            var errorCallback = e => {
                let error: ParserError = new ParserError();
                error.lineNumber = e.row;
                error.message = M.IMPORTER_FAILURE_INVALIDCSV;
                observer.error(error);
            };

            var completeCallback = result => {
                result.errors.forEach( e => errorCallback(e) );
                result.data.forEach( (object, i) => {
                    var validationResult: any = this.checkExistenceOfMandatoryFields(object);
                    if (validationResult === true) {
                        try {
                            observer.next(this.documentFrom(object, i));
                        } catch (e) {
                            let error: ParserError = new ParserError();
                            error.lineNumber = i + 1;
                            error.message = e;
                            observer.error(error);
                        }
                    } else {
                        validationResult.lineNumber = i + 1;
                        observer.error(validationResult);
                    }
                });
                observer.complete();
            };


            try {
                Papa.parse(content, {
                    header: true,
                    skipEmptyLines: true,
                    worker: true,
                    error: errorCallback,
                    complete: completeCallback
                });
            } catch (e) {
                let error: ParserError = new ParserError();
                error.message = M.IMPORTER_FAILURE_GENERICCSVERROR;
                observer.error(error);
            }
        });

    }

    /**
     * @param object an iDig object
     * @returns {any} a result object
     */
    private checkExistenceOfMandatoryFields(object: any): any {

        var result: any = true;
        IdigCsvParser.MANDATORY_FIELDS.forEach( mandatoryField => {
            if (!object[mandatoryField] || 0 === object[mandatoryField].length) {

                result = new ParserError();
                result.message = M.IMPORTER_FAILURE_MANDATORYCSVFIELDMISSING;
                result.errorData = mandatoryField;
            }
        });
        return result;
    }


    private identifier(object) {
        if (object['Identifier']!=undefined)
            return object['Identifier'];
        else
            return object['IdentifierUUID'];
    }

    private documentFrom(object, i): IdaiFieldDocument {

        var doc:IdaiFieldDocument = {
            resource: {
                id: object['IdentifierUUID'],
                // TODO We suffix the identifier with some autogenerated text this is because our testdata from the idai-field-configs repo has records with duplicate identifiers.
                identifier: "" + this.identifier(object) + " (imported item nr. " + i + ")",
                type: object['Type'],
                shortDescription: object['Title'],
                relations: {}
            },
            id: object['IdentifierUUID'],
            synced: 0
        };

        // After this initial setup, the rest of the fields is mapped "automatically".
        return this.map(object, doc);
    }


    private map(object, doc): IdaiFieldDocument {

        Object.keys(object).forEach( field => {
            if (IdigCsvParser.IGNORED_FIELDS.indexOf(field) == -1) {

                if (this.isRelation(field)) {
                    this.mapRelationField(object, doc.resource, field);
                } else if (field == IdigCsvParser.GEOMETRY_FIELD) {
                    this.mapGeometryField(object, doc.resource);
                }
                else this.copyField(object, doc.resource,field);
            }
        });

        return doc;
    }

    private isRelation(field) {
        return (IdigCsvParser.RELATION_FIELDS.indexOf(field) != -1);
    }

    private hasContent(object,field) {
        return (object[field] != undefined && object[field] != "");
    }

    private relationName(relation) {
        var relN = relation.substring(0, relation.indexOf("UUID"));
        var relN = relN.replace("Relation", "");
        if (relN == "") return "Relation";
        else return relN;
    }

    private isMappableRelation(relation) {
        return (relation.indexOf("UUID") != -1) && (this.relationName(relation) != "Relation");
    }

    private mapRelationField(object, resource, relation) {

        if (this.hasContent(object, relation)) {
            if (this.isMappableRelation(relation)) {
                resource["relations"][this.relationName(relation)] =
                    object[relation].split(/[\n\s\t]/g);
            }
        }
    };

    private mapGeometryField(object, resource) {

        if (this.hasContent(object, IdigCsvParser.GEOMETRY_FIELD)) {
            var geometryString = object[IdigCsvParser.GEOMETRY_FIELD];
            var geometry: IdaiFieldGeometry = this.parseGeometryString(geometryString);

            if (geometry) {
                resource.geometries = [geometry];
            }
        }
    }

    private parseGeometryString(geometryString): IdaiFieldGeometry {

        geometryString = geometryString.toLowerCase();
        var geometry: IdaiFieldGeometry;

        if (geometryString.startsWith("point")) {
            geometry = this.parsePointGeometryString(geometryString);
        } else if (geometryString.startsWith("polygon")) {
            geometry = this.parsePolygonGeometryString(geometryString);
        }

        return geometry;
    }

    private parsePointGeometryString(geometryString): IdaiFieldGeometry {

        var geometry: IdaiFieldGeometry = {type: "Point", coordinates: [], crs: "local"};

        geometryString = geometryString
            .replace("point ((", "")
            .replace("))", "");

        geometry.coordinates = this.parsePoint(geometryString);

        return geometry;
    }

    private parsePolygonGeometryString(geometryString): IdaiFieldGeometry {

        var geometry: IdaiFieldGeometry = {type: "Polygon", coordinates: [[]], crs: "local"};

        geometryString = geometryString
            .replace("polygon ((", "")
            .replace("))", "");

        var coordinates: Array<string> = geometryString.split(", ");
        if (coordinates.length < 3) {
            throw M.IMPORTER_FAILURE_INVALIDGEOMETRY;
        }

        for (var pointCoordinates of coordinates) {
            geometry.coordinates[0].push(this.parsePoint(pointCoordinates));
        }

        return geometry;
    }

    private parsePoint(coordinatesString): Array<number> {

        var point: Array<number> = [];

        var coordinates: Array<string> = coordinatesString.split(" ");
        if (coordinates.length != 2) {
            throw M.IMPORTER_FAILURE_INVALIDGEOMETRY;
        }

        point[0] = parseInt(coordinates[0].replace(",", "."));
        point[1] = parseInt(coordinates[1].replace(",", "."));
        if (isNaN(point[0]) || isNaN(point[1])) {
            throw M.IMPORTER_FAILURE_INVALIDGEOMETRY;
        }

        return point;
    }

    /**
     * Copies a field if it is neither mandatory nor marked as
     * manually mapped.
     *
     * @param object
     * @param resource
     * @param field
     */
    private copyField(object,resource,field) {

        if (IdigCsvParser.MANDATORY_FIELDS.indexOf(field) == -1 &&
            IdigCsvParser.MANUALLY_MAPPED_FIELDS.indexOf(field) == -1) {
            resource[field] = object[field];
        }
    }
}