import React, { useState, useRef, useEffect } from 'react';
import { ImageType } from '../types/pose';
import { useCamera } from '../hooks/useCamera';
import { drawGuideline } from '../utils/drawingUtils';

interface ImageCaptureProps {
  imageType: ImageType;
  onCapture: (dataUrl: string) => void;
  onCancel: () => void;
}

const IMAGE_TYPE_LABELS: Record<ImageType, string> = {
  [ImageType.NEUTRAL]: '正面画像',
  [ImageType.RIGHT_TILT]: '右側屈画像',
  [ImageType.LEFT_TILT]: '左側屈画像',
};

const IMAGE_TYPE_INSTRUCTIONS: Record<ImageType, string> = {
  [ImageType.NEUTRAL]: 'まっすぐ前を向いてください',
  [ImageType.RIGHT_TILT]: '肩を動かさずに、首だけを右に傾けてください',
  [ImageType.LEFT_TILT]: '肩を動かさずに、首だけを左に傾けてください',
};

export const ImageCapture: React.FC<ImageCaptureProps> = ({
  imageType,
  onCapture,
  onCancel,
}) => {
  const { videoRef, isStreaming, error, startCamera, stopCamera, captureImage } = useCamera();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showGuideline, setShowGuideline] = useState(true);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  // ガイドラインを描画
  useEffect(() => {
    if (!canvasRef.current || !videoRef.current || !isStreaming || !showGuideline) {
      return;
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const drawFrame = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // 画像タイプに応じて傾き角度を設定
      let tiltAngle = 0;
      if (imageType === ImageType.RIGHT_TILT) {
        tiltAngle = 15; // 右に15度傾ける
      } else if (imageType === ImageType.LEFT_TILT) {
        tiltAngle = -15; // 左に15度傾ける
      }

      drawGuideline(ctx, canvas.width, canvas.height, tiltAngle);

      animationId = requestAnimationFrame(drawFrame);
    };

    drawFrame();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isStreaming, showGuideline, imageType, videoRef]);

  const handleCapture = () => {
    const dataUrl = captureImage();
    if (dataUrl) {
      stopCamera();
      onCapture(dataUrl);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        stopCamera();
        onCapture(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <h2 className="text-2xl font-bold mb-2">{IMAGE_TYPE_LABELS[imageType]}</h2>
          <p className="text-gray-600 mb-4">{IMAGE_TYPE_INSTRUCTIONS[imageType]}</p>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="relative bg-gray-900 rounded-lg overflow-hidden mb-4">
            <video
              ref={videoRef}
              className="w-full h-auto"
              style={{ maxHeight: '50vh' }}
              autoPlay
              playsInline
              muted
            />
            {showGuideline && (
              <canvas
                ref={canvasRef}
                className="absolute inset-0 pointer-events-none"
                style={{ width: '100%', height: '100%' }}
              />
            )}
            {!isStreaming && !error && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75">
                <div className="text-white text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                  <p>カメラを起動中...</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mb-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showGuideline}
                onChange={(e) => setShowGuideline(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">ガイドラインを表示</span>
            </label>
          </div>

          {/* ステータス表示 */}
          {!isStreaming && !error && (
            <div className="mb-4 p-2 bg-blue-100 text-sm text-blue-700 rounded text-center flex items-center justify-center gap-2">
              <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              カメラを起動しています...
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleCapture}
              disabled={!isStreaming}
              className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors min-h-[48px] flex items-center justify-center gap-2"
              title={isStreaming ? '撮影する' : 'カメラ起動中...'}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              撮影する
            </button>

            <label className="w-full sm:flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg cursor-pointer transition-colors text-center flex items-center justify-center gap-2 min-h-[48px]">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              ファイルから選択
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <button
              onClick={() => {
                stopCamera();
                onCancel();
              }}
              className="w-full sm:flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-colors min-h-[48px] flex items-center justify-center gap-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              キャンセル
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
