import { Landmark, ShoulderValidation, FlexibilityLevel, AsymmetryLevel } from '../types/pose';
import { calculateShoulderAngle } from './angleUtils';

/**
 * 代償動作の許容範囲（度）
 * 首を側屈させた際、MediaPipe Poseの検出精度やカメラ角度により
 * 肩の位置に±5度程度のブレが生じる可能性があるため、10度に設定
 */
const SHOULDER_ANGLE_THRESHOLD = 10;

/**
 * 肩の水平を検証（代償動作の検知）
 * 
 * @param landmarks - MediaPipeのランドマーク配列
 * @param threshold - 許容角度（デフォルト: 5度）
 * @returns 検証結果
 */
export function validateShoulderLevel(
  landmarks: Landmark[],
  threshold: number = SHOULDER_ANGLE_THRESHOLD
): ShoulderValidation {
  try {
    const angle = calculateShoulderAngle(landmarks);
    const absAngle = Math.abs(angle);
    
    if (absAngle > threshold) {
      return {
        isValid: false,
        angle,
        message: `肩が ${angle.toFixed(1)}° 傾いています。肩を動かさずに首だけを傾けて撮り直してください。`
      };
    }

    return {
      isValid: true,
      angle,
      message: '良好な姿勢です'
    };
  } catch (error) {
    return {
      isValid: false,
      angle: 0,
      message: error instanceof Error ? error.message : '肩の検出に失敗しました'
    };
  }
}

/**
 * ランドマークの可視性を検証
 * 
 * @param landmarks - MediaPipeのランドマーク配列
 * @param requiredIndices - 必要なランドマークのインデックス配列
 * @param minVisibility - 最小可視性（デフォルト: 0.5）
 * @returns 検証結果
 */
export function validateLandmarksVisibility(
  landmarks: Landmark[],
  requiredIndices: number[],
  minVisibility: number = 0.5
): { isValid: boolean; message: string } {
  const missingLandmarks: number[] = [];

  for (const index of requiredIndices) {
    const landmark = landmarks[index];
    if (!landmark || (landmark.visibility !== undefined && landmark.visibility < minVisibility)) {
      missingLandmarks.push(index);
    }
  }

  if (missingLandmarks.length > 0) {
    return {
      isValid: false,
      message: `必要な部位が検出されませんでした（インデックス: ${missingLandmarks.join(', ')}）。カメラに全身が映るように調整してください。`
    };
  }

  return {
    isValid: true,
    message: 'すべての必要な部位が検出されました'
  };
}

/**
 * 柔軟性レベルを判定
 * 
 * @param angle - 測定された角度
 * @returns 柔軟性レベル
 */
export function evaluateFlexibility(angle: number): FlexibilityLevel {
  const absAngle = Math.abs(angle);

  if (absAngle < 30) {
    return FlexibilityLevel.STIFF;
  } else if (absAngle < 40) {
    return FlexibilityLevel.SOMEWHAT_STIFF;
  } else if (absAngle <= 50) {
    return FlexibilityLevel.NORMAL;
  } else {
    return FlexibilityLevel.FLEXIBLE;
  }
}

/**
 * 柔軟性レベルの日本語表示
 * 
 * @param level - 柔軟性レベル
 * @returns 日本語ラベル
 */
export function getFlexibilityLabel(level: FlexibilityLevel): string {
  const labels: Record<FlexibilityLevel, string> = {
    [FlexibilityLevel.STIFF]: '硬い',
    [FlexibilityLevel.SOMEWHAT_STIFF]: 'やや硬い',
    [FlexibilityLevel.NORMAL]: '普通',
    [FlexibilityLevel.FLEXIBLE]: '柔軟'
  };
  return labels[level];
}

/**
 * 柔軟性レベルの色
 * 
 * @param level - 柔軟性レベル
 * @returns Tailwind CSSカラークラス
 */
export function getFlexibilityColor(level: FlexibilityLevel): string {
  const colors: Record<FlexibilityLevel, string> = {
    [FlexibilityLevel.STIFF]: 'text-red-600',
    [FlexibilityLevel.SOMEWHAT_STIFF]: 'text-orange-600',
    [FlexibilityLevel.NORMAL]: 'text-green-600',
    [FlexibilityLevel.FLEXIBLE]: 'text-blue-600'
  };
  return colors[level];
}

/**
 * 左右差レベルを判定
 * 
 * @param rightAngle - 右側屈角度
 * @param leftAngle - 左側屈角度
 * @returns 左右差レベル
 */
export function evaluateAsymmetry(rightAngle: number, leftAngle: number): AsymmetryLevel {
  const diff = Math.abs(rightAngle - leftAngle);

  if (diff < 5) {
    return AsymmetryLevel.NORMAL;
  } else if (diff < 10) {
    return AsymmetryLevel.MILD;
  } else if (diff < 15) {
    return AsymmetryLevel.MODERATE;
  } else {
    return AsymmetryLevel.SIGNIFICANT;
  }
}

/**
 * 左右差レベルの日本語表示
 * 
 * @param level - 左右差レベル
 * @returns 日本語ラベル
 */
export function getAsymmetryLabel(level: AsymmetryLevel): string {
  const labels: Record<AsymmetryLevel, string> = {
    [AsymmetryLevel.NORMAL]: '正常',
    [AsymmetryLevel.MILD]: '軽度の左右差',
    [AsymmetryLevel.MODERATE]: '中等度の左右差',
    [AsymmetryLevel.SIGNIFICANT]: '顕著な左右差'
  };
  return labels[level];
}

/**
 * 左右差レベルの色
 * 
 * @param level - 左右差レベル
 * @returns Tailwind CSSカラークラス
 */
export function getAsymmetryColor(level: AsymmetryLevel): string {
  const colors: Record<AsymmetryLevel, string> = {
    [AsymmetryLevel.NORMAL]: 'text-green-600',
    [AsymmetryLevel.MILD]: 'text-yellow-600',
    [AsymmetryLevel.MODERATE]: 'text-orange-600',
    [AsymmetryLevel.SIGNIFICANT]: 'text-red-600'
  };
  return colors[level];
}

/**
 * 診断に基づく推奨事項を生成
 * 
 * @param rightLevel - 右側の柔軟性レベル
 * @param leftLevel - 左側の柔軟性レベル
 * @param asymmetryLevel - 左右差レベル
 * @param rightAngle - 右側屈角度
 * @param leftAngle - 左側屈角度
 * @returns 推奨事項の配列
 */
export function generateRecommendations(
  rightLevel: FlexibilityLevel,
  leftLevel: FlexibilityLevel,
  asymmetryLevel: AsymmetryLevel,
  rightAngle: number,
  leftAngle: number
): string[] {
  const recommendations: string[] = [];

  // 左右差の推奨
  if (asymmetryLevel === AsymmetryLevel.SIGNIFICANT) {
    const stiffer = rightAngle < leftAngle ? '右' : '左';
    recommendations.push(`${stiffer}側の首の柔軟性が低下しています。専門家の診断をお勧めします。`);
  } else if (asymmetryLevel === AsymmetryLevel.MODERATE) {
    const stiffer = rightAngle < leftAngle ? '右' : '左';
    recommendations.push(`${stiffer}側へのストレッチを重点的に行うことをお勧めします。`);
  }

  // 全体的な柔軟性の推奨
  if (rightLevel === FlexibilityLevel.STIFF || leftLevel === FlexibilityLevel.STIFF) {
    recommendations.push('首の可動域が制限されています。定期的なストレッチや専門家への相談をお勧めします。');
  } else if (rightLevel === FlexibilityLevel.SOMEWHAT_STIFF || leftLevel === FlexibilityLevel.SOMEWHAT_STIFF) {
    recommendations.push('首のストレッチを習慣化することで、柔軟性の改善が期待できます。');
  }

  // 姿勢の推奨
  if (rightLevel !== FlexibilityLevel.FLEXIBLE && leftLevel !== FlexibilityLevel.FLEXIBLE) {
    recommendations.push('デスクワークの際は、1時間に一度は首や肩を動かす休憩を取りましょう。');
  }

  // 良好な場合
  if (recommendations.length === 0) {
    recommendations.push('良好な首の可動域を保っています。この状態を維持しましょう。');
  }

  return recommendations;
}
