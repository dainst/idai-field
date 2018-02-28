import * as d3 from 'd3';
import {Component, Input, OnChanges} from '@angular/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {MatrixBuilder, TreeNode} from './matrix-builder';
import {Matrix} from './matrix';


const COLUMN_WIDTH: number = 70;
const ROW_HEIGHT: number = 70;
const MARGIN: number = 14;


@Component({
    moduleId: module.id,
    selector: 'matrix',
    templateUrl: './matrix.html'
})
/**
 * @author Thomas Kleinke
 */
export class MatrixComponent implements OnChanges {

    @Input() documents: Array<IdaiFieldDocument>;


    ngOnChanges() {

        const matrix: Matrix = new MatrixBuilder().build(this.documents);
        MatrixComponent.update(matrix);
    }


    private static update(matrix: Matrix) {

        d3.select('#matrix')
            .attr('width', matrix.columnCount * (COLUMN_WIDTH + MARGIN) + MARGIN * 2)
            .attr('height', matrix.rowCount * (ROW_HEIGHT + MARGIN) + MARGIN * 2);


        this.removeNodeElements();
        this.removeLines();

        this.createNodeElements(matrix);
        this.createLines(matrix);
    }


    private static removeNodeElements() {

        d3.select('#matrix').selectAll('g').remove();
    }


    private static removeLines() {

        d3.select('#matrix').selectAll('line').remove();
    }

    private static createNodeElements(matrix: Matrix) {

        const nodeElements = d3.select('#matrix').selectAll('g')
            .data(matrix.nodes)
            .enter()
            .append('g')
            .attr('transform', node => {
                return 'translate(' + (node.column as number * (COLUMN_WIDTH + MARGIN) + MARGIN)
                    + ',' + (node.row as number * (ROW_HEIGHT + MARGIN) + MARGIN) + ')';
            });

        this.createCircles(nodeElements);
        this.createTextLabels(nodeElements);
    }


    private static createCircles(nodeElements: d3.Selection<d3.BaseType, TreeNode, d3.BaseType, {}>) {

        nodeElements.append('circle')
            .attr('cx', COLUMN_WIDTH / 2)
            .attr('cy', ROW_HEIGHT / 2)
            .attr('r', ROW_HEIGHT / 2)
            .attr('stroke', 'black')
            .attr('stroke-width', 2)
            .attr('fill', '#748db5');
    }


    private static createTextLabels(nodeElements: d3.Selection<d3.BaseType, TreeNode, d3.BaseType, {}>) {

        nodeElements.append('text')
            .attr('x', COLUMN_WIDTH / 2)
            .attr('y', ROW_HEIGHT / 2)
            .attr('text-anchor', 'middle')
            .attr('alignment-baseline', 'middle')
            .attr('font-size', 12)
            .text(node => node.document.resource.identifier);
    }


    private static createLines(matrix: Matrix) {

        d3.select('#matrix').selectAll('line')
            .data(this.getConnections(matrix))
            .enter()
            .append('line')
            .attr('x1', connection => {
                return connection.parent.column as number * (COLUMN_WIDTH + MARGIN) + (COLUMN_WIDTH / 2)
                    + MARGIN;
            })
            .attr('y1', connection => {
                return (connection.parent.row as number + 1) * (ROW_HEIGHT + MARGIN);
            })
            .attr('x2', connection => {
                return connection.child.column as number * (COLUMN_WIDTH + MARGIN) + (COLUMN_WIDTH / 2)
                    + MARGIN;
            })
            .attr('y2', connection => {
                return connection.child.row as number * (ROW_HEIGHT + MARGIN) + MARGIN;
            })
            .attr('stroke', 'black')
            .attr('stroke-width', 2)
            .attr('stroke-opacity', 0.5);
    }


    private static getConnections(matrix: Matrix): Array<{ parent: TreeNode, child: TreeNode }> {

        const connections: Array<{ parent: TreeNode, child: TreeNode }> = [];

        matrix.nodes.forEach(node => {
            node.leftChildren.forEach(child => connections.push({ parent: node, child: child}));
            if (node.belowChild) connections.push({ parent: node, child: node.belowChild });
            node.rightChildren.forEach(child => connections.push({ parent: node, child: child}));
        });

        return connections;
    }
}