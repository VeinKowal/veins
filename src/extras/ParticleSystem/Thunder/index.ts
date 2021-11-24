/*
 *@description: 雷电特效
 *@author: guoweiyu
 *@date: 2021-05-28 15:51:08
 */
import * as THREE from 'three';
import { LightningStorm } from './LightningStorm';

type ThunderConfig = {
  // 雷电的粗细
  radius?: number;
  // 雷电的颜色
  color?: number | THREE.Color;
  // 雷电的长度
  length?: number;
  // 雷电的出现高度
  height?: number;
  // 雷电最大斜率
  maxSlope?: number;
  // 最多同时出现的雷电数
  maxLightnings?: number;
  // 雷电最小出现间隔
  lightningMinPeriod?: number;
  // 雷电最大出现间隔
  lightningMaxPeriod?: number;
  // 雷电最长持续时间
  lightningMaxDuration?: number;

  // 电光的颜色
  thunderLightColor?: number | THREE.Color;
  // 电光的强度
  thunderLightPower?: number;
};

export default class Thunder extends LightningStorm {
  private time: number = 0;
  private clock: THREE.Clock = new THREE.Clock();
  private box: THREE.Box3 = new THREE.Box3();
  private static lightningColor: THREE.Color = new THREE.Color(0xb0ffff);
  private userData: Record<string, unknown> = { type: 'weather' };
  private light: THREE.PointLight = new THREE.PointLight(0xff0000, 1, 0.0000001);

  constructor(config: ThunderConfig = {}) {
    super(Thunder.createThunder(config));
    this.createLight(config);
  }

  public update = () => {
    this.time += this.clock.getDelta();
    super.update(this.time);

    // 根据if条件修改电光持续时间 [0, 1] 0为常亮 1为常暗
    const lightDuringime = 0.99;
    if (Math.sin(this.time) + lightDuringime > 0) {
      this.light.distance = 0.0000001;
    } else {
      this.light.distance = 0;
    }
  };

  private createLight = (config: ThunderConfig) => {
    const { thunderLightColor, thunderLightPower, height } = config;
    // 初始化雷电特效 及 用于模拟电光的照明灯
    const light = new THREE.PointLight(
      thunderLightColor || 0xfffffff,
      thunderLightPower || 1,
      0.0000001,
    );
    light.position.y = height || 5000;
    // @ts-ignore
    'add' in this && this.add(light);
    this.light = light;
  };

  private static createThunder = (config: ThunderConfig) => {
    const {
      radius,
      color,
      length,
      height,
      maxSlope,
      maxLightnings,
      lightningMinPeriod,
      lightningMaxPeriod,
      lightningMaxDuration,
    } = config;

    const material = new THREE.MeshBasicMaterial({
      color: color || Thunder.lightningColor,
    });
    const rayDirection = new THREE.Vector3(0, -1, 0);
    let rayLength = 0;
    const vec1 = new THREE.Vector3();
    const vec2 = new THREE.Vector3();

    const rayParams = {
      // 雷电半径
      radius0: radius || 10,
      radius1: radius ? radius / 20 : 0.5,
      minRadius: 10.3,
      maxIterations: 7,
      timeScale: 0.15,
      propagationTimeFactor: 0.2,
      vanishingTimeFactor: 0.9,
      subrayPeriod: 4,
      subrayDutyCycle: 0.6,
      maxSubrayRecursion: 3,
      ramification: 3,
      recursionProbability: 0.4,
      roughness: 0.85,
      straightness: 0.65,
      onSubrayCreation: (
        segment: any,
        parentSubray: any,
        childSubray: any,
        lightningStrike: any,
      ) => {
        lightningStrike.subrayConePosition(segment, parentSubray, childSubray, 0.6, 0.6, 0.5);
        rayLength = lightningStrike.rayParameters.sourceOffset.y;
        vec1.subVectors(childSubray.pos1, lightningStrike.rayParameters.sourceOffset);
        const proj = rayDirection.dot(vec1);
        vec2.copy(rayDirection).multiplyScalar(proj);
        vec1.sub(vec2);
        const scale = proj / rayLength > 0.5 ? rayLength / proj : 1;
        vec2.multiplyScalar(scale);
        vec1.add(vec2);
        childSubray.pos1.addVectors(vec1, lightningStrike.rayParameters.sourceOffset);
      },
    };

    // Black star mark
    const starVertices = [];
    const prevPoint = new THREE.Vector3(0, 0, 1);
    const currPoint = new THREE.Vector3();
    for (let i = 1; i <= 16; i += 1) {
      currPoint.set(Math.sin((2 * Math.PI * i) / 16), 0, Math.cos((2 * Math.PI * i) / 16));
      if (i % 2 === 1) {
        currPoint.multiplyScalar(0.3);
      }
      starVertices.push(0, 0, 0);
      starVertices.push(prevPoint.x, prevPoint.y, prevPoint.z);
      starVertices.push(currPoint.x, currPoint.y, currPoint.z);
      prevPoint.copy(currPoint);
    }

    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const starMesh = new THREE.Mesh(starGeometry, new THREE.MeshBasicMaterial({ color: 0x020900 }));
    starMesh.scale.multiplyScalar(60);

    return {
      size: length || 4000,
      // 雷电顶部所在高度
      minHeight: height || 5000,
      // 雷电底部距离顶部距离
      maxHeight: height || 5000,
      maxSlope: maxSlope || 0.6,
      maxLightnings: maxLightnings || 3,
      lightningParameters: rayParams,
      lightningMaterial: material,
      // 雷电建最小出现间隔
      lightningMinPeriod: lightningMinPeriod || 8,
      // 雷电间最大出现间隔
      lightningMaxPeriod: lightningMaxPeriod || 14,
      // 雷电最长持续时间
      lightningMaxDuration: lightningMaxDuration || 0.1,
    };
  };
}
