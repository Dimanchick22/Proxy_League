import { useLanguageStore } from '../stores/languageStore'
import { translations } from '../i18n/locales'

export const useTranslation = () => {
  const { language } = useLanguageStore()

  const t = (key) => {
    return translations[language]?.[key] || translations['en']?.[key] || key
  }

  return { t, language }
}
