import {ImageViewPage} from './image-view.page';
import {ImageOverviewPage} from './image-overview.page';


xdescribe('image view --', function() {

    it('navigate to image overview if the image document could not be found', () => {

        ImageViewPage.get('non-existing-document', 'show');
        ImageOverviewPage.waitForCells();
    });
});