import {Component, Input, Output, EventEmitter, OnChanges, ViewChild} from '@angular/core';
import {Messages} from 'idai-components-2';
import {ProjectConfiguration, IdaiType} from 'idai-components-2';

@Component({
    moduleId: module.id,
    selector: 'type-switcher-button',
    templateUrl: './type-switcher-button.html',
    host: {
        '(document:click)': 'handleClick($event)',
    }
})

/**
 * @author Thomas Kleinke
 */
export class TypeSwitcherButtonComponent implements OnChanges{

    @Input() type: string;

    @Output() onTypeChanged: EventEmitter<string> = new EventEmitter<string>();

    @ViewChild('popover') private popover: any;

    private typesTreeList: Array<IdaiType>;


    constructor(private projectConfiguration: ProjectConfiguration,
                private messages: Messages) {}


    ngOnChanges() {

        this.initializeTypes();
    }


    public isTypeSwitchingPossible(): boolean {

        return this.typesTreeList
            && this.typesTreeList.length > 0
            && this.typesTreeList[0].children
            && this.typesTreeList[0].children.length > 0;
    }


    public chooseType(type: IdaiType) {

        this.type = type.name;
        this.onTypeChanged.emit(type.name);
    }


    private initializeTypes() {

        const typeObject: IdaiType = this.projectConfiguration.getTypesMap()[this.type];
        if (typeObject.parentType && !typeObject.parentType.isAbstract) {
            this.typesTreeList = [typeObject.parentType];
        } else {
            this.typesTreeList = [typeObject];
        }
    }


    private handleClick(event: any) {

        if (!this.popover) return;

        let target = event.target;
        let inside = false;

        do {
            if (target.id === 'type-switcher-button' || target.id === 'type-changer-menu') {
                inside = true;
                break;
            }
            target = target.parentNode;
        } while (target);

        if (!inside) {
            this.popover.close();
        }
    }
}
