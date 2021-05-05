import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import React from 'react';
import { Path } from 'react-native-svg';
import { GeoElementsCommonProps } from '../common-props';
import { GeoPolygon } from './GeoPolygon';


const props: GeoElementsCommonProps = {
    csTransformFunction: (pos) => [pos[0] * 2, pos[1] - 4],
    coordinates: [
        [[1,1],[12.2, 8.1], [7.7, 5], [76, 5.5]],
        [[0,0], [3,3],[7,5]],
    ]
};

configure({ adapter: new Adapter() });

describe('<GeoMultiPolygon />', () => {
    let wrapper: any;
    beforeAll(() => {
        wrapper = shallow(
            <GeoPolygon { ...props } fill="blue" />
        );
    });


    it('should retrun an SVG path',() => {

        expect(wrapper.find(Path)).toHaveLength(1);
    });

    
    it('passes standard SVG props like e.g. fill down to Path component', () => {

        expect(wrapper.find(Path).prop('fill')).toBe('blue');
    });


    it('Applies the csTransform function to the Path prop d',() => {

        const expectedProp = ' M152 1.5 L15.4 1 L24.4 4.1 L2 -3 M0 -4 L6 -1 L14 1 Z';
        expect(wrapper.find(Path).prop('d')).toEqual(expectedProp);
    });
});