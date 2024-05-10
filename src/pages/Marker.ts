export const CIRCLE_RADIUS = 8;
export const TEXT_SIZE = 14;
export const TEXT_FAMILY = 'Verdana';
export default class Marker {
  /** 点位x轴位置 */
  x: number = 0;
  /** 点位y轴位置 */
  y: number = 0;
  /** 点位名称 */
  name: string;
  /** 点位ID */
  id: string;
  /** 画笔 */
  _painter: CanvasRenderingContext2D;

  private _unselectImage: HTMLImageElement;
  private _selectedImage: HTMLImageElement;

  constructor(data: {
    x: number;
    y: number;
    name: string;
    id: string;
    options: {
      unselectImage;
      selectedImage;
    };
  }) {
    this.x = data.x;
    this.y = data.y;
    this.name = data.name;
    this.id = data.id;
    this._unselectImage = data.options.unselectImage;
    this._selectedImage = data.options.selectedImage;
  }

  /** 初始化点位 */
  async init(
    painter: CanvasRenderingContext2D,
    {
      existed,
    }: {
      /** 是否是已经存在的点 */
      existed: boolean;
    },
  ) {
    this._painter = painter;
    /** 画圈 */
    painter.beginPath();
    // painter.arc(
    //   this.x,
    //   this.y,
    //   CIRCLE_RADIUS,
    //   0,
    //   ([Math.PI / 180] as any) * 360,
    // );

    this._painter.drawImage(
      existed ? this._selectedImage : this._unselectImage,
      this.x - CIRCLE_RADIUS,
      this.y - CIRCLE_RADIUS,
      CIRCLE_RADIUS * 2,
      CIRCLE_RADIUS * 2,
    );
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
    if (
      mx > this.x - CIRCLE_RADIUS &&
      mx < this.x + CIRCLE_RADIUS &&
      my > this.y - CIRCLE_RADIUS &&
      my < this.y + CIRCLE_RADIUS
    ) {
      console.log('===选中啦===');
      this.popUp();
      // this.select();
      return true;
    }
    // this.unselect();
    this.popDown();
    return false;
  }

  measureText() {
    this._painter.beginPath();
    this._painter.font = `${TEXT_SIZE}px Verdana`; // 改变字的大小，文本的长度也会发生变化
    const width = this._painter.measureText(this.name).width;
    return width;
  }

  /** 弹出弹窗 */
  popUp() {
    const exist = document.querySelector(`#point${this.id}`);
    if (exist) return;
    const pop = document.createElement('div');
    pop.style.padding = '7px 12px';
    pop.style.background = '#0F1233';
    pop.style.boxShadow = '0px 2px 12px 0px rgba(0, 0, 0, 0.08)';
    pop.style.fontSize = `${TEXT_SIZE}px`;
    pop.style.fontFamily = TEXT_FAMILY;
    pop.style.borderRadius = '6px';
    pop.style.lineHeight = '22px';
    pop.style.color = '#FFFFFF';
    pop.innerText = this.name;
    pop.style.position = 'fixed';
    const textWidth = this.measureText() + 24;
    console.log('textWidth', textWidth);
    pop.style.left = `${this.x - textWidth / 2}px`;
    pop.style.top = `${this.y - 56}px`;
    pop.id = `point${this.id}`;
    document.body.appendChild(pop);
  }

  /** 隐藏弹窗 */
  popDown() {
    const pop = document.querySelector(`#point${this.id}`);
    if (pop) {
      document.body.removeChild(pop);
    }
  }

  /** 选中，外部添加选中框 */
  select() {
    // 无法清除
    this._painter.beginPath();
    this._painter.strokeRect(
      this.x - CIRCLE_RADIUS - 1,
      this.y - CIRCLE_RADIUS - 1,
      CIRCLE_RADIUS * 2 + 2,
      CIRCLE_RADIUS * 2 + 2,
    );
    this._painter.lineWidth = 1;
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
