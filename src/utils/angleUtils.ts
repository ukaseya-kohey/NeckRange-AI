import { Landmark, POSE_LANDMARKS } from '../types/pose';
import { stabilizeShoulders, estimateAcromion } from './landmarkUtils';

/**
 * 2点間の角度を計算（ラジアンから度へ変換）
 * 
 * @param x1 - 始点のX座標
 * @param y1 - 始点のY座標
 * @param x2 - 終点のX座標
 * @param y2 - 終点のY座標
 * @returns 角度（度数法）
 */
export function calculateAngle(x1: number, y1: number, x2: number, y2: number): number {
  const radians = Math.atan2(y2 - y1, x2 - x1);
  return radians * (180 / Math.PI);
}

/**
 * 肩の水平角度を計算（代償動作検知用）
 * 左肩と右肩のY座標の差から水平からの傾きを計算
 * 
 * @param landmarks - MediaPipeのランドマーク配列
 * @returns 肩の傾き角度（度）
 *          正の値：右肩が下がっている（右に傾いている）
 *          負の値：左肩が下がっている（左に傾いている）
 *          0：完全に水平
 */
export function calculateShoulderAngle(landmarks: Landmark[]): number {
  // 肩峰の位置を推定
  const leftAcromion = estimateAcromion(landmarks, 'left');
  const rightAcromion = estimateAcromion(landmarks, 'right');

  if (!leftAcromion || !rightAcromion) {
    throw new Error('肩峰の推定に失敗しました');
  }

  // 肩峰のランドマークを安定化（対称性を利用して水平に近づける）
  const stabilized = stabilizeShoulders(leftAcromion, rightAcromion);

  // 左右の肩峰の座標差を計算
  const dx = Math.abs(stabilized.left.x - stabilized.right.x);
  const dy = stabilized.left.y - stabilized.right.y;

  // デバッグログ
  const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
  const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
  
  console.log('Shoulder landmarks (original):', {
    left: { x: leftShoulder?.x, y: leftShoulder?.y },
    right: { x: rightShoulder?.x, y: rightShoulder?.y }
  });
  console.log('Acromion (estimated):', {
    left: { x: leftAcromion.x, y: leftAcromion.y },
    right: { x: rightAcromion.x, y: rightAcromion.y }
  });
  console.log('Acromion (stabilized):', {
    left: { x: stabilized.left.x, y: stabilized.left.y },
    right: { x: stabilized.right.x, y: stabilized.right.y },
    dx, dy
  });

  // Y座標の差から傾きを計算
  const radians = Math.atan(dy / dx);
  const degrees = radians * (180 / Math.PI);

  console.log('Shoulder angle calculation:', { radians, degrees });

  return degrees;
}

/**
 * 首の傾き角度を計算
 * 両肩の中点Mと鼻Nを結ぶ線と、垂直線のなす角を計算
 * θ = arctan((x_n - x_m) / (y_m - y_n)) × 180/π
 * 
 * @param landmarks - MediaPipeのランドマーク配列
 * @returns 首の傾き角度（度）正の値は右傾き、負の値は左傾き
 */
export function calculateNeckTiltAngle(landmarks: Landmark[]): number {
  // 肩峰の位置を推定
  const leftAcromion = estimateAcromion(landmarks, 'left');
  const rightAcromion = estimateAcromion(landmarks, 'right');
  const nose = landmarks[POSE_LANDMARKS.NOSE];

  if (!leftAcromion || !rightAcromion || !nose) {
    throw new Error('必要なランドマークが検出されませんでした');
  }

  // 肩峰のランドマークを安定化（精度向上のため）
  const stabilized = stabilizeShoulders(leftAcromion, rightAcromion);

  // 安定化された両肩峰の中点を計算（胸の中心）
  const chestCenterX = (stabilized.left.x + stabilized.right.x) / 2;
  const chestCenterY = (stabilized.left.y + stabilized.right.y) / 2;

  // 胸の中心から鼻へのベクトルと垂直線のなす角を計算
  const dx = nose.x - chestCenterX;
  const dy = chestCenterY - nose.y; // Y軸は下向きなので反転

  // atan2を使用して角度を計算（垂直線からの傾き）
  const radians = Math.atan2(dx, dy);
  const degrees = radians * (180 / Math.PI);

  console.log('Neck tilt angle calculation (using acromion):', {
    chestCenter: { x: chestCenterX, y: chestCenterY },
    nose: { x: nose.x, y: nose.y },
    dx, dy,
    degrees
  });

  return degrees;
}

/**
 * 正面画像を基準とした側屈角度の計算
 * 
 * @param neutralAngle - 正面時の角度
 * @param tiltAngle - 側屈時の角度
 * @returns 側屈角度（絶対値）
 */
export function calculateLateralFlexionAngle(
  neutralAngle: number,
  tiltAngle: number
): number {
  // 正面からの差分を計算
  const diff = Math.abs(tiltAngle - neutralAngle);
  return diff;
}

/**
 * 角度を度分秒形式でフォーマット
 * 
 * @param degrees - 角度（度）
 * @returns フォーマットされた文字列
 */
export function formatAngle(degrees: number): string {
  const absoluteDegrees = Math.abs(degrees);
  const deg = Math.floor(absoluteDegrees);
  const minFloat = (absoluteDegrees - deg) * 60;
  const min = Math.floor(minFloat);
  const sec = Math.round((minFloat - min) * 60);

  if (min === 0 && sec === 0) {
    return `${deg}°`;
  } else if (sec === 0) {
    return `${deg}°${min}'`;
  }
  return `${deg}°${min}'${sec}"`;
}

/**
 * 2つのランドマーク間の距離を計算
 * 
 * @param landmark1 - ランドマーク1
 * @param landmark2 - ランドマーク2
 * @returns ユークリッド距離
 */
export function calculateDistance(landmark1: Landmark, landmark2: Landmark): number {
  const dx = landmark1.x - landmark2.x;
  const dy = landmark1.y - landmark2.y;
  const dz = landmark1.z - landmark2.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * 3点から角度を計算（頂点を中心とした角度）
 * 
 * @param point1 - 点1
 * @param vertex - 頂点
 * @param point2 - 点2
 * @returns 角度（度）
 */
export function calculateAngleFromThreePoints(
  point1: Landmark,
  vertex: Landmark,
  point2: Landmark
): number {
  // ベクトルを計算
  const vector1 = {
    x: point1.x - vertex.x,
    y: point1.y - vertex.y,
  };
  const vector2 = {
    x: point2.x - vertex.x,
    y: point2.y - vertex.y,
  };

  // 内積を計算
  const dotProduct = vector1.x * vector2.x + vector1.y * vector2.y;

  // ベクトルの大きさを計算
  const magnitude1 = Math.sqrt(vector1.x * vector1.x + vector1.y * vector1.y);
  const magnitude2 = Math.sqrt(vector2.x * vector2.x + vector2.y * vector2.y);

  // cosθ = (a・b) / (|a||b|)
  const cosAngle = dotProduct / (magnitude1 * magnitude2);

  // ラジアンから度に変換
  const radians = Math.acos(Math.max(-1, Math.min(1, cosAngle)));
  return radians * (180 / Math.PI);
}
