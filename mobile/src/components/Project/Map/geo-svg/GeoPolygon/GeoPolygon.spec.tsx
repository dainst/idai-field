import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import React from 'react';
import { Path } from 'react-native-svg';
import { GeoElementsCommonProps } from '../common-props';
import { GeoPolygon } from './GeoPolygon';


const props: GeoElementsCommonProps = {
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

        const expectedProp = ' M76 5.5 L7.7 5 L12.2 8.1 L1 1 M0 0 L3 3 L7 5 Z';
        expect(wrapper.find(Path).prop('d')).toEqual(expectedProp);
    });
});