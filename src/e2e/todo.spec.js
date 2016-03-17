describe('idai field app', function() {

    it('should the correct title', function() {
        browser.get('/');
        expect(browser.getTitle()).toEqual("iDAI.field 2")
    });
});