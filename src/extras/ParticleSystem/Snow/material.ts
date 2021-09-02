import * as THREE from 'three';

export default class SnowMaterial extends THREE.PointsMaterial {
  cameraPosition: THREE.Vector3;
  uniforms:
    | {
        [uniform: string]: THREE.IUniform;
      }
    | undefined;
  constructor(parameters?: THREE.PointsMaterialParameters | undefined) {
    super(parameters);
    this.cameraPosition = new THREE.Vector3();
  }
}
