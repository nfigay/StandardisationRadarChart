/** Pure equivalent of the legacy getZone(x, y, radii) in js/radar.js.
 *  The legacy code remains active until a separately validated integration.
 *  Boundary, angle and out-of-range semantics deliberately preserved.
 */
export function getZone(x, y, radii, center = { x: 400, y: 400 }) {
  const relX = x - center.x;
  const relY = y - center.y;
  const r = Math.sqrt(relX ** 2 + relY ** 2);
  const theta = Math.atan2(relY, relX);

  if (r > radii[radii.length - 1]) {
    return { zone: undefined, quadrant: undefined };
  }

  let circleIndex = radii.findIndex(radius => r < radius);
  if (circleIndex === -1) circleIndex = radii.length - 1;

  const sectorIndex = Math.floor(((theta + Math.PI) / (2 * Math.PI)) * 4) % 4;
  return { zone: circleIndex, quadrant: sectorIndex };
}
