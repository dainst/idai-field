/* eslint-disable max-len */
import { getViewPortTransform } from './viewbox-utils';


describe('getViewPortTransform',() => {

    const viewBox = '0 0 100 100';
    const eRect = { x:0, y:0, width: 500, height: 200 };
    

    it('basically scales the viewBox to fit the size of the viewPort (eRect) if no preserveAspectRatio values are provided',() => {

        const expectedTransform = {
            translateX: 0,
            translateY: 0,
            scaleX: 5,
            scaleY: 2,
        };

        expect(getViewPortTransform(viewBox,'none none',eRect)).toEqual(expectedTransform);
    });


    it('it scales (preserving aspect ratio) and translates viewBox objects to the center of the viewport such that the entire viewBox is visible within the SVG viewport if preserveAspectRatio is xMidYMid meet', () => {
        
        const expectedTransform = {
            translateX: 150,
            translateY: 0,
            scaleX: 2,
            scaleY: 2,
        };
        expect(getViewPortTransform(viewBox,'xMidYMid meet',eRect)).toEqual(expectedTransform);
        
    });

    it('sets preserveAspectRatio to xMidYMid meet if argument is undefined',() => {

        const expectedTransform = {
            translateX: 150,
            translateY: 0,
            scaleX: 2,
            scaleY: 2,
        };
        expect(getViewPortTransform(viewBox,undefined,eRect)).toEqual(expectedTransform);
    });


    it('it scales (preserving aspect ratio) and translates viewBox objects to the center of the viewport such that the entire SVG viewport is covered if preserveAspectRatio is xMidYMid slice',() => {

        const expectedTransform = {
            translateX: 0,
            translateY: -150,
            scaleX: 5,
            scaleY: 5,
        };
        expect(getViewPortTransform(viewBox,'xMidYMid slice',eRect)).toEqual(expectedTransform);
    });


    it('scales and aligns the the viewbox with the maximum X and midpoint Y of the SVG viewport if preserveAspectRatio is xMidYMax',()=>{
        
        const expectedTransform = {
            translateX: 300,
            translateY: 0,
            scaleX: 2,
            scaleY: 2,
        };

        expect(getViewPortTransform(viewBox,'xMaxYMid meet',eRect)).toEqual(expectedTransform);
    });

    it('scales and translates correct if viewbox and viewport x and y values are != 0', () => {

        const viewBox = '5 10 100 50';
        const viewPort = {
            x: 20,
            y: 40,
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

        expect(getViewPortTransform(viewBox,'xMidYMid meet',viewPort)).toEqual(expectedTransform);
    });

    it('transform the testproject without problems', () => {
      
        
        const viewBox = [
            27.188940048217773,
            39.14105033874512,
            27.189414739608765 - 27.188940048217773,
            39.141438484191895 - 39.14105033874512].join(' ');
        const viewPort = {
                x: 20,
                y: 40,
                width: 1200,
                height: 500,
        };
        const expectedTransform = {
            translateX: -68732190.0124547,
            translateY: -50420557.05159705,
            scaleX: 1288176.9041769041,
            scaleY: 1288176.9041769041,
        };
        const viewPortTransform = getViewPortTransform(viewBox,'xMidYMid meet',viewPort);

        expect(viewPortTransform.translateX).toBeCloseTo(expectedTransform.translateX,4);
        expect(viewPortTransform.translateY).toBeCloseTo(expectedTransform.translateY,4);
        expect(viewPortTransform.scaleX).toBeCloseTo(expectedTransform.scaleX,4);
        expect(viewPortTransform.scaleY).toBeCloseTo(expectedTransform.scaleY,4);

    });
  
});