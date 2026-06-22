/** Camera reel: 0,5s ferma lato destro → rotazione libera → backflip in chiusura */
export function posizioneCameraReelGarage(t: number) {
  const x = Math.min(1, Math.max(0, t));
  const HOLD = 0.09;
  const FLIP = 0.78;
  const dist = 5.85;
  const yBase = -4.38;
  const zBase = 4.98;

  const right = {
    x: Math.sin(Math.PI / 2) * dist,
    y: yBase,
    z: Math.cos(Math.PI / 2) * zBase,
  };

  if (x <= HOLD) return right;

  const ease = (u: number) => (u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2);
  const easeIn = (u: number) => u * u * u;

  if (x < FLIP) {
    const p = ease((x - HOLD) / (FLIP - HOLD));
    const yaw = Math.PI / 2 - p * Math.PI;
    const lift = p * 0.55;
    return {
      x: Math.sin(yaw) * dist,
      y: yBase + lift,
      z: Math.cos(yaw) * (zBase - p * 0.15),
    };
  }

  const p = easeIn((x - FLIP) / (1 - FLIP));
  const yaw = -Math.PI / 2 - p * 1.15;
  const d = dist - p * 1.65;
  return {
    x: Math.sin(yaw) * d,
    y: yBase + 0.55 + p * 1.85,
    z: Math.cos(yaw) * (zBase - 0.15 - p * 1.1),
  };
}

export const REEL_GARAGE_LOOK_AT = { x: 0, y: 0.38, z: 0 };
