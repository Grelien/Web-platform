import { useEffect, useRef } from 'react';

interface PerformanceMetrics {
  renderCount: number;
  renderTime: number;
  lastRenderDuration: number;
}

export function usePerformanceMonitor(componentName: string, enabled: boolean = false) {
  const renderCountRef = useRef(0);
  const renderStartRef = useRef<number>(0);
  const metricsRef = useRef<PerformanceMetrics>({
    renderCount: 0,
    renderTime: 0,
    lastRenderDuration: 0
  });

  useEffect(() => {
    if (!enabled) return;

    renderStartRef.current = performance.now();
    renderCountRef.current += 1;

    return () => {
      const renderEndTime = performance.now();
      const renderDuration = renderEndTime - renderStartRef.current;
      
      metricsRef.current = {
        renderCount: renderCountRef.current,
        renderTime: metricsRef.current.renderTime + renderDuration,
        lastRenderDuration: renderDuration
      };

      // Log performance metrics in development
      if (import.meta.env.DEV && renderDuration > 16) {
        console.warn(
          `[Performance] ${componentName} render took ${renderDuration.toFixed(2)}ms (Target: <16ms)`
        );
      }

      // Log summary every 10 renders
      if (renderCountRef.current % 10 === 0) {
        const avgRenderTime = metricsRef.current.renderTime / renderCountRef.current;
        console.log(
          `[Performance] ${componentName} - ` +
          `Renders: ${renderCountRef.current}, ` +
          `Avg: ${avgRenderTime.toFixed(2)}ms, ` +
          `Last: ${renderDuration.toFixed(2)}ms`
        );
      }
    };
  });

  return metricsRef.current;
}

export function useRenderCount(componentName: string) {
  const renderCountRef = useRef(0);
  
  useEffect(() => {
    renderCountRef.current += 1;
    
    if (import.meta.env.DEV) {
      console.log(`[Render] ${componentName} rendered ${renderCountRef.current} times`);
    }
  });

  return renderCountRef.current;
}

// Performance budget checker
export function checkPerformanceBudget() {
  if (typeof window !== 'undefined' && 'performance' in window) {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    const metrics = {
      fcp: 0, // First Contentful Paint
      lcp: 0, // Largest Contentful Paint
      fid: 0, // First Input Delay
      cls: 0, // Cumulative Layout Shift
      ttfb: navigation.responseStart - navigation.requestStart
    };

    // Performance budgets (in ms)
    const budgets = {
      fcp: 1500,
      lcp: 2500,
      fid: 100,
      cls: 0.1,
      ttfb: 200
    };

    // Check budgets
    Object.entries(budgets).forEach(([metric, budget]) => {
      const value = metrics[metric as keyof typeof metrics];
      if (value > budget) {
        console.warn(
          `[Performance Budget] ${metric.toUpperCase()} exceeded: ${value}ms > ${budget}ms`
        );
      }
    });

    return metrics;
  }
  
  return null;
}
