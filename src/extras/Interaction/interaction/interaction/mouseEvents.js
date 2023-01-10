class MouseEvents {
  static camera;
  static raycaster;
  static domElement;
  static mouseDownPosition;
  static mouseUpPosition;
  static target = [];
  static interaction;
  static recursive = false;
  static intersectedObjects = [];
  static cancelFnMap = new Map();

  // 判断是否是一次点击事件 up与down是否在同一点发生
  static isClickEvent = (mousePosition) => {
    if (MouseEvents.mouseDownPosition) {
      return (
        mousePosition.x === MouseEvents.mouseDownPosition.x &&
        mousePosition.y === MouseEvents.mouseDownPosition.y
      );
    }
    return false;
  };

  // 获取鼠标在canvas中的坐标值
  static getNormalizedCanvasRelativePosition = (e) => {
    const boundingRect = MouseEvents.domElement.getBoundingClientRect();
    const clientX = Number.isNaN(+e.clientX) && e.changedTouches.length ? e.changedTouches[0].clientX : e.clientX;
    const clientY = Number.isNaN(+e.clientY) && e.changedTouches.length ? e.changedTouches[0].clientY : e.clientY;
    return {
      x: ((clientX - boundingRect.left) / boundingRect.width) * 2 - 1,
      y: ((clientY - boundingRect.top) / boundingRect.height) * -2 + 1,
    };
  };

  // pointerdown事件注册 记录down的位置点
  static pointerDownHandler = (e) => {
    MouseEvents.mouseDownPosition =
      MouseEvents.getNormalizedCanvasRelativePosition(e);
  };

  // 取消事件
  static reductCancelFn = () => {
    MouseEvents.cancelFnMap.forEach((fn, t) => {
      if (t.isActived) {
        const f = fn.bind(t);
        f();
      }
    });
  };

  // pointerup事件注册 记录射线选中的所有物体
  static pointerUpHandler = (e) => {
    const mouseUpPosition = MouseEvents.getNormalizedCanvasRelativePosition(e);
    MouseEvents.mouseUpPosition = mouseUpPosition;
    if (MouseEvents.isClickEvent(mouseUpPosition)) {
      MouseEvents.raycaster.setFromCamera(mouseUpPosition, MouseEvents.camera);
      MouseEvents.intersectedObjects = MouseEvents.raycaster.intersectObjects(
        MouseEvents.target ?? [],
        MouseEvents.recursive,
      );
      if (MouseEvents.intersectedObjects.length === 0)
        MouseEvents.reductCancelFn();
    } else {
      MouseEvents.intersectedObjects = [];
    }
  };

  static initMouseEvents(camera, render, scene, raycaster, interaction) {
    const { domElement } = render;
    MouseEvents.target = scene.children;
    MouseEvents.domElement = domElement;
    MouseEvents.camera = camera;
    MouseEvents.raycaster = raycaster;
    MouseEvents.recursive = true;
    MouseEvents.interaction = interaction;
    domElement.addEventListener('pointerdown', MouseEvents.pointerDownHandler);
    domElement.addEventListener('pointerup', MouseEvents.pointerUpHandler);
    return raycaster;
  }

  static removeAllEvents = () => {
    MouseEvents.cancelFnMap.clear();
    MouseEvents.domElement.removeEventListener(
      'pointerdown',
      MouseEvents.pointerDownHandler,
    );
    MouseEvents.domElement.removeEventListener(
      'pointerup',
      MouseEvents.pointerUpHandler,
    );
  };
}

export default MouseEvents;
