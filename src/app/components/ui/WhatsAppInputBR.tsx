'use client'

import { useMemo } from 'react'

/** Formata dígitos BR: 11XXXXXXXXX → (11) XXXXX-XXXX.
 * Aceita até 11 dígitos (DDD 2 + número 8 ou 9). Descarta não-dígitos.
 */
export function formatBRPhone(input: string): string {
  const d = input.replace(/\D/g, '').slice(0, 11)
  if (d.length === 0) return ''
  if (d.length <= 2) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

type InputStyle = {
  background?: string
  borderColor?: string
  color?: string
  placeholderColor?: string
}

type Props = {
  value: string
  onChange: (formatted: string) => void
  placeholder?: string
  style?: InputStyle
  id?: string
  disabled?: boolean
}

/** Input WhatsApp padrão brasileiro: bandeira 🇧🇷 + "+55" (fixo) + número com máscara (XX) XXXXX-XXXX. */
export default function WhatsAppInputBR({
  value,
  onChange,
  placeholder = '(11) 99999-9999',
  style,
  id,
  disabled,
}: Props) {
  const formatted = useMemo(() => formatBRPhone(value), [value])

  return (
    <div
      className="flex items-stretch rounded-xl border overflow-hidden transition-colors focus-within:border-[#635bff]"
      style={{
        background: style?.background,
        borderColor: style?.borderColor,
      }}
    >
      <div
        className="flex items-center gap-1.5 px-3 shrink-0 border-r select-none"
        style={{ borderColor: style?.borderColor, color: style?.color }}
        aria-hidden
      >
        <span className="text-base leading-none">🇧🇷</span>
        <span className="text-[13px] font-medium">+55</span>
      </div>
      <input
        id={id}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        value={formatted}
        onChange={(e) => onChange(formatBRPhone(e.target.value))}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 min-w-0 px-3 py-2.5 text-[13px] bg-transparent outline-none disabled:opacity-50"
        style={{ color: style?.color }}
      />
    </div>
  )
}
