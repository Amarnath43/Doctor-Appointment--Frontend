import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';

export default function ImageCropper({ imageSrc, outputWidth = 300,
  outputHeight = 300,onCropComplete, onCancel }) {
    const aspect = outputWidth / outputHeight;
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const handleCropComplete = useCallback((_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleDone = useCallback(async () => {
  try {
    const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels, outputWidth, outputHeight);
    onCropComplete(croppedBlob);
  } catch (e) {
    console.error('Cropping failed:', e);
  }
}, [imageSrc, croppedAreaPixels, outputWidth, outputHeight, onCropComplete]);


  return (
    <div className="relative w-full h-[400px] bg-black">
      <Cropper
        image={imageSrc}
        crop={crop}
        zoom={zoom}
        aspect={aspect}
        onCropChange={setCrop}
        onZoomChange={setZoom}
        onCropComplete={handleCropComplete}
      />
      <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-4 bg-white/80 p-4 rounded-xl">
        {/* Native Slider */}
        <input
          type="range"
          min="1"
          max="3"
          step="0.1"
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="w-full"
        />

        {/* Action Buttons */}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDone}
            className="px-4 py-2 rounded-md bg-gray-800 text-white hover:bg-gray-900 text-sm"
          >
            Crop
          </button>
        </div>
      </div>
    </div>
  );
}

function getCroppedImg(imageSrc, crop, outputWidth = 300, outputHeight = 300) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = imageSrc;
    image.crossOrigin = 'anonymous';

    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = outputWidth;
      canvas.height = outputHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      ctx.drawImage(
        image,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        0,
        0,
        outputWidth,
        outputHeight
      );

      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob'));
        }
      }, 'image/jpeg');
    };

    image.onerror = () => reject(new Error('Failed to load image'));
  });
}

