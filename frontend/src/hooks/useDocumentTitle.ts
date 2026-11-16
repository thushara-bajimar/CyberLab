import { useEffect } from 'react'

const BASE_TITLE = 'CyberLab - Learn Cybersecurity by Doing'

/** Gives each page its own browser-tab title, which screen readers announce when the page changes. */
export function useDocumentTitle(title: string | null | undefined) {
  useEffect(() => {
    document.title = title ? `${title} · CyberLab` : BASE_TITLE
  }, [title])
}
