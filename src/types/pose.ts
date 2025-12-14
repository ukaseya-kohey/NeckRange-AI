/**
 * MediaPipe Poseのランドマーク座標
 */
export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

/**
 * 姿勢検出結果
 */
export interface PoseResults {
  poseLandmarks?: Landmark[];
  image: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement;
}

/**
 * 画像タイプ
 */
export enum ImageType {
  NEUTRAL = 'neutral',    // 正面
  RIGHT_TILT = 'right',   // 右側屈
  LEFT_TILT = 'left'      // 左側屈
}

/**
 * アップロードされた画像情報
 */
export interface UploadedImage {
  type: ImageType;
  file: File;
  url: string;
  landmarks?: Landmark[];
}

/**
 * 肩の傾き検証結果
 */
export interface ShoulderValidation {
  isValid: boolean;
  angle: number;
  message: string;
}

/**
 * 首の角度測定結果
 */
export interface NeckAngle {
  angle: number;
  type: ImageType;
}

/**
 * キャプチャされた画像情報
 */
export interface CapturedImageData {
  type: ImageType;
  url: string;
  landmarks: Landmark[];
  angle: number;
}

/**
 * 診断結果
 */
export interface DiagnosisResult {
  neutralAngle: number;      // 正面（中心）の角度
  rightAngle: number;         // 正面から右側屈への角度差
  leftAngle: number;          // 正面から左側屈への角度差
  rightFlexibility: FlexibilityLevel;
  leftFlexibility: FlexibilityLevel;
  asymmetry: AsymmetryLevel;
  asymmetryDiff: number;
  recommendations: string[];
  // 画像データ
  neutralImage?: CapturedImageData;
  rightImage?: CapturedImageData;
  leftImage?: CapturedImageData;
}

/**
 * 柔軟性レベル
 */
export enum FlexibilityLevel {
  STIFF = 'stiff',           // 硬い (< 30°)
  SOMEWHAT_STIFF = 'somewhat_stiff', // やや硬い (30° - 40°)
  NORMAL = 'normal',         // 普通 (40° - 50°)
  FLEXIBLE = 'flexible'      // 柔軟 (> 50°)
}

/**
 * 左右差レベル
 */
export enum AsymmetryLevel {
  NORMAL = 'normal',         // 正常 (< 5°)
  MILD = 'mild',            // 軽度 (5° - 10°)
  MODERATE = 'moderate',     // 中等度 (10° - 15°)
  SIGNIFICANT = 'significant' // 顕著 (> 15°)
}

/**
 * MediaPipe Poseのランドマークインデックス（全33点）
 * 
 * 注意: 肩のランドマーク（11, 12）は肩関節を指しており、
 * 肩峰（acromion）専用のランドマークは存在しません。
 * 肩峰が必要な場合は、耳・肩・肘の位置関係から推定する必要があります。
 */
export const POSE_LANDMARKS = {
  // 顔
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,
  
  // 上半身（肩・腕・手）
  LEFT_SHOULDER: 11,    // 左肩関節（肩峰ではない）
  RIGHT_SHOULDER: 12,   // 右肩関節（肩峰ではない）
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,
  
  // 下半身（腰・脚・足）
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
} as const;
