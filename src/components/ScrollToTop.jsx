import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  // Extracts pathname property (e.g., "/privacy", "/about")
  const { pathname } = useLocation();

  // Automatically triggers whenever the pathname changes
  useEffect(() => {
    // "instant" prevents a weird visual jumping effect
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  // This component doesn't render any UI, it just handles logic
  return null; 
}