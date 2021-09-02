import * as THREE from 'three';

export default class WindMaterial extends THREE.MeshBasicMaterial {
  cameraPosition: THREE.Vector3;
  uniforms:
    | {
        [uniform: string]: THREE.IUniform;
      }
    | undefined;
  constructor(parameters?: THREE.MeshBasicMaterialParameters | undefined) {
    super(parameters);
    this.cameraPosition = new THREE.Vector3();
  }
}
