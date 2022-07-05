'use strict';

var _interopRequireWildcard = require('@babel/runtime/helpers/interopRequireWildcard');

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports['default'] = void 0;

var _classCallCheck2 = _interopRequireDefault(
  require('@babel/runtime/helpers/classCallCheck'),
);

var _createClass2 = _interopRequireDefault(
  require('@babel/runtime/helpers/createClass'),
);

var THREE = _interopRequireWildcard(require('three'));

var _proj = _interopRequireDefault(require('proj4'));

var _Crs = _interopRequireDefault(require('./Crs'));

var _Ellipsoid = _interopRequireDefault(require('../Math/Ellipsoid'));

_proj['default'].defs(
  'EPSG:4978',
  '+proj=geocent +datum=WGS84 +units=m +no_defs',
);

var ellipsoid = new _Ellipsoid['default']();
var projectionCache = {};

function proj4cache(crsIn, crsOut) {
  if (!projectionCache[crsIn]) {
    projectionCache[crsIn] = {};
  }

  if (!projectionCache[crsIn][crsOut]) {
    projectionCache[crsIn][crsOut] = (0, _proj['default'])(crsIn, crsOut);
  }

  return projectionCache[crsIn][crsOut];
}
/**
 * A Coordinates object, defined by a [crs]{@link http://inspire.ec.europa.eu/theme/rs}
 * and three values. These values are accessible through `x`, `y` and `z`,
 * although it can also be accessible through `latitude`, `longitude` and
 * `altitude`. To change a value, prefer the `set()` method below.
 *
 * @property {boolean} isCoordinates - Used to checkout whether this coordinates
 * is a Coordinates. Default is true. You should not change this, as it is used
 * internally for optimisation.
 * @property {string} crs - A supported crs by default in
 * [`proj4js`](https://github.com/proj4js/proj4js#named-projections), or an
 * added crs to `proj4js` (using `proj4.defs`). Note that `EPSG:4978` is also
 * supported by default in itowns.
 * @property {number} x - The first value of the coordinate.
 * @property {number} y - The second value of the coordinate.
 * @property {number} z - The third value of the coordinate.
 * @property {number} latitude - The first value of the coordinate.
 * @property {number} longitude - The second value of the coordinate.
 * @property {number} altitude - The third value of the coordinate.
 * @property {THREE.Vector3} geodesicNormal - The geodesic normal of the
 * coordinate.
 *
 * @example
 * new Coordinates('EPSG:4978', 20885167, 849862, 23385912); //Geocentric coordinates
 *
 * @example
 * new Coordinates('EPSG:4326', 2.33, 48.24, 24999549); //Geographic coordinates
 */

var Coordinates = /*#__PURE__*/ (function () {
  /**
   * @constructor
   *
   * @param {string} crs - A supported crs (see the `crs` property below).
   * @param {number|Array<number>|Coordinates|THREE.Vector3} [v0=0] -
   * x or longitude value, or a more complex one: it can be an array of three
   * numbers, being x/lon, x/lat, z/alt, or it can be `THREE.Vector3`. It can
   * also simply be a Coordinates.
   * @param {number} [v1=0] - y or latitude value.
   * @param {number} [v2=0] - z or altitude value.
   */
  function Coordinates(crs) {
    var v0 =
      arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
    var v1 =
      arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
    var v2 =
      arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
    (0, _classCallCheck2['default'])(this, Coordinates);
    this.isCoordinates = true;

    _Crs['default'].isValid(crs);

    this.crs = crs; // Storing the coordinates as is, not in arrays, as it is
    // slower (see https://jsbench.me/40jumfag6g/1)

    this.x = 0;
    this.y = 0;
    this.z = 0; // Normal

    this._normal = new THREE.Vector3();

    if (v0.length > 0) {
      this.setFromArray(v0);
    } else if (v0.isVector3 || v0.isCoordinates) {
      this.setFromVector3(v0);
    } else {
      this.setFromValues(v0, v1, v2);
    }

    this._normalNeedsUpdate = true;
  }
  /**
   * Set the values of this Coordinates.
   *
   * @param {number} [v0=0] - x or longitude value.
   * @param {number} [v1=0] - y or latitude value.
   * @param {number} [v2=0] - z or altitude value.
   *
   * @return {Coordinates} This Coordinates.
   */

  (0, _createClass2['default'])(Coordinates, [
    {
      key: 'setFromValues',
      value: function setFromValues() {
        var v0 =
          arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
        var v1 =
          arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
        var v2 =
          arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
        this.x = v0 == undefined ? 0 : v0;
        this.y = v1 == undefined ? 0 : v1;
        this.z = v2 == undefined ? 0 : v2;
        this._normalNeedsUpdate = true;
        return this;
      },
      /**
       * Set the values of this Coordinates from an array.
       *
       * @param {Array<number>} array - An array of number to assign to the
       * Coordinates.
       * @param {number} [offset] - Optional offset into the array.
       *
       * @return {Coordinates} This Coordinates.
       */
    },
    {
      key: 'setFromArray',
      value: function setFromArray(array) {
        var offset =
          arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
        return this.setFromValues(
          array[offset],
          array[offset + 1],
          array[offset + 2],
        );
      },
      /**
       * Set the values of this Coordinates from a `THREE.Vector3` or an `Object`
       * having `x/y/z` properties, like a `Coordinates`.
       *
       * @param {THREE.Vector3|Coordinates} v0 - The object to read the values
       * from.
       *
       * @return {Coordinates} This Coordinates.
       */
    },
    {
      key: 'setFromVector3',
      value: function setFromVector3(v0) {
        return this.setFromValues(v0.x, v0.y, v0.z);
      },
      /**
       * Returns a new Coordinates with the same values as this one. It will
       * instantiate a new Coordinates with the same CRS as this one.
       *
       * @return {Coordinates} The target with its new coordinates.
       */
    },
    {
      key: 'clone',
      value: function clone() {
        return new Coordinates(this.crs, this);
      },
      /**
       * Copies the values of the passed Coordinates to this one. The CRS is
       * however not copied.
       *
       * @param {Coordinates} src - The source to copy from.
       *
       * @return {Coordinates} This Coordinates.
       */
    },
    {
      key: 'copy',
      value: function copy(src) {
        this.crs = src.crs;
        return this.setFromVector3(src);
      },
    },
    {
      key: 'longitude',
      get: function get() {
        return this.x;
      },
    },
    {
      key: 'latitude',
      get: function get() {
        return this.y;
      },
    },
    {
      key: 'altitude',
      get: function get() {
        return this.z;
      },
      set: function set(value) {
        this.z = value;
      },
    },
    {
      key: 'geodesicNormal',
      get: function get() {
        if (this._normalNeedsUpdate) {
          this._normalNeedsUpdate = false;

          if (_Crs['default'].is4326(this.crs)) {
            ellipsoid.geodeticSurfaceNormalCartographic(this, this._normal);
          } else if (this.crs == 'EPSG:4978') {
            ellipsoid.geodeticSurfaceNormal(this, this._normal);
          } else {
            this._normal.set(0, 0, 1);
          }
        }

        return this._normal;
      },
      /**
       * Return this Coordinates values into a `THREE.Vector3`.
       *
       * @param {THREE.Vector3} [target] - The target to put the values in. If not
       * specified, a new vector will be created.
       *
       * @return {THREE.Vector3}
       */
    },
    {
      key: 'toVector3',
      value: function toVector3() {
        var target =
          arguments.length > 0 && arguments[0] !== undefined
            ? arguments[0]
            : new THREE.Vector3();
        return target.copy(this);
      },
      /**
       * Multiplies this `coordinates` (with an implicit 1 in the 4th dimension) and `mat`.
       *
       * @param      {THREE.Matrix4}  mat The matrix.
       * @return     {Coordinates}  return this object.
       */
    },
    {
      key: 'applyMatrix4',
      value: function applyMatrix4(mat) {
        return THREE.Vector3.prototype.applyMatrix4.call(this, mat);
      },
      /**
       * Returns coordinates in the wanted [CRS]{@link http://inspire.ec.europa.eu/theme/rs}.
       *
       * @param {string} crs - The CRS to convert the Coordinates into.
       * @param {Coordinates} [target] - The target to put the converted
       * Coordinates into. If not specified a new one will be created.
       *
       * @return {Coordinates} - The resulting Coordinates after the conversion.
       *
       * @example
       * const position = { longitude: 2.33, latitude: 48.24, altitude: 24999549 };
       * const coords = new Coordinates('EPSG:4326', position.longitude, position.latitude, position.altitude); // Geographic system
       * const coordinates = coords.as('EPSG:4978'); // Geocentric system
       *
       * @example
       * const position = { x: 20885167, y: 849862, z: 23385912 };
       * const coords = new Coordinates('EPSG:4978', position.x, position.y, position.z);  // Geocentric system
       * const coordinates = coords.as('EPSG:4326');  // Geographic system
       *
       * @example
       * new Coordinates('EPSG:4326', longitude: 2.33, latitude: 48.24, altitude: 24999549).as('EPSG:4978'); // Geocentric system
       *
       * @example
       * new Coordinates('EPSG:4978', x: 20885167, y: 849862, z: 23385912).as('EPSG:4326'); // Geographic system
       */
    },
    {
      key: 'as',
      value: function as(crs) {
        var target =
          arguments.length > 1 && arguments[1] !== undefined
            ? arguments[1]
            : new Coordinates(crs);

        if (this.crs == crs) {
          target.copy(this);
        } else {
          if (_Crs['default'].is4326(this.crs) && crs == 'EPSG:3857') {
            this.y = THREE.MathUtils.clamp(this.y, -89.999999, 89.999999);
          }

          target.setFromArray(
            proj4cache(this.crs, crs).forward([this.x, this.y, this.z]),
          );
        }

        target.crs = crs;
        return target;
      },
    },
  ]);
  return Coordinates;
})();

var _default = Coordinates;
exports['default'] = _default;