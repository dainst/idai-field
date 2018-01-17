import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {NavigationService} from '../../../../app/components/resources/navigation-service';
import {Static} from '../../helper/static';
import {NavigationPath} from '../../../../app/components/resources/navigation-path';


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export function main() {

    let navigationService: NavigationService;
    let viewFacade;

    let trenchDocument: IdaiFieldDocument;
    let featureDocument1: IdaiFieldDocument;
    let featureDocument2: IdaiFieldDocument;
    let featureDocument3: IdaiFieldDocument;
    let featureDocument4: IdaiFieldDocument;


    describe('NavigationService', () => {

        beforeEach(() => {

            viewFacade = jasmine.createSpyObj('viewFacade',
                ['isInOverview', 'getNavigationPath', 'setNavigationPath']);
            viewFacade.isInOverview.and.callFake(() => false);

            navigationService = new NavigationService(undefined, undefined, viewFacade);

            trenchDocument = Static.doc('Trench','trench','Trench','t') as IdaiFieldDocument;
            featureDocument1
                = Static.doc('Feature 1','feature1','Feature','f1') as IdaiFieldDocument;
            featureDocument2
                = Static.doc('Feature 2','feature2','Feature','f2') as IdaiFieldDocument;
            featureDocument3
                = Static.doc('Feature 3','feature3','Feature','f3') as IdaiFieldDocument;
            featureDocument4
                = Static.doc('Feature 4','feature4','Feature','f4') as IdaiFieldDocument;

            featureDocument1.resource.relations['isRecordedIn'] = ['t'];
            featureDocument2.resource.relations['isRecordedIn'] = ['t'];
            featureDocument3.resource.relations['isRecordedIn'] = ['t'];
            featureDocument4.resource.relations['isRecordedIn'] = ['t'];

            featureDocument2.resource.relations['liesWithin'] = ['f1'];
            featureDocument3.resource.relations['liesWithin'] = ['f2'];
            featureDocument4.resource.relations['liesWithin'] = ['f1'];
        });


        it('build path while navigating, first element', () => {

            const navigationPath: NavigationPath = { elements: [] };

            viewFacade.getNavigationPath.and.callFake(() => navigationPath);

            navigationService.moveInto(featureDocument1);
            expect(viewFacade.setNavigationPath).toHaveBeenCalledWith({
                elements: [featureDocument1],
                rootDocument: featureDocument1
            });
        });


        it('build path while navigating, subsequent element', () => {

            const navigationPath: NavigationPath = {
                elements: [featureDocument1],
                rootDocument: featureDocument1
            };

            viewFacade.getNavigationPath.and.callFake(() => navigationPath);

            navigationService.moveInto(featureDocument2);
            expect(viewFacade.setNavigationPath).toHaveBeenCalledWith({
                elements: [featureDocument1, featureDocument2],
                rootDocument: featureDocument2
            });
        });



        it('allow switching back to previous path elements without losing path', () => {

            const navigationPath: NavigationPath = {
                elements: [featureDocument1, featureDocument2, featureDocument3],
                rootDocument: featureDocument2
            };

            viewFacade.getNavigationPath.and.callFake(() => navigationPath);

            navigationService.moveInto(featureDocument1);
            expect(viewFacade.setNavigationPath).toHaveBeenCalledWith({
                elements: [featureDocument1, featureDocument2, featureDocument3],
                rootDocument: featureDocument1
            });
        });


        it('delete path elements when choosing new branch', () => {

            const navigationPath: NavigationPath = {
                elements: [featureDocument1, featureDocument2, featureDocument3],
                rootDocument: featureDocument1
            };

            viewFacade.getNavigationPath.and.callFake(() => navigationPath);

            navigationService.moveInto(featureDocument4);
            expect(viewFacade.setNavigationPath).toHaveBeenCalledWith({
                elements: [featureDocument1, featureDocument4],
                rootDocument: featureDocument4
            });
        });
    });
}