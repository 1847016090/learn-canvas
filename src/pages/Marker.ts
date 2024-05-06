export const CIRCLE_RADIUS = 14;

export default class Marker {
  /** 点位x轴位置 */
  x: number = 0;
  /** 点位y轴位置 */
  y: number = 0;
  /** 填充内容 */
  index: number = 0;
  constructor(options: { index: number; x: number; y: number }) {
    this.x = options.x;
    this.y = options.y;
    this.index = options.index;
  }

  /** 初始化点位 */
  init(painter: CanvasRenderingContext2D) {
    /** 画圈 */
    painter.beginPath();
    painter.arc(
      this.x,
      this.y,
      CIRCLE_RADIUS,
      0,
      ([Math.PI / 180] as any) * 360,
    );
    painter.fillStyle = '#ba765f';
    painter.fill();
    painter.closePath();

    /** 画字 */
    painter.beginPath();
    painter.font = '14px Verdana';
    painter.textAlign = 'center';
    painter.textBaseline = 'middle';
    painter.fillStyle = '#fff';
    painter.fillText(String(this.index), this.x, this.y, 400);
    painter.closePath();
  }
}
