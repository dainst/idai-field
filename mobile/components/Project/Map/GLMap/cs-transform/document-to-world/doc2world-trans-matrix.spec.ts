/* eslint-disable max-len */
import { CSBox } from '../types';
import { getDocumentToWorldTransform } from './doc2world-trans-matrix';


describe('getViewPortTransform',() => {

    const viewBox: CSBox = { minX: 0, minY: 0, width: 100, height: 100 };
    const eRect = { minX:0, minY:0, width: 500, height: 200 };
    

    it('basically scales the dcoument coordinate system to fit the size of the world coordinate system (eRect) if no preserveAspectRatio values are provided',() => {

        const expectedTransform = {
            translateX: 0,
            translateY: 0,
            scaleX: 5,
            scaleY: 2,
        };

        expect(getDocumentToWorldTransform(viewBox,eRect, 'none none')).toEqual(expectedTransform);
    });


    it('it scales (preserving aspect ratio) and translates document cs objects to the center of the world cs such that the entire document cs is visible within the world cs if preserveAspectRatio is xMidYMid meet', () => {
        
        const expectedTransform = {
            translateX: 150,
            translateY: 0,
            scaleX: 2,
            scaleY: 2,
        };
        expect(getDocumentToWorldTransform(viewBox,eRect, 'xMidYMid meet')).toEqual(expectedTransform);
        
    });

    it('sets preserveAspectRatio to xMidYMid meet if argument is undefined',() => {

        const expectedTransform = {
            translateX: 150,
            translateY: 0,
            scaleX: 2,
            scaleY: 2,
        };
        expect(getDocumentToWorldTransform(viewBox,eRect)).toEqual(expectedTransform);
    });


    it('it scales (preserving aspect ratio) and translates documents objects to the center of the world cs such that the entire document cs is covered if preserveAspectRatio is xMidYMid slice',() => {

        const expectedTransform = {
            translateX: 0,
            translateY: -150,
            scaleX: 5,
            scaleY: 5,
        };
        expect(getDocumentToWorldTransform(viewBox,eRect, 'xMidYMid slice')).toEqual(expectedTransform);
    });


    it('scales and aligns the the document cs with the maximum X and midpoint Y of the world cs if preserveAspectRatio is xMidYMax',()=>{
        
        const expectedTransform = {
            translateX: 300,
            translateY: 0,
            scaleX: 2,
            scaleY: 2,
        };

        expect(getDocumentToWorldTransform(viewBox,eRect, 'xMaxYMid meet')).toEqual(expectedTransform);
    });

    it('scales and translates correct if document cs and world cs x and y values are != 0', () => {

        const documentCS: CSBox = {
            minX: 5,
            minY: 10,
            width: 100,
            height: 50
        };
        const worldCS: CSBox = {
            minX: 20,
            minY: 40,
            width: 1200,
            height: 500,
        };
        //scaleX = 1200/100 = 12
        //scaleY = 500/50 = 10
        //tX = 20 - (5*12) = -40
        //ty = 40 - (10*10) = -60
        //provided meet for meetOrSlice => scaleX = scaleY = Math.min(scaleX, scaleY) = 10
        //tX = -40 + (1200 - 10*100)/2 = 60
        //tY = -60 + (500 - 50*10)/2 = -60
        const expectedTransform = {
            translateX: 60,
            translateY: -60,
            scaleX: 10,
            scaleY: 10,
        };

        expect(getDocumentToWorldTransform(documentCS,worldCS, 'xMidYMid meet')).toEqual(expectedTransform);
    });

    it('transform the testproject without problems', () => {
      
        
        const documentCS: CSBox = {
            minX: 27.188940048217773,
            minY: 39.14105033874512,
            width: 27.189414739608765 - 27.188940048217773,
            height: 39.141438484191895 - 39.14105033874512
        };
        const worldCS: CSBox = {
                minX: 20,
                minY: 40,
                width: 1200,
                height: 500,
        };
        const expectedTransform = {
            translateX: -68732190.0124547,
            translateY: -50420557.05159705,
            scaleX: 1288176.9041769041,
            scaleY: 1288176.9041769041,
        };
        const viewPortTransform = getDocumentToWorldTransform(documentCS,worldCS,'xMidYMid meet');

        expect(viewPortTransform.translateX).toBeCloseTo(expectedTransform.translateX,4);
        expect(viewPortTransform.translateY).toBeCloseTo(expectedTransform.translateY,4);
        expect(viewPortTransform.scaleX).toBeCloseTo(expectedTransform.scaleX,4);
        expect(viewPortTransform.scaleY).toBeCloseTo(expectedTransform.scaleY,4);

    });
  
});