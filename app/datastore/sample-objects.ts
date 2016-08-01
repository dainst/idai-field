import {IdaiFieldDocument} from '../model/idai-field-document';

export var DOCS: IdaiFieldDocument[] = [
    {
        "id" : "o1", "resource" : { "id": "o1",
            "identifier": "ob1",
            "title": "Obi One Kenobi",
            "cuts" : ["o2"],
            "type": "object"
        },
        "synced": 0
    },
    {
        "id" : "o2", "resource" : { "id" : "o2",
            "identifier": "ob2",
            "title": "Qui Gon Jinn",
            "isCutBy" : ["o1"],
            "type": "object"
        },
        "synced": 0
    },
    {
        "id" : "o3", "resource" : { "id": "o3",
            "identifier": "ob3", "title": "Luke Skywalker", "type": "object"
        },
        "synced": 0
    },
    {
        "id" : "o4", "resource" : { "id": "o4",
            "identifier": "ob4", "title": "Han Solo", "type": "object"
        },
        "synced": 0
    },
    {
        "id" : "o5", "resource" : { "id": "o5",
            "identifier": "ob5", "title": "Boba Fett", "type": "object"
        },
        "synced": 0
    }
];