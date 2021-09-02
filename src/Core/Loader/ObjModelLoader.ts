/**
 *@description 加载OBJ文件的加载器.
 *@author guoweiyu.
 *@date 2021-08-24 09:26:49.
 */
import { ObjModelLoaderType } from './type';
import { LineMaterial } from '../../lib/lines/LineMaterial';
import { LineSegments2 } from '../../lib/lines/LineSegments2';
import { LineSegmentsGeometry } from '../../lib/lines/LineSegmentsGeometry';
import { Group, Object3D, BoxHelper, Mesh, EdgesGeometry } from 'three';
import { OBJLoader2 } from '../../lib/loaders/OBJLoader2';

class ObjModelLoader extends Group {
  constructor(config: ObjModelLoaderType) {
    super();
    this.load(config);
  }

  // 将模型放在【0，0，0】点
  moveToCenter = (model: Object3D) => {
    const box = new BoxHelper(model);
    const boundSphere = box.geometry.boundingSphere;
    if (!boundSphere) return;
    const { x, y, z } = boundSphere.center;
    model.position.x -= x;
    model.position.y -= y;
    model.position.z -= z;
  };

  // 添加鼠标悬浮勾边的方法
  addEdgeOutline = (model: Object3D) => {
    model.traverse((child: any) => {
      if (!(child instanceof Mesh)) return;
      const edges = new EdgesGeometry(child.geometry);
      const lintMat = new LineMaterial({
        color: '#f56d00',
        linewidth: 0.003,
      });
      const lineGeo = new LineSegmentsGeometry().fromEdgesGeometry(edges);
      const line = new LineSegments2(lineGeo, lintMat);
      model.add(line);
      line.visible = false;
      child.userData.line = line;
      child.cursor = 'pointer';
      child.on('mouseover', () => {
        // child.add(line);
        line.visible = true;
      });
      child.on('mouseout', () => {
        // child.remove(line);
        line.visible = false;
      });
    });
  };

  load = (config: ObjModelLoaderType) => {
    const { url, complete, isOutline = true } = config;
    if (!url) return;
    const loader = new OBJLoader2();
    loader.load(url, obj => {
      this.moveToCenter(obj);
      isOutline && this.addEdgeOutline(obj);
      this.add(obj);
      complete && complete(this);
    });
  };
}

export default ObjModelLoader;
