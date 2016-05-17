var common = require("./common.js");

describe('valuelist', function() {

    function getOptions() {
        return element(by.tagName("valuelist")).all(by.css('select option'));
    }

    beforeEach(function () {
        browser.get('/');
    });

    it('should select some options of a valuelist and save the values', function () {

        var optionsToSelect = [0, 2, 7, 12];

        common.createObject("o1")
            .then(common.createObject("o2"))
            .then(getOptions)
            .then(function(options) {
                for (var i in options) {
                    if (optionsToSelect.indexOf(parseInt(i)) != -1) {
                        options[i].click();
                    }
                }
            })
            .then(common.saveObject)
            .then(common.selectObject(1))
            .then(common.selectObject(0))
            .then(getOptions)
            .then(function(options) {
                for (var i in options) {
                    if (optionsToSelect.indexOf(parseInt(i)) != -1) {
                        expect(options[i].getAttribute('selected')).toEqual("true");
                    } else {
                        expect(options[i].getAttribute('selected')).toBe(null);
                    }
                }
            });
    });
});

