import { NCS } from "@amodx/ncs/";
import { Mesh } from "@babylonjs/core";

import { DVEBRMesh } from "@divinevoxel/vlox-babylon/Meshes/DVEBRMesh";
import { VoxelModelIndex } from "@divinevoxel/vlox/Voxels/Indexes/VoxelModelIndex";
import { BabylonContext } from "@dvegames/vlox/Babylon/Contexts/Babylon.context";
import { TransformNodeComponent } from "@dvegames/vlox/Babylon/Components/Base/TransformNode.component";
export const VoxelModelComponent = NCS.registerComponent({
  type: "voxel-model",
  schema: NCS.schema({
    voxelId: NCS.property(""),
    voxelState: NCS.property(""),
  }),
  data: NCS.data<{
    mesh: Mesh;
  }>(),
  init(component) {
    const transformNode = TransformNodeComponent.getRequired(component.node);

    const { scene } = BabylonContext.getRequired(component.node).data;

    const mesh = new Mesh("", scene);

    const model = VoxelModelIndex.getModel(
      component.schema.voxelId,
      component.schema.voxelState
    );
    const material = VoxelModelIndex.getMaterial(
      component.schema.voxelId,
      component.schema.voxelState
    );
    if (!model || !material) {
      return console.error(
        "Could not make mesh for voxel with data:",
        component.schema.voxelState
      );
    }
    DVEBRMesh.UpdateVertexData(
      mesh,
      scene.getEngine()! as any,
      model.model[2][0] as any
    );

    mesh.renderingGroupId =1;
    mesh.material = material;
    component.data = { mesh };
    console.warn("making mesh", transformNode);
    transformNode.data.parent(mesh);
  },
  dispose: (component) => component.data.mesh.dispose(),
});
