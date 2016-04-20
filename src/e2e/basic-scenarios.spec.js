describe('idai field app', function() {

    it('should create a new object of type object ', function() {
        browser.get('/');

        element(by.id('object-overview-button-create-object')).click().then(function(){
            element(by.id('create-object-option-0')).click().then(function(){
                
                element(by.id('object-edit-input-identifier')).sendKeys('12345');
                expect(element(by.id('object-overview-identifier-0')).getText()).toEqual("12345");
            });
        });
    });
});
