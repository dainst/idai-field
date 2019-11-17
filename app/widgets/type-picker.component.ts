import {Component, Input, Output, EventEmitter, OnChanges} from '@angular/core';
import {IdaiType} from '../core/configuration/model/idai-type';


@Component({
    selector: 'type-picker',
    moduleId: module.id,
    templateUrl: './type-picker.html'
})
/**
 * @author Thomas Kleinke
 */
export class TypePickerComponent implements OnChanges {

    @Input() typesTreeList: Array<IdaiType>;
    @Input() selectedTypes: string[];
    @Input() allTypesOptionVisible: boolean = false;
    @Input() allowPickingAbstractTypes: boolean = false;

    @Output() onTypePicked: EventEmitter<IdaiType> = new EventEmitter<IdaiType>();


    public types: Array<IdaiType> = [];


    ngOnChanges() {

        this.types = [];

        this.typesTreeList.forEach(type => {
            this.types.push(type);
            if (type.children) this.types = this.types.concat(type.children);
        });
    }


    public pickType(type: IdaiType) {

        if (type && type.isAbstract && !this.allowPickingAbstractTypes) return;

        this.onTypePicked.emit(type);
    }


    public getTypeId(type: IdaiType): string {

        return (this.isChildType(type) ? (type.parentType as IdaiType).name.toLowerCase() + '-' : '')
            + type.name.toLowerCase();
    }


    public isChildType(type: IdaiType): boolean {

        return type.parentType !== undefined
            && this.types.find(typeToCheck => typeToCheck === type.parentType) !== undefined;
    }


    public isParentSelected(type: IdaiType): boolean {

        if (!type.parentType || !this.selectedTypes) return false;

        const parentName: string = type.parentType.name;
        return this.selectedTypes.find(typeName => typeName === parentName) !== undefined;
    }
}