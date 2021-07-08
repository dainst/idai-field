import { Query, buildBackendGetParams, parseFrontendGetParams, deleteFilterFromParams } from './query';

test('transform query object to backend GET parameters', () => {

    const query: Query = {
        q: '*',
        filters: [
            {
                field: 'field1',
                value: 'value1'
            },
            {
                field: 'field2',
                value: 'value2'
            }
        ],
        not: [
            {
                field: 'field3',
                value: 'value3'
            },
            {
                field: 'field4',
                value: 'value4'
            }
        ],
        exists: ['field5', 'field6'],
        size: 42,
        from: 23
    };

    const result = buildBackendGetParams(query);
    expect(result.length).toBeGreaterThan(0);

    const splitResult = result.split('&');

    expect(splitResult).toContain('q=*');
    expect(splitResult).toContain('filters[]=field1:value1');
    expect(splitResult).toContain('filters[]=field2:value2');
    expect(splitResult).toContain('not[]=field3:value3');
    expect(splitResult).toContain('not[]=field4:value4');
    expect(splitResult).toContain('exists[]=field5');
    expect(splitResult).toContain('exists[]=field6');
    expect(splitResult).toContain('size=42');
    expect(splitResult).toContain('from=23');

});

test('transform frontend GET parameters to query object', () => {

    const params = 'q=asdf&field1=value1&field2=value2';
    
    const query = parseFrontendGetParams(params);

    expect(query.q).toBe('asdf');
    expect(query.filters).toContainEqual({ field: 'field1', value: 'value1' });
    expect(query.filters).toContainEqual({ field: 'field2', value: 'value2' });
});


test('transform frontend GET parameters to query object and create filters array', () => {

    const params = 'q=qwer&field1=value1&field2=value2';
    
    const query = parseFrontendGetParams(params, { q: 'asdf' });

    expect(query.q).toBe('qwer');
    expect(query.filters).toContainEqual({ field: 'field1', value: 'value1' });
    expect(query.filters).toContainEqual({ field: 'field2', value: 'value2' });
});


test('transform frontend GET parameters to query object and return new query instance', () => {

    const params = 'q=qwer&field1=value1&field2=value2';
    
    const oldQuery: Query = { q: 'asdf', filters: [{ field: 'field1', value: 'value1' }] };
    const query = parseFrontendGetParams(params, oldQuery);

    expect(query.q).toBe('qwer');
    expect(query.filters).toContainEqual({ field: 'field1', value: 'value1' });
    expect(query.filters).toContainEqual({ field: 'field2', value: 'value2' });

    expect(query).not.toBe(oldQuery);
});


test('delete filter from params by key', () => {

    const params = new URLSearchParams('q=qwer&field1=value1&field1=value2&field2=value3');

    const newParams = deleteFilterFromParams(params, 'field1');
    
    const entries = Array.from(newParams.entries());
    expect(entries).not.toContainEqual(['field1', 'value1']);
    expect(entries).not.toContainEqual(['field1', 'value2']);
    expect(entries).toContainEqual(['q', 'qwer']);
    expect(entries).toContainEqual(['field2', 'value3']);
});


test('delete filter from params by key and value', () => {

    const params = new URLSearchParams('q=qwer&field1=value1&field1=value2&field2=value3');

    const newParams = deleteFilterFromParams(params, 'field1', 'value2');
    
    const entries = Array.from(newParams.entries());
    expect(entries).not.toContainEqual(['field1', 'value2']);
    expect(entries).toContainEqual(['field1', 'value1']);
    expect(entries).toContainEqual(['q', 'qwer']);
    expect(entries).toContainEqual(['field2', 'value3']);
});


test('delete filter from params by key and return new params instance', () => {

    const params = new URLSearchParams('q=qwer&field1=value1&field1=value2&field2=value3');

    const newParams = deleteFilterFromParams(params, 'field1');
    
    expect(newParams).not.toBe(params);
});
