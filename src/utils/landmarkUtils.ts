import { Landmark } from '../types/pose';

/**
 * ランドマークの異常値を検出
 * 
 * @param landmark - チェックするランドマーク
 * @returns 異常値かどうか
 */
export function isOutlier(landmark: Landmark): boolean {
  // 可視性が低い場合は異常値とみなす
  if (landmark.visibility !== undefined && landmark.visibility < 0.5) {
    return true;
  }
  
  // 座標が画面外の場合は異常値
  if (landmark.x < 0 || landmark.x > 1 || landmark.y < 0 || landmark.y > 1) {
    return true;
  }
  
  return false;
}

/**
 * 複数のランドマークセットの中央値を計算（ロバスト推定）
 * 
 * @param landmarkSets - ランドマークセットの配列
 * @param index - ランドマークのインデックス
 * @returns 中央値ランドマーク
 */
export function getMedianLandmark(landmarkSets: Landmark[][], index: number): Landmark {
  const xValues = landmarkSets.map(set => set[index].x).sort((a, b) => a - b);
  const yValues = landmarkSets.map(set => set[index].y).sort((a, b) => a - b);
  const zValues = landmarkSets.map(set => set[index].z).sort((a, b) => a - b);
  
  const mid = Math.floor(landmarkSets.length / 2);
  
  return {
    x: landmarkSets.length % 2 === 0 ? (xValues[mid - 1] + xValues[mid]) / 2 : xValues[mid],
    y: landmarkSets.length % 2 === 0 ? (yValues[mid - 1] + yValues[mid]) / 2 : yValues[mid],
    z: landmarkSets.length % 2 === 0 ? (zValues[mid - 1] + zValues[mid]) / 2 : zValues[mid],
    visibility: landmarkSets[0][index].visibility
  };
}

/**
 * 肩のランドマークを安定化（左右の対称性を利用）
 * 
 * @param leftShoulder - 左肩のランドマーク
 * @param rightShoulder - 右肩のランドマーク
 * @returns 安定化された肩のランドマーク
 */
export function stabilizeShoulders(
  leftShoulder: Landmark,
  rightShoulder: Landmark
): { left: Landmark; right: Landmark } {
  // 肩のY座標の平均を計算（水平を仮定）
  const avgY = (leftShoulder.y + rightShoulder.y) / 2;
  
  // 両肩のY座標を平均値に近づける（ソフト補正）
  const stabilizationFactor = 0.3; // 30%だけ平均に近づける
  
  const stabilizedLeft: Landmark = {
    ...leftShoulder,
    y: leftShoulder.y * (1 - stabilizationFactor) + avgY * stabilizationFactor
  };
  
  const stabilizedRight: Landmark = {
    ...rightShoulder,
    y: rightShoulder.y * (1 - stabilizationFactor) + avgY * stabilizationFactor
  };
  
  return { left: stabilizedLeft, right: stabilizedRight };
}

/**
 * ランドマークの移動平均フィルタ
 * 
 * @param currentLandmark - 現在のランドマーク
 * @param previousLandmark - 前回のランドマーク
 * @param alpha - スムージング係数（0-1）
 * @returns スムージングされたランドマーク
 */
export function smoothLandmark(
  currentLandmark: Landmark,
  previousLandmark: Landmark | null,
  alpha: number = 0.5
): Landmark {
  if (!previousLandmark) {
    return currentLandmark;
  }
  
  return {
    x: currentLandmark.x * alpha + previousLandmark.x * (1 - alpha),
    y: currentLandmark.y * alpha + previousLandmark.y * (1 - alpha),
    z: currentLandmark.z * alpha + previousLandmark.z * (1 - alpha),
    visibility: currentLandmark.visibility
  };
}

/**
 * ランドマークセット全体にガウシアンスムージングを適用
 * 
 * @param landmarks - ランドマーク配列
 * @param previousLandmarks - 前回のランドマーク配列
 * @param alpha - スムージング係数（0-1）デフォルト0.7
 * @returns スムージングされたランドマーク配列
 */
export function smoothLandmarks(
  landmarks: Landmark[],
  previousLandmarks: Landmark[] | null,
  alpha: number = 0.7
): Landmark[] {
  if (!previousLandmarks) {
    return landmarks;
  }
  
  return landmarks.map((landmark, index) => 
    smoothLandmark(landmark, previousLandmarks[index], alpha)
  );
}

/**
 * 肩峰（acromion）の位置を推定
 * 
 * MediaPipe Poseには肩峰専用のランドマークがないため、
 * 耳、肩、肘の位置関係から肩峰を推定する
 * 
 * @param landmarks - MediaPipeのランドマーク配列
 * @param side - 'left' または 'right'
 * @returns 推定された肩峰の位置
 */
export function estimateAcromion(
  landmarks: Landmark[],
  side: 'left' | 'right'
): Landmark {
  // MediaPipe Poseのランドマークインデックス
  const POSE_LANDMARKS = {
    LEFT_EAR: 7,
    RIGHT_EAR: 8,
    LEFT_SHOULDER: 11,
    RIGHT_SHOULDER: 12,
    LEFT_ELBOW: 13,
    RIGHT_ELBOW: 14,
  };

  const ear = landmarks[side === 'left' ? POSE_LANDMARKS.LEFT_EAR : POSE_LANDMARKS.RIGHT_EAR];
  const shoulder = landmarks[side === 'left' ? POSE_LANDMARKS.LEFT_SHOULDER : POSE_LANDMARKS.RIGHT_SHOULDER];
  const elbow = landmarks[side === 'left' ? POSE_LANDMARKS.LEFT_ELBOW : POSE_LANDMARKS.RIGHT_ELBOW];

  if (!ear || !shoulder || !elbow) {
    // フォールバック：肩のランドマークをそのまま使用
    return shoulder || { x: 0, y: 0, z: 0 };
  }

  // 肩峰の推定ロジック：
  // 1. X座標：耳のX座標から肩の方向へオフセット（体の外側）
  // 2. Y座標：肩と耳の中間（少し上）
  // 3. Z座標：肩のZ座標を使用

  const earToShoulderX = shoulder.x - ear.x;
  const earToShoulderY = shoulder.y - ear.y;
  
  // 肩峰は耳から肩への方向に、耳からの距離の約70%の位置
  const acromionOffsetRatio = 0.7;
  
  const acromionX = ear.x + earToShoulderX * acromionOffsetRatio;
  const acromionY = ear.y + earToShoulderY * acromionOffsetRatio;

  // さらに、肩から肘への方向を考慮して、より外側に補正
  const shoulderToElbowX = elbow.x - shoulder.x;
  const lateralOffset = Math.abs(shoulderToElbowX) * 0.15; // 肩幅の15%外側
  
  const finalX = side === 'left' 
    ? acromionX - lateralOffset  // 左肩峰：より左（外側）へ
    : acromionX + lateralOffset; // 右肩峰：より右（外側）へ

  return {
    x: finalX,
    y: acromionY,
    z: shoulder.z,
    visibility: Math.min(ear.visibility || 1, shoulder.visibility || 1)
  };
}
