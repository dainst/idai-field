/**
 * @author Daniel de Oliveira
 */
export class DoceditActiveTabService {


    private activeTab: any;


    public getActiveTab() {

        return this.activeTab;
    }


    public setActiveTab(activeTab: any) {

        this.activeTab = activeTab;
    }
}