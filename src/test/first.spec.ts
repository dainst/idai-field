import {describe,expect,it,xit, inject, beforeEachProviders} from 'angular2/testing';

export function main() {
    describe('TestDemo', () => {

        it('should be true', () => {
            expect(true).toBe(true);
        });

        it('should also be true', () => {
            expect(false).toBe(false);
        });
    });
}