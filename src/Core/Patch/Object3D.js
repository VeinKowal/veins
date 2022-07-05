/**
 *@description 为Object3D添加重写一些方法.
 *@author guoweiyu.
 *@date 2021-08-23 10:06:35.
 */
import { Object3D } from 'three';

/**
 * @description 查询方法.
 * @param {String} param - 查询条件.
 * @param {Boolean} recursive - 是否查询所有后代物体，默认为true.
 * @return {Object3D[]} 查询结果.
 */
Object3D.prototype.query = function (param, recursive = true) {
  // 没有参数 返回
  if (!param) return;
  const result = [];
  let matchStr = param;
  let matchMap = new Map();

  // 判断是否用正则表达式匹配name
  let isReg = typeof param === 'object';
  // 判断是否用type匹配Object3D，(.xxx)
  let isType = /^\./.test(param);
  // 判断是否用id匹配Object3D，(#xxx)
  let isID = /^#/.test(param);
  // 判断是否用自定义属性值匹配Object3D，([xxx=yyy])
  let isUD = /(^\[)[\s\S]*?(\]$)/.test(param);

  if (!isReg && typeof param === 'string') {
    if (isType) matchStr = param.slice(1);
    else if (isID) matchStr = param.slice(1);
    else if (isUD) {
      const content = param.slice(1, param.length - 1);
      const arr = content.split(',');
      arr.forEach((item) => {
        const mapItem = item.split('=');
        if (mapItem.length <= 1) return;
        matchMap.set(mapItem[0].trim(), mapItem[1].trim());
      });
    }
  }

  const strMatch = (child) => {
    const { name, type, id, userData } = child;
    if (
      param === name ||
      (isReg && param.test(name)) ||
      (isType && matchStr === type) ||
      (isID && matchStr === `${id}`)
    ) {
      result.push(child);
    } else if (isUD) {
      let isMatch = false;
      matchMap.forEach((v, k) => {
        userData[k] && userData[k] == v && (isMatch = true);
      });
      isMatch && result.push(child);
    }
  };

  if (recursive) {
    this.traverse((child) => strMatch(child));
  } else {
    this.children.forEach((child) => strMatch(child));
  }

  return result;
};

Object3D.prototype.copy = function (source, recursive = true) {
  this.name = source.name;

  this.up.copy(source.up);

  this.position.copy(source.position);
  this.rotation.order = source.rotation.order;
  this.quaternion.copy(source.quaternion);
  this.scale.copy(source.scale);

  this.matrix.copy(source.matrix);
  this.matrixWorld.copy(source.matrixWorld);

  this.matrixAutoUpdate = source.matrixAutoUpdate;
  this.matrixWorldNeedsUpdate = source.matrixWorldNeedsUpdate;

  this.layers.mask = source.layers.mask;
  this.visible = source.visible;

  this.castShadow = source.castShadow;
  this.receiveShadow = source.receiveShadow;

  this.frustumCulled = source.frustumCulled;
  this.renderOrder = source.renderOrder;
  // 边框勾勒
  this.line = source.line;

  this.userData = JSON.parse(JSON.stringify(source.userData));

  if (recursive === true) {
    for (let i = 0; i < source.children.length; i++) {
      const child = source.children[i];
      if (child.isLineSegments2) {
        this.add(child);
      } else {
        this.add(child.clone());
      }
    }
  }

  return this;
};
