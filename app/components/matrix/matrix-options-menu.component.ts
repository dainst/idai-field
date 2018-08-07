import {Component, EventEmitter, Output, Renderer2} from '@angular/core';
import {MenuComponent} from '../../widgets/menu.component';
import {MatrixLineMode, MatrixState} from './matrix-state';


@Component({
    moduleId: module.id,
    selector: 'matrix-options-menu',
    templateUrl: './matrix-options-menu.html'
})
/**
 * @author Thomas Kleinke
 */
export class MatrixOptionsMenuComponent extends MenuComponent {

    @Output() onChange: EventEmitter<void> = new EventEmitter<void>();


    constructor(private matrixState: MatrixState,
                renderer: Renderer2) {

        super(renderer, 'matrix-options-button', 'matrix-options-menu');
    }


    public getLineMode = () => this.matrixState.getLineMode();
    public getClusterMode = () => this.matrixState.getClusterMode();


    public setLineMode(lineMode: MatrixLineMode) {

        this.matrixState.setLineMode(lineMode);
        this.onChange.emit()
    }


    public toggleClusterMode() {

        this.matrixState.setClusterMode(
            this.matrixState.getClusterMode() === 'periods' ? 'none' : 'periods'
        );
        this.onChange.emit();
    }
}