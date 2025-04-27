/**
 * Metabase detection logic
 * Provides functionality to detect Metabase instances in the browser
 */

import { DetectionResult } from '../../../types/adapters';
import { getSelectors } from './selectors';

/**
 * Checks if the current page contains Metabase-specific DOM elements
 * @returns Promise resolving to a detection result
 */
export async function detectMetabase(): Promise<DetectionResult> {
  try {
    const selectors = getSelectors();
    const url = window.location.href;
    const urlMatches = doesUrlMatchMetabase(url);
    
    if (!urlMatches) {
      return { detected: false, confidence: 0 };
    }
    
    // Default CSS selectors in case none are defined
    const cssSelectors = selectors.detection?.css || [
      '.Logo', 
      '.QueryBuilder', 
      '.GuiBuilder-data'
    ];
    
    // Check for Metabase-specific DOM elements
    const detectionResults = await Promise.all([
      checkMetabaseElement(cssSelectors[0] || '.Logo'), // Metabase logo
      checkMetabaseElement(cssSelectors[1] || '.QueryBuilder'), // Query builder
      checkMetabaseElement(cssSelectors[2] || '.GuiBuilder-data') // Database selector
    ]);
    
    // Count how many elements were found
    const detectedElementsCount = detectionResults.filter(Boolean).length;
    
    // Calculate confidence based on number of detected elements
    const confidence = calculateConfidence(detectedElementsCount, urlMatches);
    
    return {
      detected: confidence > 40,
      confidence,
      details: {
        urlPattern: url,
        elements: detectionResults
          .map((found, index) => (found ? cssSelectors[index] : null))
          .filter(Boolean) as string[]
      }
    };
  } catch (error) {
    console.error('Error detecting Metabase:', error);
    return { detected: false, confidence: 0 };
  }
}

/**
 * Checks if a specific Metabase DOM element exists
 * @param selector CSS selector to check
 * @returns Promise resolving to true if element found, false otherwise
 */
async function checkMetabaseElement(selector: string): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      const element = document.querySelector(selector);
      resolve(!!element);
    });
  });
}

/**
 * Check if the URL matches common Metabase patterns
 * @param url URL to check
 * @returns True if URL matches Metabase patterns
 */
function doesUrlMatchMetabase(url: string): boolean {
  const metabaseUrlPatterns = [
    /\/question\//i,        // Question page
    /\/dashboard\//i,       // Dashboard page
    /\/browse\//i,          // Browse data page
    /\/model\//i,           // Models page
    /\/admin\/databases/i,  // Database admin page
    /\/metabase\//i         // Instance with metabase in URL
  ];
  
  return metabaseUrlPatterns.some(pattern => pattern.test(url));
}

/**
 * Calculate detection confidence based on elements found and URL match
 * @param detectedElementsCount Number of Metabase elements found
 * @param urlMatches Whether the URL matches Metabase patterns
 * @returns Confidence score (0-100)
 */
function calculateConfidence(detectedElementsCount: number, urlMatches: boolean): number {
  // Base confidence from URL matching
  const urlConfidence = urlMatches ? 30 : 0;
  
  // Additional confidence from element detection (up to 70%)
  const elementConfidence = (detectedElementsCount / 3) * 70;
  
  return Math.min(urlConfidence + elementConfidence, 100);
}

/**
 * Attempts to extract Metabase version from the page
 * @returns Promise resolving to version string or null if not found
 */
export async function detectMetabaseVersion(): Promise<string | null> {
  try {
    // Check for version in the page source
    const pageSource = document.documentElement.outerHTML;
    const versionMatch = pageSource.match(/Metabase\s+v?(\d+\.\d+\.\d+)/i);
    
    if (versionMatch && versionMatch[1]) {
      return versionMatch[1];
    }
    
    // Try to find version in footer
    const footerElement = document.querySelector('.Footer-copyright');
    if (footerElement && footerElement.textContent) {
      const footerMatch = footerElement.textContent.match(/Metabase\s+v?(\d+\.\d+\.\d+)/i);
      if (footerMatch && footerMatch[1]) {
        return footerMatch[1];
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error detecting Metabase version:', error);
    return null;
  }
} 