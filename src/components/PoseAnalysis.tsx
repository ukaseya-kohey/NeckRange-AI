import React, { useEffect, useRef, useState } from 'react';
import { Landmark, ImageType } from '../types/pose';
import { usePoseDetection } from '../hooks/usePoseDetection';
import { validateShoulderLevel } from '../utils/validationUtils';
import { calculateNeckTiltAngle } from '../utils/angleUtils';
import {
  drawLandmarks,
  drawSkeleton,
  drawShoulderLine,
  drawNeckAngleLine,
  drawErrorMessage,
  drawSuccessMessage,
} from '../utils/drawingUtils';

interface PoseAnalysisProps {
  imageUrl: string;
  imageType: ImageType;
  onAnalysisComplete: (landmarks: Landmark[], angle: number) => void;
  onError: (error: string) => void;
}

export const PoseAnalysis: React.FC<PoseAnalysisProps> = ({
  imageUrl,
  imageType,
  onAnalysisComplete,
  onError,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const hasAnalyzedRef = useRef(false); // 処理済みフラグ
  const { processImage, isLoading: isPoseLoading } = usePoseDetection();

  useEffect(() => {
    const analyzeImage = async () => {
      // 既に処理済みの場合はスキップ
      if (hasAnalyzedRef.current) {
        return;
      }

      if (isPoseLoading) {
        console.log('Waiting for MediaPipe Pose to load...');
        return;
      }

      setIsAnalyzing(true);
      console.log('Starting image analysis for:', imageType);

      try {
        // 画像を読み込み
        const img = new Image();
        // CORS問題を回避するため、Data URLの場合はcrossOriginを設定しない
        if (!imageUrl.startsWith('data:')) {
          img.crossOrigin = 'anonymous';
        }
        
        await new Promise((resolve, reject) => {
          img.onload = () => {
            console.log('Image loaded:', img.width, 'x', img.height);
            resolve(null);
          };
          img.onerror = (e) => {
            console.error('Image load error:', e);
            reject(new Error('画像の読み込みに失敗しました'));
          };
          img.src = imageUrl;
        });

        imageRef.current = img;

        // ポーズ検出を実行
        console.log('Processing image with MediaPipe Pose...');
        const detectedLandmarks = await processImage(img);
        console.log('Detected landmarks:', detectedLandmarks ? detectedLandmarks.length : 'null');

        if (!detectedLandmarks || detectedLandmarks.length === 0) {
          const errorMsg = '姿勢を検出できませんでした。人物が画面全体に映っているか確認してください。';
          console.error(errorMsg);
          onError(errorMsg);
          return;
        }

        // Landmarks are used in drawAnalysisResult

        // 肩の水平検証（正面以外の場合）
        if (imageType !== ImageType.NEUTRAL) {
          const shoulderValidation = validateShoulderLevel(detectedLandmarks);
          
          if (!shoulderValidation.isValid) {
            onError(shoulderValidation.message);
            drawAnalysisResult(img, detectedLandmarks, false, shoulderValidation.message);
            return;
          }
        }

        // 首の角度を計算
        const neckAngle = calculateNeckTiltAngle(detectedLandmarks);

        // 解析結果を描画
        drawAnalysisResult(img, detectedLandmarks, true, `角度: ${neckAngle.toFixed(1)}°`);

        // 解析完了を通知
        hasAnalyzedRef.current = true; // 処理済みフラグをセット
        onAnalysisComplete(detectedLandmarks, neckAngle);
      } catch (error) {
        console.error('Analysis error:', error);
        onError(
          error instanceof Error 
            ? error.message 
            : '画像の解析中にエラーが発生しました'
        );
      } finally {
        setIsAnalyzing(false);
      }
    };

    analyzeImage();
  }, [imageUrl, imageType, isPoseLoading, processImage]); // onAnalysisComplete, onErrorを依存配列から除外

  // imageUrlが変わったらフラグをリセット
  useEffect(() => {
    hasAnalyzedRef.current = false;
  }, [imageUrl]);

  const drawAnalysisResult = (
    img: HTMLImageElement,
    detectedLandmarks: Landmark[],
    isValid: boolean,
    message: string
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvasのサイズを画像に合わせる
    canvas.width = img.width;
    canvas.height = img.height;

    // 画像を描画
    ctx.drawImage(img, 0, 0);

    // ランドマークとスケルトンを描画
    drawLandmarks(ctx, detectedLandmarks, canvas.width, canvas.height);
    drawSkeleton(ctx, detectedLandmarks, canvas.width, canvas.height);

    // 肩のラインを描画
    const shoulderValidation = validateShoulderLevel(detectedLandmarks);
    drawShoulderLine(
      ctx,
      detectedLandmarks,
      canvas.width,
      canvas.height,
      shoulderValidation.isValid
    );

    // 首の角度ラインを描画
    try {
      const neckAngle = calculateNeckTiltAngle(detectedLandmarks);
      drawNeckAngleLine(ctx, detectedLandmarks, canvas.width, canvas.height, neckAngle);
    } catch (error) {
      // 角度計算エラーは無視
    }

    // メッセージを描画
    if (isValid) {
      drawSuccessMessage(ctx, message, canvas.width, canvas.height);
    } else {
      drawErrorMessage(ctx, message, canvas.width, canvas.height);
    }
  };

  return (
    <div className="w-full">
      {isPoseLoading && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">MediaPipe Poseを読み込んでいます...</p>
          <p className="text-sm">初回は少し時間がかかる場合があります。</p>
        </div>
      )}

      {isAnalyzing && !isPoseLoading && (
        <div className="flex flex-col items-center justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <span className="text-lg text-gray-700 font-semibold">画像を解析中...</span>
          <span className="text-sm text-gray-500 mt-2">AIが姿勢を検出しています</span>
        </div>
      )}

      <canvas
        ref={canvasRef}
        className="w-full h-auto rounded-lg shadow-lg"
        style={{ display: isAnalyzing ? 'none' : 'block' }}
      />
    </div>
  );
};
