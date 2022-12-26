"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.GLTFLoader = void 0;

var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));

var _assertThisInitialized2 = _interopRequireDefault(require("@babel/runtime/helpers/assertThisInitialized"));

var _get2 = _interopRequireDefault(require("@babel/runtime/helpers/get"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _three = require("three");

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function () { var Super = (0, _getPrototypeOf2["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2["default"])(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2["default"])(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

var GLTFLoader = /*#__PURE__*/function (_Loader) {
  (0, _inherits2["default"])(GLTFLoader, _Loader);

  var _super = _createSuper(GLTFLoader);

  function GLTFLoader(manager) {
    var _this;

    (0, _classCallCheck2["default"])(this, GLTFLoader);
    _this = _super.call(this, manager);
    _this.dracoLoader = null;
    _this.ktx2Loader = null;
    _this.meshoptDecoder = null;
    _this.pluginCallbacks = [];

    _this.register(function (parser) {
      return new GLTFMaterialsClearcoatExtension(parser);
    });

    _this.register(function (parser) {
      return new GLTFTextureBasisUExtension(parser);
    });

    _this.register(function (parser) {
      return new GLTFTextureWebPExtension(parser);
    });

    _this.register(function (parser) {
      return new GLTFMaterialsTransmissionExtension(parser);
    });

    _this.register(function (parser) {
      return new GLTFLightsExtension(parser);
    });

    _this.register(function (parser) {
      return new GLTFMeshoptCompression(parser);
    });

    return _this;
  }

  (0, _createClass2["default"])(GLTFLoader, [{
    key: "load",
    value: function load(url, onLoad, onProgress, onError) {
      var scope = this;
      var resourcePath;

      if (this.resourcePath !== '') {
        resourcePath = this.resourcePath;
      } else if (this.path !== '') {
        resourcePath = this.path;
      } else {
        resourcePath = _three.LoaderUtils.extractUrlBase(url);
      } // Tells the LoadingManager to track an extra item, which resolves after
      // the model is fully loaded. This means the count of items loaded will
      // be incorrect, but ensures manager.onLoad() does not fire early.


      this.manager.itemStart(url);

      var _onError = function (e) {
        if (onError) {
          onError(e);
        } else {
          console.error(e);
        }

        scope.manager.itemError(url);
        scope.manager.itemEnd(url);
      };

      var loader = new _three.FileLoader(this.manager);
      loader.setPath(this.path);
      loader.setResponseType('arraybuffer');
      loader.setRequestHeader(this.requestHeader);
      loader.setWithCredentials(this.withCredentials);
      loader.load(url, function (data) {
        try {
          scope.parse(data, resourcePath, function (gltf) {
            onLoad(gltf);
            scope.manager.itemEnd(url);
          }, _onError);
        } catch (e) {
          _onError(e);
        }
      }, onProgress, _onError);
    }
  }, {
    key: "setDRACOLoader",
    value: function setDRACOLoader(dracoLoader) {
      this.dracoLoader = dracoLoader;
      return this;
    }
  }, {
    key: "setDDSLoader",
    value: function setDDSLoader() {
      throw new Error('THREE.GLTFLoader: "MSFT_texture_dds" no longer supported. Please update to "KHR_texture_basisu".');
    }
  }, {
    key: "setKTX2Loader",
    value: function setKTX2Loader(ktx2Loader) {
      this.ktx2Loader = ktx2Loader;
      return this;
    }
  }, {
    key: "setMeshoptDecoder",
    value: function setMeshoptDecoder(meshoptDecoder) {
      this.meshoptDecoder = meshoptDecoder;
      return this;
    }
  }, {
    key: "register",
    value: function register(callback) {
      if (this.pluginCallbacks.indexOf(callback) === -1) {
        this.pluginCallbacks.push(callback);
      }

      return this;
    }
  }, {
    key: "unregister",
    value: function unregister(callback) {
      if (this.pluginCallbacks.indexOf(callback) !== -1) {
        this.pluginCallbacks.splice(this.pluginCallbacks.indexOf(callback), 1);
      }

      return this;
    }
  }, {
    key: "parse",
    value: function parse(data, path, onLoad, onError) {
      var content;
      var extensions = {};
      var plugins = {};

      if (typeof data === 'string') {
        content = data;
      } else {
        var magic = _three.LoaderUtils.decodeText(new Uint8Array(data, 0, 4));

        if (magic === BINARY_EXTENSION_HEADER_MAGIC) {
          try {
            extensions[EXTENSIONS.KHR_BINARY_GLTF] = new GLTFBinaryExtension(data);
          } catch (error) {
            if (onError) onError(error);
            return;
          }

          content = extensions[EXTENSIONS.KHR_BINARY_GLTF].content;
        } else {
          content = _three.LoaderUtils.decodeText(new Uint8Array(data));
        }
      }

      var json = JSON.parse(content);

      if (json.asset === undefined || json.asset.version[0] < 2) {
        if (onError) onError(new Error('THREE.GLTFLoader: Unsupported asset. glTF versions >=2.0 are supported.'));
        return;
      }

      var parser = new GLTFParser(json, {
        path: path || this.resourcePath || '',
        crossOrigin: this.crossOrigin,
        requestHeader: this.requestHeader,
        manager: this.manager,
        ktx2Loader: this.ktx2Loader,
        meshoptDecoder: this.meshoptDecoder
      });
      parser.fileLoader.setRequestHeader(this.requestHeader);

      for (var i = 0; i < this.pluginCallbacks.length; i++) {
        var plugin = this.pluginCallbacks[i](parser);
        plugins[plugin.name] = plugin; // Workaround to avoid determining as unknown extension
        // in addUnknownExtensionsToUserData().
        // Remove this workaround if we move all the existing
        // extension handlers to plugin system

        extensions[plugin.name] = true;
      }

      if (json.extensionsUsed) {
        for (var _i = 0; _i < json.extensionsUsed.length; ++_i) {
          var extensionName = json.extensionsUsed[_i];
          var extensionsRequired = json.extensionsRequired || [];

          switch (extensionName) {
            case EXTENSIONS.KHR_MATERIALS_UNLIT:
              extensions[extensionName] = new GLTFMaterialsUnlitExtension();
              break;

            case EXTENSIONS.KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS:
              extensions[extensionName] = new GLTFMaterialsPbrSpecularGlossinessExtension();
              break;

            case EXTENSIONS.KHR_DRACO_MESH_COMPRESSION:
              extensions[extensionName] = new GLTFDracoMeshCompressionExtension(json, this.dracoLoader);
              break;

            case EXTENSIONS.KHR_TEXTURE_TRANSFORM:
              extensions[extensionName] = new GLTFTextureTransformExtension();
              break;

            case EXTENSIONS.KHR_MESH_QUANTIZATION:
              extensions[extensionName] = new GLTFMeshQuantizationExtension();
              break;

            default:
              if (extensionsRequired.indexOf(extensionName) >= 0 && plugins[extensionName] === undefined) {
                console.warn('THREE.GLTFLoader: Unknown extension "' + extensionName + '".');
              }

          }
        }
      }

      parser.setExtensions(extensions);
      parser.setPlugins(plugins);
      parser.parse(onLoad, onError);
    }
  }]);
  return GLTFLoader;
}(_three.Loader);
/* GLTFREGISTRY */


exports.GLTFLoader = GLTFLoader;

function GLTFRegistry() {
  var objects = {};
  return {
    get: function get(key) {
      return objects[key];
    },
    add: function add(key, object) {
      objects[key] = object;
    },
    remove: function remove(key) {
      delete objects[key];
    },
    removeAll: function removeAll() {
      objects = {};
    }
  };
}
/*********************************/

/********** EXTENSIONS ***********/

/*********************************/


var EXTENSIONS = {
  KHR_BINARY_GLTF: 'KHR_binary_glTF',
  KHR_DRACO_MESH_COMPRESSION: 'KHR_draco_mesh_compression',
  KHR_LIGHTS_PUNCTUAL: 'KHR_lights_punctual',
  KHR_MATERIALS_CLEARCOAT: 'KHR_materials_clearcoat',
  KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS: 'KHR_materials_pbrSpecularGlossiness',
  KHR_MATERIALS_TRANSMISSION: 'KHR_materials_transmission',
  KHR_MATERIALS_UNLIT: 'KHR_materials_unlit',
  KHR_TEXTURE_BASISU: 'KHR_texture_basisu',
  KHR_TEXTURE_TRANSFORM: 'KHR_texture_transform',
  KHR_MESH_QUANTIZATION: 'KHR_mesh_quantization',
  EXT_TEXTURE_WEBP: 'EXT_texture_webp',
  EXT_MESHOPT_COMPRESSION: 'EXT_meshopt_compression'
};
/**
 * Punctual Lights Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_lights_punctual
 */

var GLTFLightsExtension = /*#__PURE__*/function () {
  function GLTFLightsExtension(parser) {
    (0, _classCallCheck2["default"])(this, GLTFLightsExtension);
    this.parser = parser;
    this.name = EXTENSIONS.KHR_LIGHTS_PUNCTUAL; // Object3D instance caches

    this.cache = {
      refs: {},
      uses: {}
    };
  }

  (0, _createClass2["default"])(GLTFLightsExtension, [{
    key: "_markDefs",
    value: function _markDefs() {
      var parser = this.parser;
      var nodeDefs = this.parser.json.nodes || [];

      for (var nodeIndex = 0, nodeLength = nodeDefs.length; nodeIndex < nodeLength; nodeIndex++) {
        var nodeDef = nodeDefs[nodeIndex];

        if (nodeDef.extensions && nodeDef.extensions[this.name] && nodeDef.extensions[this.name].light !== undefined) {
          parser._addNodeRef(this.cache, nodeDef.extensions[this.name].light);
        }
      }
    }
  }, {
    key: "_loadLight",
    value: function _loadLight(lightIndex) {
      var parser = this.parser;
      var cacheKey = 'light:' + lightIndex;
      var dependency = parser.cache.get(cacheKey);
      if (dependency) return dependency;
      var json = parser.json;
      var extensions = json.extensions && json.extensions[this.name] || {};
      var lightDefs = extensions.lights || [];
      var lightDef = lightDefs[lightIndex];
      var lightNode;
      var color = new _three.Color(0xffffff);
      if (lightDef.color !== undefined) color.fromArray(lightDef.color);
      var range = lightDef.range !== undefined ? lightDef.range : 0;

      switch (lightDef.type) {
        case 'directional':
          lightNode = new _three.DirectionalLight(color);
          lightNode.target.position.set(0, 0, -1);
          lightNode.add(lightNode.target);
          break;

        case 'point':
          lightNode = new _three.PointLight(color);
          lightNode.distance = range;
          break;

        case 'spot':
          lightNode = new _three.SpotLight(color);
          lightNode.distance = range; // Handle spotlight properties.

          lightDef.spot = lightDef.spot || {};
          lightDef.spot.innerConeAngle = lightDef.spot.innerConeAngle !== undefined ? lightDef.spot.innerConeAngle : 0;
          lightDef.spot.outerConeAngle = lightDef.spot.outerConeAngle !== undefined ? lightDef.spot.outerConeAngle : Math.PI / 4.0;
          lightNode.angle = lightDef.spot.outerConeAngle;
          lightNode.penumbra = 1.0 - lightDef.spot.innerConeAngle / lightDef.spot.outerConeAngle;
          lightNode.target.position.set(0, 0, -1);
          lightNode.add(lightNode.target);
          break;

        default:
          throw new Error('THREE.GLTFLoader: Unexpected light type: ' + lightDef.type);
      } // Some lights (e.g. spot) default to a position other than the origin. Reset the position
      // here, because node-level parsing will only override position if explicitly specified.


      lightNode.position.set(0, 0, 0);
      lightNode.decay = 2;
      if (lightDef.intensity !== undefined) lightNode.intensity = lightDef.intensity;
      lightNode.name = parser.createUniqueName(lightDef.name || 'light_' + lightIndex);
      dependency = Promise.resolve(lightNode);
      parser.cache.add(cacheKey, dependency);
      return dependency;
    }
  }, {
    key: "createNodeAttachment",
    value: function createNodeAttachment(nodeIndex) {
      var self = this;
      var parser = this.parser;
      var json = parser.json;
      var nodeDef = json.nodes[nodeIndex];
      var lightDef = nodeDef.extensions && nodeDef.extensions[this.name] || {};
      var lightIndex = lightDef.light;
      if (lightIndex === undefined) return null;
      return this._loadLight(lightIndex).then(function (light) {
        return parser._getNodeRef(self.cache, lightIndex, light);
      });
    }
  }]);
  return GLTFLightsExtension;
}();
/**
 * Unlit Materials Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_unlit
 */


var GLTFMaterialsUnlitExtension = /*#__PURE__*/function () {
  function GLTFMaterialsUnlitExtension() {
    (0, _classCallCheck2["default"])(this, GLTFMaterialsUnlitExtension);
    this.name = EXTENSIONS.KHR_MATERIALS_UNLIT;
  }

  (0, _createClass2["default"])(GLTFMaterialsUnlitExtension, [{
    key: "getMaterialType",
    value: function getMaterialType() {
      return _three.MeshBasicMaterial;
    }
  }, {
    key: "extendParams",
    value: function extendParams(materialParams, materialDef, parser) {
      var pending = [];
      materialParams.color = new _three.Color(1.0, 1.0, 1.0);
      materialParams.opacity = 1.0;
      var metallicRoughness = materialDef.pbrMetallicRoughness;

      if (metallicRoughness) {
        if (Array.isArray(metallicRoughness.baseColorFactor)) {
          var array = metallicRoughness.baseColorFactor;
          materialParams.color.fromArray(array);
          materialParams.opacity = array[3];
        }

        if (metallicRoughness.baseColorTexture !== undefined) {
          pending.push(parser.assignTexture(materialParams, 'map', metallicRoughness.baseColorTexture));
        }
      }

      return Promise.all(pending);
    }
  }]);
  return GLTFMaterialsUnlitExtension;
}();
/**
 * Clearcoat Materials Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_clearcoat
 */


var GLTFMaterialsClearcoatExtension = /*#__PURE__*/function () {
  function GLTFMaterialsClearcoatExtension(parser) {
    (0, _classCallCheck2["default"])(this, GLTFMaterialsClearcoatExtension);
    this.parser = parser;
    this.name = EXTENSIONS.KHR_MATERIALS_CLEARCOAT;
  }

  (0, _createClass2["default"])(GLTFMaterialsClearcoatExtension, [{
    key: "getMaterialType",
    value: function getMaterialType(materialIndex) {
      var parser = this.parser;
      var materialDef = parser.json.materials[materialIndex];
      if (!materialDef.extensions || !materialDef.extensions[this.name]) return null;
      return _three.MeshPhysicalMaterial;
    }
  }, {
    key: "extendMaterialParams",
    value: function extendMaterialParams(materialIndex, materialParams) {
      var parser = this.parser;
      var materialDef = parser.json.materials[materialIndex];

      if (!materialDef.extensions || !materialDef.extensions[this.name]) {
        return Promise.resolve();
      }

      var pending = [];
      var extension = materialDef.extensions[this.name];

      if (extension.clearcoatFactor !== undefined) {
        materialParams.clearcoat = extension.clearcoatFactor;
      }

      if (extension.clearcoatTexture !== undefined) {
        pending.push(parser.assignTexture(materialParams, 'clearcoatMap', extension.clearcoatTexture));
      }

      if (extension.clearcoatRoughnessFactor !== undefined) {
        materialParams.clearcoatRoughness = extension.clearcoatRoughnessFactor;
      }

      if (extension.clearcoatRoughnessTexture !== undefined) {
        pending.push(parser.assignTexture(materialParams, 'clearcoatRoughnessMap', extension.clearcoatRoughnessTexture));
      }

      if (extension.clearcoatNormalTexture !== undefined) {
        pending.push(parser.assignTexture(materialParams, 'clearcoatNormalMap', extension.clearcoatNormalTexture));

        if (extension.clearcoatNormalTexture.scale !== undefined) {
          var scale = extension.clearcoatNormalTexture.scale; // https://github.com/mrdoob/three.js/issues/11438#issuecomment-507003995

          materialParams.clearcoatNormalScale = new _three.Vector2(scale, -scale);
        }
      }

      return Promise.all(pending);
    }
  }]);
  return GLTFMaterialsClearcoatExtension;
}();
/**
 * Transmission Materials Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_transmission
 * Draft: https://github.com/KhronosGroup/glTF/pull/1698
 */


var GLTFMaterialsTransmissionExtension = /*#__PURE__*/function () {
  function GLTFMaterialsTransmissionExtension(parser) {
    (0, _classCallCheck2["default"])(this, GLTFMaterialsTransmissionExtension);
    this.parser = parser;
    this.name = EXTENSIONS.KHR_MATERIALS_TRANSMISSION;
  }

  (0, _createClass2["default"])(GLTFMaterialsTransmissionExtension, [{
    key: "getMaterialType",
    value: function getMaterialType(materialIndex) {
      var parser = this.parser;
      var materialDef = parser.json.materials[materialIndex];
      if (!materialDef.extensions || !materialDef.extensions[this.name]) return null;
      return _three.MeshPhysicalMaterial;
    }
  }, {
    key: "extendMaterialParams",
    value: function extendMaterialParams(materialIndex, materialParams) {
      var parser = this.parser;
      var materialDef = parser.json.materials[materialIndex];

      if (!materialDef.extensions || !materialDef.extensions[this.name]) {
        return Promise.resolve();
      }

      var pending = [];
      var extension = materialDef.extensions[this.name];

      if (extension.transmissionFactor !== undefined) {
        materialParams.transmission = extension.transmissionFactor;
      }

      if (extension.transmissionTexture !== undefined) {
        pending.push(parser.assignTexture(materialParams, 'transmissionMap', extension.transmissionTexture));
      }

      return Promise.all(pending);
    }
  }]);
  return GLTFMaterialsTransmissionExtension;
}();
/**
 * BasisU Texture Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_texture_basisu
 */


var GLTFTextureBasisUExtension = /*#__PURE__*/function () {
  function GLTFTextureBasisUExtension(parser) {
    (0, _classCallCheck2["default"])(this, GLTFTextureBasisUExtension);
    this.parser = parser;
    this.name = EXTENSIONS.KHR_TEXTURE_BASISU;
  }

  (0, _createClass2["default"])(GLTFTextureBasisUExtension, [{
    key: "loadTexture",
    value: function loadTexture(textureIndex) {
      var parser = this.parser;
      var json = parser.json;
      var textureDef = json.textures[textureIndex];

      if (!textureDef.extensions || !textureDef.extensions[this.name]) {
        return null;
      }

      var extension = textureDef.extensions[this.name];
      var source = json.images[extension.source];
      var loader = parser.options.ktx2Loader;

      if (!loader) {
        if (json.extensionsRequired && json.extensionsRequired.indexOf(this.name) >= 0) {
          throw new Error('THREE.GLTFLoader: setKTX2Loader must be called before loading KTX2 textures');
        } else {
          // Assumes that the extension is optional and that a fallback texture is present
          return null;
        }
      }

      return parser.loadTextureImage(textureIndex, source, loader);
    }
  }]);
  return GLTFTextureBasisUExtension;
}();
/**
 * WebP Texture Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/EXT_texture_webp
 */


var GLTFTextureWebPExtension = /*#__PURE__*/function () {
  function GLTFTextureWebPExtension(parser) {
    (0, _classCallCheck2["default"])(this, GLTFTextureWebPExtension);
    this.parser = parser;
    this.name = EXTENSIONS.EXT_TEXTURE_WEBP;
    this.isSupported = null;
  }

  (0, _createClass2["default"])(GLTFTextureWebPExtension, [{
    key: "loadTexture",
    value: function loadTexture(textureIndex) {
      var name = this.name;
      var parser = this.parser;
      var json = parser.json;
      var textureDef = json.textures[textureIndex];

      if (!textureDef.extensions || !textureDef.extensions[name]) {
        return null;
      }

      var extension = textureDef.extensions[name];
      var source = json.images[extension.source];
      var loader = parser.textureLoader;

      if (source.uri) {
        var handler = parser.options.manager.getHandler(source.uri);
        if (handler !== null) loader = handler;
      }

      return this.detectSupport().then(function (isSupported) {
        if (isSupported) return parser.loadTextureImage(textureIndex, source, loader);

        if (json.extensionsRequired && json.extensionsRequired.indexOf(name) >= 0) {
          throw new Error('THREE.GLTFLoader: WebP required by asset but unsupported.');
        } // Fall back to PNG or JPEG.


        return parser.loadTexture(textureIndex);
      });
    }
  }, {
    key: "detectSupport",
    value: function detectSupport() {
      if (!this.isSupported) {
        this.isSupported = new Promise(function (resolve) {
          var image = new Image(); // Lossy test image. Support for lossy images doesn't guarantee support for all
          // WebP images, unfortunately.

          image.src = 'data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA';

          image.onload = image.onerror = function () {
            resolve(image.height === 1);
          };
        });
      }

      return this.isSupported;
    }
  }]);
  return GLTFTextureWebPExtension;
}();
/**
 * meshopt BufferView Compression Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/EXT_meshopt_compression
 */


var GLTFMeshoptCompression = /*#__PURE__*/function () {
  function GLTFMeshoptCompression(parser) {
    (0, _classCallCheck2["default"])(this, GLTFMeshoptCompression);
    this.name = EXTENSIONS.EXT_MESHOPT_COMPRESSION;
    this.parser = parser;
  }

  (0, _createClass2["default"])(GLTFMeshoptCompression, [{
    key: "loadBufferView",
    value: function loadBufferView(index) {
      var json = this.parser.json;
      var bufferView = json.bufferViews[index];

      if (bufferView.extensions && bufferView.extensions[this.name]) {
        var extensionDef = bufferView.extensions[this.name];
        var buffer = this.parser.getDependency('buffer', extensionDef.buffer);
        var decoder = this.parser.options.meshoptDecoder;

        if (!decoder || !decoder.supported) {
          if (json.extensionsRequired && json.extensionsRequired.indexOf(this.name) >= 0) {
            throw new Error('THREE.GLTFLoader: setMeshoptDecoder must be called before loading compressed files');
          } else {
            // Assumes that the extension is optional and that fallback buffer data is present
            return null;
          }
        }

        return Promise.all([buffer, decoder.ready]).then(function (res) {
          var byteOffset = extensionDef.byteOffset || 0;
          var byteLength = extensionDef.byteLength || 0;
          var count = extensionDef.count;
          var stride = extensionDef.byteStride;
          var result = new ArrayBuffer(count * stride);
          var source = new Uint8Array(res[0], byteOffset, byteLength);
          decoder.decodeGltfBuffer(new Uint8Array(result), count, stride, source, extensionDef.mode, extensionDef.filter);
          return result;
        });
      } else {
        return null;
      }
    }
  }]);
  return GLTFMeshoptCompression;
}();
/* BINARY EXTENSION */


var BINARY_EXTENSION_HEADER_MAGIC = 'glTF';
var BINARY_EXTENSION_HEADER_LENGTH = 12;
var BINARY_EXTENSION_CHUNK_TYPES = {
  JSON: 0x4E4F534A,
  BIN: 0x004E4942
};

var GLTFBinaryExtension = function GLTFBinaryExtension(data) {
  (0, _classCallCheck2["default"])(this, GLTFBinaryExtension);
  this.name = EXTENSIONS.KHR_BINARY_GLTF;
  this.content = null;
  this.body = null;
  var headerView = new DataView(data, 0, BINARY_EXTENSION_HEADER_LENGTH);
  this.header = {
    magic: _three.LoaderUtils.decodeText(new Uint8Array(data.slice(0, 4))),
    version: headerView.getUint32(4, true),
    length: headerView.getUint32(8, true)
  };

  if (this.header.magic !== BINARY_EXTENSION_HEADER_MAGIC) {
    throw new Error('THREE.GLTFLoader: Unsupported glTF-Binary header.');
  } else if (this.header.version < 2.0) {
    throw new Error('THREE.GLTFLoader: Legacy binary file detected.');
  }

  var chunkContentsLength = this.header.length - BINARY_EXTENSION_HEADER_LENGTH;
  var chunkView = new DataView(data, BINARY_EXTENSION_HEADER_LENGTH);
  var chunkIndex = 0;

  while (chunkIndex < chunkContentsLength) {
    var chunkLength = chunkView.getUint32(chunkIndex, true);
    chunkIndex += 4;
    var chunkType = chunkView.getUint32(chunkIndex, true);
    chunkIndex += 4;

    if (chunkType === BINARY_EXTENSION_CHUNK_TYPES.JSON) {
      var contentArray = new Uint8Array(data, BINARY_EXTENSION_HEADER_LENGTH + chunkIndex, chunkLength);
      this.content = _three.LoaderUtils.decodeText(contentArray);
    } else if (chunkType === BINARY_EXTENSION_CHUNK_TYPES.BIN) {
      var byteOffset = BINARY_EXTENSION_HEADER_LENGTH + chunkIndex;
      this.body = data.slice(byteOffset, byteOffset + chunkLength);
    } // Clients must ignore chunks with unknown types.


    chunkIndex += chunkLength;
  }

  if (this.content === null) {
    throw new Error('THREE.GLTFLoader: JSON content not found.');
  }
};
/**
 * DRACO Mesh Compression Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_draco_mesh_compression
 */


var GLTFDracoMeshCompressionExtension = /*#__PURE__*/function () {
  function GLTFDracoMeshCompressionExtension(json, dracoLoader) {
    (0, _classCallCheck2["default"])(this, GLTFDracoMeshCompressionExtension);

    if (!dracoLoader) {
      throw new Error('THREE.GLTFLoader: No DRACOLoader instance provided.');
    }

    this.name = EXTENSIONS.KHR_DRACO_MESH_COMPRESSION;
    this.json = json;
    this.dracoLoader = dracoLoader;
    this.dracoLoader.preload();
  }

  (0, _createClass2["default"])(GLTFDracoMeshCompressionExtension, [{
    key: "decodePrimitive",
    value: function decodePrimitive(primitive, parser) {
      var json = this.json;
      var dracoLoader = this.dracoLoader;
      var bufferViewIndex = primitive.extensions[this.name].bufferView;
      var gltfAttributeMap = primitive.extensions[this.name].attributes;
      var threeAttributeMap = {};
      var attributeNormalizedMap = {};
      var attributeTypeMap = {};

      for (var attributeName in gltfAttributeMap) {
        var threeAttributeName = ATTRIBUTES[attributeName] || attributeName.toLowerCase();
        threeAttributeMap[threeAttributeName] = gltfAttributeMap[attributeName];
      }

      for (var _attributeName in primitive.attributes) {
        var _threeAttributeName = ATTRIBUTES[_attributeName] || _attributeName.toLowerCase();

        if (gltfAttributeMap[_attributeName] !== undefined) {
          var accessorDef = json.accessors[primitive.attributes[_attributeName]];
          var componentType = WEBGL_COMPONENT_TYPES[accessorDef.componentType];
          attributeTypeMap[_threeAttributeName] = componentType;
          attributeNormalizedMap[_threeAttributeName] = accessorDef.normalized === true;
        }
      }

      return parser.getDependency('bufferView', bufferViewIndex).then(function (bufferView) {
        return new Promise(function (resolve) {
          dracoLoader.decodeDracoFile(bufferView, function (geometry) {
            for (var _attributeName2 in geometry.attributes) {
              var attribute = geometry.attributes[_attributeName2];
              var normalized = attributeNormalizedMap[_attributeName2];
              if (normalized !== undefined) attribute.normalized = normalized;
            }

            resolve(geometry);
          }, threeAttributeMap, attributeTypeMap);
        });
      });
    }
  }]);
  return GLTFDracoMeshCompressionExtension;
}();
/**
 * Texture Transform Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_texture_transform
 */


var GLTFTextureTransformExtension = /*#__PURE__*/function () {
  function GLTFTextureTransformExtension() {
    (0, _classCallCheck2["default"])(this, GLTFTextureTransformExtension);
    this.name = EXTENSIONS.KHR_TEXTURE_TRANSFORM;
  }

  (0, _createClass2["default"])(GLTFTextureTransformExtension, [{
    key: "extendTexture",
    value: function extendTexture(texture, transform) {
      if (transform.texCoord !== undefined) {
        console.warn('THREE.GLTFLoader: Custom UV sets in "' + this.name + '" extension not yet supported.');
      }

      if (transform.offset === undefined && transform.rotation === undefined && transform.scale === undefined) {
        // See https://github.com/mrdoob/three.js/issues/21819.
        return texture;
      }

      texture = texture.clone();

      if (transform.offset !== undefined) {
        texture.offset.fromArray(transform.offset);
      }

      if (transform.rotation !== undefined) {
        texture.rotation = transform.rotation;
      }

      if (transform.scale !== undefined) {
        texture.repeat.fromArray(transform.scale);
      }

      texture.needsUpdate = true;
      return texture;
    }
  }]);
  return GLTFTextureTransformExtension;
}();
/**
 * Specular-Glossiness Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_pbrSpecularGlossiness
 */

/**
 * A sub class of StandardMaterial with some of the functionality
 * changed via the `onBeforeCompile` callback
 * @pailhead
 */


var GLTFMeshStandardSGMaterial = /*#__PURE__*/function (_MeshStandardMaterial) {
  (0, _inherits2["default"])(GLTFMeshStandardSGMaterial, _MeshStandardMaterial);

  var _super2 = _createSuper(GLTFMeshStandardSGMaterial);

  function GLTFMeshStandardSGMaterial(params) {
    var _this2;

    (0, _classCallCheck2["default"])(this, GLTFMeshStandardSGMaterial);
    _this2 = _super2.call(this);
    _this2.isGLTFSpecularGlossinessMaterial = true; //various chunks that need replacing

    var specularMapParsFragmentChunk = ['#ifdef USE_SPECULARMAP', '	uniform sampler2D specularMap;', '#endif'].join('\n');
    var glossinessMapParsFragmentChunk = ['#ifdef USE_GLOSSINESSMAP', '	uniform sampler2D glossinessMap;', '#endif'].join('\n');
    var specularMapFragmentChunk = ['vec3 specularFactor = specular;', '#ifdef USE_SPECULARMAP', '	vec4 texelSpecular = texture2D( specularMap, vUv );', '	texelSpecular = sRGBToLinear( texelSpecular );', '	// reads channel RGB, compatible with a glTF Specular-Glossiness (RGBA) texture', '	specularFactor *= texelSpecular.rgb;', '#endif'].join('\n');
    var glossinessMapFragmentChunk = ['float glossinessFactor = glossiness;', '#ifdef USE_GLOSSINESSMAP', '	vec4 texelGlossiness = texture2D( glossinessMap, vUv );', '	// reads channel A, compatible with a glTF Specular-Glossiness (RGBA) texture', '	glossinessFactor *= texelGlossiness.a;', '#endif'].join('\n');
    var lightPhysicalFragmentChunk = ['PhysicalMaterial material;', 'material.diffuseColor = diffuseColor.rgb * ( 1. - max( specularFactor.r, max( specularFactor.g, specularFactor.b ) ) );', 'vec3 dxy = max( abs( dFdx( geometryNormal ) ), abs( dFdy( geometryNormal ) ) );', 'float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );', 'material.specularRoughness = max( 1.0 - glossinessFactor, 0.0525 ); // 0.0525 corresponds to the base mip of a 256 cubemap.', 'material.specularRoughness += geometryRoughness;', 'material.specularRoughness = min( material.specularRoughness, 1.0 );', 'material.specularColor = specularFactor;'].join('\n');
    var uniforms = {
      specular: {
        value: new _three.Color().setHex(0xffffff)
      },
      glossiness: {
        value: 1
      },
      specularMap: {
        value: null
      },
      glossinessMap: {
        value: null
      }
    };
    _this2._extraUniforms = uniforms;

    _this2.onBeforeCompile = function (shader) {
      for (var uniformName in uniforms) {
        shader.uniforms[uniformName] = uniforms[uniformName];
      }

      shader.fragmentShader = shader.fragmentShader.replace('uniform float roughness;', 'uniform vec3 specular;').replace('uniform float metalness;', 'uniform float glossiness;').replace('#include <roughnessmap_pars_fragment>', specularMapParsFragmentChunk).replace('#include <metalnessmap_pars_fragment>', glossinessMapParsFragmentChunk).replace('#include <roughnessmap_fragment>', specularMapFragmentChunk).replace('#include <metalnessmap_fragment>', glossinessMapFragmentChunk).replace('#include <lights_physical_fragment>', lightPhysicalFragmentChunk);
    };

    Object.defineProperties((0, _assertThisInitialized2["default"])(_this2), {
      specular: {
        get: function get() {
          return uniforms.specular.value;
        },
        set: function set(v) {
          uniforms.specular.value = v;
        }
      },
      specularMap: {
        get: function get() {
          return uniforms.specularMap.value;
        },
        set: function set(v) {
          uniforms.specularMap.value = v;

          if (v) {
            this.defines.USE_SPECULARMAP = ''; // USE_UV is set by the renderer for specular maps
          } else {
            delete this.defines.USE_SPECULARMAP;
          }
        }
      },
      glossiness: {
        get: function get() {
          return uniforms.glossiness.value;
        },
        set: function set(v) {
          uniforms.glossiness.value = v;
        }
      },
      glossinessMap: {
        get: function get() {
          return uniforms.glossinessMap.value;
        },
        set: function set(v) {
          uniforms.glossinessMap.value = v;

          if (v) {
            this.defines.USE_GLOSSINESSMAP = '';
            this.defines.USE_UV = '';
          } else {
            delete this.defines.USE_GLOSSINESSMAP;
            delete this.defines.USE_UV;
          }
        }
      }
    });
    delete _this2.metalness;
    delete _this2.roughness;
    delete _this2.metalnessMap;
    delete _this2.roughnessMap;

    _this2.setValues(params);

    return _this2;
  }

  (0, _createClass2["default"])(GLTFMeshStandardSGMaterial, [{
    key: "copy",
    value: function copy(source) {
      (0, _get2["default"])((0, _getPrototypeOf2["default"])(GLTFMeshStandardSGMaterial.prototype), "copy", this).call(this, source);
      this.specularMap = source.specularMap;
      this.specular.copy(source.specular);
      this.glossinessMap = source.glossinessMap;
      this.glossiness = source.glossiness;
      delete this.metalness;
      delete this.roughness;
      delete this.metalnessMap;
      delete this.roughnessMap;
      return this;
    }
  }]);
  return GLTFMeshStandardSGMaterial;
}(_three.MeshStandardMaterial);

var GLTFMaterialsPbrSpecularGlossinessExtension = /*#__PURE__*/function () {
  function GLTFMaterialsPbrSpecularGlossinessExtension() {
    (0, _classCallCheck2["default"])(this, GLTFMaterialsPbrSpecularGlossinessExtension);
    this.name = EXTENSIONS.KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS;
    this.specularGlossinessParams = ['color', 'map', 'lightMap', 'lightMapIntensity', 'aoMap', 'aoMapIntensity', 'emissive', 'emissiveIntensity', 'emissiveMap', 'bumpMap', 'bumpScale', 'normalMap', 'normalMapType', 'displacementMap', 'displacementScale', 'displacementBias', 'specularMap', 'specular', 'glossinessMap', 'glossiness', 'alphaMap', 'envMap', 'envMapIntensity', 'refractionRatio'];
  }

  (0, _createClass2["default"])(GLTFMaterialsPbrSpecularGlossinessExtension, [{
    key: "getMaterialType",
    value: function getMaterialType() {
      return GLTFMeshStandardSGMaterial;
    }
  }, {
    key: "extendParams",
    value: function extendParams(materialParams, materialDef, parser) {
      var pbrSpecularGlossiness = materialDef.extensions[this.name];
      materialParams.color = new _three.Color(1.0, 1.0, 1.0);
      materialParams.opacity = 1.0;
      var pending = [];

      if (Array.isArray(pbrSpecularGlossiness.diffuseFactor)) {
        var array = pbrSpecularGlossiness.diffuseFactor;
        materialParams.color.fromArray(array);
        materialParams.opacity = array[3];
      }

      if (pbrSpecularGlossiness.diffuseTexture !== undefined) {
        pending.push(parser.assignTexture(materialParams, 'map', pbrSpecularGlossiness.diffuseTexture));
      }

      materialParams.emissive = new _three.Color(0.0, 0.0, 0.0);
      materialParams.glossiness = pbrSpecularGlossiness.glossinessFactor !== undefined ? pbrSpecularGlossiness.glossinessFactor : 1.0;
      materialParams.specular = new _three.Color(1.0, 1.0, 1.0);

      if (Array.isArray(pbrSpecularGlossiness.specularFactor)) {
        materialParams.specular.fromArray(pbrSpecularGlossiness.specularFactor);
      }

      if (pbrSpecularGlossiness.specularGlossinessTexture !== undefined) {
        var specGlossMapDef = pbrSpecularGlossiness.specularGlossinessTexture;
        pending.push(parser.assignTexture(materialParams, 'glossinessMap', specGlossMapDef));
        pending.push(parser.assignTexture(materialParams, 'specularMap', specGlossMapDef));
      }

      return Promise.all(pending);
    }
  }, {
    key: "createMaterial",
    value: function createMaterial(materialParams) {
      var material = new GLTFMeshStandardSGMaterial(materialParams);
      material.fog = true;
      material.color = materialParams.color;
      material.map = materialParams.map === undefined ? null : materialParams.map;
      material.lightMap = null;
      material.lightMapIntensity = 1.0;
      material.aoMap = materialParams.aoMap === undefined ? null : materialParams.aoMap;
      material.aoMapIntensity = 1.0;
      material.emissive = materialParams.emissive;
      material.emissiveIntensity = 1.0;
      material.emissiveMap = materialParams.emissiveMap === undefined ? null : materialParams.emissiveMap;
      material.bumpMap = materialParams.bumpMap === undefined ? null : materialParams.bumpMap;
      material.bumpScale = 1;
      material.normalMap = materialParams.normalMap === undefined ? null : materialParams.normalMap;
      material.normalMapType = _three.TangentSpaceNormalMap;
      if (materialParams.normalScale) material.normalScale = materialParams.normalScale;
      material.displacementMap = null;
      material.displacementScale = 1;
      material.displacementBias = 0;
      material.specularMap = materialParams.specularMap === undefined ? null : materialParams.specularMap;
      material.specular = materialParams.specular;
      material.glossinessMap = materialParams.glossinessMap === undefined ? null : materialParams.glossinessMap;
      material.glossiness = materialParams.glossiness;
      material.alphaMap = null;
      material.envMap = materialParams.envMap === undefined ? null : materialParams.envMap;
      material.envMapIntensity = 1.0;
      material.refractionRatio = 0.98;
      return material;
    }
  }]);
  return GLTFMaterialsPbrSpecularGlossinessExtension;
}();
/**
 * Mesh Quantization Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_mesh_quantization
 */


var GLTFMeshQuantizationExtension = function GLTFMeshQuantizationExtension() {
  (0, _classCallCheck2["default"])(this, GLTFMeshQuantizationExtension);
  this.name = EXTENSIONS.KHR_MESH_QUANTIZATION;
};
/*********************************/

/********** INTERPOLATION ********/

/*********************************/
// Spline Interpolation
// Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#appendix-c-spline-interpolation


var GLTFCubicSplineInterpolant = /*#__PURE__*/function (_Interpolant) {
  (0, _inherits2["default"])(GLTFCubicSplineInterpolant, _Interpolant);

  var _super3 = _createSuper(GLTFCubicSplineInterpolant);

  function GLTFCubicSplineInterpolant(parameterPositions, sampleValues, sampleSize, resultBuffer) {
    (0, _classCallCheck2["default"])(this, GLTFCubicSplineInterpolant);
    return _super3.call(this, parameterPositions, sampleValues, sampleSize, resultBuffer);
  }

  (0, _createClass2["default"])(GLTFCubicSplineInterpolant, [{
    key: "copySampleValue_",
    value: function copySampleValue_(index) {
      // Copies a sample value to the result buffer. See description of glTF
      // CUBICSPLINE values layout in interpolate_() function below.
      var result = this.resultBuffer,
          values = this.sampleValues,
          valueSize = this.valueSize;

      for (var i = 0; i !== valueSize; i++) {
        result[i] = values[index * valueSize * 3 + valueSize + i];
      }

      return result;
    }
  }]);
  return GLTFCubicSplineInterpolant;
}(_three.Interpolant);

GLTFCubicSplineInterpolant.prototype.beforeStart_ = GLTFCubicSplineInterpolant.prototype.copySampleValue_;
GLTFCubicSplineInterpolant.prototype.afterEnd_ = GLTFCubicSplineInterpolant.prototype.copySampleValue_;

GLTFCubicSplineInterpolant.prototype.interpolate_ = function (i1, t0, t, t1) {
  var result = this.resultBuffer;
  var values = this.sampleValues;
  var stride = this.valueSize;
  var stride3 = stride * 3;
  var td = t1 - t0;
  var p = (t - t0) / td;
  var pp = p * p;
  var ppp = pp * p;
  var offset1 = i1 * stride3;
  var offset0 = offset1 - stride3;
  var s2 = -2 * ppp + 3 * pp;
  var s3 = ppp - pp;

  // Layout of keyframe output values for CUBICSPLINE animations:
  //   [ inTangent_1, splineVertex_1, outTangent_1, inTangent_2, splineVertex_2, ... ]
  for (var i = 0; i !== stride; i++) {
    var p0 = values[offset0 + i + stride]; // splineVertex_k

    var m0 = values[offset0 + i + stride * 2] * td; // outTangent_k * (t_k+1 - t_k)

    var p1 = values[offset1 + i + stride]; // splineVertex_k+1

    var m1 = values[offset1 + i] * td; // inTangent_k+1 * (t_k+1 - t_k)

    result[i] = (1 - s2) * p0 + (s3 - pp + p) * m0 + s2 * p1 + s3 * m1;
  }

  return result;
};
/*********************************/

/********** INTERNALS ************/

/*********************************/

/* CONSTANTS */


var WEBGL_CONSTANTS = {
  FLOAT: 5126,
  //FLOAT_MAT2: 35674,
  FLOAT_MAT3: 35675,
  FLOAT_MAT4: 35676,
  FLOAT_VEC2: 35664,
  FLOAT_VEC3: 35665,
  FLOAT_VEC4: 35666,
  LINEAR: 9729,
  REPEAT: 10497,
  SAMPLER_2D: 35678,
  POINTS: 0,
  LINES: 1,
  LINE_LOOP: 2,
  LINE_STRIP: 3,
  TRIANGLES: 4,
  TRIANGLE_STRIP: 5,
  TRIANGLE_FAN: 6,
  UNSIGNED_BYTE: 5121,
  UNSIGNED_SHORT: 5123
};
var WEBGL_COMPONENT_TYPES = {
  5120: Int8Array,
  5121: Uint8Array,
  5122: Int16Array,
  5123: Uint16Array,
  5125: Uint32Array,
  5126: Float32Array
};
var WEBGL_FILTERS = {
  9728: _three.NearestFilter,
  9729: _three.LinearFilter,
  9984: _three.NearestMipmapNearestFilter,
  9985: _three.LinearMipmapNearestFilter,
  9986: _three.NearestMipmapLinearFilter,
  9987: _three.LinearMipmapLinearFilter
};
var WEBGL_WRAPPINGS = {
  33071: _three.ClampToEdgeWrapping,
  33648: _three.MirroredRepeatWrapping,
  10497: _three.RepeatWrapping
};
var WEBGL_TYPE_SIZES = {
  'SCALAR': 1,
  'VEC2': 2,
  'VEC3': 3,
  'VEC4': 4,
  'MAT2': 4,
  'MAT3': 9,
  'MAT4': 16
};
var ATTRIBUTES = {
  POSITION: 'position',
  NORMAL: 'normal',
  TANGENT: 'tangent',
  TEXCOORD_0: 'uv',
  TEXCOORD_1: 'uv2',
  COLOR_0: 'color',
  WEIGHTS_0: 'skinWeight',
  JOINTS_0: 'skinIndex',
  _BATCHID: '_BATCHID'
};
var PATH_PROPERTIES = {
  scale: 'scale',
  translation: 'position',
  rotation: 'quaternion',
  weights: 'morphTargetInfluences'
};
var INTERPOLATION = {
  CUBICSPLINE: undefined,
  // We use a custom interpolant (GLTFCubicSplineInterpolation) for CUBICSPLINE tracks. Each
  // keyframe track will be initialized with a default interpolation type, then modified.
  LINEAR: _three.InterpolateLinear,
  STEP: _three.InterpolateDiscrete
};
var ALPHA_MODES = {
  OPAQUE: 'OPAQUE',
  MASK: 'MASK',
  BLEND: 'BLEND'
};
/* UTILITY FUNCTIONS */

function resolveURL(url, path) {
  // Invalid URL
  if (typeof url !== 'string' || url === '') return ''; // Host Relative URL

  if (/^https?:\/\//i.test(path) && /^\//.test(url)) {
    path = path.replace(/(^https?:\/\/[^\/]+).*/i, '$1');
  } // Absolute URL http://,https://,//


  if (/^(https?:)?\/\//i.test(url)) return url; // Data URI

  if (/^data:.*,.*$/i.test(url)) return url; // Blob URL

  if (/^blob:.*$/i.test(url)) return url; // Relative URL

  return path + url;
}
/**
 * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#default-material
 */


function createDefaultMaterial(cache) {
  if (cache['DefaultMaterial'] === undefined) {
    cache['DefaultMaterial'] = new _three.MeshStandardMaterial({
      color: 0xFFFFFF,
      emissive: 0x000000,
      metalness: 1,
      roughness: 1,
      transparent: false,
      depthTest: true,
      side: _three.FrontSide
    });
  }

  return cache['DefaultMaterial'];
}

function addUnknownExtensionsToUserData(knownExtensions, object, objectDef) {
  // Add unknown glTF extensions to an object's userData.
  for (var name in objectDef.extensions) {
    if (knownExtensions[name] === undefined) {
      object.userData.gltfExtensions = object.userData.gltfExtensions || {};
      object.userData.gltfExtensions[name] = objectDef.extensions[name];
    }
  }
}
/**
 * @param {Object3D|Material|BufferGeometry} object
 * @param {GLTF.definition} gltfDef
 */


function assignExtrasToUserData(object, gltfDef) {
  if (gltfDef.extras !== undefined) {
    if ((0, _typeof2["default"])(gltfDef.extras) === 'object') {
      Object.assign(object.userData, gltfDef.extras);
    } else {
      console.warn('THREE.GLTFLoader: Ignoring primitive type .extras, ' + gltfDef.extras);
    }
  }
}
/**
 * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#morph-targets
 *
 * @param {BufferGeometry} geometry
 * @param {Array<GLTF.Target>} targets
 * @param {GLTFParser} parser
 * @return {Promise<BufferGeometry>}
 */


function addMorphTargets(geometry, targets, parser) {
  var hasMorphPosition = false;
  var hasMorphNormal = false;

  for (var i = 0, il = targets.length; i < il; i++) {
    var target = targets[i];
    if (target.POSITION !== undefined) hasMorphPosition = true;
    if (target.NORMAL !== undefined) hasMorphNormal = true;
    if (hasMorphPosition && hasMorphNormal) break;
  }

  if (!hasMorphPosition && !hasMorphNormal) return Promise.resolve(geometry);
  var pendingPositionAccessors = [];
  var pendingNormalAccessors = [];

  for (var _i2 = 0, _il = targets.length; _i2 < _il; _i2++) {
    var _target = targets[_i2];

    if (hasMorphPosition) {
      var pendingAccessor = _target.POSITION !== undefined ? parser.getDependency('accessor', _target.POSITION) : geometry.attributes.position;
      pendingPositionAccessors.push(pendingAccessor);
    }

    if (hasMorphNormal) {
      var _pendingAccessor = _target.NORMAL !== undefined ? parser.getDependency('accessor', _target.NORMAL) : geometry.attributes.normal;

      pendingNormalAccessors.push(_pendingAccessor);
    }
  }

  return Promise.all([Promise.all(pendingPositionAccessors), Promise.all(pendingNormalAccessors)]).then(function (accessors) {
    var morphPositions = accessors[0];
    var morphNormals = accessors[1];
    if (hasMorphPosition) geometry.morphAttributes.position = morphPositions;
    if (hasMorphNormal) geometry.morphAttributes.normal = morphNormals;
    geometry.morphTargetsRelative = true;
    return geometry;
  });
}
/**
 * @param {Mesh} mesh
 * @param {GLTF.Mesh} meshDef
 */


function updateMorphTargets(mesh, meshDef) {
  mesh.updateMorphTargets();

  if (meshDef.weights !== undefined) {
    for (var i = 0, il = meshDef.weights.length; i < il; i++) {
      mesh.morphTargetInfluences[i] = meshDef.weights[i];
    }
  } // .extras has user-defined data, so check that .extras.targetNames is an array.


  if (meshDef.extras && Array.isArray(meshDef.extras.targetNames)) {
    var targetNames = meshDef.extras.targetNames;

    if (mesh.morphTargetInfluences.length === targetNames.length) {
      mesh.morphTargetDictionary = {};

      for (var _i3 = 0, _il2 = targetNames.length; _i3 < _il2; _i3++) {
        mesh.morphTargetDictionary[targetNames[_i3]] = _i3;
      }
    } else {
      console.warn('THREE.GLTFLoader: Invalid extras.targetNames length. Ignoring names.');
    }
  }
}

function createPrimitiveKey(primitiveDef) {
  var dracoExtension = primitiveDef.extensions && primitiveDef.extensions[EXTENSIONS.KHR_DRACO_MESH_COMPRESSION];
  var geometryKey;

  if (dracoExtension) {
    geometryKey = 'draco:' + dracoExtension.bufferView + ':' + dracoExtension.indices + ':' + createAttributesKey(dracoExtension.attributes);
  } else {
    geometryKey = primitiveDef.indices + ':' + createAttributesKey(primitiveDef.attributes) + ':' + primitiveDef.mode;
  }

  return geometryKey;
}

function createAttributesKey(attributes) {
  var attributesKey = '';
  var keys = Object.keys(attributes).sort();

  for (var i = 0, il = keys.length; i < il; i++) {
    attributesKey += keys[i] + ':' + attributes[keys[i]] + ';';
  }

  return attributesKey;
}

function getNormalizedComponentScale(constructor) {
  // Reference:
  // https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_mesh_quantization#encoding-quantized-data
  switch (constructor) {
    case Int8Array:
      return 1 / 127;

    case Uint8Array:
      return 1 / 255;

    case Int16Array:
      return 1 / 32767;

    case Uint16Array:
      return 1 / 65535;

    default:
      throw new Error('THREE.GLTFLoader: Unsupported normalized accessor component type.');
  }
}
/* GLTF PARSER */


var GLTFParser = /*#__PURE__*/function () {
  function GLTFParser() {
    var json = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    (0, _classCallCheck2["default"])(this, GLTFParser);
    this.json = json;
    this.extensions = {};
    this.plugins = {};
    this.options = options; // loader object cache

    this.cache = new GLTFRegistry(); // associations between Three.js objects and glTF elements

    this.associations = new Map(); // BufferGeometry caching

    this.primitiveCache = {}; // Object3D instance caches

    this.meshCache = {
      refs: {},
      uses: {}
    };
    this.cameraCache = {
      refs: {},
      uses: {}
    };
    this.lightCache = {
      refs: {},
      uses: {}
    };
    this.textureCache = {}; // Track node names, to ensure no duplicates

    this.nodeNamesUsed = {}; // Use an ImageBitmapLoader if imageBitmaps are supported. Moves much of the
    // expensive work of uploading a texture to the GPU off the main thread.

    if (typeof createImageBitmap !== 'undefined' && /Firefox/.test(navigator.userAgent) === false) {
      this.textureLoader = new _three.ImageBitmapLoader(this.options.manager);
    } else {
      this.textureLoader = new _three.TextureLoader(this.options.manager);
    }

    this.textureLoader.setCrossOrigin(this.options.crossOrigin);
    this.textureLoader.setRequestHeader(this.options.requestHeader);
    this.fileLoader = new _three.FileLoader(this.options.manager);
    this.fileLoader.setResponseType('arraybuffer');

    if (this.options.crossOrigin === 'use-credentials') {
      this.fileLoader.setWithCredentials(true);
    }
  }

  (0, _createClass2["default"])(GLTFParser, [{
    key: "setExtensions",
    value: function setExtensions(extensions) {
      this.extensions = extensions;
    }
  }, {
    key: "setPlugins",
    value: function setPlugins(plugins) {
      this.plugins = plugins;
    }
  }, {
    key: "parse",
    value: function parse(onLoad, onError) {
      var parser = this;
      var json = this.json;
      var extensions = this.extensions; // Clear the loader cache

      this.cache.removeAll(); // Mark the special nodes/meshes in json for efficient parse

      this._invokeAll(function (ext) {
        return ext._markDefs && ext._markDefs();
      });

      Promise.all(this._invokeAll(function (ext) {
        return ext.beforeRoot && ext.beforeRoot();
      })).then(function () {
        return Promise.all([parser.getDependencies('scene'), parser.getDependencies('animation'), parser.getDependencies('camera')]);
      }).then(function (dependencies) {
        var result = {
          scene: dependencies[0][json.scene || 0],
          scenes: dependencies[0],
          animations: dependencies[1],
          cameras: dependencies[2],
          asset: json.asset,
          parser: parser,
          userData: {}
        };
        addUnknownExtensionsToUserData(extensions, result, json);
        assignExtrasToUserData(result, json);
        Promise.all(parser._invokeAll(function (ext) {
          return ext.afterRoot && ext.afterRoot(result);
        })).then(function () {
          onLoad(result);
        });
      })["catch"](onError);
    }
    /**
     * Marks the special nodes/meshes in json for efficient parse.
     */

  }, {
    key: "_markDefs",
    value: function _markDefs() {
      var nodeDefs = this.json.nodes || [];
      var skinDefs = this.json.skins || [];
      var meshDefs = this.json.meshes || []; // Nothing in the node definition indicates whether it is a Bone or an
      // Object3D. Use the skins' joint references to mark bones.

      for (var skinIndex = 0, skinLength = skinDefs.length; skinIndex < skinLength; skinIndex++) {
        var joints = skinDefs[skinIndex].joints;

        for (var i = 0, il = joints.length; i < il; i++) {
          nodeDefs[joints[i]].isBone = true;
        }
      } // Iterate over all nodes, marking references to shared resources,
      // as well as skeleton joints.


      for (var nodeIndex = 0, nodeLength = nodeDefs.length; nodeIndex < nodeLength; nodeIndex++) {
        var nodeDef = nodeDefs[nodeIndex];

        if (nodeDef.mesh !== undefined) {
          this._addNodeRef(this.meshCache, nodeDef.mesh); // Nothing in the mesh definition indicates whether it is
          // a SkinnedMesh or Mesh. Use the node's mesh reference
          // to mark SkinnedMesh if node has skin.


          if (nodeDef.skin !== undefined) {
            meshDefs[nodeDef.mesh].isSkinnedMesh = true;
          }
        }

        if (nodeDef.camera !== undefined) {
          this._addNodeRef(this.cameraCache, nodeDef.camera);
        }
      }
    }
    /**
     * Counts references to shared node / Object3D resources. These resources
     * can be reused, or "instantiated", at multiple nodes in the scene
     * hierarchy. Mesh, Camera, and Light instances are instantiated and must
     * be marked. Non-scenegraph resources (like Materials, Geometries, and
     * Textures) can be reused directly and are not marked here.
     *
     * Example: CesiumMilkTruck sample model reuses "Wheel" meshes.
     */

  }, {
    key: "_addNodeRef",
    value: function _addNodeRef(cache, index) {
      if (index === undefined) return;

      if (cache.refs[index] === undefined) {
        cache.refs[index] = cache.uses[index] = 0;
      }

      cache.refs[index]++;
    }
    /** Returns a reference to a shared resource, cloning it if necessary. */

  }, {
    key: "_getNodeRef",
    value: function _getNodeRef(cache, index, object) {
      if (cache.refs[index] <= 1) return object;
      var ref = object.clone();
      ref.name += '_instance_' + cache.uses[index]++;
      return ref;
    }
  }, {
    key: "_invokeOne",
    value: function _invokeOne(func) {
      var extensions = Object.values(this.plugins);
      extensions.push(this);

      for (var i = 0; i < extensions.length; i++) {
        var result = func(extensions[i]);
        if (result) return result;
      }

      return null;
    }
  }, {
    key: "_invokeAll",
    value: function _invokeAll(func) {
      var extensions = Object.values(this.plugins);
      extensions.unshift(this);
      var pending = [];

      for (var i = 0; i < extensions.length; i++) {
        var result = func(extensions[i]);
        if (result) pending.push(result);
      }

      return pending;
    }
    /**
     * Requests the specified dependency asynchronously, with caching.
     * @param {string} type
     * @param {number} index
     * @return {Promise<Object3D|Material|THREE.Texture|AnimationClip|ArrayBuffer|Object>}
     */

  }, {
    key: "getDependency",
    value: function getDependency(type, index) {
      var cacheKey = type + ':' + index;
      var dependency = this.cache.get(cacheKey);

      if (!dependency) {
        switch (type) {
          case 'scene':
            dependency = this.loadScene(index);
            break;

          case 'node':
            dependency = this.loadNode(index);
            break;

          case 'mesh':
            dependency = this._invokeOne(function (ext) {
              return ext.loadMesh && ext.loadMesh(index);
            });
            break;

          case 'accessor':
            dependency = this.loadAccessor(index);
            break;

          case 'bufferView':
            dependency = this._invokeOne(function (ext) {
              return ext.loadBufferView && ext.loadBufferView(index);
            });
            break;

          case 'buffer':
            dependency = this.loadBuffer(index);
            break;

          case 'material':
            dependency = this._invokeOne(function (ext) {
              return ext.loadMaterial && ext.loadMaterial(index);
            });
            break;

          case 'texture':
            dependency = this._invokeOne(function (ext) {
              return ext.loadTexture && ext.loadTexture(index);
            });
            break;

          case 'skin':
            dependency = this.loadSkin(index);
            break;

          case 'animation':
            dependency = this.loadAnimation(index);
            break;

          case 'camera':
            dependency = this.loadCamera(index);
            break;

          default:
            throw new Error('Unknown type: ' + type);
        }

        this.cache.add(cacheKey, dependency);
      }

      return dependency;
    }
    /**
     * Requests all dependencies of the specified type asynchronously, with caching.
     * @param {string} type
     * @return {Promise<Array<Object>>}
     */

  }, {
    key: "getDependencies",
    value: function getDependencies(type) {
      var dependencies = this.cache.get(type);

      if (!dependencies) {
        var parser = this;
        var defs = this.json[type + (type === 'mesh' ? 'es' : 's')] || [];
        dependencies = Promise.all(defs.map(function (def, index) {
          return parser.getDependency(type, index);
        }));
        this.cache.add(type, dependencies);
      }

      return dependencies;
    }
    /**
     * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#buffers-and-buffer-views
     * @param {number} bufferIndex
     * @return {Promise<ArrayBuffer>}
     */

  }, {
    key: "loadBuffer",
    value: function loadBuffer(bufferIndex) {
      var bufferDef = this.json.buffers[bufferIndex];
      var loader = this.fileLoader;

      if (bufferDef.type && bufferDef.type !== 'arraybuffer') {
        throw new Error('THREE.GLTFLoader: ' + bufferDef.type + ' buffer type is not supported.');
      } // If present, GLB container is required to be the first buffer.


      if (bufferDef.uri === undefined && bufferIndex === 0) {
        return Promise.resolve(this.extensions[EXTENSIONS.KHR_BINARY_GLTF].body);
      }

      var options = this.options;
      return new Promise(function (resolve, reject) {
        loader.load(resolveURL(bufferDef.uri, options.path), resolve, undefined, function () {
          reject(new Error('THREE.GLTFLoader: Failed to load buffer "' + bufferDef.uri + '".'));
        });
      });
    }
    /**
     * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#buffers-and-buffer-views
     * @param {number} bufferViewIndex
     * @return {Promise<ArrayBuffer>}
     */

  }, {
    key: "loadBufferView",
    value: function loadBufferView(bufferViewIndex) {
      var bufferViewDef = this.json.bufferViews[bufferViewIndex];
      return this.getDependency('buffer', bufferViewDef.buffer).then(function (buffer) {
        var byteLength = bufferViewDef.byteLength || 0;
        var byteOffset = bufferViewDef.byteOffset || 0;
        return buffer.slice(byteOffset, byteOffset + byteLength);
      });
    }
    /**
     * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#accessors
     * @param {number} accessorIndex
     * @return {Promise<BufferAttribute|InterleavedBufferAttribute>}
     */

  }, {
    key: "loadAccessor",
    value: function loadAccessor(accessorIndex) {
      var parser = this;
      var json = this.json;
      var accessorDef = this.json.accessors[accessorIndex];

      if (accessorDef.bufferView === undefined && accessorDef.sparse === undefined) {
        // Ignore empty accessors, which may be used to declare runtime
        // information about attributes coming from another source (e.g. Draco
        // compression extension).
        return Promise.resolve(null);
      }

      var pendingBufferViews = [];

      if (accessorDef.bufferView !== undefined) {
        pendingBufferViews.push(this.getDependency('bufferView', accessorDef.bufferView));
      } else {
        pendingBufferViews.push(null);
      }

      if (accessorDef.sparse !== undefined) {
        pendingBufferViews.push(this.getDependency('bufferView', accessorDef.sparse.indices.bufferView));
        pendingBufferViews.push(this.getDependency('bufferView', accessorDef.sparse.values.bufferView));
      }

      return Promise.all(pendingBufferViews).then(function (bufferViews) {
        var bufferView = bufferViews[0];
        var itemSize = WEBGL_TYPE_SIZES[accessorDef.type];
        var TypedArray = WEBGL_COMPONENT_TYPES[accessorDef.componentType]; // For VEC3: itemSize is 3, elementBytes is 4, itemBytes is 12.

        var elementBytes = TypedArray.BYTES_PER_ELEMENT;
        var byteOffset = accessorDef.byteOffset || 0;
        var byteStride = accessorDef.bufferView !== undefined ? json.bufferViews[accessorDef.bufferView].byteStride : undefined;
        var normalized = accessorDef.normalized === true;
        var array, bufferAttribute; // The buffer is not interleaved if the stride is the item size in bytes.

        if (byteStride && byteStride !== elementBytes * itemSize) {
          // Each "slice" of the buffer, as defined by 'count' elements of 'byteStride' bytes, gets its own InterleavedBuffer
          // This makes sure that IBA.count reflects accessor.count properly
          var ibSlice = Math.floor(byteOffset / byteStride);
          var ibCacheKey = 'InterleavedBuffer:' + accessorDef.bufferView + ':' + accessorDef.componentType + ':' + ibSlice + ':' + accessorDef.count;
          var ib = parser.cache.get(ibCacheKey);

          if (!ib) {
            array = new TypedArray(bufferView, ibSlice * byteStride, accessorDef.count * byteStride / elementBytes); // Integer parameters to IB/IBA are in array elements, not bytes.

            ib = new _three.InterleavedBuffer(array, byteStride / elementBytes);
            parser.cache.add(ibCacheKey, ib);
          }

          bufferAttribute = new _three.InterleavedBufferAttribute(ib, itemSize, byteOffset % byteStride / elementBytes, normalized);
        } else {
          if (bufferView === null) {
            array = new TypedArray(accessorDef.count * itemSize);
          } else {
            array = new TypedArray(bufferView, byteOffset, accessorDef.count * itemSize);
          }

          bufferAttribute = new _three.BufferAttribute(array, itemSize, normalized);
        } // https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#sparse-accessors


        if (accessorDef.sparse !== undefined) {
          var itemSizeIndices = WEBGL_TYPE_SIZES.SCALAR;
          var TypedArrayIndices = WEBGL_COMPONENT_TYPES[accessorDef.sparse.indices.componentType];
          var byteOffsetIndices = accessorDef.sparse.indices.byteOffset || 0;
          var byteOffsetValues = accessorDef.sparse.values.byteOffset || 0;
          var sparseIndices = new TypedArrayIndices(bufferViews[1], byteOffsetIndices, accessorDef.sparse.count * itemSizeIndices);
          var sparseValues = new TypedArray(bufferViews[2], byteOffsetValues, accessorDef.sparse.count * itemSize);

          if (bufferView !== null) {
            // Avoid modifying the original ArrayBuffer, if the bufferView wasn't initialized with zeroes.
            bufferAttribute = new _three.BufferAttribute(bufferAttribute.array.slice(), bufferAttribute.itemSize, bufferAttribute.normalized);
          }

          for (var i = 0, il = sparseIndices.length; i < il; i++) {
            var index = sparseIndices[i];
            bufferAttribute.setX(index, sparseValues[i * itemSize]);
            if (itemSize >= 2) bufferAttribute.setY(index, sparseValues[i * itemSize + 1]);
            if (itemSize >= 3) bufferAttribute.setZ(index, sparseValues[i * itemSize + 2]);
            if (itemSize >= 4) bufferAttribute.setW(index, sparseValues[i * itemSize + 3]);
            if (itemSize >= 5) throw new Error('THREE.GLTFLoader: Unsupported itemSize in sparse BufferAttribute.');
          }
        }

        return bufferAttribute;
      });
    }
    /**
     * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#textures
     * @param {number} textureIndex
     * @return {Promise<THREE.Texture>}
     */

  }, {
    key: "loadTexture",
    value: function loadTexture(textureIndex) {
      var json = this.json;
      var options = this.options;
      var textureDef = json.textures[textureIndex];
      var source = json.images[textureDef.source];
      var loader = this.textureLoader;

      if (source.uri) {
        var handler = options.manager.getHandler(source.uri);
        if (handler !== null) loader = handler;
      }

      return this.loadTextureImage(textureIndex, source, loader);
    }
  }, {
    key: "loadTextureImage",
    value: function loadTextureImage(textureIndex, source, loader) {
      var parser = this;
      var json = this.json;
      var options = this.options;
      var textureDef = json.textures[textureIndex];
      var cacheKey = (source.uri || source.bufferView) + ':' + textureDef.sampler;

      if (this.textureCache[cacheKey]) {
        // See https://github.com/mrdoob/three.js/issues/21559.
        return this.textureCache[cacheKey];
      }

      var URL = self.URL || self.webkitURL;
      var sourceURI = source.uri || '';
      var isObjectURL = false;
      var hasAlpha = true;
      var isJPEG = sourceURI.search(/\.jpe?g($|\?)/i) > 0 || sourceURI.search(/^data\:image\/jpeg/) === 0;
      if (source.mimeType === 'image/jpeg' || isJPEG) hasAlpha = false;

      if (source.bufferView !== undefined) {
        // Load binary image data from bufferView, if provided.
        sourceURI = parser.getDependency('bufferView', source.bufferView).then(function (bufferView) {
          if (source.mimeType === 'image/png') {
            // Inspect the PNG 'IHDR' chunk to determine whether the image could have an
            // alpha channel. This check is conservative — the image could have an alpha
            // channel with all values == 1, and the indexed type (colorType == 3) only
            // sometimes contains alpha.
            //
            // https://en.wikipedia.org/wiki/Portable_Network_Graphics#File_header
            var colorType = new DataView(bufferView, 25, 1).getUint8(0, false);
            hasAlpha = colorType === 6 || colorType === 4 || colorType === 3;
          }

          isObjectURL = true;
          var blob = new Blob([bufferView], {
            type: source.mimeType
          });
          sourceURI = URL.createObjectURL(blob);
          return sourceURI;
        });
      } else if (source.uri === undefined) {
        throw new Error('THREE.GLTFLoader: Image ' + textureIndex + ' is missing URI and bufferView');
      }

      var promise = Promise.resolve(sourceURI).then(function (sourceURI) {
        return new Promise(function (resolve, reject) {
          var onLoad = resolve;

          if (loader.isImageBitmapLoader === true) {
            onLoad = function (imageBitmap) {
              resolve(new _three.CanvasTexture(imageBitmap));
            };
          }

          loader.load(resolveURL(sourceURI, options.path), onLoad, undefined, reject);
        });
      }).then(function (texture) {
        // Clean up resources and configure Texture.
        if (isObjectURL === true) {
          URL.revokeObjectURL(sourceURI);
        }

        texture.flipY = false;
        if (textureDef.name) texture.name = textureDef.name; // When there is definitely no alpha channel in the texture, set RGBFormat to save space.

        if (!hasAlpha) texture.format = _three.RGBFormat;
        var samplers = json.samplers || {};
        var sampler = samplers[textureDef.sampler] || {};
        texture.magFilter = WEBGL_FILTERS[sampler.magFilter] || _three.LinearFilter;
        texture.minFilter = WEBGL_FILTERS[sampler.minFilter] || _three.LinearMipmapLinearFilter;
        texture.wrapS = WEBGL_WRAPPINGS[sampler.wrapS] || _three.RepeatWrapping;
        texture.wrapT = WEBGL_WRAPPINGS[sampler.wrapT] || _three.RepeatWrapping;
        parser.associations.set(texture, {
          type: 'textures',
          index: textureIndex
        });
        return texture;
      });
      this.textureCache[cacheKey] = promise;
      return promise;
    }
    /**
     * Asynchronously assigns a texture to the given material parameters.
     * @param {Object} materialParams
     * @param {string} mapName
     * @param {Object} mapDef
     * @return {Promise}
     */

  }, {
    key: "assignTexture",
    value: function assignTexture(materialParams, mapName, mapDef) {
      var parser = this;
      return this.getDependency('texture', mapDef.index).then(function (texture) {
        // Materials sample aoMap from UV set 1 and other maps from UV set 0 - this can't be configured
        // However, we will copy UV set 0 to UV set 1 on demand for aoMap
        if (mapDef.texCoord !== undefined && mapDef.texCoord != 0 && !(mapName === 'aoMap' && mapDef.texCoord == 1)) {
          console.warn('THREE.GLTFLoader: Custom UV set ' + mapDef.texCoord + ' for texture ' + mapName + ' not yet supported.');
        }

        if (parser.extensions[EXTENSIONS.KHR_TEXTURE_TRANSFORM]) {
          var transform = mapDef.extensions !== undefined ? mapDef.extensions[EXTENSIONS.KHR_TEXTURE_TRANSFORM] : undefined;

          if (transform) {
            var gltfReference = parser.associations.get(texture);
            texture = parser.extensions[EXTENSIONS.KHR_TEXTURE_TRANSFORM].extendTexture(texture, transform);
            parser.associations.set(texture, gltfReference);
          }
        }

        materialParams[mapName] = texture;
      });
    }
    /**
     * Assigns final material to a Mesh, Line, or Points instance. The instance
     * already has a material (generated from the glTF material options alone)
     * but reuse of the same glTF material may require multiple threejs materials
     * to accommodate different primitive types, defines, etc. New materials will
     * be created if necessary, and reused from a cache.
     * @param  {Object3D} mesh Mesh, Line, or Points instance.
     */

  }, {
    key: "assignFinalMaterial",
    value: function assignFinalMaterial(mesh) {
      var geometry = mesh.geometry;
      var material = mesh.material;
      var useVertexTangents = geometry.attributes.tangent !== undefined;
      var useVertexColors = geometry.attributes.color !== undefined;
      var useFlatShading = geometry.attributes.normal === undefined;
      var useMorphTargets = Object.keys(geometry.morphAttributes).length > 0;
      var useMorphNormals = useMorphTargets && geometry.morphAttributes.normal !== undefined;

      if (mesh.isPoints) {
        var cacheKey = 'PointsMaterial:' + material.uuid;
        var pointsMaterial = this.cache.get(cacheKey);

        if (!pointsMaterial) {
          pointsMaterial = new _three.PointsMaterial();

          _three.Material.prototype.copy.call(pointsMaterial, material);

          pointsMaterial.color.copy(material.color);
          pointsMaterial.map = material.map;
          pointsMaterial.sizeAttenuation = false; // glTF spec says points should be 1px

          this.cache.add(cacheKey, pointsMaterial);
        }

        material = pointsMaterial;
      } else if (mesh.isLine) {
        var _cacheKey = 'LineBasicMaterial:' + material.uuid;

        var lineMaterial = this.cache.get(_cacheKey);

        if (!lineMaterial) {
          lineMaterial = new _three.LineBasicMaterial();

          _three.Material.prototype.copy.call(lineMaterial, material);

          lineMaterial.color.copy(material.color);
          this.cache.add(_cacheKey, lineMaterial);
        }

        material = lineMaterial;
      } // Clone the material if it will be modified


      if (useVertexTangents || useVertexColors || useFlatShading || useMorphTargets) {
        var _cacheKey2 = 'ClonedMaterial:' + material.uuid + ':';

        if (material.isGLTFSpecularGlossinessMaterial) _cacheKey2 += 'specular-glossiness:';
        if (useVertexTangents) _cacheKey2 += 'vertex-tangents:';
        if (useVertexColors) _cacheKey2 += 'vertex-colors:';
        if (useFlatShading) _cacheKey2 += 'flat-shading:';
        if (useMorphTargets) _cacheKey2 += 'morph-targets:';
        if (useMorphNormals) _cacheKey2 += 'morph-normals:';
        var cachedMaterial = this.cache.get(_cacheKey2);

        if (!cachedMaterial) {
          cachedMaterial = material.clone();
          if (useVertexColors) cachedMaterial.vertexColors = true;
          if (useFlatShading) cachedMaterial.flatShading = true;
          if (useMorphTargets) cachedMaterial.morphTargets = true;
          if (useMorphNormals) cachedMaterial.morphNormals = true;

          if (useVertexTangents) {
            cachedMaterial.vertexTangents = true; // https://github.com/mrdoob/three.js/issues/11438#issuecomment-507003995

            if (cachedMaterial.normalScale) cachedMaterial.normalScale.y *= -1;
            if (cachedMaterial.clearcoatNormalScale) cachedMaterial.clearcoatNormalScale.y *= -1;
          }

          this.cache.add(_cacheKey2, cachedMaterial);
          this.associations.set(cachedMaterial, this.associations.get(material));
        }

        material = cachedMaterial;
      } // workarounds for mesh and geometry


      if (material.aoMap && geometry.attributes.uv2 === undefined && geometry.attributes.uv !== undefined) {
        geometry.setAttribute('uv2', geometry.attributes.uv);
      }

      mesh.material = material;
    }
  }, {
    key: "getMaterialType",
    value: function getMaterialType()
    /* materialIndex */
    {
      return _three.MeshStandardMaterial;
    }
    /**
     * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#materials
     * @param {number} materialIndex
     * @return {Promise<Material>}
     */

  }, {
    key: "loadMaterial",
    value: function loadMaterial(materialIndex) {
      var parser = this;
      var json = this.json;
      var extensions = this.extensions;
      var materialDef = json.materials[materialIndex];
      var materialType;
      var materialParams = {};
      var materialExtensions = materialDef.extensions || {};
      var pending = [];

      if (materialExtensions[EXTENSIONS.KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS]) {
        var sgExtension = extensions[EXTENSIONS.KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS];
        materialType = sgExtension.getMaterialType();
        pending.push(sgExtension.extendParams(materialParams, materialDef, parser));
      } else if (materialExtensions[EXTENSIONS.KHR_MATERIALS_UNLIT]) {
        var kmuExtension = extensions[EXTENSIONS.KHR_MATERIALS_UNLIT];
        materialType = kmuExtension.getMaterialType();
        pending.push(kmuExtension.extendParams(materialParams, materialDef, parser));
      } else {
        // Specification:
        // https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#metallic-roughness-material
        var metallicRoughness = materialDef.pbrMetallicRoughness || {};
        materialParams.color = new _three.Color(1.0, 1.0, 1.0);
        materialParams.opacity = 1.0;

        if (Array.isArray(metallicRoughness.baseColorFactor)) {
          var array = metallicRoughness.baseColorFactor;
          materialParams.color.fromArray(array);
          materialParams.opacity = array[3];
        }

        if (metallicRoughness.baseColorTexture !== undefined) {
          pending.push(parser.assignTexture(materialParams, 'map', metallicRoughness.baseColorTexture));
        }

        materialParams.metalness = metallicRoughness.metallicFactor !== undefined ? metallicRoughness.metallicFactor : 1.0;
        materialParams.roughness = metallicRoughness.roughnessFactor !== undefined ? metallicRoughness.roughnessFactor : 1.0;

        if (metallicRoughness.metallicRoughnessTexture !== undefined) {
          pending.push(parser.assignTexture(materialParams, 'metalnessMap', metallicRoughness.metallicRoughnessTexture));
          pending.push(parser.assignTexture(materialParams, 'roughnessMap', metallicRoughness.metallicRoughnessTexture));
        }

        materialType = this._invokeOne(function (ext) {
          return ext.getMaterialType && ext.getMaterialType(materialIndex);
        });
        pending.push(Promise.all(this._invokeAll(function (ext) {
          return ext.extendMaterialParams && ext.extendMaterialParams(materialIndex, materialParams);
        })));
      }

      if (materialDef.doubleSided === true) {
        materialParams.side = _three.DoubleSide;
      }

      var alphaMode = materialDef.alphaMode || ALPHA_MODES.OPAQUE;

      if (alphaMode === ALPHA_MODES.BLEND) {
        materialParams.transparent = true; // See: https://github.com/mrdoob/three.js/issues/17706

        materialParams.depthWrite = false;
      } else {
        materialParams.transparent = false;

        if (alphaMode === ALPHA_MODES.MASK) {
          materialParams.alphaTest = materialDef.alphaCutoff !== undefined ? materialDef.alphaCutoff : 0.5;
        }
      }

      if (materialDef.normalTexture !== undefined && materialType !== _three.MeshBasicMaterial) {
        pending.push(parser.assignTexture(materialParams, 'normalMap', materialDef.normalTexture)); // https://github.com/mrdoob/three.js/issues/11438#issuecomment-507003995

        materialParams.normalScale = new _three.Vector2(1, -1);

        if (materialDef.normalTexture.scale !== undefined) {
          materialParams.normalScale.set(materialDef.normalTexture.scale, -materialDef.normalTexture.scale);
        }
      }

      if (materialDef.occlusionTexture !== undefined && materialType !== _three.MeshBasicMaterial) {
        pending.push(parser.assignTexture(materialParams, 'aoMap', materialDef.occlusionTexture));

        if (materialDef.occlusionTexture.strength !== undefined) {
          materialParams.aoMapIntensity = materialDef.occlusionTexture.strength;
        }
      }

      if (materialDef.emissiveFactor !== undefined && materialType !== _three.MeshBasicMaterial) {
        materialParams.emissive = new _three.Color().fromArray(materialDef.emissiveFactor);
      }

      if (materialDef.emissiveTexture !== undefined && materialType !== _three.MeshBasicMaterial) {
        pending.push(parser.assignTexture(materialParams, 'emissiveMap', materialDef.emissiveTexture));
      }

      return Promise.all(pending).then(function () {
        var material;

        if (materialType === GLTFMeshStandardSGMaterial) {
          material = extensions[EXTENSIONS.KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS].createMaterial(materialParams);
        } else {
          material = new materialType(materialParams);
        }

        if (materialDef.name) material.name = materialDef.name; // baseColorTexture, emissiveTexture, and specularGlossinessTexture use sRGB encoding.

        if (material.map) material.map.encoding = _three.sRGBEncoding;
        if (material.emissiveMap) material.emissiveMap.encoding = _three.sRGBEncoding;
        assignExtrasToUserData(material, materialDef);
        parser.associations.set(material, {
          type: 'materials',
          index: materialIndex
        });
        if (materialDef.extensions) addUnknownExtensionsToUserData(extensions, material, materialDef);
        return material;
      });
    }
    /** When Object3D instances are targeted by animation, they need unique names. */

  }, {
    key: "createUniqueName",
    value: function createUniqueName(originalName) {
      var sanitizedName = _three.PropertyBinding.sanitizeNodeName(originalName || '');

      var name = sanitizedName;

      for (var i = 1; this.nodeNamesUsed[name]; ++i) {
        name = sanitizedName + '_' + i;
      }

      this.nodeNamesUsed[name] = true;
      return name;
    }
    /**
     * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#geometry
     *
     * Creates BufferGeometries from primitives.
     *
     * @param {Array<GLTF.Primitive>} primitives
     * @return {Promise<Array<BufferGeometry>>}
     */

  }, {
    key: "loadGeometries",
    value: function loadGeometries(primitives) {
      var parser = this;
      var extensions = this.extensions;
      var cache = this.primitiveCache;

      function createDracoPrimitive(primitive) {
        return extensions[EXTENSIONS.KHR_DRACO_MESH_COMPRESSION].decodePrimitive(primitive, parser).then(function (geometry) {
          return addPrimitiveAttributes(geometry, primitive, parser);
        });
      }

      var pending = [];

      for (var i = 0, il = primitives.length; i < il; i++) {
        var primitive = primitives[i];
        var cacheKey = createPrimitiveKey(primitive); // See if we've already created this geometry

        var cached = cache[cacheKey];

        if (cached) {
          // Use the cached geometry if it exists
          pending.push(cached.promise);
        } else {
          var geometryPromise = void 0;

          if (primitive.extensions && primitive.extensions[EXTENSIONS.KHR_DRACO_MESH_COMPRESSION]) {
            // Use DRACO geometry if available
            geometryPromise = createDracoPrimitive(primitive);
          } else {
            // Otherwise create a new geometry
            geometryPromise = addPrimitiveAttributes(new _three.BufferGeometry(), primitive, parser);
          } // Cache this geometry


          cache[cacheKey] = {
            primitive: primitive,
            promise: geometryPromise
          };
          pending.push(geometryPromise);
        }
      }

      return Promise.all(pending);
    }
    /**
     * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#meshes
     * @param {number} meshIndex
     * @return {Promise<Group|Mesh|SkinnedMesh>}
     */

  }, {
    key: "loadMesh",
    value: function loadMesh(meshIndex) {
      var parser = this;
      var json = this.json;
      var extensions = this.extensions;
      var meshDef = json.meshes[meshIndex];
      var primitives = meshDef.primitives;
      var pending = [];

      for (var i = 0, il = primitives.length; i < il; i++) {
        var material = primitives[i].material === undefined ? createDefaultMaterial(this.cache) : this.getDependency('material', primitives[i].material);
        pending.push(material);
      }

      pending.push(parser.loadGeometries(primitives));
      return Promise.all(pending).then(function (results) {
        var materials = results.slice(0, results.length - 1);
        var geometries = results[results.length - 1];
        var meshes = [];

        for (var _i4 = 0, _il3 = geometries.length; _i4 < _il3; _i4++) {
          var geometry = geometries[_i4];
          var primitive = primitives[_i4]; // 1. create Mesh

          var mesh = void 0;
          var _material = materials[_i4];

          if (primitive.mode === WEBGL_CONSTANTS.TRIANGLES || primitive.mode === WEBGL_CONSTANTS.TRIANGLE_STRIP || primitive.mode === WEBGL_CONSTANTS.TRIANGLE_FAN || primitive.mode === undefined) {
            // .isSkinnedMesh isn't in glTF spec. See ._markDefs()
            mesh = meshDef.isSkinnedMesh === true ? new _three.SkinnedMesh(geometry, _material) : new _three.Mesh(geometry, _material);

            if (mesh.isSkinnedMesh === true && !mesh.geometry.attributes.skinWeight.normalized) {
              // we normalize floating point skin weight array to fix malformed assets (see #15319)
              // it's important to skip this for non-float32 data since normalizeSkinWeights assumes non-normalized inputs
              mesh.normalizeSkinWeights();
            }

            if (primitive.mode === WEBGL_CONSTANTS.TRIANGLE_STRIP) {
              mesh.geometry = toTrianglesDrawMode(mesh.geometry, _three.TriangleStripDrawMode);
            } else if (primitive.mode === WEBGL_CONSTANTS.TRIANGLE_FAN) {
              mesh.geometry = toTrianglesDrawMode(mesh.geometry, _three.TriangleFanDrawMode);
            }
          } else if (primitive.mode === WEBGL_CONSTANTS.LINES) {
            mesh = new _three.LineSegments(geometry, _material);
          } else if (primitive.mode === WEBGL_CONSTANTS.LINE_STRIP) {
            mesh = new _three.Line(geometry, _material);
          } else if (primitive.mode === WEBGL_CONSTANTS.LINE_LOOP) {
            mesh = new _three.LineLoop(geometry, _material);
          } else if (primitive.mode === WEBGL_CONSTANTS.POINTS) {
            mesh = new _three.Points(geometry, _material);
          } else {
            throw new Error('THREE.GLTFLoader: Primitive mode unsupported: ' + primitive.mode);
          }

          if (Object.keys(mesh.geometry.morphAttributes).length > 0) {
            updateMorphTargets(mesh, meshDef);
          }

          mesh.name = parser.createUniqueName(meshDef.name || 'mesh_' + meshIndex);
          assignExtrasToUserData(mesh, meshDef);
          if (primitive.extensions) addUnknownExtensionsToUserData(extensions, mesh, primitive);
          parser.assignFinalMaterial(mesh);
          meshes.push(mesh);
        }

        if (meshes.length === 1) {
          return meshes[0];
        }

        var group = new _three.Group();

        for (var _i5 = 0, _il4 = meshes.length; _i5 < _il4; _i5++) {
          group.add(meshes[_i5]);
        }

        return group;
      });
    }
    /**
     * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#cameras
     * @param {number} cameraIndex
     * @return {Promise<THREE.Camera>}
     */

  }, {
    key: "loadCamera",
    value: function loadCamera(cameraIndex) {
      var camera;
      var cameraDef = this.json.cameras[cameraIndex];
      var params = cameraDef[cameraDef.type];

      if (!params) {
        console.warn('THREE.GLTFLoader: Missing camera parameters.');
        return;
      }

      if (cameraDef.type === 'perspective') {
        camera = new _three.PerspectiveCamera(_three.MathUtils.radToDeg(params.yfov), params.aspectRatio || 1, params.znear || 1, params.zfar || 2e6);
      } else if (cameraDef.type === 'orthographic') {
        camera = new _three.OrthographicCamera(-params.xmag, params.xmag, params.ymag, -params.ymag, params.znear, params.zfar);
      }

      if (cameraDef.name) camera.name = this.createUniqueName(cameraDef.name);
      assignExtrasToUserData(camera, cameraDef);
      return Promise.resolve(camera);
    }
    /**
     * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#skins
     * @param {number} skinIndex
     * @return {Promise<Object>}
     */

  }, {
    key: "loadSkin",
    value: function loadSkin(skinIndex) {
      var skinDef = this.json.skins[skinIndex];
      var skinEntry = {
        joints: skinDef.joints
      };

      if (skinDef.inverseBindMatrices === undefined) {
        return Promise.resolve(skinEntry);
      }

      return this.getDependency('accessor', skinDef.inverseBindMatrices).then(function (accessor) {
        skinEntry.inverseBindMatrices = accessor;
        return skinEntry;
      });
    }
    /**
     * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#animations
     * @param {number} animationIndex
     * @return {Promise<AnimationClip>}
     */

  }, {
    key: "loadAnimation",
    value: function loadAnimation(animationIndex) {
      var json = this.json;
      var animationDef = json.animations[animationIndex];
      var pendingNodes = [];
      var pendingInputAccessors = [];
      var pendingOutputAccessors = [];
      var pendingSamplers = [];
      var pendingTargets = [];

      for (var i = 0, il = animationDef.channels.length; i < il; i++) {
        var channel = animationDef.channels[i];
        var sampler = animationDef.samplers[channel.sampler];
        var target = channel.target;
        var name = target.node !== undefined ? target.node : target.id; // NOTE: target.id is deprecated.

        var input = animationDef.parameters !== undefined ? animationDef.parameters[sampler.input] : sampler.input;
        var output = animationDef.parameters !== undefined ? animationDef.parameters[sampler.output] : sampler.output;
        pendingNodes.push(this.getDependency('node', name));
        pendingInputAccessors.push(this.getDependency('accessor', input));
        pendingOutputAccessors.push(this.getDependency('accessor', output));
        pendingSamplers.push(sampler);
        pendingTargets.push(target);
      }

      return Promise.all([Promise.all(pendingNodes), Promise.all(pendingInputAccessors), Promise.all(pendingOutputAccessors), Promise.all(pendingSamplers), Promise.all(pendingTargets)]).then(function (dependencies) {
        var nodes = dependencies[0];
        var inputAccessors = dependencies[1];
        var outputAccessors = dependencies[2];
        var samplers = dependencies[3];
        var targets = dependencies[4];
        var tracks = [];

        var _loop = function (_i6) {
          var node = nodes[_i6];
          var inputAccessor = inputAccessors[_i6];
          var outputAccessor = outputAccessors[_i6];
          var sampler = samplers[_i6];
          var target = targets[_i6];
          if (node === undefined) return "continue";
          node.updateMatrix();
          node.matrixAutoUpdate = true;
          var TypedKeyframeTrack = void 0;

          switch (PATH_PROPERTIES[target.path]) {
            case PATH_PROPERTIES.weights:
              TypedKeyframeTrack = _three.NumberKeyframeTrack;
              break;

            case PATH_PROPERTIES.rotation:
              TypedKeyframeTrack = _three.QuaternionKeyframeTrack;
              break;

            case PATH_PROPERTIES.position:
            case PATH_PROPERTIES.scale:
            default:
              TypedKeyframeTrack = _three.VectorKeyframeTrack;
              break;
          }

          var targetName = node.name ? node.name : node.uuid;
          var interpolation = sampler.interpolation !== undefined ? INTERPOLATION[sampler.interpolation] : _three.InterpolateLinear;
          var targetNames = [];

          if (PATH_PROPERTIES[target.path] === PATH_PROPERTIES.weights) {
            // Node may be a Group (glTF mesh with several primitives) or a Mesh.
            node.traverse(function (object) {
              if (object.isMesh === true && object.morphTargetInfluences) {
                targetNames.push(object.name ? object.name : object.uuid);
              }
            });
          } else {
            targetNames.push(targetName);
          }

          var outputArray = outputAccessor.array;

          if (outputAccessor.normalized) {
            var scale = getNormalizedComponentScale(outputArray.constructor);
            var scaled = new Float32Array(outputArray.length);

            for (var j = 0, jl = outputArray.length; j < jl; j++) {
              scaled[j] = outputArray[j] * scale;
            }

            outputArray = scaled;
          }

          for (var _j = 0, _jl = targetNames.length; _j < _jl; _j++) {
            var track = new TypedKeyframeTrack(targetNames[_j] + '.' + PATH_PROPERTIES[target.path], inputAccessor.array, outputArray, interpolation); // Override interpolation with custom factory method.

            if (sampler.interpolation === 'CUBICSPLINE') {
              track.createInterpolant = function (result) {
                // A CUBICSPLINE keyframe in glTF has three output values for each input value,
                // representing inTangent, splineVertex, and outTangent. As a result, track.getValueSize()
                // must be divided by three to get the interpolant's sampleSize argument.
                return new GLTFCubicSplineInterpolant(this.times, this.values, this.getValueSize() / 3, result);
              }; // Mark as CUBICSPLINE. `track.getInterpolation()` doesn't support custom interpolants.


              track.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline = true;
            }

            tracks.push(track);
          }
        };

        for (var _i6 = 0, _il5 = nodes.length; _i6 < _il5; _i6++) {
          var _ret = _loop(_i6, _il5);

          if (_ret === "continue") continue;
        }

        var name = animationDef.name ? animationDef.name : 'animation_' + animationIndex;
        return new _three.AnimationClip(name, undefined, tracks);
      });
    }
  }, {
    key: "createNodeMesh",
    value: function createNodeMesh(nodeIndex) {
      var json = this.json;
      var parser = this;
      var nodeDef = json.nodes[nodeIndex];
      if (nodeDef.mesh === undefined) return null;
      return parser.getDependency('mesh', nodeDef.mesh).then(function (mesh) {
        var node = parser._getNodeRef(parser.meshCache, nodeDef.mesh, mesh); // if weights are provided on the node, override weights on the mesh.


        if (nodeDef.weights !== undefined) {
          node.traverse(function (o) {
            if (!o.isMesh) return;

            for (var i = 0, il = nodeDef.weights.length; i < il; i++) {
              o.morphTargetInfluences[i] = nodeDef.weights[i];
            }
          });
        }

        return node;
      });
    }
    /**
     * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#nodes-and-hierarchy
     * @param {number} nodeIndex
     * @return {Promise<Object3D>}
     */

  }, {
    key: "loadNode",
    value: function loadNode(nodeIndex) {
      var json = this.json;
      var extensions = this.extensions;
      var parser = this;
      var nodeDef = json.nodes[nodeIndex]; // reserve node's name before its dependencies, so the root has the intended name.

      var nodeName = nodeDef.name ? parser.createUniqueName(nodeDef.name) : '';
      return function () {
        var pending = [];

        var meshPromise = parser._invokeOne(function (ext) {
          return ext.createNodeMesh && ext.createNodeMesh(nodeIndex);
        });

        if (meshPromise) {
          pending.push(meshPromise);
        }

        if (nodeDef.camera !== undefined) {
          pending.push(parser.getDependency('camera', nodeDef.camera).then(function (camera) {
            return parser._getNodeRef(parser.cameraCache, nodeDef.camera, camera);
          }));
        }

        parser._invokeAll(function (ext) {
          return ext.createNodeAttachment && ext.createNodeAttachment(nodeIndex);
        }).forEach(function (promise) {
          pending.push(promise);
        });

        return Promise.all(pending);
      }().then(function (objects) {
        var node; // .isBone isn't in glTF spec. See ._markDefs

        if (nodeDef.isBone === true) {
          node = new _three.Bone();
        } else if (objects.length > 1) {
          node = new _three.Group();
        } else if (objects.length === 1) {
          node = objects[0];
        } else {
          node = new _three.Object3D();
        }

        if (node !== objects[0]) {
          for (var i = 0, il = objects.length; i < il; i++) {
            node.add(objects[i]);
          }
        }

        if (nodeDef.name) {
          node.userData.name = nodeDef.name;
          node.name = nodeName;
        }

        assignExtrasToUserData(node, nodeDef);
        if (nodeDef.extensions) addUnknownExtensionsToUserData(extensions, node, nodeDef);

        if (nodeDef.matrix !== undefined) {
          var matrix = new _three.Matrix4();
          matrix.fromArray(nodeDef.matrix);
          node.applyMatrix4(matrix);
        } else {
          if (nodeDef.translation !== undefined) {
            node.position.fromArray(nodeDef.translation);
          }

          if (nodeDef.rotation !== undefined) {
            node.quaternion.fromArray(nodeDef.rotation);
          }

          if (nodeDef.scale !== undefined) {
            node.scale.fromArray(nodeDef.scale);
          }
        }

        parser.associations.set(node, {
          type: 'nodes',
          index: nodeIndex
        });
        return node;
      });
    }
    /**
     * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#scenes
     * @param {number} sceneIndex
     * @return {Promise<Group>}
     */

  }, {
    key: "loadScene",
    value: function loadScene(sceneIndex) {
      var json = this.json;
      var extensions = this.extensions;
      var sceneDef = this.json.scenes[sceneIndex];
      var parser = this; // Loader returns Group, not Scene.
      // See: https://github.com/mrdoob/three.js/issues/18342#issuecomment-578981172

      var scene = new _three.Group();
      if (sceneDef.name) scene.name = parser.createUniqueName(sceneDef.name);
      assignExtrasToUserData(scene, sceneDef);
      if (sceneDef.extensions) addUnknownExtensionsToUserData(extensions, scene, sceneDef);
      var nodeIds = sceneDef.nodes || [];
      var pending = [];

      for (var i = 0, il = nodeIds.length; i < il; i++) {
        pending.push(buildNodeHierachy(nodeIds[i], scene, json, parser));
      }

      return Promise.all(pending).then(function () {
        return scene;
      });
    }
  }]);
  return GLTFParser;
}();

function buildNodeHierachy(nodeId, parentObject, json, parser) {
  var nodeDef = json.nodes[nodeId];
  return parser.getDependency('node', nodeId).then(function (node) {
    if (nodeDef.skin === undefined) return node; // build skeleton here as well

    var skinEntry;
    return parser.getDependency('skin', nodeDef.skin).then(function (skin) {
      skinEntry = skin;
      var pendingJoints = [];

      for (var i = 0, il = skinEntry.joints.length; i < il; i++) {
        pendingJoints.push(parser.getDependency('node', skinEntry.joints[i]));
      }

      return Promise.all(pendingJoints);
    }).then(function (jointNodes) {
      node.traverse(function (mesh) {
        if (!mesh.isMesh) return;
        var bones = [];
        var boneInverses = [];

        for (var j = 0, jl = jointNodes.length; j < jl; j++) {
          var jointNode = jointNodes[j];

          if (jointNode) {
            bones.push(jointNode);
            var mat = new _three.Matrix4();

            if (skinEntry.inverseBindMatrices !== undefined) {
              mat.fromArray(skinEntry.inverseBindMatrices.array, j * 16);
            }

            boneInverses.push(mat);
          } else {
            console.warn('THREE.GLTFLoader: Joint "%s" could not be found.', skinEntry.joints[j]);
          }
        }

        mesh.bind(new _three.Skeleton(bones, boneInverses), mesh.matrixWorld);
      });
      return node;
    });
  }).then(function (node) {
    // build node hierachy
    parentObject.add(node);
    var pending = [];

    if (nodeDef.children) {
      var children = nodeDef.children;

      for (var i = 0, il = children.length; i < il; i++) {
        var child = children[i];
        pending.push(buildNodeHierachy(child, node, json, parser));
      }
    }

    return Promise.all(pending);
  });
}
/**
 * @param {BufferGeometry} geometry
 * @param {GLTF.Primitive} primitiveDef
 * @param {GLTFParser} parser
 */


function computeBounds(geometry, primitiveDef, parser) {
  var attributes = primitiveDef.attributes;
  var box = new _three.Box3();

  if (attributes.POSITION !== undefined) {
    var accessor = parser.json.accessors[attributes.POSITION];
    var min = accessor.min;
    var max = accessor.max; // glTF requires 'min' and 'max', but VRM (which extends glTF) currently ignores that requirement.

    if (min !== undefined && max !== undefined) {
      box.set(new _three.Vector3(min[0], min[1], min[2]), new _three.Vector3(max[0], max[1], max[2]));

      if (accessor.normalized) {
        var boxScale = getNormalizedComponentScale(WEBGL_COMPONENT_TYPES[accessor.componentType]);
        box.min.multiplyScalar(boxScale);
        box.max.multiplyScalar(boxScale);
      }
    } else {
      console.warn('THREE.GLTFLoader: Missing min/max properties for accessor POSITION.');
      return;
    }
  } else {
    return;
  }

  var targets = primitiveDef.targets;

  if (targets !== undefined) {
    var maxDisplacement = new _three.Vector3();
    var vector = new _three.Vector3();

    for (var i = 0, il = targets.length; i < il; i++) {
      var target = targets[i];

      if (target.POSITION !== undefined) {
        var _accessor = parser.json.accessors[target.POSITION];
        var _min = _accessor.min;
        var _max = _accessor.max; // glTF requires 'min' and 'max', but VRM (which extends glTF) currently ignores that requirement.

        if (_min !== undefined && _max !== undefined) {
          // we need to get max of absolute components because target weight is [-1,1]
          vector.setX(Math.max(Math.abs(_min[0]), Math.abs(_max[0])));
          vector.setY(Math.max(Math.abs(_min[1]), Math.abs(_max[1])));
          vector.setZ(Math.max(Math.abs(_min[2]), Math.abs(_max[2])));

          if (_accessor.normalized) {
            var _boxScale = getNormalizedComponentScale(WEBGL_COMPONENT_TYPES[_accessor.componentType]);

            vector.multiplyScalar(_boxScale);
          } // Note: this assumes that the sum of all weights is at most 1. This isn't quite correct - it's more conservative
          // to assume that each target can have a max weight of 1. However, for some use cases - notably, when morph targets
          // are used to implement key-frame animations and as such only two are active at a time - this results in very large
          // boxes. So for now we make a box that's sometimes a touch too small but is hopefully mostly of reasonable size.


          maxDisplacement.max(vector);
        } else {
          console.warn('THREE.GLTFLoader: Missing min/max properties for accessor POSITION.');
        }
      }
    } // As per comment above this box isn't conservative, but has a reasonable size for a very large number of morph targets.


    box.expandByVector(maxDisplacement);
  }

  geometry.boundingBox = box;
  var sphere = new _three.Sphere();
  box.getCenter(sphere.center);
  sphere.radius = box.min.distanceTo(box.max) / 2;
  geometry.boundingSphere = sphere;
}
/**
 * @param {BufferGeometry} geometry
 * @param {GLTF.Primitive} primitiveDef
 * @param {GLTFParser} parser
 * @return {Promise<BufferGeometry>}
 */


function addPrimitiveAttributes(geometry, primitiveDef, parser) {
  var attributes = primitiveDef.attributes;
  var pending = [];

  function assignAttributeAccessor(accessorIndex, attributeName) {
    return parser.getDependency('accessor', accessorIndex).then(function (accessor) {
      geometry.setAttribute(attributeName, accessor);
    });
  }

  for (var gltfAttributeName in attributes) {
    var threeAttributeName = ATTRIBUTES[gltfAttributeName] || gltfAttributeName.toLowerCase(); // Skip attributes already provided by e.g. Draco extension.

    if (threeAttributeName in geometry.attributes) continue;
    pending.push(assignAttributeAccessor(attributes[gltfAttributeName], threeAttributeName));
  }

  if (primitiveDef.indices !== undefined && !geometry.index) {
    var accessor = parser.getDependency('accessor', primitiveDef.indices).then(function (accessor) {
      geometry.setIndex(accessor);
    });
    pending.push(accessor);
  }

  assignExtrasToUserData(geometry, primitiveDef);
  computeBounds(geometry, primitiveDef, parser);
  return Promise.all(pending).then(function () {
    return primitiveDef.targets !== undefined ? addMorphTargets(geometry, primitiveDef.targets, parser) : geometry;
  });
}
/**
 * @param {BufferGeometry} geometry
 * @param {Number} drawMode
 * @return {BufferGeometry}
 */


function toTrianglesDrawMode(geometry, drawMode) {
  var index = geometry.getIndex(); // generate index if not present

  if (index === null) {
    var indices = [];
    var position = geometry.getAttribute('position');

    if (position !== undefined) {
      for (var i = 0; i < position.count; i++) {
        indices.push(i);
      }

      geometry.setIndex(indices);
      index = geometry.getIndex();
    } else {
      console.error('THREE.GLTFLoader.toTrianglesDrawMode(): Undefined position attribute. Processing not possible.');
      return geometry;
    }
  } //


  var numberOfTriangles = index.count - 2;
  var newIndices = [];

  if (drawMode === _three.TriangleFanDrawMode) {
    // gl.TRIANGLE_FAN
    for (var _i7 = 1; _i7 <= numberOfTriangles; _i7++) {
      newIndices.push(index.getX(0));
      newIndices.push(index.getX(_i7));
      newIndices.push(index.getX(_i7 + 1));
    }
  } else {
    // gl.TRIANGLE_STRIP
    for (var _i8 = 0; _i8 < numberOfTriangles; _i8++) {
      if (_i8 % 2 === 0) {
        newIndices.push(index.getX(_i8));
        newIndices.push(index.getX(_i8 + 1));
        newIndices.push(index.getX(_i8 + 2));
      } else {
        newIndices.push(index.getX(_i8 + 2));
        newIndices.push(index.getX(_i8 + 1));
        newIndices.push(index.getX(_i8));
      }
    }
  }

  if (newIndices.length / 3 !== numberOfTriangles) {
    console.error('THREE.GLTFLoader.toTrianglesDrawMode(): Unable to generate correct amount of triangles.');
  } // build final geometry


  var newGeometry = geometry.clone();
  newGeometry.setIndex(newIndices);
  return newGeometry;
}