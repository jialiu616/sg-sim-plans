import { useEffect, useRef } from 'react'

export function useBodyScrollLock(isLocked: boolean) {
  const scrollY = useRef(0)

  useEffect(() => {
    if (isLocked) {
      scrollY.current = window.scrollY
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY.current}px`
      document.body.style.left = '0'
      document.body.style.right = '0'
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.left = ''
      document.body.style.right = ''
      document.body.style.overflow = ''
      window.scrollTo(0, scrollY.current)
    }

    return () => {
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.left = ''
      document.body.style.right = ''
      document.body.style.overflow = ''
      window.scrollTo(0, scrollY.current)
    }
  }, [isLocked])
}
