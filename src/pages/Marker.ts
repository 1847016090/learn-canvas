export const CIRCLE_RADIUS = 8;

export default class Marker {
  /** 点位x轴位置 */
  x: number = 0;
  /** 点位y轴位置 */
  y: number = 0;
  /** 点位名称 */
  name: string;
  /** 点位ID */
  id: string;
  _id: string;
  /** 画笔 */
  _painter: CanvasRenderingContext2D;

  constructor(options: { x: number; y: number; name: string; id: string }) {
    this.x = options.x;
    this.y = options.y;
    this.name = options.name;
    this.id = options.id;
  }

  /** 初始化点位 */
  init(painter: CanvasRenderingContext2D) {
    this._painter = painter;
    /** 画圈 */
    painter.beginPath();
    painter.arc(
      this.x,
      this.y,
      CIRCLE_RADIUS,
      0,
      ([Math.PI / 180] as any) * 360,
    );
    painter.fillStyle = '#C800FF';
    painter.fill();
    painter.closePath();

    /** 画字 */
    // painter.beginPath();
    // painter.font = '14px Verdana';
    // painter.textAlign = 'center';
    // painter.textBaseline = 'middle';
    // painter.fillStyle = '#fff';
    // painter.fillText(String(this.index), this.x, this.y, CIRCLE_RADIUS * 2 - 4);
    // painter.closePath();
  }

  /**
   * 检测是否选中
   * @param mx 鼠标点中的x值
   * @param my 鼠标点中的y值
   */
  checkSelected(mx: number, my: number) {
    console.log('this.x', this.x);
    console.log('this.y', this.y);
    if (
      mx > this.x - CIRCLE_RADIUS &&
      mx < this.x + CIRCLE_RADIUS &&
      my > this.y - CIRCLE_RADIUS &&
      my < this.y + CIRCLE_RADIUS
    ) {
      console.log('===选中啦===');
      // this.select();
      return {
        id: this.id,
      };
    }
    // this.unselect();
    return null;
  }

  /** 选中，外部添加选中框 */
  select() {
    // 无法清除
    this._painter.beginPath();
    this._painter.strokeRect(
      this.x - CIRCLE_RADIUS,
      this.y - CIRCLE_RADIUS,
      CIRCLE_RADIUS * 2,
      CIRCLE_RADIUS * 2,
    );
    this._painter.strokeStyle = '#5C67FF';
    this._painter.stroke();
    this._painter.closePath();
  }
  /** 更细x,y */
  update(x, y) {
    this.x = x;
    this.y = y;
  }
}
