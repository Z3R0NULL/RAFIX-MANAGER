/**
 * ImageUploader — Uploader de fotos con compresión a base64.
 * Comprime cada imagen a máx 1200px y calidad JPEG 0.75 antes de guardar.
 * Props:
 *  - images: string[]  (array de data URLs base64)
 *  - onChange(images): callback con el nuevo array
 *  - label: string
 *  - maxImages: number (default 6)
 */
import React, { useRef, useState } from 'react'
import { Camera, X, ZoomIn } from 'lucide-react'

const MAX_SIZE = 1200
const QUALITY = 0.75

function compressImage(file) {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      if (width > MAX_SIZE || height > MAX_SIZE) {
        if (width > height) { height = Math.round((height * MAX_SIZE) / width); width = MAX_SIZE }
        else { width = Math.round((width * MAX_SIZE) / height); height = MAX_SIZE }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d').drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', QUALITY))
    }
    img.src = url
  })
}

export default function ImageUploader({ images = [], onChange, label, maxImages = 6 }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [lightbox, setLightbox] = useState(null) // index o null
  const [processing, setProcessing] = useState(false)

  const handleFiles = async (files) => {
    const remaining = maxImages - images.length
    if (remaining <= 0) return
    setProcessing(true)
    const toProcess = Array.from(files).slice(0, remaining)
    const compressed = await Promise.all(toProcess.map(compressImage))
    onChange([...images, ...compressed])
    setProcessing(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  const removeImage = (i) => {
    const next = images.filter((_, idx) => idx !== i)
    onChange(next)
    if (lightbox === i) setLightbox(null)
  }

  const canAdd = images.length < maxImages

  return (
    <div>
      {label && (
        <p className="text-xs font-medium text-slate-400 mb-2">{label}</p>
      )}

      <div className="grid grid-cols-3 gap-2">
        {/* Thumbnails */}
        {images.map((src, i) => (
          <div key={i} className="relative group aspect-square rounded-lg overflow-hidden bg-slate-800 border border-slate-700">
            <img src={src} alt={`foto-${i + 1}`} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/50 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
              <button
                type="button"
                onClick={() => setLightbox(i)}
                className="w-7 h-7 rounded-full bg-slate-800/80 flex items-center justify-center text-white hover:bg-indigo-600 transition-colors"
              >
                <ZoomIn size={13} />
              </button>
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="w-7 h-7 rounded-full bg-slate-800/80 flex items-center justify-center text-white hover:bg-red-600 transition-colors"
              >
                <X size={13} />
              </button>
            </div>
          </div>
        ))}

        {/* Add button */}
        {canAdd && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            disabled={processing}
            className={`aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1.5 transition-all ${
              dragging
                ? 'border-indigo-500 bg-indigo-900/20'
                : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/50'
            } ${processing ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
          >
            <Camera size={18} className={dragging ? 'text-indigo-400' : 'text-slate-500'} />
            <span className="text-xs text-slate-500">
              {processing ? 'Procesando...' : images.length === 0 ? 'Agregar foto' : '+'}
            </span>
          </button>
        )}
      </div>

      {images.length > 0 && (
        <p className="text-xs text-slate-600 mt-1.5">{images.length} / {maxImages} fotos</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4"
          onClick={() => setLightbox(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={images[lightbox]}
              alt={`foto-${lightbox + 1}`}
              className="w-full h-full object-contain rounded-xl"
            />
            <button
              type="button"
              onClick={() => setLightbox(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-900/80 flex items-center justify-center text-white hover:bg-slate-800 transition-colors"
            >
              <X size={16} />
            </button>
            {/* Prev / Next */}
            {images.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setLightbox(i)}
                    className={`w-2 h-2 rounded-full transition-colors ${i === lightbox ? 'bg-white' : 'bg-slate-600 hover:bg-slate-400'}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
