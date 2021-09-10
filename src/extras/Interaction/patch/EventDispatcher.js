import { EventDispatcher, Object3D } from 'three';
import { Utils } from '../utils/Utils.js';
import MouseEvents from '../interaction/mouseEvents';

/**
 * proxy `addEventListener` function
 *
 * @param {String} type event type, evnet name
 * @param {Function} fn callback
 * @return {this} this
 */
EventDispatcher.prototype.on = function (type, fn) {
  if (!Utils.isFunction(fn)) return;
  if (this instanceof Object3D) {
    this.interactive = true;
    this.isActived = false;
  };
  const basicFn = (e) => {
    const { intersectedObjects, interaction } = MouseEvents;
    this.isActived = true;

    // 再判断路线上是否有Marker 存在就只执行Marker方法
    const marker = intersectedObjects.find((obj) => obj.userData && obj.userData.type && obj.userData.type === 'Marker');
    (marker && 'isActive' in marker) ? interaction.triggerEvent(marker, 'click', e) : fn(e);
  }
  if (type === 'click') {
    this.addEventListener(type, (e) => {
      const { isClickEvent, mouseUpPosition } = MouseEvents;
      // 先判断距离再决定是否执行
      if (!isClickEvent(mouseUpPosition)) return;
      basicFn(e);
    });
  } else if (type === 'dblclick') {
    this.addEventListener('click', (e) => {
      if (e.data.originalEvent.detail === 2) {
        basicFn(e);
      }
    });
  } else if (type === 'cancel') {
    // 保存cancel方法
    MouseEvents.cancelFnMap.set(this, () => {
      fn()
      this.isActived = false;
    })
  } else this.addEventListener(type, (e) => {
    basicFn(e);
  });
  return this;
};

/**
 * proxy `removeEventListener` function
 *
 * @param {String} type event type, evnet name
 * @param {Function} fn callback, which you had bind before
 * @return {this} this
 */
EventDispatcher.prototype.off = function (type, fn) {
  this.removeEventListener(type, fn);
  return this;
};

/**
 * binding a once event, just emit once time
 *
 * @param {String} type event type, evnet name
 * @param {Function} fn callback
 * @return {this} this
 */
EventDispatcher.prototype.once = function (type, fn) {
  if (!Utils.isFunction(fn)) return;
  const cb = (ev) => {
    fn(ev);
    this.off(type, cb);
  };
  this.on(type, cb);
  return this;
};

/**
 * emit a event
 *
 * @param {String} type event type, evnet name
 * @return {this} this
 */
EventDispatcher.prototype.emit = function (type, ...argument) {
  if (this._listeners === undefined || Utils.isUndefined(this._listeners[type])) return;
  const cbs = this._listeners[type] || [];
  const cache = cbs.slice(0);

  for (let i = 0; i < cache.length; i += 1) {
    cache[i].apply(this, argument);
  }
  return this;
};

