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
      POSE_LANDMARKS.MOUTH_LEFT,
      POSE_LANDMARKS.MOUTH_RIGHT,
    ];

    if (importantIndices.includes(index)) {
      const x = landmark.x * width;
      const y = landmark.y * height;
      
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fill();
    }
  });
  
  // 顎の位置と耳の中点を描画
  // MediaPipe Holisticの顔メッシュが利用可能な場合は高精度なランドマークを使用
  const faceLandmarks = (landmarks as any).faceLandmarks as Landmark[] | undefined;
  
  let chinX: number = 0, chinY: number = 0;
  let earCenterX: number = 0, earCenterY: number = 0;
  let hasChinData = false;
  let hasEarData = false;
  
  if (faceLandmarks && faceLandmarks.length >= 468) {
    // MediaPipe Holistic使用時：顔メッシュから高精度に取得
    const chinTip = faceLandmarks[152];
    if (chinTip) {
      chinX = chinTip.x * width;
      chinY = chinTip.y * height;
      hasChinData = true;
    }
    
    // 耳の周辺ランドマークから高精度な耳の中点を計算
    const leftEarPoints = [faceLandmarks[234], faceLandmarks[127]].filter(p => p);
    const rightEarPoints = [faceLandmarks[454], faceLandmarks[356]].filter(p => p);
    
    if (leftEarPoints.length > 0 && rightEarPoints.length > 0) {
      const leftEarX = leftEarPoints.reduce((sum, p) => sum + p.x, 0) / leftEarPoints.length;
      const leftEarY = leftEarPoints.reduce((sum, p) => sum + p.y, 0) / leftEarPoints.length;
      const rightEarX = rightEarPoints.reduce((sum, p) => sum + p.x, 0) / rightEarPoints.length;
      const rightEarY = rightEarPoints.reduce((sum, p) => sum + p.y, 0) / rightEarPoints.length;
      
      earCenterX = ((leftEarX + rightEarX) / 2) * width;
      earCenterY = ((leftEarY + rightEarY) / 2) * height;
      hasEarData = true;
    }
  } else {
    // MediaPipe Pose使用時：従来の方法
    const mouthLeft = landmarks[POSE_LANDMARKS.MOUTH_LEFT];
    const mouthRight = landmarks[POSE_LANDMARKS.MOUTH_RIGHT];
    const leftEar = landmarks[POSE_LANDMARKS.LEFT_EAR];
    const rightEar = landmarks[POSE_LANDMARKS.RIGHT_EAR];
    
    if (mouthLeft && mouthRight && 
        mouthLeft.visibility && mouthRight.visibility &&
        mouthLeft.visibility > 0.5 && mouthRight.visibility > 0.5) {
      chinX = ((mouthLeft.x + mouthRight.x) / 2) * width;
      chinY = ((mouthLeft.y + mouthRight.y) / 2) * height;
      hasChinData = true;
    }
    
    if (leftEar && rightEar && 
        leftEar.visibility && rightEar.visibility &&
        leftEar.visibility > 0.5 && rightEar.visibility > 0.5) {
      earCenterX = ((leftEar.x + rightEar.x) / 2) * width;
      earCenterY = ((leftEar.y + rightEar.y) / 2) * height;
      hasEarData = true;
    }
  }
  
  // 顎の位置を描画
  if (hasChinData) {
    // 顎の位置を強調表示（より大きく、異なる色）
    ctx.fillStyle = '#ff00ff'; // マゼンタ色で目立たせる
    ctx.beginPath();
    ctx.arc(chinX, chinY, 8, 0, 2 * Math.PI);
    ctx.fill();
    
    // 顎の点を縁取り
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(chinX, chinY, 8, 0, 2 * Math.PI);
    ctx.stroke();
  }
  
  // 耳の中点を描画
  if (hasEarData) {
    // 耳の中点を強調表示（シアン色）
    ctx.fillStyle = '#00ffff'; // シアン色
    ctx.beginPath();
    ctx.arc(earCenterX, earCenterY, 8, 0, 2 * Math.PI);
    ctx.fill();
    
    // 耳の中点を縁取り
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(earCenterX, earCenterY, 8, 0, 2 * Math.PI);
    ctx.stroke();
  }
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

  // 肩のY座標の平均（肩のラインの高さ）
  const shoulderY = ((leftAcromion.y + rightAcromion.y) / 2) * height;
  const leftX = leftAcromion.x * width;
  const rightX = rightAcromion.x * width;
  
  // 水平基準線を描画（白色・破線）
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 10]);
  ctx.beginPath();
  ctx.moveTo(Math.min(leftX, rightX) - 50, shoulderY);
  ctx.lineTo(Math.max(leftX, rightX) + 50, shoulderY);
  ctx.stroke();

  // 肩のライン（実際の肩峰を結ぶ線）
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
 * MediaPipe Holisticの顔メッシュが利用可能な場合は高精度なランドマークを使用
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
  // MediaPipe Holisticの顔メッシュが利用可能か確認
  const faceLandmarks = (landmarks as any).faceLandmarks as Landmark[] | undefined;
  
  let chinX: number, chinY: number;
  let earCenterX: number, earCenterY: number;
  
  if (faceLandmarks && faceLandmarks.length >= 468) {
    // MediaPipe Holistic使用時：顔メッシュから高精度に取得
    const chinTip = faceLandmarks[152];
    if (!chinTip) return;
    
    chinX = chinTip.x * width;
    chinY = chinTip.y * height;
    
    // 耳の周辺ランドマークから高精度な耳の中点を計算
    const leftEarPoints = [faceLandmarks[234], faceLandmarks[127]].filter(p => p);
    const rightEarPoints = [faceLandmarks[454], faceLandmarks[356]].filter(p => p);
    
    if (leftEarPoints.length === 0 || rightEarPoints.length === 0) return;
    
    const leftEarX = leftEarPoints.reduce((sum, p) => sum + p.x, 0) / leftEarPoints.length;
    const leftEarY = leftEarPoints.reduce((sum, p) => sum + p.y, 0) / leftEarPoints.length;
    const rightEarX = rightEarPoints.reduce((sum, p) => sum + p.x, 0) / rightEarPoints.length;
    const rightEarY = rightEarPoints.reduce((sum, p) => sum + p.y, 0) / rightEarPoints.length;
    
    earCenterX = ((leftEarX + rightEarX) / 2) * width;
    earCenterY = ((leftEarY + rightEarY) / 2) * height;
  } else {
    // MediaPipe Pose使用時：従来の方法
    const leftEar = landmarks[POSE_LANDMARKS.LEFT_EAR];
    const rightEar = landmarks[POSE_LANDMARKS.RIGHT_EAR];
    const mouthLeft = landmarks[POSE_LANDMARKS.MOUTH_LEFT];
    const mouthRight = landmarks[POSE_LANDMARKS.MOUTH_RIGHT];

    if (!leftEar || !rightEar || !mouthLeft || !mouthRight) return;

    // 顎の位置を計算（口の中点）
    chinX = ((mouthLeft.x + mouthRight.x) / 2) * width;
    chinY = ((mouthLeft.y + mouthRight.y) / 2) * height;

    // 耳の中点を計算
    earCenterX = ((leftEar.x + rightEar.x) / 2) * width;
    earCenterY = ((leftEar.y + rightEar.y) / 2) * height;
  }

  // 顎から耳の中点への線を描画（首の角度線）
  ctx.strokeStyle = '#ffff00';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(chinX, chinY);
  ctx.lineTo(earCenterX, earCenterY);
  ctx.stroke();

  // 垂直線を描画（参照用）- 顎の位置から上へ
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 10]);
  ctx.beginPath();
  ctx.moveTo(chinX, chinY);
  ctx.lineTo(chinX, chinY - 100);
  ctx.stroke();
  ctx.setLineDash([]);

  // 角度テキストを描画
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px Arial';
  ctx.fillText(`${angle.toFixed(1)}°`, chinX + 10, chinY - 50);
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
  const centerX = width / 2;
  const centerY = height / 2;
  
  // 人型シルエットのサイズ設定
  const silhouetteScale = Math.min(width, height) * 0.35;
  const headRadius = silhouetteScale * 0.2;
  const neckHeight = silhouetteScale * 0.15;
  const shoulderWidth = silhouetteScale * 0.8;
  const torsoHeight = silhouetteScale * 0.6;
  
  // 人型シルエットの各部位の位置計算（傾き角度を適用）
  const tiltRad = (tiltAngle * Math.PI) / 180;
  
  // 頭部の位置（傾きに応じて移動）
  const headCenterX = centerX + Math.sin(tiltRad) * neckHeight;
  const headCenterY = centerY - silhouetteScale * 0.4 - Math.cos(tiltRad) * neckHeight * 0.5;
  
  // 首の付け根の位置
  const neckBaseX = centerX;
  const neckBaseY = centerY - silhouetteScale * 0.2;
  
  // 肩の位置
  const leftShoulderX = neckBaseX - shoulderWidth / 2;
  const leftShoulderY = neckBaseY;
  const rightShoulderX = neckBaseX + shoulderWidth / 2;
  const rightShoulderY = neckBaseY;
  
  // 胴体の底辺の位置
  const torsoBottomY = neckBaseY + torsoHeight;
  
  ctx.save();
  
  // 人型シルエットを描画（影）
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  // 影の描画（少しオフセット）
  const shadowOffset = 3;
  
  // 頭（影）
  ctx.beginPath();
  ctx.arc(headCenterX + shadowOffset, headCenterY + shadowOffset, headRadius, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();
  
  // 首（影）
  ctx.beginPath();
  ctx.moveTo(headCenterX + shadowOffset, headCenterY + headRadius + shadowOffset);
  ctx.lineTo(neckBaseX + shadowOffset, neckBaseY + shadowOffset);
  ctx.stroke();
  
  // 肩（影）
  ctx.beginPath();
  ctx.moveTo(leftShoulderX + shadowOffset, leftShoulderY + shadowOffset);
  ctx.lineTo(rightShoulderX + shadowOffset, rightShoulderY + shadowOffset);
  ctx.stroke();
  
  // 左肩から首（影）
  ctx.beginPath();
  ctx.moveTo(leftShoulderX + shadowOffset, leftShoulderY + shadowOffset);
  ctx.lineTo(neckBaseX + shadowOffset, neckBaseY + shadowOffset);
  ctx.stroke();
  
  // 右肩から首（影）
  ctx.beginPath();
  ctx.moveTo(rightShoulderX + shadowOffset, rightShoulderY + shadowOffset);
  ctx.lineTo(neckBaseX + shadowOffset, neckBaseY + shadowOffset);
  ctx.stroke();
  
  // 胴体（影）
  ctx.beginPath();
  ctx.moveTo(leftShoulderX + shadowOffset, leftShoulderY + shadowOffset);
  ctx.lineTo(leftShoulderX + shoulderWidth * 0.1 + shadowOffset, torsoBottomY + shadowOffset);
  ctx.lineTo(rightShoulderX - shoulderWidth * 0.1 + shadowOffset, torsoBottomY + shadowOffset);
  ctx.lineTo(rightShoulderX + shadowOffset, rightShoulderY + shadowOffset);
  ctx.fill();
  ctx.stroke();
  
  // 人型シルエット本体を描画
  ctx.strokeStyle = 'rgba(0, 255, 255, 0.9)';
  ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
  ctx.lineWidth = 4;
  
  // 頭
  ctx.beginPath();
  ctx.arc(headCenterX, headCenterY, headRadius, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();
  
  // 首
  ctx.beginPath();
  ctx.moveTo(headCenterX, headCenterY + headRadius);
  ctx.lineTo(neckBaseX, neckBaseY);
  ctx.stroke();
  
  // 肩のライン（水平）
  ctx.strokeStyle = 'rgba(255, 215, 0, 0.95)';
  ctx.lineWidth = 5;
  ctx.setLineDash([15, 10]);
  ctx.beginPath();
  ctx.moveTo(leftShoulderX, leftShoulderY);
  ctx.lineTo(rightShoulderX, rightShoulderY);
  ctx.stroke();
  ctx.setLineDash([]);
  
  // 肩の端点マーカー
  ctx.fillStyle = 'rgba(255, 215, 0, 0.95)';
  ctx.beginPath();
  ctx.arc(leftShoulderX, leftShoulderY, 8, 0, 2 * Math.PI);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(rightShoulderX, rightShoulderY, 8, 0, 2 * Math.PI);
  ctx.fill();
  
  // 左肩から首
  ctx.strokeStyle = 'rgba(0, 255, 255, 0.9)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(leftShoulderX, leftShoulderY);
  ctx.lineTo(neckBaseX, neckBaseY);
  ctx.stroke();
  
  // 右肩から首
  ctx.beginPath();
  ctx.moveTo(rightShoulderX, rightShoulderY);
  ctx.lineTo(neckBaseX, neckBaseY);
  ctx.stroke();
  
  // 胴体（台形）
  ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
  ctx.strokeStyle = 'rgba(0, 255, 255, 0.9)';
  ctx.beginPath();
  ctx.moveTo(leftShoulderX, leftShoulderY);
  ctx.lineTo(leftShoulderX + shoulderWidth * 0.1, torsoBottomY);
  ctx.lineTo(rightShoulderX - shoulderWidth * 0.1, torsoBottomY);
  ctx.lineTo(rightShoulderX, rightShoulderY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  
  ctx.restore();

  // 側屈撮影時: 矢印を表示
  if (tiltAngle !== 0) {
    const arrowWidth = 50;
    
    // 矢印の位置計算
    const direction = tiltAngle < 0 ? -1 : 1;
    const arrowStartX = headCenterX;
    const arrowStartY = headCenterY - headRadius - 20;
    const arrowEndX = arrowStartX + direction * 80;
    const arrowEndY = arrowStartY;

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
    
    // 矢印ヘッド（影）
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
    ctx.strokeStyle = 'rgba(255, 255, 0, 0.95)';
    ctx.fillStyle = 'rgba(255, 255, 0, 0.95)';
    ctx.lineWidth = 10;
    
    ctx.beginPath();
    ctx.moveTo(arrowStartX, arrowStartY);
    ctx.lineTo(arrowEndX, arrowEndY);
    ctx.stroke();
    
    // 矢印ヘッド
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
    
    // テキスト表示
    const directionText = tiltAngle < 0 ? '← この方向に首を傾けて' : 'この方向に首を傾けて →';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.font = 'bold 22px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(directionText, centerX + 1, arrowStartY - 21);
    
    ctx.fillStyle = 'rgba(255, 255, 255, 1.0)';
    ctx.fillText(directionText, centerX, arrowStartY - 20);
  }

  // テキスト表示
  if (tiltAngle === 0) {
    // 正面撮影時のガイドテキスト
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('顔と肩をシルエットに合わせてください', centerX + 1, headCenterY - headRadius - 39);

    ctx.fillStyle = 'rgba(255, 255, 255, 1.0)';
    ctx.fillText('顔と肩をシルエットに合わせてください', centerX, headCenterY - headRadius - 40);
  }
  
  // 肩ラインテキスト
  const shoulderText = '肩のラインを水平に保ってください';
  const textMetrics = ctx.measureText(shoulderText);
  const textWidth = textMetrics.width;
  const textHeight = 25;
  const textX = centerX;
  const textY = torsoBottomY + 30;
  
  // テキスト背景
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
