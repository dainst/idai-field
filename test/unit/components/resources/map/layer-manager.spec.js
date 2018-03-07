"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var layer_manager_1 = require("../../../../../app/components/resources/map/map/layer-manager");
var static_1 = require("../../../../subsystem/static");
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('LayerManager', function () {
    var layerManager;
    var layerDocuments = [
        static_1.Static.doc('Layer 1', 'layer1', 'Image', 'l1'),
        static_1.Static.doc('Layer 2', 'layer2', 'Image', 'l2'),
    ];
    var mainTypeDocument = static_1.Static.doc('Main Type Document', 'MTD', 'trench', 'mtd');
    var mockViewFacade;
    beforeEach(function () {
        var mockDatastore = jasmine.createSpyObj('datastore', ['find']);
        mockDatastore.find.and.returnValue(Promise.resolve({ documents: layerDocuments }));
        var mockImageTypeUtility = jasmine.createSpyObj('imageTypeUtility', ['getImageTypeNames']);
        mockImageTypeUtility.getImageTypeNames.and.returnValue(['Image']);
        mockViewFacade = jasmine.createSpyObj('viewFacade', ['getActiveLayersIds', 'setActiveLayersIds']);
        mockViewFacade.getActiveLayersIds.and.returnValue([]);
        layerManager = new layer_manager_1.LayerManager(mockDatastore, mockImageTypeUtility, mockViewFacade);
    });
    it('initialize layers', function (done) { return __awaiter(_this, void 0, void 0, function () {
        var _a, layers, activeLayersChange;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, layerManager.initializeLayers(true)];
                case 1:
                    _a = _b.sent(), layers = _a.layers, activeLayersChange = _a.activeLayersChange;
                    expect(layers.length).toBe(2);
                    expect(layers[0].resource.id).toEqual('l1');
                    expect(layers[1].resource.id).toEqual('l2');
                    expect(activeLayersChange.added.length).toBe(0);
                    expect(activeLayersChange.removed.length).toBe(0);
                    done();
                    return [2 /*return*/];
            }
        });
    }); });
    it('restore active layers from resources state', function (done) { return __awaiter(_this, void 0, void 0, function () {
        var activeLayersChange;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    mockViewFacade.getActiveLayersIds.and.returnValue(['l2']);
                    return [4 /*yield*/, layerManager.initializeLayers(true)];
                case 1:
                    activeLayersChange = (_a.sent()).activeLayersChange;
                    expect(activeLayersChange.added.length).toBe(1);
                    expect(activeLayersChange.added[0]).toEqual('l2');
                    expect(activeLayersChange.removed.length).toBe(0);
                    done();
                    return [2 /*return*/];
            }
        });
    }); });
    it('add and remove correct layers when initializing with different resources states', function (done) { return __awaiter(_this, void 0, void 0, function () {
        var activeLayersChange;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    mockViewFacade.getActiveLayersIds.and.returnValue(['l2']);
                    return [4 /*yield*/, layerManager.initializeLayers(true)];
                case 1:
                    _a.sent();
                    mockViewFacade.getActiveLayersIds.and.returnValue(['l1']);
                    return [4 /*yield*/, layerManager.initializeLayers(true)];
                case 2:
                    activeLayersChange = (_a.sent()).activeLayersChange;
                    expect(activeLayersChange.added.length).toBe(1);
                    expect(activeLayersChange.added[0]).toEqual('l1');
                    expect(activeLayersChange.removed.length).toBe(1);
                    expect(activeLayersChange.removed[0]).toEqual('l2');
                    done();
                    return [2 /*return*/];
            }
        });
    }); });
    it('add or remove no layers if the layers are initialized with the same resources state again', function (done) { return __awaiter(_this, void 0, void 0, function () {
        var activeLayersChange;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    mockViewFacade.getActiveLayersIds.and.returnValue(['l2']);
                    return [4 /*yield*/, layerManager.initializeLayers(true)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, layerManager.initializeLayers(true)];
                case 2:
                    activeLayersChange = (_a.sent()).activeLayersChange;
                    expect(activeLayersChange.added.length).toBe(0);
                    expect(activeLayersChange.removed.length).toBe(0);
                    done();
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=layer-manager.spec.js.map