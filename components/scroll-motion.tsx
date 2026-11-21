"use client";

import { useEffect } from "react";

export function ScrollMotion() {
  useEffect(() => {
    const targets = Array.from(document.querySelectorAll<HTMLElement>(".site-header, main > section, .site-footer"));
    targets.forEach((target, index) => { if (index > 1) target.dataset.reveal = ""; });
    document.documentElement.classList.add("motion-ready");
    const observer = new IntersectionObserver(entries => entries.forEach(entry => entry.target.classList.toggle("is-visible", entry.isIntersecting)), { threshold: 0.08, rootMargin: "0px 0px -32px 0px" });
    targets.filter(target => target.hasAttribute("data-reveal")).forEach(target => observer.observe(target));
    return () => { observer.disconnect(); document.documentElement.classList.remove("motion-ready"); };
  }, []);
  return null;
}
