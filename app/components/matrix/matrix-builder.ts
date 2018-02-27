import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {Matrix} from './matrix';


export interface TreeNode {

    document: IdaiFieldDocument;
    leftChildren: Array<TreeNode>;
    belowChild?: TreeNode;
    rightChildren: Array<TreeNode>;
    row?: number;
    column?: number;
}


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class MatrixBuilder {

    private documents: Array<IdaiFieldDocument>;
    private treeNodes: { [resourceId: string]: TreeNode };
    private rows: Array<Array<IdaiFieldDocument|undefined>>;


    public build(documents: Array<IdaiFieldDocument>): Matrix {

        this.documents = documents;
        this.treeNodes = {};
        this.rows = [];

        const rootDocument: IdaiFieldDocument|undefined = MatrixBuilder.findRootDocument(documents);

        if (!rootDocument) return MatrixBuilder.createEmptyMatrix();

        const rootNode: TreeNode = this.buildTreeNode(rootDocument);

        this.addToRows(rootNode);

        return {
            rows: this.rows,
            nodes: Object.values(this.treeNodes),
            rowCount: this.rows.length,
            columnCount: this.getMatrixColumnCount()
        };
    }


    private buildTreeNode(document: IdaiFieldDocument): TreeNode {

        const treeNode: TreeNode = { document: document, leftChildren: [], rightChildren: [] };

        const relations: string[] = document.resource.relations['isAfter'];

        if (!relations) return treeNode;

        const hasBelowChild: boolean = relations.length % 2 == 1;
        const sideChildrenCount: number = Math.floor(relations.length / 2);

        for (let i = 0; i < relations.length; i++) {
            const isAfterDocument: IdaiFieldDocument|undefined = this.getDocument(relations[i]);
            if (!isAfterDocument) throw 'Document not found: ' + relations[i];

            const childNode: TreeNode = this.getTreeNode(isAfterDocument);

            if (i < sideChildrenCount) {
                treeNode.leftChildren.push(childNode);
            } else if (i == sideChildrenCount && hasBelowChild) {
                treeNode.belowChild = childNode;
            } else {
                treeNode.rightChildren.push(childNode);
            }
        }

        return treeNode;
    }


    private getTreeNode(document: IdaiFieldDocument): TreeNode {

        const resourceId = document.resource.id as string;

        if (!this.treeNodes[resourceId]) {
            this.treeNodes[resourceId] = this.buildTreeNode(document);
        }

        return this.treeNodes[resourceId];
    }


    private addToRows(treeNode: TreeNode, row: number = 0, columnOffset: number = 0) {

        const column: number = MatrixBuilder.getLeftSizeNodeWidth(treeNode) + columnOffset;

        if (treeNode.row !== undefined && treeNode.column !== undefined) {
            this.rows[treeNode.row][treeNode.column] = undefined;
            if (treeNode.row != row) treeNode.row = Math.max(treeNode.row, row);
            treeNode.column = Math.floor((treeNode.column + column) / 2);
        } else {
            treeNode.row = row;
            treeNode.column = column;
        }

        this.switchRowIfCurrentFieldIsOccupied(treeNode);

        if (!this.rows[treeNode.row]) this.rows[treeNode.row] = [];
        this.rows[treeNode.row][treeNode.column] = treeNode.document;

        let currentColumn: number = columnOffset;

        treeNode.leftChildren.forEach(childNode => {
            this.addToRows(childNode, row + 1, currentColumn);
            currentColumn += MatrixBuilder.getNodeColumnWidth(childNode);
        });

        if (treeNode.belowChild) {
            this.addToRows(treeNode.belowChild, row + 1, column);
            currentColumn += MatrixBuilder.getNodeColumnWidth(treeNode.belowChild);
        } else {
            currentColumn++;
        }

        treeNode.rightChildren.forEach(childNode => {
            this.addToRows(childNode, row + 1, currentColumn);
            currentColumn += MatrixBuilder.getNodeColumnWidth(childNode);
        });
    }


    private getDocument(id: string): IdaiFieldDocument|undefined {

        return this.documents.find(document => document.resource.id == id);
    }


    private switchRowIfCurrentFieldIsOccupied(treeNode: TreeNode) {

        if (treeNode.row === undefined || treeNode.column === undefined) throw 'TreeNode position is not set';

        while (this.rows[treeNode.row] && this.rows[treeNode.row][treeNode.column]) {
            treeNode.row++;
        }
    }


    private getMatrixColumnCount(): number {

        let maxWidth: number = 0;
        this.rows.forEach(row => maxWidth = Math.max(maxWidth, row.length));

        return maxWidth;
    }


    private static findRootDocument(documents: Array<IdaiFieldDocument>): IdaiFieldDocument|undefined {

        return documents.find(document => {
            return document.resource.relations['isAfter'] && !document.resource.relations['isBefore'];
        });
    }


    private static getLeftSizeNodeWidth(treeNode: TreeNode): number {

        let leftBranchChildren: number = 0;

        treeNode.leftChildren.forEach(childNode => {
            leftBranchChildren += this.getNodeColumnWidth(childNode);
        });

        if (treeNode.belowChild) leftBranchChildren += this.getLeftSizeNodeWidth(treeNode.belowChild);

        return leftBranchChildren;
    }


    private static getNodeColumnWidth(treeNode: TreeNode): number {

        let columns: number = 1;

        treeNode.leftChildren.forEach(childNode => columns += this.getNodeColumnWidth(childNode));
        treeNode.rightChildren.forEach(childNode => columns += this.getNodeColumnWidth(childNode));

        return columns;
    }


    private static createEmptyMatrix(): Matrix {

        return {
            rows: [],
            nodes: [],
            rowCount: 0,
            columnCount: 0
        };
    }
}