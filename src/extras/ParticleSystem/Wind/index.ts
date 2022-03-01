/*
 *@description: 大风特效
 *@author: guoweiyu
 *@date: 2021-05-28 15:50:47
 */
import * as THREE from 'three';
import WindMaterial from './material';

type WindConfig = {
  // 区域范围的长度 默认4000
  length?: number;
  // 区域范围的高度 默认5000
  height?: number;
  // 风条的长度 默认值4000 小于等于0则变为默认长度4000
  windLength?: number;
  // 风条的斜率 单位：度 默认值-8 长度改变后需重新调节
  slope?: number;
  // 风条运动的速率 默认值1速度为90 小于等于零则为默认值1
  velocity?: number;
  // 风条的数量规模 默认值1有50个风条 小于0则变为默认值1 等于0则无风条产生
  scale?: number;
};
export default class Wind extends THREE.Mesh {
  private time: number = 0;
  private clock: THREE.Clock = new THREE.Clock();
  private box: THREE.Box3 = new THREE.Box3();
  material: WindMaterial = new WindMaterial();
  private velocity: number = 1;
  constructor(
    config: WindConfig = {
      length: 4000,
      height: 5000,
      scale: 1,
      windLength: 4000,
      slope: -8,
    },
  ) {
    super();
    this.createWind(config);
    this.userData.type = 'weather';
    config.velocity && config.velocity > 0 && (this.velocity = config.velocity);
  }

  public update = (cameraPosition: THREE.Vector3) => {
    this.time = (this.time + this.clock.getDelta() * 0.5) % 1;

    this.material.cameraPosition = cameraPosition;
    if (this.material.uniforms && 'attributes' in this.geometry) {
      // v用以控制风速
      const v = 90 * this.velocity;

      // 四个点为一风条
      for (let i = 0; i < this.geometry.attributes.position.count; i += 4) {
        const { position, velocity } = this.geometry.attributes;

        // 使风条在每次渲染时按照所吹方向移动
        for (let j = i; j < i + 4; j += 1) {
          position.setX(j, position.getX(j) - velocity.getX(i) * v);
          position.setY(j, position.getY(j) - velocity.getY(i) * v);
          position.setZ(j, position.getZ(j) - velocity.getZ(i) * v);
        }

        // 如果风条移动到范围外 修改风条位置到范围内
        if (
          position.getX(i) < this.box.min.x ||
          position.getX(i) > this.box.max.x
        ) {
          const initialX = position.getX(i);
          const initialY = position.getY(i);
          const randomX =
            Math.random() * (this.box.max.x - this.box.min.x) + this.box.min.x;
          const randomY =
            Math.random() * (this.box.max.y - this.box.min.y) + this.box.min.y;
          const randomZ =
            Math.random() * (this.box.max.z - this.box.min.z) + this.box.min.z;

          for (let j = i; j < i + 4; j += 1) {
            position.setX(j, randomX + position.getX(j) - initialX);
            position.setY(j, randomY + position.getY(j) - initialY);
            position.setZ(j, randomZ);
          }
        }

        if (
          position.getY(i) < this.box.min.y ||
          position.getY(i) > this.box.max.y
        ) {
          const initialX = position.getX(i);
          const initialY = position.getY(i);
          const randomX =
            Math.random() * (this.box.max.x - this.box.min.x) + this.box.min.x;
          const randomY =
            Math.random() * (this.box.max.y - this.box.min.y) + this.box.min.y;
          const randomZ =
            Math.random() * (this.box.max.z - this.box.min.z) + this.box.min.z;

          for (let j = i; j < i + 4; j += 1) {
            position.setX(j, randomX + position.getX(j) - initialX);
            position.setY(j, randomY + position.getY(j) - initialY);
            position.setZ(j, randomZ);
          }
        }

        if (
          position.getZ(i) < this.box.min.z ||
          position.getZ(i) > this.box.max.z
        ) {
          const initialX = position.getX(i);
          const initialY = position.getY(i);
          const randomX =
            Math.random() * (this.box.max.x - this.box.min.x) + this.box.min.x;
          const randomY =
            Math.random() * (this.box.max.y - this.box.min.y) + this.box.min.y;
          const randomZ =
            Math.random() * (this.box.max.z - this.box.min.z) + this.box.min.z;

          for (let j = i; j < i + 4; j += 1) {
            position.setX(j, randomX + position.getX(j) - initialX);
            position.setY(j, randomY + position.getY(j) - initialY);
            position.setZ(j, randomZ);
          }
        }
      }
      if ('needsUpdate' in this.geometry.attributes.position) {
        this.geometry.attributes.position.needsUpdate = true;
      }
    }
  };

  private getRotatePoint = (
    points: { x: number; y: number }[],
    rotateCenter: { x: number; y: number },
    angle: number,
  ) => {
    const rotatedPoints: { x: number; y: number }[] = [];
    points.forEach((e) => {
      const x1 = e.x;
      const y1 = e.y;
      const x2 = rotateCenter.x;
      const y2 = rotateCenter.y;

      const x =
        (x1 - x2) * Math.cos((angle * Math.PI) / 180) -
        (y1 - y2) * Math.sin((angle * Math.PI) / 180) +
        x2;
      const y =
        (x1 - x2) * Math.sin((angle * Math.PI) / 180) +
        (y1 - y2) * Math.cos((angle * Math.PI) / 180) +
        y2;

      rotatedPoints.push({ x, y });
    });
    return rotatedPoints;
  };

  private createWind = (config: WindConfig) => {
    const { length, height, windLength, slope, scale } = config;

    const box = new THREE.Box3(
      new THREE.Vector3(length ? -length : -4000, 0, length ? -length : -4000),
      new THREE.Vector3(
        length ? length * 2 : 8000,
        height || 5000,
        length ? length * 2 : 8000,
      ),
    );
    this.box = box;

    const material = new WindMaterial({
      transparent: true,
      opacity: 0.3,
      map: new THREE.TextureLoader().load(
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAB4CAYAAAAg79h0AAACCUlEQVRYhbVYi47DMAgzbff//9u1y2mnERHHJDndHdK0R1xjCJBoVkoBgA3A+4Oht9fxAWxisdrxeVlgKoSxI7BENgd+P+RMUAz+2zHT46BdPc2adhIOCsKipmkKogt2aVFTDFsK54XmAdZknEiIbYGKUDHJ6B6DMmlSMDRnUpEh0zR0xxFJ4dHktjBIunuILDfuR8KbbVl293egMqjzLjqMSiUugBMahcuec6b/TUFTDTNQsy3TPPkGy56bCZdM0+h+3XeW7V0UbyvuuuaUDbE8x3fkVjWpER3dy77rBuzM3c9AW6Ylgg4uMsVkK8frvlIFW1K+S6CmzfH5YsTin5vTfCg8FRxBTA/WtgkAfze1JZ1NRSPkCPQeX5XphR5QgzgIEK1WKF8clDVMmdkI1PTdjKmCVPmaAgF6unyD7mxWxqK7mD5jmgp3kJzhDrr08zkTVNe8QU+KJlqdT9fgJoYIysyiu3Q8q+jUvdwypi5P96A6q6YziS7V1CxGd08BAoPOSauXUTK7FChAk4JTJLG7+F2j8NldNqZrMpU1RXcNtqW6y5iqxSpITyoVnQS5u/SkWt7gJZBKQVfjZ7LYMS27y3KV1lPHxAOD6wlqYDC4RBAyoJqZMgXZVGmutdn0bS5+nMxuwvCxIY1TMDw26r1kFB1fSCPz7dGpG4af6rf/ZeIL3OYFAL4AxjDgy+FcJmUAAAAASUVORK5CYII=',
      ),
      depthWrite: true,
      side: THREE.DoubleSide,
    });

    material.onBeforeCompile = (shader) => {
      material.uniforms = shader.uniforms;
    };

    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const normals = [];
    const uvs = [];
    const indices = [];
    const velocity = [];

    if (!scale) return;

    for (let i = 0; i < (scale > 0 ? 50 * scale : 50); i += 1) {
      const pos = new THREE.Vector3();
      pos.x = Math.random() * (box.max.x - box.min.x) + box.min.x;
      pos.y = Math.random() * (box.max.y - box.min.y) + box.min.y;
      pos.z = Math.random() * (box.max.z - box.min.z) + box.min.z;

      const elHeight = 800;
      const elWidth = elHeight / 1000 + 20;

      // 风条向下的偏移量
      const excursion = windLength && windLength > 0 ? windLength : 4000;
      const verticePoint1 = {
        x: pos.x + elWidth + excursion / 2,
        y: pos.y + elHeight / 2,
      };
      const verticePoint2 = {
        x: pos.x - elWidth + excursion / 2,
        y: pos.y + elHeight / 2,
      };
      const verticePoint3 = {
        x: pos.x - elWidth - excursion / 2,
        y: pos.y - elHeight / 2,
      };
      const verticePoint4 = {
        x: pos.x + elWidth - excursion / 2,
        y: pos.y - elHeight / 2,
      };
      const rotatedPoints = this.getRotatePoint(
        [verticePoint1, verticePoint2, verticePoint3, verticePoint4],
        pos,
        slope || -12,
      );

      vertices.push(
        rotatedPoints[0].x,
        rotatedPoints[0].y,
        pos.z,
        rotatedPoints[1].x,
        rotatedPoints[1].y,
        pos.z,
        rotatedPoints[2].x,
        rotatedPoints[2].y,
        pos.z,
        rotatedPoints[3].x,
        rotatedPoints[3].y,
        pos.z,
      );

      // 风条所吹向的方向的单位向量
      const dectorVec = new THREE.Vector3(
        rotatedPoints[0].x,
        rotatedPoints[0].y,
        pos.z,
      )
        .sub(new THREE.Vector3(rotatedPoints[3].x, rotatedPoints[3].y, pos.z))
        .normalize();
      // 存储该单位向量
      velocity.push(dectorVec.x, dectorVec.y, dectorVec.z);

      normals.push(
        pos.x,
        pos.y,
        pos.z,
        pos.x,
        pos.y,
        pos.z,
        pos.x,
        pos.y,
        pos.z,
        pos.x,
        pos.y,
        pos.z,
      );

      uvs.push(1, 1, 0, 1, 0, 0, 1, 0);

      indices.push(
        i * 4 + 0,
        i * 4 + 1,
        i * 4 + 2,
        i * 4 + 0,
        i * 4 + 2,
        i * 4 + 3,
      );
    }

    geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(vertices), 3),
    );
    geometry.setAttribute(
      'normal',
      new THREE.BufferAttribute(new Float32Array(normals), 3),
    );
    geometry.setAttribute(
      'uv',
      new THREE.BufferAttribute(new Float32Array(uvs), 2),
    );
    geometry.setAttribute(
      'velocity',
      new THREE.BufferAttribute(new Float32Array(velocity), 3),
    );
    geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));

    this.geometry = geometry;
    this.material = material;
  };
}
