import {Component, Input, OnChanges} from '@angular/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {MatrixBuilder} from './matrix-builder';
import {Matrix} from './matrix';


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

    private matrix: Matrix;


    ngOnChanges() {

        this.matrix = new MatrixBuilder().build(this.documents);
    }

}