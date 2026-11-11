/**
 * B1.4-A — Pure radar viewport geometry. No DOM, W2UI, Cytoscape, or side effects.
 *
 * The radar model uses an 800 x 800 logical plane (center 400,400).
 * `width` and `height` must be the untransformed CSS pixel dimensions of the
 * shared SVG/Cytoscape viewport as allocated by W2UI.
 *
 * A point (x,y) in model coordinates is displayed at:
 *   { x: x * zoom + pan.x, y: y * zoom + pan.y }
 *
 * SVG counterpart: viewBox="0 0 800 800" and
 * preserveAspectRatio="xMidYMid meet", in the same width/height viewport.
 */
export function computeRadarViewport({ width, height, logicalSize = 800 } = {}) {
  if (![width, height, logicalSize].every(v => typeof v === 'number' && Number.isFinite(v) && v > 0)) {
    throw new RangeError('width, height and logicalSize must be finite positive numbers');
  }

  const constrainedByWidth = width <= height;
  const zoom = (constrainedByWidth ? width : height) / logicalSize;
  // Algebraically equivalent to centering (W - L*s)/2, but avoids
  // floating-point cancellation on the dimension that determines zoom.
  const pan = constrainedByWidth
    ? { x: 0, y: (height - width) / 2 }
    : { x: (width - height) / 2, y: 0 };

  return { zoom, pan };
}
