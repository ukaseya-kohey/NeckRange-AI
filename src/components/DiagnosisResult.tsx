import React, { useEffect, useRef, useState } from 'react';
import { DiagnosisResult as DiagnosisResultType, CapturedImageData } from '../types/pose';
import {
  getFlexibilityLabel,
  getAsymmetryLabel,
} from '../utils/validationUtils';
import {
  drawLandmarks,
  drawSkeleton,
  drawShoulderLine,
  drawNeckAngleLine,
} from '../utils/drawingUtils';

interface DiagnosisResultProps {
  result: DiagnosisResultType;
  onReset: () => void;
}

/**
 * 画像に骨格と角度の線を描画するコンポーネント
 */
const AnnotatedImage: React.FC<{ imageData: CapturedImageData; title: string }> = ({ imageData, title }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // キャンバスサイズを画像に合わせる
      canvas.width = img.width;
      canvas.height = img.height;

      // 画像を描画
      ctx.drawImage(img, 0, 0);

      // 骨格を描画
      drawSkeleton(ctx, imageData.landmarks, canvas.width, canvas.height);
      drawLandmarks(ctx, imageData.landmarks, canvas.width, canvas.height);

      // 肩の線を描画（緑色で水平を示す）
      drawShoulderLine(ctx, imageData.landmarks, canvas.width, canvas.height, true);

      // 首の角度線を描画
      drawNeckAngleLine(ctx, imageData.landmarks, canvas.width, canvas.height, imageData.angle);
    };

    img.src = imageData.url;
  }, [imageData]);

  return (
    <div className="relative bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5">
        <h4 className="text-sm font-semibold text-slate-700 tracking-tight">{title}</h4>
      </div>
      <div className="p-3">
        <canvas ref={canvasRef} className="w-full h-auto rounded-lg" />
      </div>
    </div>
  );
};

/**
 * プログレスバー（線形）
 */
const LinearProgress: React.FC<{ value: number; max: number; label: string; color: string }> = ({ value, max, label, color }) => {
  const percentage = Math.min((value / max) * 100, 100);
  const [animatedPercentage, setAnimatedPercentage] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => setAnimatedPercentage(percentage), 100);
    return () => clearTimeout(timeout);
  }, [percentage]);

  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between">
        <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">{label}</span>
        <span className="text-2xl font-bold text-slate-900">{value.toFixed(1)}°</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} transition-all duration-1000 ease-out rounded-full`}
          style={{ width: `${animatedPercentage}%` }}
        />
      </div>
      <div className="text-xs text-slate-500 text-right">最大 {max}°</div>
    </div>
  );
};

/**
 * メトリクスカード
 */
const MetricCard: React.FC<{ 
  title: string; 
  value: number | string; 
  unit?: string;
  label: string;
  icon?: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'info';
}> = ({ title, value, unit = '°', label, icon, variant = 'info' }) => {
  const variantStyles = {
    primary: 'border-l-blue-500 bg-blue-50/50',
    success: 'border-l-emerald-500 bg-emerald-50/50',
    warning: 'border-l-amber-500 bg-amber-50/50',
    info: 'border-l-slate-500 bg-slate-50/50',
  };

  return (
    <div className={`border-l-4 ${variantStyles[variant]} border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200`}>
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{title}</h4>
        {icon && <div className="text-slate-400">{icon}</div>}
      </div>
      <div className="flex items-baseline gap-1 mb-1">
        <span className="text-3xl font-bold text-slate-900">{typeof value === 'number' ? value.toFixed(1) : value}</span>
        {unit && <span className="text-sm text-slate-500 font-medium">{unit}</span>}
      </div>
      <p className="text-xs font-medium text-slate-600">{label}</p>
    </div>
  );
};

/**
 * セクションヘッダー
 */
const SectionHeader: React.FC<{ title: string; subtitle?: string; icon?: React.ReactNode }> = ({ title, subtitle, icon }) => (
  <div className="mb-6">
    <div className="flex items-center gap-3 mb-1">
      {icon && <div className="text-slate-700">{icon}</div>}
      <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h2>
    </div>
    {subtitle && <p className="text-sm text-slate-600 ml-9">{subtitle}</p>}
  </div>
);

/**
 * ステータスバッジ
 */
const StatusBadge: React.FC<{ label: string; variant: 'success' | 'warning' | 'error' | 'info' }> = ({ label, variant }) => {
  const styles = {
    success: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    warning: 'bg-amber-100 text-amber-800 border-amber-200',
    error: 'bg-rose-100 text-rose-800 border-rose-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200',
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold border rounded-full ${styles[variant]}`}>
      {label}
    </span>
  );
};

export const DiagnosisResult: React.FC<DiagnosisResultProps> = ({ result, onReset }) => {
  const getFlexibilityVariant = (label: string): 'success' | 'warning' | 'error' | 'info' => {
    if (label === '柔軟') return 'success';
    if (label === '普通') return 'info';
    if (label === 'やや硬い') return 'warning';
    return 'error';
  };

  const getAsymmetryVariant = (label: string): 'success' | 'warning' | 'error' | 'info' => {
    if (label === '正常') return 'success';
    if (label === '軽度') return 'info';
    if (label === '中等度') return 'warning';
    return 'error';
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-8 bg-blue-600 rounded-full" />
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">頸部可動域測定レポート</h1>
              <p className="text-sm text-slate-600 mt-0.5">Cervical Range of Motion Assessment</p>
            </div>
          </div>
        </div>

        {/* 主要メトリクス - 3カラム */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <MetricCard
            title="正面角度"
            value={result.neutralAngle}
            label="ニュートラルポジション"
            variant="info"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            }
          />
          <MetricCard
            title="右側屈"
            value={result.rightAngle}
            label={getFlexibilityLabel(result.rightFlexibility)}
            variant={getFlexibilityVariant(getFlexibilityLabel(result.rightFlexibility)) === 'success' ? 'success' : 
                     getFlexibilityVariant(getFlexibilityLabel(result.rightFlexibility)) === 'info' ? 'info' :
                     getFlexibilityVariant(getFlexibilityLabel(result.rightFlexibility)) === 'warning' ? 'warning' : 'primary'}
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            }
          />
          <MetricCard
            title="左側屈"
            value={result.leftAngle}
            label={getFlexibilityLabel(result.leftFlexibility)}
            variant={getFlexibilityVariant(getFlexibilityLabel(result.leftFlexibility)) === 'success' ? 'success' : 
                     getFlexibilityVariant(getFlexibilityLabel(result.leftFlexibility)) === 'info' ? 'info' :
                     getFlexibilityVariant(getFlexibilityLabel(result.leftFlexibility)) === 'warning' ? 'warning' : 'primary'}
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            }
          />
        </div>

        {/* 可動域詳細 */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-8">
          <SectionHeader 
            title="可動域分析"
            subtitle="Range of Motion Analysis"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          />
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <LinearProgress value={result.rightAngle} max={60} label="右側屈可動域" color="bg-blue-500" />
              {result.rightImage && (
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                    <div className="text-slate-600 mb-1 font-medium">首の傾斜角</div>
                    <div className="text-lg font-bold text-slate-900">{result.rightImage.angle.toFixed(1)}°</div>
                  </div>
                  {result.rightShoulderAngle !== undefined && (
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                      <div className="text-slate-600 mb-1 font-medium">肩の傾斜角</div>
                      <div className="text-lg font-bold text-slate-900">{result.rightShoulderAngle.toFixed(1)}°</div>
                    </div>
                  )}
                </div>
              )}
              <div className="flex justify-center pt-2">
                <StatusBadge 
                  label={getFlexibilityLabel(result.rightFlexibility)}
                  variant={getFlexibilityVariant(getFlexibilityLabel(result.rightFlexibility))}
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <LinearProgress value={result.leftAngle} max={60} label="左側屈可動域" color="bg-emerald-500" />
              {result.leftImage && (
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                    <div className="text-slate-600 mb-1 font-medium">首の傾斜角</div>
                    <div className="text-lg font-bold text-slate-900">{result.leftImage.angle.toFixed(1)}°</div>
                  </div>
                  {result.leftShoulderAngle !== undefined && (
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                      <div className="text-slate-600 mb-1 font-medium">肩の傾斜角</div>
                      <div className="text-lg font-bold text-slate-900">{result.leftShoulderAngle.toFixed(1)}°</div>
                    </div>
                  )}
                </div>
              )}
              <div className="flex justify-center pt-2">
                <StatusBadge 
                  label={getFlexibilityLabel(result.leftFlexibility)}
                  variant={getFlexibilityVariant(getFlexibilityLabel(result.leftFlexibility))}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 左右バランス */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-8">
          <SectionHeader 
            title="左右対称性評価"
            subtitle="Bilateral Symmetry Assessment"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
            }
          />
          
          <div className="grid md:grid-cols-3 gap-6 items-center">
            <div className="text-center p-6 bg-blue-50/50 rounded-xl border border-blue-100">
              <div className="text-4xl font-bold text-blue-600 mb-2">{result.rightAngle.toFixed(1)}°</div>
              <div className="text-xs font-medium text-slate-600 uppercase tracking-wide">右側屈</div>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 border-4 border-white shadow-lg mb-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900">{result.asymmetryDiff.toFixed(1)}°</div>
                </div>
              </div>
              <div className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-3">差分</div>
              <StatusBadge 
                label={getAsymmetryLabel(result.asymmetry)}
                variant={getAsymmetryVariant(getAsymmetryLabel(result.asymmetry))}
              />
            </div>
            
            <div className="text-center p-6 bg-emerald-50/50 rounded-xl border border-emerald-100">
              <div className="text-4xl font-bold text-emerald-600 mb-2">{result.leftAngle.toFixed(1)}°</div>
              <div className="text-xs font-medium text-slate-600 uppercase tracking-wide">左側屈</div>
            </div>
          </div>
        </div>

        {/* 解析画像 */}
        {result.neutralImage && result.rightImage && result.leftImage && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-8">
            <SectionHeader 
              title="画像解析結果"
              subtitle="Postural Analysis Images"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
            />
            
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <AnnotatedImage imageData={result.neutralImage} title="正面（中心）" />
              <AnnotatedImage imageData={result.rightImage} title="右側屈" />
              <AnnotatedImage imageData={result.leftImage} title="左側屈" />
            </div>
            
            {/* 凡例 */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">マーカー凡例</h4>
              <div className="grid md:grid-cols-3 gap-x-6 gap-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0" />
                  <span>骨格・ランドマーク・水平肩ライン</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-red-500 rounded-full flex-shrink-0" />
                  <span>肩ライン（傾斜時）</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-yellow-500 rounded-full flex-shrink-0" />
                  <span>首角度線（顎→耳中点）</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-white border-2 border-slate-400 rounded-full flex-shrink-0" />
                  <span>基準線（水平・垂直）</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{backgroundColor: '#ff00ff'}} />
                  <span>顎位置（口中点）</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{backgroundColor: '#00ffff'}} />
                  <span>耳中点</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 評価基準 */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">可動域評価基準</h3>
            <div className="space-y-2">
              {[
                { label: '硬い', range: '< 30°', color: 'bg-rose-500' },
                { label: 'やや硬い', range: '30° - 40°', color: 'bg-amber-500' },
                { label: '普通', range: '40° - 50°', color: 'bg-blue-500' },
                { label: '柔軟', range: '≥ 50°', color: 'bg-emerald-500' }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 ${item.color} rounded-full`} />
                    <span className="text-sm font-medium text-slate-700">{item.label}</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-500 font-mono">{item.range}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">左右差評価基準</h3>
            <div className="space-y-2">
              {[
                { label: '正常', range: '< 5°', color: 'bg-emerald-500' },
                { label: '軽度', range: '5° - 10°', color: 'bg-blue-500' },
                { label: '中等度', range: '10° - 15°', color: 'bg-amber-500' },
                { label: '顕著', range: '≥ 15°', color: 'bg-rose-500' }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 ${item.color} rounded-full`} />
                    <span className="text-sm font-medium text-slate-700">{item.label}</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-500 font-mono">{item.range}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 推奨事項 */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-amber-900 uppercase tracking-wide mb-3">推奨事項</h3>
              <ul className="space-y-2">
                {result.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-amber-900">
                    <span className="inline-flex items-center justify-center w-5 h-5 bg-amber-200 rounded-full text-xs font-bold flex-shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <span className="flex-1">{recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* 注意事項 */}
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-8">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <h4 className="text-xs font-semibold text-rose-900 uppercase tracking-wide mb-1">免責事項</h4>
              <p className="text-xs text-rose-800 leading-relaxed">
                本診断は簡易的なスクリーニングツールであり、医学的診断を代替するものではありません。痛み、違和感、または異常を感じる場合は、必ず医療専門家にご相談ください。
              </p>
            </div>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="grid sm:grid-cols-2 gap-4">
          <button
            onClick={onReset}
            className="group relative bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3.5 px-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            <div className="relative flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>再測定する</span>
            </div>
          </button>
          <button
            onClick={() => window.print()}
            className="group relative bg-white hover:bg-slate-50 text-slate-900 font-semibold py-3.5 px-6 rounded-xl border-2 border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md transition-all duration-200"
          >
            <div className="relative flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>結果を印刷</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
