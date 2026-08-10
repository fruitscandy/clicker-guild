/** Exact logical-space head path shared by the live renderer and fracture mask. */
export function traceArchivistHead(context: CanvasRenderingContext2D) {
  context.beginPath();
  context.moveTo(-31, -71);
  context.lineTo(-7, -77);
  context.lineTo(25, -72);
  context.lineTo(37, -43);
  context.lineTo(27, -13);
  context.lineTo(6, -2);
  context.lineTo(-23, -12);
  context.lineTo(-39, -42);
  context.closePath();
}

/** Exact logical-space mantle path shared by the live renderer and fracture mask. */
export function traceArchivistMantle(context: CanvasRenderingContext2D) {
  context.beginPath();
  context.moveTo(-22, -12);
  context.lineTo(-64, 4);
  context.lineTo(-51, 29);
  context.lineTo(-38, 19);
  context.lineTo(-31, 68);
  context.lineTo(-11, 57);
  context.lineTo(0, 78);
  context.lineTo(14, 55);
  context.lineTo(35, 68);
  context.lineTo(39, 20);
  context.lineTo(56, 29);
  context.lineTo(68, 1);
  context.lineTo(25, -12);
  context.closePath();
}

/** Trace both silhouette subpaths as one fillable matte. */
export function traceArchivistSilhouette(context: CanvasRenderingContext2D) {
  context.beginPath();
  context.moveTo(-31, -71);
  context.lineTo(-7, -77);
  context.lineTo(25, -72);
  context.lineTo(37, -43);
  context.lineTo(27, -13);
  context.lineTo(6, -2);
  context.lineTo(-23, -12);
  context.lineTo(-39, -42);
  context.closePath();
  context.moveTo(-22, -12);
  context.lineTo(-64, 4);
  context.lineTo(-51, 29);
  context.lineTo(-38, 19);
  context.lineTo(-31, 68);
  context.lineTo(-11, 57);
  context.lineTo(0, 78);
  context.lineTo(14, 55);
  context.lineTo(35, 68);
  context.lineTo(39, 20);
  context.lineTo(56, 29);
  context.lineTo(68, 1);
  context.lineTo(25, -12);
  context.closePath();
}
