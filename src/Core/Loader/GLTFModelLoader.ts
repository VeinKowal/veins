/**
 *@description 加载GLTF文件的加载器.
 *@author guoweiyu.
 *@date 2021-08-24 09:26:49.
 */
import { GLTFModelLoaderType } from './type';
import ModelLoader from './ModelLoader';
import { GLTFLoader } from '../../lib/loaders/GLTFLoader';

class OBJModelLoader extends ModelLoader {
  load(config: GLTFModelLoaderType) {
    const { url, complete, isOutline = true } = config;
    if (!url) return;
    const loader = new GLTFLoader();
    loader.load(url, (gltf: any) => {
      const { scene } = gltf;
      if (!scene) return;
      this.moveToCenter(scene);
      isOutline && this.addEdgeOutline(scene);
      this.add(scene);
      complete && complete(this);
    });
  }
}

export default OBJModelLoader;
