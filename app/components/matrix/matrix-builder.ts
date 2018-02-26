import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {Matrix} from './matrix';


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class MatrixBuilder {

    private documents: Array<IdaiFieldDocument>;
    private rows: Array<Array<IdaiFieldDocument|undefined>>;


    public build(documents: Array<IdaiFieldDocument>): Matrix {

        this.documents = documents;
        this.rows = [];

        const rootDocument: IdaiFieldDocument|undefined = MatrixBuilder.findRootDocument(documents);

        if (!rootDocument) return MatrixBuilder.createEmptyMatrix();

        this.addToRows(rootDocument);

        return {
            rows: this.rows
        };
    }


    private addToRows(document: IdaiFieldDocument, row: number = 0, column: number = 0) {

        if (!this.rows[row]) this.rows[row] = [];

        this.rows[row][column] = document;

        const relations: string[] = document.resource.relations['isAfter'];

        if (!relations) return;

        for (let i = 0; i < relations.length; i++) {
            const isAfterDocument: IdaiFieldDocument|undefined = this.getDocument(relations[i]);
            if (!isAfterDocument) throw 'Document not found: ' + relations[i];

            this.addToRows(isAfterDocument, row + 1, column + i);
        }
    }


    private getDocument(id: string): IdaiFieldDocument|undefined {

        return this.documents.find(document => document.resource.id == id);
    }


    private static findRootDocument(documents: Array<IdaiFieldDocument>): IdaiFieldDocument|undefined {

        return documents.find(document => {
            return document.resource.relations['isAfter'] && !document.resource.relations['isBefore'];
        });
    }


    private static createEmptyMatrix(): Matrix {

        return {
            rows: []
        };
    }
}