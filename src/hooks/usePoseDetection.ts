import { useEffect, useRef, useState } from 'react';
import * as poseModule from '@mediapipe/pose';
import { Landmark } from '../types/pose';

// MediaPipe Poseの型定義
type Pose = poseModule.Pose;
type Results = poseModule.Results;

interface UsePoseDetectionProps {
  onResults?: (landmarks: Landmark[]) => void;
}

interface UsePoseDetectionReturn {
  pose: Pose | null;
  isLoading: boolean;
  error: string | null;
  processImage: (imageElement: HTMLImageElement) => Promise<Landmark[] | null>;
}

/**
 * MediaPipe Poseを使用した姿勢検出のカスタムフック
 */
export function usePoseDetection({ onResults }: UsePoseDetectionProps = {}): UsePoseDetectionReturn {
  const [pose, setPose] = useState<Pose | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const landmarksRef = useRef<Landmark[] | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initializePose = async () => {
      try {
        setIsLoading(true);
        
        // MediaPipe Poseのインスタンスを作成
        console.log('Initializing MediaPipe Pose...');
        const poseInstance = new poseModule.Pose({
          locateFile: (file) => {
            console.log('Loading MediaPipe file:', file);
            return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
          }
        });

        // オプションを設定
        poseInstance.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          enableSegmentation: false,
          smoothSegmentation: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        // 結果のコールバックを設定
        poseInstance.onResults((results: Results) => {
          console.log('MediaPipe onResults called:', results.poseLandmarks ? 'Landmarks found' : 'No landmarks');
          if (results.poseLandmarks) {
            const landmarks = results.poseLandmarks as Landmark[];
            landmarksRef.current = landmarks;
            console.log('Landmarks saved to ref:', landmarks.length);
            
            if (onResults) {
              onResults(landmarks);
            }
          } else {
            console.warn('No pose landmarks detected in image');
            landmarksRef.current = null;
          }
        });

        // 初期化を待つ
        await poseInstance.initialize();

        if (isMounted) {
          setPose(poseInstance);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Pose initialization error:', err);
          setError(err instanceof Error ? err.message : 'Poseの初期化に失敗しました');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializePose();

    return () => {
      isMounted = false;
      if (pose) {
        pose.close();
      }
    };
  }, []);

  /**
   * 画像をリサイズして適切なサイズに縮小
   */
  const resizeImage = (img: HTMLImageElement, maxWidth: number = 1280, maxHeight: number = 1280): HTMLImageElement => {
    const canvas = document.createElement('canvas');
    let width = img.width;
    let height = img.height;

    // アスペクト比を維持しながらリサイズ
    if (width > maxWidth || height > maxHeight) {
      const aspectRatio = width / height;
      if (width > height) {
        width = maxWidth;
        height = width / aspectRatio;
      } else {
        height = maxHeight;
        width = height * aspectRatio;
      }
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(img, 0, 0, width, height);
    }

    const resizedImg = new Image();
    resizedImg.src = canvas.toDataURL('image/jpeg', 0.9);
    console.log(`Image resized from ${img.width}x${img.height} to ${width}x${height}`);
    return resizedImg;
  };

  /**
   * 画像を処理してランドマークを取得
   */
  const processImage = async (imageElement: HTMLImageElement): Promise<Landmark[] | null> => {
    if (!pose) {
      console.error('Pose is not initialized');
      setError('Poseが初期化されていません');
      return null;
    }

    try {
      landmarksRef.current = null;
      
      console.log('Original image size:', imageElement.width, 'x', imageElement.height);
      
      // 画像が大きすぎる場合はリサイズ
      let processImg = imageElement;
      if (imageElement.width > 1280 || imageElement.height > 1280) {
        processImg = resizeImage(imageElement);
        // リサイズ後の画像が読み込まれるまで待つ
        await new Promise<void>((resolve) => {
          if (processImg.complete) {
            resolve();
          } else {
            processImg.onload = () => resolve();
          }
        });
      }
      
      console.log('Processing image with MediaPipe Pose...', processImg.width, 'x', processImg.height);
      await pose.send({ image: processImg });
      
      // 結果が非同期で返ってくるのを待つ（最大5秒）
      const maxWaitTime = 5000;
      const checkInterval = 100;
      let waited = 0;
      
      while (landmarksRef.current === null && waited < maxWaitTime) {
        await new Promise(resolve => setTimeout(resolve, checkInterval));
        waited += checkInterval;
      }
      
      console.log('Wait time:', waited, 'ms');
      console.log('Landmarks detected:', landmarksRef.current ? (landmarksRef.current as Landmark[]).length : 'null');
      
      return landmarksRef.current;
    } catch (err) {
      console.error('Image processing error:', err);
      setError(err instanceof Error ? err.message : '画像の処理に失敗しました');
      return null;
    }
  };

  return {
    pose,
    isLoading,
    error,
    processImage,
  };
}
