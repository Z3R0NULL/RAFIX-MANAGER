/**
 * PatternInput — Selector de patrón de desbloqueo estilo Android (grilla 3×3).
 *
 * Props:
 *  - value: number[]  (ej: [1,2,3,6,9] — índices 1-9 en orden de trazado)
 *  - onChange(pattern): callback con el nuevo array
 *  - readOnly: boolean — muestra el patrón sin interacción (para vista detalle)
 */
import React, { useRef, useState, useEffect, useCallback } from 'react'
import { RotateCcw } from 'lucide-react'

// Posiciones de los 9 puntos en la grilla (en %)
const DOT_POSITIONS = [
  { x: 16.5, y: 16.5 }, // 1
  { x: 50,   y: 16.5 }, // 2
  { x: 83.5, y: 16.5 }, // 3
  { x: 16.5, y: 50   }, // 4
  { x: 50,   y: 50   }, // 5
  { x: 83.5, y: 50   }, // 6
  { x: 16.5, y: 83.5 }, // 7
  { x: 50,   y: 83.5 }, // 8
  { x: 83.5, y: 83.5 }, // 9
]

function getCenter(idx) {
  return DOT_POSITIONS[idx - 1]
}

export default function PatternInput({ value = [], onChange, readOnly = false }) {
  const svgRef = useRef(null)
  const [drawing, setDrawing] = useState(false)
  const [cursor, setCursor] = useState(null) // {x,y} en %
  const [locked, setLocked] = useState(false) // true cuando hay patrón y no se ha borrado

  const pattern = value || []
  const hasPattern = pattern.length > 0

  // Convierte coordenadas del evento a % dentro del SVG
  const toPercent = useCallback((e) => {
    const svg = svgRef.current
    if (!svg) return null
    const rect = svg.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return {
      x: ((clientX - rect.left) / rect.width) * 100,
      y: ((clientY - rect.top) / rect.height) * 100,
    }
  }, [])

  // Detecta qué punto (1-9) está bajo las coordenadas dadas (radio 12%)
  const hitTest = useCallback((px, py) => {
    for (let i = 0; i < 9; i++) {
      const { x, y } = DOT_POSITIONS[i]
      const dist = Math.sqrt((px - x) ** 2 + (py - y) ** 2)
      if (dist < 12) return i + 1
    }
    return null
  }, [])

  const handleStart = useCallback((e) => {
    if (readOnly || locked) return
    e.preventDefault()
    const pos = toPercent(e)
    if (!pos) return
    const hit = hitTest(pos.x, pos.y)
    if (hit) {
      onChange([hit])
      setDrawing(true)
      setCursor(pos)
    }
  }, [readOnly, locked, toPercent, hitTest, onChange])

  const handleMove = useCallback((e) => {
    if (!drawing || readOnly) return
    e.preventDefault()
    const pos = toPercent(e)
    if (!pos) return
    setCursor(pos)
    const hit = hitTest(pos.x, pos.y)
    if (hit && !pattern.includes(hit)) {
      onChange([...pattern, hit])
    }
  }, [drawing, readOnly, toPercent, hitTest, pattern, onChange])

  const handleEnd = useCallback(() => {
    setDrawing(false)
    setCursor(null)
    // Una vez terminado el trazo, bloquear para que no se pueda redibujar sin borrar
    setLocked(true)
  }, [])

  useEffect(() => {
    if (!drawing) return
    window.addEventListener('mouseup', handleEnd)
    window.addEventListener('touchend', handleEnd)
    return () => {
      window.removeEventListener('mouseup', handleEnd)
      window.removeEventListener('touchend', handleEnd)
    }
  }, [drawing, handleEnd])

  const reset = () => {
    onChange([])
    setDrawing(false)
    setCursor(null)
    setLocked(false)
  }

  // Colores
  const dotActive   = '#6366f1' // indigo-500
  const dotInactive = '#334155' // slate-700
  const lineColor   = '#6366f180'

  // Construir los segmentos de línea entre puntos del patrón
  const segments = []
  for (let i = 0; i < pattern.length - 1; i++) {
    const a = getCenter(pattern[i])
    const b = getCenter(pattern[i + 1])
    segments.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y })
  }
  // Línea activa hasta el cursor
  if (drawing && cursor && pattern.length > 0) {
    const last = getCenter(pattern[pattern.length - 1])
    segments.push({ x1: last.x, y1: last.y, x2: cursor.x, y2: cursor.y, active: true })
  }

  return (
    <div className="flex flex-col items-start gap-3">
      <div className="flex items-center gap-3">
        <div
          className={`relative w-36 h-36 rounded-xl bg-slate-800 border ${
            readOnly ? 'border-slate-700' : locked ? 'border-slate-600' : hasPattern ? 'border-indigo-500/50' : 'border-slate-700'
          } ${!readOnly ? (locked ? 'cursor-not-allowed select-none touch-none' : 'cursor-crosshair select-none touch-none') : ''}`}
        >
          <svg
            ref={svgRef}
            viewBox="0 0 100 100"
            className="w-full h-full"
            onMouseDown={handleStart}
            onMouseMove={handleMove}
            onTouchStart={handleStart}
            onTouchMove={handleMove}
          >
            {/* Líneas del patrón */}
            {segments.map((seg, i) => (
              <line
                key={i}
                x1={seg.x1} y1={seg.y1}
                x2={seg.x2} y2={seg.y2}
                stroke={seg.active ? dotActive + '99' : lineColor}
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            ))}

            {/* Puntos */}
            {DOT_POSITIONS.map((pos, i) => {
              const num = i + 1
              const active = pattern.includes(num)
              const stepIndex = pattern.indexOf(num)
              const isFirst = stepIndex === 0
              const isLast  = stepIndex === pattern.length - 1 && pattern.length > 1
              return (
                <g key={num}>
                  {/* Halo activo */}
                  {active && (
                    <circle cx={pos.x} cy={pos.y} r="9" fill={dotActive} opacity="0.15" />
                  )}
                  {/* Anillo de inicio */}
                  {isFirst && (
                    <circle
                      cx={pos.x} cy={pos.y} r="7.5"
                      fill="none"
                      stroke={dotActive}
                      strokeWidth="1.5"
                      opacity="0.7"
                    />
                  )}
                  {/* Punto principal */}
                  <circle
                    cx={pos.x} cy={pos.y} r="5"
                    fill={active ? dotActive : dotInactive}
                    className="transition-colors duration-100"
                  />
                  {/* Número de orden (edición) */}
                  {active && !readOnly && (
                    <text
                      x={pos.x} y={pos.y + 0.8}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="4.5"
                      fill="white"
                      fontWeight="700"
                      style={{ userSelect: 'none', pointerEvents: 'none' }}
                    >
                      {stepIndex + 1}
                    </text>
                  )}
                  {/* Indicador INICIO en readOnly */}
                  {isFirst && readOnly && (
                    <text
                      x={pos.x} y={pos.y - 11}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="3.8"
                      fill={dotActive}
                      fontWeight="700"
                      style={{ userSelect: 'none', pointerEvents: 'none' }}
                    >
                      INICIO
                    </text>
                  )}
                  {/* Indicador FIN en readOnly */}
                  {isLast && readOnly && (
                    <text
                      x={pos.x} y={pos.y + 13}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="3.8"
                      fill="#94a3b8"
                      fontWeight="600"
                      style={{ userSelect: 'none', pointerEvents: 'none' }}
                    >
                      FIN
                    </text>
                  )}
                </g>
              )
            })}
          </svg>
        </div>

        <div className="flex flex-col gap-2">
          {!readOnly && (
            <button
              type="button"
              onClick={reset}
              disabled={!hasPattern}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-xs text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <RotateCcw size={11} />
              Borrar
            </button>
          )}
          <div className="text-xs text-slate-500 leading-relaxed max-w-[120px]">
            {readOnly
              ? hasPattern
                ? <span className="text-indigo-400 font-medium">{pattern.length} puntos registrados</span>
                : <span className="text-slate-600">Sin patrón</span>
              : hasPattern
                ? <span className="text-indigo-400">{pattern.length} punto{pattern.length !== 1 ? 's' : ''}</span>
                : <span>Toca y arrastrá para dibujar el patrón</span>
            }
          </div>
        </div>
      </div>
    </div>
  )
}
