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

        const canvas = d3.select('#matrix')
            .attr('width', matrix.columnCount * (COLUMN_WIDTH + MARGIN) + MARGIN * 2)
            .attr('height', matrix.rowCount * (ROW_HEIGHT + MARGIN) + MARGIN * 2);

        canvas.selectAll('g').remove();

        this.createNodeElements(matrix);
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
}