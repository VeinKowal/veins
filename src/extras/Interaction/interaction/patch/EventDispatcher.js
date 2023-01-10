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
    if (!('events' in this)) this.events = new Map();
  } else {
    // console.error('不允许注册鼠标事件');
    return this;
  }
  const basicFn = (e) => {
    const { intersectedObjects, interaction } = MouseEvents;
    this.isActived = true;

    // 再判断路线上是否有Marker 存在就只执行Marker方法
    const marker = intersectedObjects.find(
      (obj) =>
        obj.userData && obj.userData.type && obj.userData.type === 'Marker',
    );
    marker && 'isActive' in marker
      ? interaction.triggerEvent(marker, 'click', e)
      : fn(e);
  };
  if (type === 'click') {
    const event = (e) => {
      const { isClickEvent, getNormalizedCanvasRelativePosition } = MouseEvents;
      // 先判断距离再决定是否执行
      if (
        !isClickEvent(getNormalizedCanvasRelativePosition(e.data.originalEvent))
      )
        return;
      basicFn(e);
    };
    this.events.set(fn, event);
    this.addEventListener('pointerup', event);
  } else if (type === 'dblclick') {
    const event = (e) => {
      if (e.data.originalEvent.detail === 2) {
        basicFn(e);
      }
    };
    this.events.set(fn, event);
    this.addEventListener('click', event);
  } else if (type === 'cancel') {
    // 保存cancel方法
    MouseEvents.cancelFnMap.set(this, () => {
      fn();
      this.isActived = false;
    });
  } else {
    this.events.set(fn, basicFn);
    this.addEventListener(type, basicFn);
  }
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
  let event = null;
  if ('events' in this) {
    event = this.events.get(fn);
    this.events.delete(fn);
  }
  if (type === 'click') type = 'pointerup';
  event
    ? this.removeEventListener(type, event)
    : this.removeEventListener(type, fn);
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
  if (this._listeners === undefined || Utils.isUndefined(this._listeners[type]))
    return;
  const cbs = this._listeners[type] || [];
  const cache = cbs.slice(0);

  for (let i = 0; i < cache.length; i += 1) {
    cache[i].apply(this, argument);
  }
  return this;
};
