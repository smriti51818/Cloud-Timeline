export const themeConfigs = {
  calm: {
    primary: '#4169E1', // Royal Blue
    secondary: '#87CEEB', // Sky Blue
    background: 'linear-gradient(135deg, #E0F6FF 0%, #B3E5FC 100%)',
    accent: '#FFFFFF',
    cardBg: 'rgba(255, 255, 255, 0.8)',
    textColor: '#1e293b',
    emotionColor: '#3b82f6',
  },
  vibrant: {
    primary: '#FFD700', // Gold
    secondary: '#FFA500', // Orange
    background: 'linear-gradient(135deg, #FFF8E1 0%, #FFECB3 100%)',
    accent: '#000000',
    cardBg: 'rgba(255, 255, 255, 0.9)',
    textColor: '#92400e',
    emotionColor: '#f59e0b',
  },
  retro: {
    primary: '#8B4513', // Saddle Brown
    secondary: '#D2691E', // Chocolate
    background: 'linear-gradient(135deg, #F5F5DC 0%, #DEB887 100%)',
    accent: '#FFFFFF',
    cardBg: 'rgba(255, 255, 255, 0.85)',
    textColor: '#5d4037',
    emotionColor: '#8d6e63',
  },
  minimal: {
    primary: '#2F4F4F', // Dark Slate Gray
    secondary: '#708090', // Slate Gray
    background: 'linear-gradient(135deg, #F8F8FF 0%, #E6E6FA 100%)',
    accent: '#000000',
    cardBg: 'rgba(255, 255, 255, 0.95)',
    textColor: '#374151',
    emotionColor: '#6b7280',
  },
  dreamy: {
    primary: '#9333ea', // Purple
    secondary: '#ec4899', // Pink
    background: 'linear-gradient(135deg, #f3e8ff 0%, #fce7f3 100%)',
    accent: '#ffffff',
    cardBg: 'rgba(255, 255, 255, 0.9)',
    textColor: '#6b21a8',
    emotionColor: '#c084fc',
  },
  sunset: {
    primary: '#f97316', // Orange
    secondary: '#dc2626', // Red
    background: 'linear-gradient(135deg, #fed7aa 0%, #fecaca 100%)',
    accent: '#ffffff',
    cardBg: 'rgba(255, 255, 255, 0.85)',
    textColor: '#9a3412',
    emotionColor: '#fb923c',
  },
  ocean: {
    primary: '#0891b2', // Cyan
    secondary: '#0e7490', // Sky Blue
    background: 'linear-gradient(135deg, #cffafe 0%, #a5f3fc 100%)',
    accent: '#ffffff',
    cardBg: 'rgba(255, 255, 255, 0.9)',
    textColor: '#164e63',
    emotionColor: '#06b6d4',
  },
  forest: {
    primary: '#16a34a', // Green
    secondary: '#15803d', // Dark Green
    background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
    accent: '#ffffff',
    cardBg: 'rgba(255, 255, 255, 0.9)',
    textColor: '#14532d',
    emotionColor: '#22c55e',
  },
}

export function getMoodBasedTheme(avgSentiment: string) {
  switch (avgSentiment) {
    case 'positive':
      return themeConfigs.vibrant
    case 'negative':
      return themeConfigs.calm
    default:
      return themeConfigs.minimal
  }
}

export function applyDynamicBackground(sentiment: string) {
  const theme = getMoodBasedTheme(sentiment)
  document.documentElement.style.setProperty('--dynamic-bg', theme.background)
  document.documentElement.style.setProperty('--dynamic-primary', theme.primary)
  document.documentElement.style.setProperty('--dynamic-secondary', theme.secondary)
  document.documentElement.style.setProperty('--dynamic-card-bg', theme.cardBg)
  document.documentElement.style.setProperty('--dynamic-text-color', theme.textColor)
  document.documentElement.style.setProperty('--dynamic-emotion-color', theme.emotionColor)
}

export function applyTheme(themeKey: keyof typeof themeConfigs) {
  const theme = themeConfigs[themeKey]
  document.documentElement.style.setProperty('--dynamic-bg', theme.background)
  document.documentElement.style.setProperty('--dynamic-primary', theme.primary)
  document.documentElement.style.setProperty('--dynamic-secondary', theme.secondary)
  document.documentElement.style.setProperty('--dynamic-card-bg', theme.cardBg)
  document.documentElement.style.setProperty('--dynamic-text-color', theme.textColor)
  document.documentElement.style.setProperty('--dynamic-emotion-color', theme.emotionColor)

  // Apply background to body
  document.body.style.background = theme.background
  document.body.style.color = theme.textColor
}
