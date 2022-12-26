"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _three = require("three");

var _GeometryLayer2 = _interopRequireDefault(require("./GeometryLayer"));

var _FeatureProcessing = _interopRequireDefault(require("../Process/FeatureProcessing"));

var _Feature2Mesh = _interopRequireDefault(require("../Converter/Feature2Mesh"));

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function () { var Super = (0, _getPrototypeOf2["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2["default"])(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2["default"])(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

/**
 * `FeatureGeometryLayer` displays geographic vector data (geojson, kml...) in object 3D.
 * `FeatureGeometryLayer` is a pre-configured `GeometryLayer` to load and convert vector data.
 * In deed, `GeometryLayer` allows customizing data loading (`update` method)
 * and their conversion (`convert` method),
 *
 * @property {boolean} isFeatureGeometryLayer - Used to checkout whether this layer is
 * a FeatureGeometryLayer. Default is true. You should not change this, as it is used
 * internally for optimisation.
 */
var FeatureGeometryLayer = /*#__PURE__*/function (_GeometryLayer) {
  (0, _inherits2["default"])(FeatureGeometryLayer, _GeometryLayer);

  var _super = _createSuper(FeatureGeometryLayer);

  /**
   * @constructor
   * @extends GeometryLayer
   *
   * @param {string} id - The id of the layer, that should be unique. It is
   * not mandatory, but an error will be emitted if this layer is added a
   * {@link View} that already has a layer going by that id.
   * @param {Object} [config] - Optional configuration, all elements in it
   * will be merged as is in the layer.
   * @param {function} [options.batchId] - optional function to create batchId attribute.
   * It is passed the feature property and the feature index.
   * As the batchId is using an unsigned int structure on 32 bits, the batchId could be between 0 and 4,294,967,295.
   * @param {THREE.Object3D} [config.object3d=new THREE.Group()] root object3d layer.
   *
   */
  function FeatureGeometryLayer(id) {
    var _this;

    var config = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    (0, _classCallCheck2["default"])(this, FeatureGeometryLayer);
    config.update = _FeatureProcessing["default"].update;
    config.convert = _Feature2Mesh["default"].convert({
      batchId: config.batchId
    });
    _this = _super.call(this, id, config.object3d || new _three.Group(), config);
    _this.isFeatureGeometryLayer = true;
    return _this;
  }

  return FeatureGeometryLayer;
}(_GeometryLayer2["default"]);

var _default = FeatureGeometryLayer;
exports["default"] = _default;