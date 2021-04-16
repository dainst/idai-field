import { navigateTo, resetApp, start, stop, waitForExist } from '../app';
import { ImageOverviewPage } from './image-overview.page';
import { NavbarPage } from '../navbar.page';

const path = require('path');


describe('images/upload --', () => {

    // image is already present in mediastore folder since uploading does not work in HttpMediastore
    const imageFileName: string = 'Aldrin_Apollo_11.jpg';


    beforeAll(async done => {

        await start();
        done();
    });


    beforeEach(async done => {

        await navigateTo('settings');
        await resetApp();
        await navigateTo('images');
        await ImageOverviewPage.waitForCells();
        done();
    });


    afterAll(async done => {

        await stop();
        done();
    });


    const uploadImage = async () => {

        await ImageOverviewPage.uploadImage(path.resolve(__dirname, '../../../../../test-data/' + imageFileName));
        await ImageOverviewPage.chooseImageSubcategory(0);
    };


    it('image upload should create a JSON document, which in turn gets displayed in the grid', async done => {

        await uploadImage();
        await waitForExist(await ImageOverviewPage.getCellByIdentifier(imageFileName));
        
        done();
    });


    it('do not allow uploading an image with a duplicate filename', async done => {

        await uploadImage();
        await waitForExist(await ImageOverviewPage.getCellByIdentifier(imageFileName));
        await uploadImage();
        await NavbarPage.awaitAlert('Ein Bild mit dem gleichen Dateinamen existiert bereits', false);

        done();
    });
});
