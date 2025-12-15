import { Landmark, POSE_LANDMARKS } from '../types/pose';
import { estimateAcromion } from './landmarkUtils';

/**
 * Canvas上にランドマークを描画
 * 
 * @param ctx - Canvasコンテキスト
 * @param landmarks - MediaPipeのランドマーク配列
 * @param width - Canvas幅
 * @param height - Canvas高さ
 */
export function drawLandmarks(
  ctx: CanvasRenderingContext2D,
  landmarks: Landmark[],
  width: number,
  height: number
): void {
  ctx.fillStyle = '#00ff00';
  
  landmarks.forEach((landmark, index) => {
    // 重要なランドマークのみを描画
    const importantIndices: number[] = [
      POSE_LANDMARKS.NOSE,
      POSE_LANDMARKS.LEFT_EYE,
      POSE_LANDMARKS.RIGHT_EYE,
      POSE_LANDMARKS.LEFT_EAR,
      POSE_LANDMARKS.RIGHT_EAR,
      POSE_LANDMARKS.LEFT_SHOULDER,
      POSE_LANDMARKS.RIGHT_SHOULDER,
    ];

    if (importantIndices.includes(index)) {
      const x = landmark.x * width;
      const y = landmark.y * height;
      
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fill();
    }
  });
}

/**
 * Canvas上に骨格線（スケルトン）を描画
 * 
 * @param ctx - Canvasコンテキスト
 * @param landmarks - MediaPipeのランドマーク配列
 * @param width - Canvas幅
 * @param height - Canvas高さ
 */
export function drawSkeleton(
  ctx: CanvasRenderingContext2D,
  landmarks: Landmark[],
  width: number,
  height: number
): void {
  ctx.strokeStyle = '#00ff00';
  ctx.lineWidth = 2;

  // 描画する接続線
  const connections = [
    [POSE_LANDMARKS.NOSE, POSE_LANDMARKS.LEFT_EYE],
    [POSE_LANDMARKS.NOSE, POSE_LANDMARKS.RIGHT_EYE],
    [POSE_LANDMARKS.LEFT_EYE, POSE_LANDMARKS.LEFT_EAR],
    [POSE_LANDMARKS.RIGHT_EYE, POSE_LANDMARKS.RIGHT_EAR],
    [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.RIGHT_SHOULDER],
  ];

  connections.forEach(([startIdx, endIdx]) => {
    const start = landmarks[startIdx];
    const end = landmarks[endIdx];

    if (start && end) {
      ctx.beginPath();
      ctx.moveTo(start.x * width, start.y * height);
      ctx.lineTo(end.x * width, end.y * height);
      ctx.stroke();
    }
  });
}

/**
 * 肩の水平線を描画
 * 
 * @param ctx - Canvasコンテキスト
 * @param landmarks - MediaPipeのランドマーク配列
 * @param width - Canvas幅
 * @param height - Canvas高さ
 * @param isValid - 肩が水平かどうか
 */
export function drawShoulderLine(
  ctx: CanvasRenderingContext2D,
  landmarks: Landmark[],
  width: number,
  height: number,
  isValid: boolean
): void {
  // 肩峰の位置を推定
  const leftAcromion = estimateAcromion(landmarks, 'left');
  const rightAcromion = estimateAcromion(landmarks, 'right');

  if (!leftAcromion || !rightAcromion) return;

  ctx.strokeStyle = isValid ? '#00ff00' : '#ff0000';
  ctx.lineWidth = 3;
  ctx.setLineDash([5, 5]);

  ctx.beginPath();
  ctx.moveTo(leftAcromion.x * width, leftAcromion.y * height);
  ctx.lineTo(rightAcromion.x * width, rightAcromion.y * height);
  ctx.stroke();

  ctx.setLineDash([]);
}

/**
 * 首の傾き角度線を描画
 * 
 * @param ctx - Canvasコンテキスト
 * @param landmarks - MediaPipeのランドマーク配列
 * @param width - Canvas幅
 * @param height - Canvas高さ
 * @param angle - 角度
 */
export function drawNeckAngleLine(
  ctx: CanvasRenderingContext2D,
  landmarks: Landmark[],
  width: number,
  height: number,
  angle: number
): void {
  // 肩峰の位置を推定
  const leftAcromion = estimateAcromion(landmarks, 'left');
  const rightAcromion = estimateAcromion(landmarks, 'right');
  const nose = landmarks[POSE_LANDMARKS.NOSE];

  if (!leftAcromion || !rightAcromion || !nose) return;

  // 両肩峰の中点を計算（胸の中心）
  const chestCenterX = ((leftAcromion.x + rightAcromion.x) / 2) * width;
  const chestCenterY = ((leftAcromion.y + rightAcromion.y) / 2) * height;
  const noseX = nose.x * width;
  const noseY = nose.y * height;

  // 胸の中心から鼻への線を描画
  ctx.strokeStyle = '#ffff00';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(chestCenterX, chestCenterY);
  ctx.lineTo(noseX, noseY);
  ctx.stroke();

  // 垂直線を描画（参照用）
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 10]);
  ctx.beginPath();
  ctx.moveTo(chestCenterX, chestCenterY);
  ctx.lineTo(chestCenterX, chestCenterY - 100);
  ctx.stroke();
  ctx.setLineDash([]);

  // 角度テキストを描画
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px Arial';
  ctx.fillText(`${angle.toFixed(1)}°`, chestCenterX + 10, chestCenterY - 50);
}

/**
 * 撮影ガイドラインオーバーレイを描画
 * 
 * @param ctx - Canvasコンテキスト
 * @param width - Canvas幅
 * @param height - Canvas高さ
 * @param tiltAngle - 傾き角度（度）。0=正面、正の値=右傾き、負の値=左傾き
 */
export function drawGuideline(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  tiltAngle: number = 0
): void {
  const faceGuideX = width / 2;
  const faceGuideY = height * 0.40;

  if (tiltAngle === 0) {
    // 正面撮影時: 楕円を表示
    const faceGuideRadiusX = width * 0.15;
    const faceGuideRadiusY = height * 0.2;

    // 顔ガイドの影（立体感）
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.lineWidth = 8;
    ctx.setLineDash([15, 10]);
    ctx.beginPath();
    ctx.ellipse(faceGuideX, faceGuideY + 2, faceGuideRadiusX, faceGuideRadiusY, 0, 0, 2 * Math.PI);
    ctx.stroke();

    // 顔ガイド（明るく太く）
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.9)';
    ctx.lineWidth = 5;
    ctx.setLineDash([15, 10]);
    ctx.beginPath();
    ctx.ellipse(faceGuideX, faceGuideY, faceGuideRadiusX, faceGuideRadiusY, 0, 0, 2 * Math.PI);
    ctx.stroke();
  } else {
    // 側屈撮影時: 耳の位置から肩の方向への矢印を表示
    const arrowWidth = 50;
    
    // 耳の位置を推定（顔ガイドの左右端あたり）
    const earY = height * 0.35; // 耳の高さ（顔ガイドより少し下）
    const shoulderY = height * 0.67; // 肩の位置
    
    // 矢印の起点：傾ける方向の耳の位置
    const earOffsetX = width * 0.12; // 顔の横幅の半分程度
    // カメラ鏡像対応：tiltAngle < 0（右側屈）は画面では左に見える
    const direction = tiltAngle < 0 ? -1 : 1;
    const arrowStartX = faceGuideX + direction * earOffsetX;
    const arrowStartY = earY;
    
    // 矢印の長さを計算（耳から肩への距離の約80%）
    const verticalDistance = shoulderY - earY;
    const horizontalDistance = width * 0.15;
    
    // 矢印の終点（斜め下、肩の方向）
    const arrowEndX = arrowStartX + direction * horizontalDistance;
    const arrowEndY = arrowStartY + verticalDistance * 0.8;

    ctx.setLineDash([]);
    
    // 矢印の影
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    ctx.moveTo(arrowStartX + 2, arrowStartY + 2);
    ctx.lineTo(arrowEndX + 2, arrowEndY + 2);
    ctx.stroke();
    
    // 矢印ヘッド（影）- 斜め方向の三角形
    const angle = Math.atan2(arrowEndY - arrowStartY, arrowEndX - arrowStartX);
    ctx.beginPath();
    ctx.moveTo(arrowEndX + 2, arrowEndY + 2);
    ctx.lineTo(
      arrowEndX + 2 - Math.cos(angle - 0.4) * arrowWidth,
      arrowEndY + 2 - Math.sin(angle - 0.4) * arrowWidth
    );
    ctx.lineTo(
      arrowEndX + 2 - Math.cos(angle + 0.4) * arrowWidth,
      arrowEndY + 2 - Math.sin(angle + 0.4) * arrowWidth
    );
    ctx.closePath();
    ctx.fill();

    // 矢印本体
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.95)';
    ctx.fillStyle = 'rgba(0, 255, 255, 0.95)';
    ctx.lineWidth = 10;
    
    ctx.beginPath();
    ctx.moveTo(arrowStartX, arrowStartY);
    ctx.lineTo(arrowEndX, arrowEndY);
    ctx.stroke();
    
    // 矢印ヘッド - 斜め方向の三角形
    ctx.beginPath();
    ctx.moveTo(arrowEndX, arrowEndY);
    ctx.lineTo(
      arrowEndX - Math.cos(angle - 0.4) * arrowWidth,
      arrowEndY - Math.sin(angle - 0.4) * arrowWidth
    );
    ctx.lineTo(
      arrowEndX - Math.cos(angle + 0.4) * arrowWidth,
      arrowEndY - Math.sin(angle + 0.4) * arrowWidth
    );
    ctx.closePath();
    ctx.fill();
    
    // テキスト表示（画面中央上部に表示）
    const directionText = tiltAngle < 0 ? '← この方向に首を傾けて' : 'この方向に首を傾けて →';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.font = 'bold 22px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(directionText, faceGuideX + 1, earY - 31);
    
    ctx.fillStyle = 'rgba(255, 255, 255, 1.0)';
    ctx.fillText(directionText, faceGuideX, earY - 30);
  }

  // 肩の位置ガイド（水平線）- 影（画面下から1/3の位置 = 画面上から2/3）
  const shoulderY = height * 0.67; // 画面下から1/3（約67%）の位置に配置
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.lineWidth = 8;
  ctx.setLineDash([20, 10]);
  ctx.beginPath();
  ctx.moveTo(width * 0.15, shoulderY + 2);
  ctx.lineTo(width * 0.85, shoulderY + 2);
  ctx.stroke();

  // 肩の位置ガイド（水平線）- メイン
  ctx.strokeStyle = 'rgba(255, 215, 0, 0.95)'; // ゴールド色で目立つように
  ctx.lineWidth = 5;
  ctx.setLineDash([20, 10]);
  ctx.beginPath();
  ctx.moveTo(width * 0.15, shoulderY);
  ctx.lineTo(width * 0.85, shoulderY);
  ctx.stroke();

  // 肩ラインの端点マーカー
  ctx.fillStyle = 'rgba(255, 215, 0, 0.95)';
  ctx.beginPath();
  ctx.arc(width * 0.15, shoulderY, 8, 0, 2 * Math.PI);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(width * 0.85, shoulderY, 8, 0, 2 * Math.PI);
  ctx.fill();

  ctx.setLineDash([]);

  // 正面撮影時のみ顔ガイドテキストを表示
  if (tiltAngle === 0) {
    const faceGuideRadiusY = height * 0.2;
    
    // ガイドテキスト - 影
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('顔をここに合わせてください', faceGuideX + 1, faceGuideY - faceGuideRadiusY - 14);

    // ガイドテキスト - メイン
    ctx.fillStyle = 'rgba(255, 255, 255, 1.0)';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('顔をここに合わせてください', faceGuideX, faceGuideY - faceGuideRadiusY - 15);
  }
  
  // 肩ラインテキスト（影）
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('肩のラインを水平に保ってください', faceGuideX + 1, shoulderY + 36);
  
  // 肩ラインテキストは背景付き
  const shoulderText = '肩のラインを水平に保ってください';
  const textMetrics = ctx.measureText(shoulderText);
  const textWidth = textMetrics.width;
  const textHeight = 25;
  const textX = faceGuideX;
  const textY = shoulderY + 35;
  
  // テキスト背景（半透明の黒背景）
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(textX - textWidth / 2 - 10, textY - textHeight + 5, textWidth + 20, textHeight);
  
  // テキスト
  ctx.fillStyle = 'rgba(255, 215, 0, 1.0)';
  ctx.font = 'bold 20px Arial';
  ctx.fillText(shoulderText, textX, textY);
}

/**
 * エラーメッセージをCanvas上に描画
 * 
 * @param ctx - Canvasコンテキスト
 * @param message - メッセージ
 * @param width - Canvas幅
 * @param height - Canvas高さ
 */
export function drawErrorMessage(
  ctx: CanvasRenderingContext2D,
  message: string,
  width: number,
  height: number
): void {
  // 半透明の背景
  ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
  ctx.fillRect(0, height - 80, width, 80);

  // エラーメッセージ
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(message, width / 2, height - 45);
}

/**
 * 成功メッセージをCanvas上に描画
 * 
 * @param ctx - Canvasコンテキスト
 * @param message - メッセージ
 * @param width - Canvas幅
 * @param height - Canvas高さ
 */
export function drawSuccessMessage(
  ctx: CanvasRenderingContext2D,
  message: string,
  width: number,
  height: number
): void {
  // 半透明の背景
  ctx.fillStyle = 'rgba(0, 255, 0, 0.7)';
  ctx.fillRect(0, height - 60, width, 60);

  // 成功メッセージ
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(message, width / 2, height - 30);
}

/**
 * Canvas全体をクリア
 * 
 * @param ctx - Canvasコンテキスト
 * @param width - Canvas幅
 * @param height - Canvas高さ
 */
export function clearCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  ctx.clearRect(0, 0, width, height);
}
