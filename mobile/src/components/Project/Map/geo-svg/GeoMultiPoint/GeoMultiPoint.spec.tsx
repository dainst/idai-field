import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import React from 'react';
import { GeoElementsCommonProps } from '../common-props';
import { GeoPoint } from '../GeoPoint/GeoPoint';
import { GeoMultiPoint } from './GeoMultiPoint';


const props: GeoElementsCommonProps = {
    coordinates: [[2,2],[1,3],[5,8],[14,4],[7,3]],
};

configure({ adapter: new Adapter() });

describe('<GeoMultiPoint />',() => {
    let wrapper: any;
    beforeAll(() => {
        wrapper = shallow(
            <GeoMultiPoint { ...props } />);
    });

    it('renders a circle for each coordinate',() => {

        expect(wrapper.find(GeoPoint)).toHaveLength(props.coordinates.length);
    });

    it('applies correct coordinates to GeoPoints props',() => {

        wrapper.find(GeoPoint).forEach((node: any, i:number) => {
            expect(node.prop('coordinates')).toEqual(props.coordinates[i]);
        });
    });
});