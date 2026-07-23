import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    // Always reset body overflow before navigating — prevents mobile menu
    // leaving overflow:hidden locked on the new page
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    window.scrollTo({ top: 0, behavior: 'instant' });
    // Also reset the dashboard <main> scroll container
    const mainScroll = document.getElementById('main-scroll');
    if (mainScroll) mainScroll.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}
