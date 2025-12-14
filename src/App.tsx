import { useState } from 'react';
import { ImageType, Landmark, DiagnosisResult as DiagnosisResultType } from './types/pose';
import { ImageCapture } from './components/ImageCapture';
import { PoseAnalysis } from './components/PoseAnalysis';
import { DiagnosisResult } from './components/DiagnosisResult';
import {
  evaluateFlexibility,
  evaluateAsymmetry,
  generateRecommendations,
} from './utils/validationUtils';
import { calculateLateralFlexionAngle } from './utils/angleUtils';

interface CapturedImage {
  type: ImageType;
  url: string;
  landmarks?: Landmark[];
  angle?: number;
}

type AppState = 'intro' | 'capture' | 'analyze' | 'result';

function App() {
  const [appState, setAppState] = useState<AppState>('intro');
  const [currentImageType, setCurrentImageType] = useState<ImageType>(ImageType.NEUTRAL);
  const [capturedImages, setCapturedImages] = useState<CapturedImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResultType | null>(null);

  const handleStartCapture = () => {
    setAppState('capture');
    setCurrentImageType(ImageType.NEUTRAL);
    setCapturedImages([]);
    setError(null);
  };

  const handleImageCaptured = (dataUrl: string) => {
    setCapturedImages(prev => [
      ...prev,
      { type: currentImageType, url: dataUrl }
    ]);
    setAppState('analyze');
  };

  const handleAnalysisComplete = (landmarks: Landmark[], angle: number) => {
    const updatedImages = capturedImages.map(img =>
      img.type === currentImageType
        ? { ...img, landmarks, angle }
        : img
    );
    setCapturedImages(updatedImages);
    setError(null);

    // 次の画像へ進む
    if (currentImageType === ImageType.NEUTRAL) {
      setCurrentImageType(ImageType.RIGHT_TILT);
      setAppState('capture');
    } else if (currentImageType === ImageType.RIGHT_TILT) {
      setCurrentImageType(ImageType.LEFT_TILT);
      setAppState('capture');
    } else {
      // すべての画像が揃ったので診断を実行
      calculateDiagnosis(updatedImages);
    }
  };

  const handleAnalysisError = (errorMessage: string) => {
    setError(errorMessage);
    // エラーが発生したら同じ画像を再撮影
    setTimeout(() => {
      setCapturedImages(prev => prev.filter(img => img.type !== currentImageType));
      setAppState('capture');
      setError(null);
    }, 3000);
  };

  const calculateDiagnosis = (images: CapturedImage[]) => {
    const neutral = images.find(img => img.type === ImageType.NEUTRAL);
    const right = images.find(img => img.type === ImageType.RIGHT_TILT);
    const left = images.find(img => img.type === ImageType.LEFT_TILT);

    if (!neutral?.angle || !right?.angle || !left?.angle ||
        !neutral?.landmarks || !right?.landmarks || !left?.landmarks) {
      setError('角度データが不足しています');
      return;
    }

    // 正面からの側屈角度を計算
    const rightAngle = calculateLateralFlexionAngle(neutral.angle, right.angle);
    const leftAngle = calculateLateralFlexionAngle(neutral.angle, left.angle);

    // 柔軟性と左右差を評価
    const rightFlexibility = evaluateFlexibility(rightAngle);
    const leftFlexibility = evaluateFlexibility(leftAngle);
    const asymmetry = evaluateAsymmetry(rightAngle, leftAngle);
    const asymmetryDiff = Math.abs(rightAngle - leftAngle);

    // 推奨事項を生成
    const recommendations = generateRecommendations(
      rightFlexibility,
      leftFlexibility,
      asymmetry,
      rightAngle,
      leftAngle
    );

    const result: DiagnosisResultType = {
      neutralAngle: neutral.angle,  // 正面（中心）の角度
      rightAngle,
      leftAngle,
      rightFlexibility,
      leftFlexibility,
      asymmetry,
      asymmetryDiff,
      recommendations,
      // 画像データを含める
      neutralImage: {
        type: neutral.type,
        url: neutral.url,
        landmarks: neutral.landmarks,
        angle: neutral.angle
      },
      rightImage: {
        type: right.type,
        url: right.url,
        landmarks: right.landmarks,
        angle: right.angle
      },
      leftImage: {
        type: left.type,
        url: left.url,
        landmarks: left.landmarks,
        angle: left.angle
      }
    };

    setDiagnosisResult(result);
    setAppState('result');
  };

  const handleReset = () => {
    setAppState('intro');
    setCapturedImages([]);
    setError(null);
    setDiagnosisResult(null);
    setCurrentImageType(ImageType.NEUTRAL);
  };

  const handleCancelCapture = () => {
    // 前の画像を削除
    setCapturedImages(prev => prev.filter(img => img.type !== currentImageType));
    
    // 最初の画像の場合はイントロに戻る
    if (currentImageType === ImageType.NEUTRAL) {
      setAppState('intro');
    } else if (currentImageType === ImageType.RIGHT_TILT) {
      // 正面画像の再撮影
      setCurrentImageType(ImageType.NEUTRAL);
      setAppState('capture');
    } else {
      // 右側屈画像の再撮影
      setCurrentImageType(ImageType.RIGHT_TILT);
      setAppState('capture');
    }
  };

  const getProgressText = () => {
    const total = 3;
    const current = capturedImages.filter(img => img.landmarks).length + 1;
    return `ステップ ${current} / ${total}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* ヘッダー */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-800">
            🎯 NeckRange AI
          </h1>
          <p className="text-gray-600 mt-1">首の可動域測定サービス</p>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* エラー表示 */}
        {error && (
          <div className="mb-6 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
            <p className="font-bold">エラー</p>
            <p>{error}</p>
          </div>
        )}

        {/* イントロ画面 */}
        {appState === 'intro' && (
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🎯</div>
              <h2 className="text-4xl font-bold mb-4 text-gray-800">
                NeckRange AI へようこそ
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                AIが首の可動域を測定し、姿勢のバランスを診断します
              </p>
            </div>

            {/* 使い方 */}
            <div className="bg-blue-50 rounded-lg p-6 mb-8">
              <h3 className="text-2xl font-semibold mb-4 text-blue-900">📝 使い方</h3>
              <ol className="space-y-4">
                <li className="flex items-start">
                  <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 flex-shrink-0">
                    1
                  </span>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">正面画像の撮影</h4>
                    <p className="text-gray-600">まっすぐ前を向いた状態で撮影します</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 flex-shrink-0">
                    2
                  </span>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">右側屈画像の撮影</h4>
                    <p className="text-gray-600">肩を動かさず、首だけを右に傾けます</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 flex-shrink-0">
                    3
                  </span>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">左側屈画像の撮影</h4>
                    <p className="text-gray-600">肩を動かさず、首だけを左に傾けます</p>
                  </div>
                </li>
              </ol>
            </div>

            {/* 注意事項 */}
            <div className="bg-yellow-50 rounded-lg p-6 mb-8 border-2 border-yellow-200">
              <h3 className="text-lg font-semibold mb-3 text-yellow-900">⚠️ 撮影時の注意</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>肩を動かさないように注意してください</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>明るい場所で撮影してください</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>顔全体と肩が画面に収まるようにしてください</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>痛みを感じたら無理をしないでください</span>
                </li>
              </ul>
            </div>

            <button
              onClick={handleStartCapture}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xl py-4 px-8 rounded-lg transition-colors shadow-lg"
            >
              🚀 測定を開始する
            </button>
          </div>
        )}

        {/* 画像キャプチャ */}
        {appState === 'capture' && (
          <div>
            <div className="text-center mb-4">
              <span className="inline-block bg-blue-600 text-white px-4 py-2 rounded-full font-semibold">
                {getProgressText()}
              </span>
            </div>
            <ImageCapture
              imageType={currentImageType}
              onCapture={handleImageCaptured}
              onCancel={handleCancelCapture}
            />
          </div>
        )}

        {/* 画像解析 */}
        {appState === 'analyze' && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-4">
              <span className="inline-block bg-blue-600 text-white px-4 py-2 rounded-full font-semibold">
                {getProgressText()}
              </span>
            </div>
            <div className="bg-white rounded-lg shadow-xl p-8">
              <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
                画像を解析中...
              </h2>
              {capturedImages
                .filter(img => img.type === currentImageType)
                .map((img, index) => (
                  <PoseAnalysis
                    key={index}
                    imageUrl={img.url}
                    imageType={img.type}
                    onAnalysisComplete={handleAnalysisComplete}
                    onError={handleAnalysisError}
                  />
                ))}
            </div>
          </div>
        )}

        {/* 診断結果 */}
        {appState === 'result' && diagnosisResult && (
          <DiagnosisResult result={diagnosisResult} onReset={handleReset} />
        )}
      </main>

      {/* フッター */}
      <footer className="bg-white mt-16 py-6 border-t">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-600">
          <p className="text-sm">
            © 2024 NeckRange AI. この診断は医学的診断に代わるものではありません。
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
