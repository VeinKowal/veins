import { ZippedMtlObjBridge } from './obj2/bridge/ZippedMtlObjBridge';
import { ZippedMTLLoader } from './ZippedMTLLoader.js';
import { ZippedOBJLoader2 } from './ZippedOBJLoader2';
import JSZip from 'jszip';

export const loadZipModel = (
  addr: string,
  onLoad: (obj: THREE.Object3D) => void,
) => {
  const xhr = new XMLHttpRequest();
  xhr.withCredentials = true;
  xhr.open('GET', addr, true);
  xhr.responseType = 'blob';
  xhr.onreadystatechange = () => {
    if (xhr.readyState === 4 && xhr.status === 200) {
      const blob = new Blob([xhr.response]);
      loadBlobModel(blob, onLoad);
    }
  };
  xhr.send();
};

async function loadBlobModel(
  blob: Blob,
  onLoad: (obj: THREE.Object3D) => void,
) {
  const zip = new JSZip();
  await zip.loadAsync(blob);

  const resources = new Map<string, string>();
  const files = zip.filter((relativePath: string) => {
    return !relativePath.endsWith('.obj') && !relativePath.endsWith('.mtl');
  });
  for (let i = 0; i < files.length; ++i) {
    const content = await files[i].async('base64');
    resources.set(files[i].name, content);
  }
  const mtlContent = await zip.file('model.mtl').async('string');

  const onMaterialLoad = (materialCreator: ZippedMTLLoader.MaterialCreator) => {
    const objLoader = new ZippedOBJLoader2();
    objLoader.addMaterials(
      ZippedMtlObjBridge.addMaterialsFromMtlLoader(materialCreator),
      true,
    );
    objLoader.load(zip, obj => {
      onLoad(obj);
    });
  };

  const mtlLoader = new ZippedMTLLoader();
  mtlLoader.load(mtlContent, resources, onMaterialLoad);
}
