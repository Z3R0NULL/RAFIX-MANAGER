export const STATUS_CONFIG = {
  pending: {
    label: 'Pendiente',
    color: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
    dot: 'bg-slate-400',
  },
  diagnosing: {
    label: 'Diagnóstico',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    dot: 'bg-blue-500',
  },
  waiting_approval: {
    label: 'Esperando aprobación',
    color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
    dot: 'bg-yellow-500',
  },
  in_repair: {
    label: 'En reparación',
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
    dot: 'bg-orange-500',
  },
  completed: {
    label: 'Completado',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    dot: 'bg-green-500',
  },
  irreparable: {
    label: 'Sin reparación',
    color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    dot: 'bg-red-500',
  },
  delivered: {
    label: 'Entregado',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    dot: 'bg-purple-500',
  },
}

export const BUDGET_STATUS_CONFIG = {
  pending: { label: 'Pendiente', color: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' },
  approved: { label: 'Aprobado', color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
  rejected: { label: 'Rechazado', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
}

export const DEVICE_TYPES = [
  { value: 'phone', label: 'Teléfono / Smartphone' },
  { value: 'laptop', label: 'Laptop / Notebook' },
  { value: 'desktop', label: 'PC de escritorio' },
  { value: 'gpu', label: 'GPU / Placa de video' },
  { value: 'audio', label: 'Equipo de audio' },
  { value: 'tablet', label: 'Tablet' },
  { value: 'console', label: 'Consola de juegos' },
  { value: 'other', label: 'Otro' },
]

export const ACCESSORIES_OPTIONS = [
  'Cargador',
  'Cable',
  'Funda / Cover',
  'Protector de pantalla',
  'Batería',
  'Stylus',
  'Auriculares',
  'Tarjeta de memoria',
  'SIM Card',
  'Manual / Caja',
]

export const formatDate = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const formatDateShort = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export const formatCurrency = (val) => {
  if (!val && val !== 0) return '—'
  const num = parseFloat(val)
  if (isNaN(num)) return '—'
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num)
}

// Marcas y modelos para sugerencias en el formulario
export const DEVICE_SUGGESTIONS = {
  Samsung: [
    'Galaxy S24 Ultra', 'Galaxy S24+', 'Galaxy S24', 'Galaxy S23 Ultra', 'Galaxy S23+', 'Galaxy S23',
    'Galaxy S22 Ultra', 'Galaxy S22+', 'Galaxy S22', 'Galaxy S21 Ultra', 'Galaxy S21', 'Galaxy S20',
    'Galaxy A55', 'Galaxy A54', 'Galaxy A53', 'Galaxy A35', 'Galaxy A34', 'Galaxy A33', 'Galaxy A25', 'Galaxy A24', 'Galaxy A15', 'Galaxy A14',
    'Galaxy Note 20 Ultra', 'Galaxy Note 20', 'Galaxy Note 10+', 'Galaxy Note 10', 'Galaxy Note 9',
    'Galaxy M55', 'Galaxy M54', 'Galaxy M34', 'Galaxy M14', 'Galaxy Z Fold 5', 'Galaxy Z Flip 5', 'Galaxy Z Flip 4',
  ],
  Apple: [
    'iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15 Plus', 'iPhone 15',
    'iPhone 14 Pro Max', 'iPhone 14 Pro', 'iPhone 14 Plus', 'iPhone 14',
    'iPhone 13 Pro Max', 'iPhone 13 Pro', 'iPhone 13', 'iPhone 13 Mini',
    'iPhone 12 Pro Max', 'iPhone 12 Pro', 'iPhone 12', 'iPhone 12 Mini',
    'iPhone 11 Pro Max', 'iPhone 11 Pro', 'iPhone 11',
    'iPhone XS Max', 'iPhone XS', 'iPhone XR', 'iPhone X',
    'iPhone SE (3ra gen)', 'iPhone SE (2da gen)', 'iPhone 8 Plus', 'iPhone 8', 'iPhone 7 Plus', 'iPhone 7',
    'iPad Pro 12.9" M2', 'iPad Pro 11" M2', 'iPad Air 5ta gen', 'iPad Mini 6ta gen', 'iPad 10ma gen',
    'MacBook Pro 16" M3', 'MacBook Pro 14" M3', 'MacBook Air 15" M2', 'MacBook Air 13" M2',
  ],
  Motorola: [
    'Edge 50 Ultra', 'Edge 50 Pro', 'Edge 40 Pro', 'Edge 40', 'Edge 30 Ultra', 'Edge 30 Pro',
    'Moto G85', 'Moto G84', 'Moto G73', 'Moto G54', 'Moto G53', 'Moto G34', 'Moto G24', 'Moto G14',
    'Moto G52', 'Moto G42', 'Moto G32', 'Moto G22', 'Moto G31',
    'Razr 40 Ultra', 'Razr 40', 'Razr+ 2023',
  ],
  Xiaomi: [
    'Redmi Note 13 Pro+', 'Redmi Note 13 Pro', 'Redmi Note 13', 'Redmi Note 12 Pro+',
    'Redmi Note 12 Pro', 'Redmi Note 12', 'Redmi Note 11 Pro', 'Redmi Note 11',
    'Redmi 13C', 'Redmi 12C', 'Redmi 12', 'Redmi 10C', 'Redmi A3', 'Redmi A2',
    'Xiaomi 14 Ultra', 'Xiaomi 14 Pro', 'Xiaomi 14', 'Xiaomi 13T Pro', 'Xiaomi 13T', 'Xiaomi 13 Pro', 'Xiaomi 13',
    'POCO X6 Pro', 'POCO X6', 'POCO X5 Pro', 'POCO X5', 'POCO M6 Pro', 'POCO M5', 'POCO F5',
  ],
  LG: [
    'Wing', 'Velvet 5G', 'V60 ThinQ', 'V50 ThinQ', 'V40 ThinQ',
    'G8 ThinQ', 'G7 ThinQ', 'G6', 'G5', 'G4',
    'K62', 'K52', 'K42', 'K41S', 'Q60', 'Stylo 6', 'Stylo 5',
  ],
  Huawei: [
    'P60 Pro', 'P60', 'P50 Pro', 'P50', 'P40 Pro', 'P40', 'P30 Pro', 'P30', 'P20 Pro',
    'Mate 60 Pro', 'Mate 50 Pro', 'Mate 40 Pro', 'Mate 30 Pro', 'Mate 20 Pro',
    'Nova 12 Ultra', 'Nova 11 Ultra', 'Nova 10 Pro', 'Nova 9', 'Nova 8',
    'Y9s', 'Y8s', 'Y7a', 'Y6p',
  ],
  HP: [
    'Pavilion 15', 'Pavilion 14', 'Pavilion x360 15', 'Envy x360 15', 'Envy x360 13',
    'Spectre x360 16', 'Spectre x360 14', 'EliteBook 840 G10', 'EliteBook 850 G9',
    'ProBook 450 G10', 'ProBook 440 G10', 'Victus 15', 'Victus 16', 'OMEN 16', 'OMEN 17',
  ],
  Dell: [
    'XPS 15 9530', 'XPS 13 9340', 'XPS 15 Plus', 'Inspiron 15 3520', 'Inspiron 15 5530',
    'Inspiron 14 5430', 'Vostro 15 3530', 'Vostro 14 3420', 'Latitude 5540', 'Latitude 5440',
    'Alienware m18 R1', 'Alienware m16 R1', 'G15 5530', 'G16 7630',
  ],
  Lenovo: [
    'ThinkPad X1 Carbon Gen 11', 'ThinkPad X1 Yoga Gen 8', 'ThinkPad T14s Gen 4', 'ThinkPad T14 Gen 4',
    'IdeaPad 5 15', 'IdeaPad 3 15', 'IdeaPad Gaming 3', 'IdeaPad Gaming 5',
    'Yoga 7i 16"', 'Yoga 9i 14"', 'Legion 5 Gen 8', 'Legion 5 Pro Gen 8', 'Legion 7 Gen 8', 'Legion Pro 5',
  ],
  ASUS: [
    'ROG Strix G16 2024', 'ROG Strix G15', 'ROG Zephyrus G14 2024', 'ROG Zephyrus G16 2024',
    'TUF Gaming A15 2024', 'TUF Gaming A17', 'TUF Gaming F15', 'VivoBook 15', 'VivoBook 14',
    'ZenBook 14 OLED', 'ZenBook 15 OLED', 'ProArt Studiobook 16', 'ExpertBook B9',
  ],
  Acer: [
    'Nitro 5 AN515', 'Nitro 7 AN715', 'Predator Helios 300', 'Predator Helios 16', 'Predator Triton 500',
    'Aspire 5 A515', 'Aspire 3 A315', 'Swift 3 SF314', 'Swift 5 SF514', 'Swift X SFX14',
    'Spin 5 SP514', 'Spin 3 SP314',
  ],
  Sony: [
    'Xperia 1 VI', 'Xperia 1 V', 'Xperia 5 V', 'Xperia 5 IV', 'Xperia 10 VI', 'Xperia 10 V',
    'PlayStation 5', 'PlayStation 5 Slim', 'PlayStation 4 Pro', 'PlayStation 4',
  ],
  Nintendo: [
    'Nintendo Switch OLED', 'Nintendo Switch', 'Nintendo Switch Lite',
  ],
  Microsoft: [
    'Xbox Series X', 'Xbox Series S', 'Xbox One X', 'Xbox One S',
    'Surface Pro 10', 'Surface Pro 9', 'Surface Laptop 6', 'Surface Laptop 5', 'Surface Laptop Studio 2',
  ],
}

export const BRAND_LIST = Object.keys(DEVICE_SUGGESTIONS)
