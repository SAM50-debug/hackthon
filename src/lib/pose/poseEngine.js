import { Pose } from "@mediapipe/pose";
import { POSE_CONFIG } from "./poseConfig";

export function createPoseEngine({ onResults }) {
  const pose = new Pose({
    locateFile: (file) =>
      `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
  });

  pose.setOptions(POSE_CONFIG);
  pose.onResults(onResults);

  return pose;
}
