import { useEffect, useMemo, useRef, useState } from "react";
import InitDVErenderer from "@divinevoxel/babylon-renderer/Defaults/Foundation/Classic/InitDVEBRClassic";
import { DVEFBRCore } from "@divinevoxel/babylon-renderer/Defaults/Foundation/DVEFBRCore";
import {
  CreateBox,
  CreateSphere,
  Engine,
  FreeCamera,
  Scene,
  UniversalCamera,
  Vector3,
} from "@babylonjs/core";
import { DivineVoxelEngineRender } from "@divinevoxel/core/Contexts/Render";
import { textureData } from "Data/TextureData";
import { SceneTool } from "@divinevoxel/babylon-renderer/Defaults/Foundation/Tools/SceneTool";
import { InitRenderPlayer } from "Player/RenderPlayer";
import { RenderNodes } from "Classes";
import { VoxelSelect } from "Components/VoxelSelect/VoxelSelect";
import { WorldMapComponent } from "Map/WorldMapComponent";

const worldWorker = new Worker(new URL("./Contexts/World/", import.meta.url), {
  type: "module",
});

const nexusWorker = new Worker(new URL("./Contexts/Nexus", import.meta.url), {
  type: "module",
});

const constructorWorkers: Worker[] = [];
for (let i = 0; i < navigator.hardwareConcurrency - 3; i++) {
  constructorWorkers.push(
    new Worker(new URL("./Contexts/Constructor/", import.meta.url), {
      type: "module",
    })
  );
}
export function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [nodes, setNodes] = useState<RenderNodes | null>(null);

  const noWorldGen = useMemo(() => {
    const urlObj = new URL(window.location.href);
    const params = new URLSearchParams(urlObj.search);
    return params.has("no-world-gen");
  }, [window.location.href]);

  useEffect(() => {
    (async () => {
      if (!canvasRef.current) return;
      const canvas = canvasRef.current;
      const DVER = new DivineVoxelEngineRender();
      let antialias = false;
      const engine = new Engine(canvas, antialias);
      engine.doNotHandleContextLost = true;
      engine.enableOfflineSupport = false;

      const nodes = new RenderNodes();
      engine.setSize(window.innerWidth, window.innerHeight);
      let dirty = false;
      window.addEventListener("resize", function () {
        engine.resize();
        dirty = true;
      });

      canvasRef.current.addEventListener("click", () => {
        canvas.requestPointerLock();
      });
      const scene = new Scene(engine);

      const camera = new UniversalCamera("", new Vector3(0, 0, 0));

      camera.position.y = 70;

      camera.setTarget(Vector3.Zero());

      camera.maxZ = 1000;
      camera.fov = 1.8;
      camera.attachControl(canvas, true);

      scene.activeCamera = camera;
      scene.collisionsEnabled = false;

      engine.runRenderLoop(() => {
        scene.render();
      });

      const renderer = await InitDVErenderer({
        textureTypes: [],
        substances: [],
        scene: scene,
        textureData,
      });

      const core = new DVEFBRCore({
        renderer,
        nexusWorker,
      });

      await DVER.init({
        core,
        renderer,
        worldWorker,
        constructorWorkers,
      });
      const skybox = CreateSphere("skyBox", { diameter: 400.0 }, scene);
      skybox.infiniteDistance = true;
      const skyboxMat = renderer.nodes.materials.get("#dve_skybox");
      if (skyboxMat) {
        skybox.material = skyboxMat._material;
        skybox.material!.backFaceCulling = false;
      }
      const sceneTool = new SceneTool();
      sceneTool.fog.setDensity(0.00001);
      sceneTool.fog.setColor(1, 1, 1);
      sceneTool.options.doSun(true);
      sceneTool.options.doAO(true);
      sceneTool.options.doRGB(true);
      sceneTool.levels.setSun(0.8);
      sceneTool.levels.setBase(0.01);
      if (noWorldGen) {
        DVER.threads.world.runTasks("start-world-test", []);
      } else {
        DVER.threads.world.runTasks("start-world", []);
      }

      nodes.camera = camera;
      nodes.scene = scene;
      nodes.canvas = canvas;
      nodes.engine = engine;
      nodes.core = core;
      nodes.sceneTool = sceneTool;
      (window as any).nodes = nodes;
      setNodes(nodes);
      const player = await InitRenderPlayer(DVER, nodes);
      nodes.player = player;
    })();
  }, []);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {nodes && <WorldMapComponent nodes={nodes} />}
      <VoxelSelect />
      <canvas
        style={{
          width: "100%",
          height: "100%",
          touchAction: "none",
        }}
        ref={canvasRef}
      ></canvas>
    </div>
  );
}
