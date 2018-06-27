import {Static} from '../../../../static';
import {IdaiFieldDocument} from 'idai-components-2/field';
import {NavigationPath} from '../../../../../../app/components/resources/state/navpath/navigation-path';
import {toResourceId} from '../../../../../../app/components/resources/state/navpath/navigation-path-segment';

/**
 * @author Daniel de Oliveira
 */
describe('NavigationPath', () => {


    it('go back and forth between two segments', () => {

        let navPath: NavigationPath = NavigationPath.empty();

        const featureDocument1 = Static.ifDoc('Feature 1','feature1','Feature', 'f1');
        const featureDocument2 = Static.ifDoc('Feature 2','feature2','Feature', 'f2');

        navPath = NavigationPath.setNewSelectedSegmentDoc(navPath, featureDocument1);

        expect(navPath.segments.length).toEqual(1);
        expect(toResourceId(navPath.segments[0])).toEqual(featureDocument1.resource.id);
        expect(navPath.selectedSegmentId).toEqual(featureDocument1.resource.id);

        navPath = NavigationPath.setNewSelectedSegmentDoc(navPath, featureDocument2);

        expect(navPath.segments.length).toEqual(2);
        expect(toResourceId(navPath.segments[1])).toEqual(featureDocument2.resource.id);
        expect(navPath.selectedSegmentId).toEqual(featureDocument2.resource.id);

        navPath = NavigationPath.setNewSelectedSegmentDoc(navPath, featureDocument1);

        expect(navPath.segments.length).toEqual(2);
        expect(navPath.selectedSegmentId).toEqual(featureDocument1.resource.id);

        navPath = NavigationPath.setNewSelectedSegmentDoc(navPath, featureDocument2);

        expect(navPath.segments.length).toEqual(2);
        expect(navPath.selectedSegmentId).toEqual(featureDocument2.resource.id);
    });


    it('replace last segment after going back once', () => {

        let navPath: NavigationPath = NavigationPath.empty();

        const featureDocument1 = Static.ifDoc('Feature 1','feature1','Feature', 'f1');
        const featureDocument2 = Static.ifDoc('Feature 2','feature2','Feature', 'f2');
        const featureDocument3 = Static.ifDoc('Feature 3','feature3','Feature', 'f3');

        navPath = NavigationPath.setNewSelectedSegmentDoc(navPath, featureDocument1);

        expect(navPath.segments.length).toEqual(1);
        expect(toResourceId(navPath.segments[0])).toEqual(featureDocument1.resource.id);
        expect(navPath.selectedSegmentId).toEqual(featureDocument1.resource.id);

        navPath = NavigationPath.setNewSelectedSegmentDoc(navPath, featureDocument2);

        expect(navPath.segments.length).toEqual(2);
        expect(toResourceId(navPath.segments[1])).toEqual(featureDocument2.resource.id);
        expect(navPath.selectedSegmentId).toEqual(featureDocument2.resource.id);

        navPath = NavigationPath.setNewSelectedSegmentDoc(navPath, featureDocument1);

        expect(navPath.segments.length).toEqual(2);
        expect(navPath.selectedSegmentId).toEqual(featureDocument1.resource.id);

        navPath = NavigationPath.setNewSelectedSegmentDoc(navPath, featureDocument3);

        expect(navPath.segments.length).toEqual(2);
        expect(toResourceId(navPath.segments[1])).toEqual(featureDocument3.resource.id);
        expect(navPath.selectedSegmentId).toEqual(featureDocument3.resource.id);
    });


    it('replace first segment after going back', () => {

        let navPath: NavigationPath = NavigationPath.empty();

        const featureDocument1 = Static.ifDoc('Feature 1','feature1','Feature', 'f1');
        const featureDocument2 = Static.ifDoc('Feature 2','feature2','Feature', 'f2');
        const featureDocument3 = Static.ifDoc('Feature 3','feature3','Feature', 'f3');

        navPath = NavigationPath.setNewSelectedSegmentDoc(navPath, featureDocument1);

        expect(navPath.segments.length).toEqual(1);
        expect(toResourceId(navPath.segments[0])).toEqual(featureDocument1.resource.id);
        expect(navPath.selectedSegmentId).toEqual(featureDocument1.resource.id);

        navPath = NavigationPath.setNewSelectedSegmentDoc(navPath, featureDocument2);

        expect(navPath.segments.length).toEqual(2);
        expect(toResourceId(navPath.segments[1])).toEqual(featureDocument2.resource.id);
        expect(navPath.selectedSegmentId).toEqual(featureDocument2.resource.id);

        navPath = NavigationPath.setNewSelectedSegmentDoc(navPath, undefined);

        expect(navPath.segments.length).toEqual(2);
        expect(navPath.selectedSegmentId).toEqual(undefined);

        navPath = NavigationPath.setNewSelectedSegmentDoc(navPath, featureDocument3);

        expect(navPath.segments.length).toEqual(1);
        expect(toResourceId(navPath.segments[0])).toEqual(featureDocument3.resource.id);
        expect(navPath.selectedSegmentId).toEqual(featureDocument3.resource.id);
    });
});
