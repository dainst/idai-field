"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 */
var Static = (function () {
    function Static() {
    }
    Static.doc = function (sd, identifier, type, id) {
        if (!identifier)
            identifier = 'identifer';
        if (!type)
            type = 'Find';
        var doc = {
            resource: {
                id: "A",
                shortDescription: sd,
                identifier: identifier,
                title: 'title',
                type: type,
                relations: {}
            },
            created: {
                user: 'anonymous',
                date: new Date()
            },
            modified: [
                {
                    user: 'anonymous',
                    date: new Date()
                }
            ]
        };
        if (id) {
            doc['_id'] = id;
            doc.resource['id'] = id;
        }
        else
            delete doc.resource['id'];
        return doc;
    };
    return Static;
}());
Static.idfDoc = function (sd, identifier, type, id) { return Static.doc(sd, identifier, type, id); };
exports.Static = Static;
//# sourceMappingURL=static.js.map