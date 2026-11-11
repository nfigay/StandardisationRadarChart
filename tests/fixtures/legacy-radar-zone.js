function getZone(x, y, radii) {
  let relX = x - chartCenter.x;
  let relY = y - chartCenter.y;
  let r = Math.sqrt(relX ** 2 + relY ** 2);  // Calcul de la distance au centre
  let theta = Math.atan2(relY, relX); // Angle en radians (-π à π)
  let angleDeg = (theta * 180) / Math.PI; // Conversion en degrés

  // Si la distance est supérieure au rayon du cercle le plus grand, on renvoie undefined pour zone et quadrant
  if (r > radii[radii.length - 1]) {
    return { zone: undefined, quadrant: undefined };
  }

  let circleIndex = radii.findIndex(radius => r < radius);
  if (circleIndex === -1) circleIndex = radii.length - 1; // Évite un index hors limites

  let sectorIndex = Math.floor(((theta + Math.PI) / (2 * Math.PI)) * 4) % 4;

  return { zone: circleIndex, quadrant: sectorIndex }; // 🔥 Correction : Associer aux bonnes variables
}
