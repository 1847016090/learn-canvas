import Marker from './Marker';
import { CIRCLE_RADIUS } from './Marker';

const loadImage = (url): Promise<HTMLImageElement> =>
  new Promise((resolve) => {
    const img = new Image();
    img.src = url;
    img.onload = () => {
      resolve(img);
    };
  });

type Point = {
  contentListPoiId: string;
  contentListPoiName: string;
  usingGuideBookIdx: number;
  marker?: Marker;
  position: {
    x: number;
    y: number;
    z?: number;
  };
};

export enum EditorStatusEnum {
  /** 普通模式：可拖拽 */
  Normal = 'normal',
  /** 新增模式：可新增点位 */
  New = 'new',
}

export enum EditorModeEnum {
  /** 拖拽点 */
  DragPoint = 'dragPoint',
  /** 拖拽地图 */
  DragMap = 'dragMap',
  /** 无 */
  None = 'none',
}

export default class MapEditor {
  /** 编辑器状态 */
  status: EditorStatusEnum = EditorStatusEnum.Normal;

  canvasId: string;
  /** 地图链接 */
  map: string;

  /** 比列 */
  ratio: number;
  /** 点位信息 */
  points: Point[] = [];

  canvasLeft: number = 0;
  canvasTop: number = 0;

  /** 当前模式 */
  private _mode: EditorModeEnum = EditorModeEnum.None;
  /** 背景地图信息 */
  private _mapInfo: HTMLImageElement;
  private _selectedPoint: Point;
  private _painter: CanvasRenderingContext2D;
  private _canvas: HTMLCanvasElement;
  // private _dragDownX: number;
  // private _dragDownY: number;
  constructor(options: {
    /** canvas ID */
    canvasId: string;
    /** 背景地图链接 */
    map: string;
    /** 已有点位信息 */
    points?: Point[];
  }) {
    this.canvasId = options.canvasId;
    this.map = options.map;
    this.points = options.points || [];
  }

  /** 初始化 */
  async init() {
    /** 请求地图 */
    await this.initMap();
    /** 初始化画笔 */
    this._initPainter();
    /** 绘制背景地图 */
    this._drawMap();
    /** 绘制点位信息 */
    this._drawPoints();
    /** 监听鼠标点击事件 */
    this._addMouseListener();
  }

  async initMap() {
    const map: HTMLImageElement = await loadImage(this.map);
    this._mapInfo = map;
  }

  /** 初始化画笔 */
  async _initPainter() {
    // 得到画布
    const canvas: HTMLCanvasElement = document.querySelector(
      `#${this.canvasId}`,
    );
    /** 获取canvas已经图片宽高 */
    const canvasHeight = window.innerHeight;
    const ratio = window.innerHeight / this._mapInfo.height;
    this.ratio = ratio;
    const mapWidth = ratio * this._mapInfo.width;
    const canvasWidth =
      mapWidth > window.innerWidth ? window.innerWidth : mapWidth;
    this._canvas = canvas;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    // canvas.style.cursor = "move"
    /** 创建画笔 */
    this._painter = canvas.getContext('2d');
  }

  /** 绘制地图 */
  _drawMap() {
    const mapWidth = this.ratio * this._mapInfo.width;
    const mapHeight = this._mapInfo.height;
    /** 绘制背景 */
    this._painter.drawImage(this._mapInfo, 0, 0, mapWidth, mapHeight);
  }

  /** 清除画布重新绘制 */
  clear() {
    this._painter.clearRect(0, 0, this._canvas.width, this._canvas.height);
  }

  /** 重新绘制 */
  _rerender() {
    this._drawMap();
    this._drawPoints();
  }

  /** 监听鼠标点击事件 */
  private _addMouseListener() {
    this._canvas.addEventListener('click', this._onMouseClick);
    this._canvas.addEventListener('mousedown', this._onMouseDown);
    this._canvas.addEventListener('mouseup', this._onMouseUp);
    this._canvas.addEventListener('mousemove', this._onMouseMove);
  }

  /** 鼠标点击 */
  private _onMouseClick = (event) => {
    const { clientX, clientY } = event;
    console.log('===点击===', this.status, clientX, clientY);
    switch (this.status) {
      case EditorStatusEnum.New:
        // this.points.push(this.getMousePosition(event));
        this._drawPoints();
      case EditorStatusEnum.Normal:
        console.log('===普通模式===', clientX, clientY);
        const point = this.points.find((p) =>
          p.marker.checkSelected(clientX, clientY),
        );
        /** 点击同一个点不绘制 */
        if (
          point &&
          point.contentListPoiId === this._selectedPoint?.contentListPoiId
        ) {
          this._selectedPoint = point;
          return;
        }
        /** 点击不同点清除画布重新绘制 */
        if (
          point &&
          point.contentListPoiId !== this._selectedPoint?.contentListPoiId
        ) {
          this._selectedPoint = point;
          this.clear();
          this._rerender();

          return;
        }

        /** 重置 */
        console.log('重置');
        this._selectedPoint = undefined;
        this.clear();
        this._rerender();
    }
  };

  /** 鼠标点下 */
  private _onMouseDown = (event: MouseEvent) => {
    if (this._selectedPoint) {
      this._mode = EditorModeEnum.DragPoint;
      // this._dragDownX = event.clientX;
      // this._dragDownY = event.clientY;
    }
  };

  /** 鼠标抬起 */
  private _onMouseUp = (event) => {
    switch (this.status) {
      case EditorStatusEnum.New:
        // this.points.push(this.getMousePosition(event));
        this._drawPoints();
      case EditorStatusEnum.Normal:
        this._mode = EditorModeEnum.None;
        this._rerender();
        console.log('this.points', this.points);
        console.log('1111', 1111);
    }
  };

  /**鼠标移动 */
  private _onMouseMove = (event) => {
    const { x, y } = event;
    switch (this._mode) {
      case EditorModeEnum.DragPoint:
        /** 1. 移除存在的选中的点 */
        this.points = this.points.filter(
          (p) => p.contentListPoiId !== this._selectedPoint?.contentListPoiId,
        );
        /** 2. 重新生成一个新点 */
        this._selectedPoint.marker.update(x, y);
        this.points.push({
          ...this._selectedPoint,
          position: { x, y },
        });
        /** 3. 重新绘制 */
        this._rerender();
    }
  };

  /** 移出事件监听 */
  removeMouseListener() {
    this._canvas.removeEventListener('mousedown', this._onMouseDown);
    this._canvas.removeEventListener('mouseup', this._onMouseUp);
    this._canvas.removeEventListener('mousemove', this._onMouseMove);
    this._canvas.removeEventListener('click', this._onMouseClick);
  }

  /** 对齐坐标 */
  getMousePosition({ clientX, clientY }) {
    const xBase = clientX - this.canvasLeft;
    const yBase = clientY - this.canvasTop;
    return {
      x: xBase,
      y: yBase,
    };
  }

  /** 渲染点位 */
  _drawPoints() {
    if (!this.points.length) return;
    this.points = this.points.map((point) => {
      const marker = new Marker({
        ...point.position,
        name: point.contentListPoiName,
        id: point.contentListPoiId,
      });
      marker.init(this._painter);
      if (
        this._selectedPoint?.contentListPoiId === point.contentListPoiId &&
        this._mode !== EditorModeEnum.DragPoint
      ) {
        marker.select();
      }
      return {
        marker,
        ...point,
      };
    }) as Point[];
  }

  /** 删除点位信息 */
  delete() {}
}
