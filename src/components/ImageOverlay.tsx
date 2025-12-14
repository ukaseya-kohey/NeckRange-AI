import React, { useState } from 'react';

interface ImageOverlayProps {
  baseImage: string;
  overlayImage: string;
  baseLabel: string;
  overlayLabel: string;
  title: string;
}

export const ImageOverlay: React.FC<ImageOverlayProps> = ({
  baseImage,
  overlayImage,
  baseLabel,
  overlayLabel,
  title,
}) => {
  const [opacity, setOpacity] = useState(0.5);
  const [showOverlay, setShowOverlay] = useState(true);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-bold mb-4 text-gray-800 text-center">
        {title}
      </h3>

      {/* 画像重ね合わせ表示 */}
      <div className="relative w-full max-w-md mx-auto mb-6 bg-gray-100 rounded-lg overflow-hidden">
        <div className="relative aspect-[3/4]">
          {/* ベース画像（正面） */}
          <img
            src={baseImage}
            alt={baseLabel}
            className="absolute inset-0 w-full h-full object-contain"
          />
          
          {/* オーバーレイ画像（側屈） */}
          {showOverlay && (
            <img
              src={overlayImage}
              alt={overlayLabel}
              className="absolute inset-0 w-full h-full object-contain"
              style={{ opacity }}
            />
          )}
        </div>

        {/* 画像ラベル */}
        <div className="absolute top-2 left-2 right-2 flex justify-between">
          <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
            {baseLabel}
          </span>
          {showOverlay && (
            <span 
              className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-semibold"
              style={{ opacity }}
            >
              {overlayLabel}
            </span>
          )}
        </div>
      </div>

      {/* コントロール */}
      <div className="space-y-4">
        {/* オーバーレイ表示/非表示トグル */}
        <div className="flex items-center justify-center space-x-3">
          <button
            onClick={() => setShowOverlay(!showOverlay)}
            className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
              showOverlay
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
            }`}
          >
            {showOverlay ? '✓ 重ね合わせ表示中' : '重ね合わせ表示'}
          </button>
        </div>

        {/* 透明度スライダー */}
        {showOverlay && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-semibold text-gray-700">
                {overlayLabel}の透明度
              </label>
              <span className="text-sm font-mono text-gray-600">
                {Math.round(opacity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={opacity * 100}
              onChange={(e) => setOpacity(parseInt(e.target.value) / 100)}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${opacity * 100}%, #e5e7eb ${opacity * 100}%, #e5e7eb 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>透明（0%）</span>
              <span>不透明（100%）</span>
            </div>
          </div>
        )}

        {/* 説明 */}
        <div className="bg-blue-50 border-l-4 border-blue-600 p-3 rounded">
          <p className="text-sm text-gray-700">
            💡 <strong>スライダー</strong>で透明度を調整して、首の傾きの違いを確認できます
          </p>
        </div>
      </div>
    </div>
  );
};
