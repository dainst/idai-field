import {Component, EventEmitter, Input, Output, Renderer2} from '@angular/core';
import {MenuComponent} from '../../widgets/menu.component';


@Component({
    moduleId: module.id,
    selector: 'matrix-options-menu',
    templateUrl: './matrix-options-menu.html'
})
/**
 * @author Thomas Kleinke
 */
export class MatrixOptionsMenuComponent extends MenuComponent {

    @Input() lineMode: 'ortho'|'curved';
    @Input() clusterMode: 'periods'|'none';

    @Output() onLineModeChanged: EventEmitter<'ortho'|'curved'> = new EventEmitter<'ortho'|'curved'>();
    @Output() onClusterModeChanged: EventEmitter<'periods'|'none'> = new EventEmitter<'periods'|'none'>();


    constructor(renderer: Renderer2) {

        super(renderer, 'matrix-options-button', 'matrix-options-menu');
    }


    public emitLineMode() {

        this.onLineModeChanged.emit(this.lineMode);
    }


    public toggleClusterMode() {

        this.clusterMode = this.clusterMode === 'periods' ? 'none' : 'periods';
        this.onClusterModeChanged.emit(this.clusterMode);
    }
}