import { Field, Document } from "idai-field-core";

export type AffectedDocument = {
    document: Document,
    fields: Array<Field>
}