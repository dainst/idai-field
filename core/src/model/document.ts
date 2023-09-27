import { filter, to, isAssociative, isPrimitive, map, flow, keys, isUndefinedOrEmpty } from 'tsfun';
import { NewResource, Resource } from './resource';
import { Action } from './action';
import { ObjectUtils } from '../tools/object-utils';
import { Labels } from '../services';
import { Warnings } from './warnings';

export type RevisionId = string;
export type DocumentId = string;


export interface NewDocument {

    resource: NewResource;
}


export module NewDocument {

    export const hasId = (doc: NewDocument) => doc.resource.id !== undefined;
}


/**
 * Document =
 *   | FieldDocument             // Category: Inscriptions, Operations, Finds, Features, Types, TypeCatalogs, 
 *                               // !Project, !Images, !Configuration
 *     | [ConcreteFieldDocument] // Resources which can possibly have geometries + Inscriptions, which do not have geometries
 *         | FeatureDocument     // Category: Feature and subtypes
 *     | [AbstractFieldDocument] // Category: Type/TypeCatalog
 *   | ImageDocument             // Category: Image and subtypes
 *   | ConfigurationDocument
 * 
 * Names with [] denote Document types which we currently do not have a concrete interface for but exist logically.
 */
export interface Document extends NewDocument {

    _id: DocumentId;
    _rev?: RevisionId; // we could take out the ? later, too
    _conflicts?: Array<RevisionId>;
    resource: Resource;
    modified: Array<Action>;
    created: Action;
    warnings?: Warnings;
    project?: string; // if set, it means that the document belongs to another project
}


export const toResourceId = (doc: Document): Resource.Id => to([Document.RESOURCE, Resource.ID])(doc);


/**
 * Companion module
 */
export module Document {

    export const CREATED = 'created';
    export const MODIFIED = 'modified';
    export const PROJECT = 'project';
    export const RESOURCE = 'resource';
    export const _REV = '_rev';


    export function clone<D extends NewDocument>(document: D): D {
    
        if (isAssociative(document)) return map(document, clone as any) as any;
        if (isPrimitive(document)) return document;
        
        return (document as any) instanceof Date
            ? new Date(document)
            : ObjectUtils.jsonClone(document);
    }


    export function getLastModified(document: Document): Action {

        return (document.modified && document.modified.length > 0)
            ? document.modified[document.modified.length - 1]
            : document.created as Action;
    }


    export function isValid(document: Document|NewDocument, newDocument = false): boolean {

        if (!document.resource) return false;
        if (!document.resource.id && !newDocument) return false;
        if (!document.resource.relations) return false;
        if (!newDocument && !(document as Document).created) return false;
        if (!newDocument && !(document as Document).modified) return false;

        return true;
    }


    export function getLabel(document: Document, labels: Labels): string {

        return (document.resource.shortDescription)
            ? labels.getFromI18NString(document.resource.shortDescription) + ' (' + document.resource.identifier + ')'
            : document.resource.identifier;
    }


    export function removeFields<D extends Document>(fields: Array<string>) {

        return (document: D): D => {

            const result = {...document};
            result.resource = filter(document.resource, 
                (_propertyValue, propertyKey) => !fields.includes(propertyKey)) as Resource;
            return result as D;
        };
    }


    export function removeRelations<D extends Document>(relations: Array<string>) {

        return (document: D): D => {

            const result = {...document};
            result.resource = {...document.resource};
            result.resource.relations = filter(result.resource.relations,
                (_propertyValue, propertyKey) => !relations.includes(propertyKey))
            return result as D;
        };
    }


    export function removeEmptyRelationArrays(document: Document) {

        const undefinedOrEmptyRelationFields = flow(
            document.resource.relations,
            filter(isUndefinedOrEmpty),
            keys
        );

        return removeRelations(undefinedOrEmptyRelationFields)(document);
    }


    export function hasRelationTarget(document: Document, relationName: string, targetId: string): boolean {

        return Resource.hasRelationTarget(document.resource, relationName, targetId);
    }


    export function hasRelations(document: Document, relationName: string): boolean {

        return Resource.hasRelations(document.resource, relationName);
    }


    export const hasEqualId = (l: Document|undefined) => (r: Document): boolean => (l !== undefined && l.resource.id === r.resource.id);

    export const hasGeometry = (document: Document): boolean => document.resource.geometry? true : false;
}
