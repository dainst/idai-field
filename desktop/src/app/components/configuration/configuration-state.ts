import { Injectable } from '@angular/core';
import { StateSerializer } from '../../services/state-serializer';


/**
 * @author Thomas Kleinke
 */
@Injectable()
export class ConfigurationState {

    private selectedCategoriesFilterName: string;
    private selectedCategoryName: string;
    private selectedGroupName: string;


    constructor(private stateSerializer: StateSerializer) {}


    public getSelectedCategoriesFilterName(): string {

        return this.selectedCategoriesFilterName;
    }


    public async setSelectedCategoriesFilterName(selectedCategoriesFilterName: string) {

        this.selectedCategoriesFilterName = selectedCategoriesFilterName;
        await this.store();
    }


    public getSelectedCategoryName(): string {

        return this.selectedCategoryName;
    }


    public setSelectedCategoryName(selectedCategoryName: string) {

        this.selectedCategoryName = selectedCategoryName;
    }


    public getSelectedGroupName(): string {

        return this.selectedGroupName;
    }


    public setSelectedGroupName(selectedGroupName: string) {

        this.selectedGroupName = selectedGroupName;
    }
   

    public async load() {

        const loadedState: any = await this.stateSerializer.load('configuration-state');

        if (loadedState.selectedCategoriesFilterName) {
            this.selectedCategoriesFilterName = loadedState.selectedCategoriesFilterName;
        }
    }


    public async store() {

        await this.stateSerializer.store(this.createSerializationObject(), 'configuration-state');
    }


    private createSerializationObject(): any {

        return {
            selectedCategoriesFilterName: this.selectedCategoriesFilterName
        };
    }
}
