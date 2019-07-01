import {ImageViewPage} from './image-view.page';
import {MediaOverviewPage} from '../media/media-overview.page';


xdescribe('image view --', function() {

    it('navigate to media overview if the image document could not be found', () => {

        ImageViewPage.get('non-existing-document', 'show');
        MediaOverviewPage.waitForCells();
    });
});