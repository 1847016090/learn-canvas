import Marker from './Marker';
import { CIRCLE_RADIUS } from './Marker';

const loadImage = (url) =>
  new Promise((resolve) => {
    const img = new Image();
    img.src = url;
    img.onload = () => {
      resolve(img);
    };
  });

type Point = { x: number; y: number };

export default class MapEditor {
  canvasId: string;
  map: string;
  width: number;
  height: number;

  points: Point[] = [];

  canvasLeft: number = 0;
  canvasTop: number = 0;

  private _painter: CanvasRenderingContext2D;
  private _canvas: HTMLCanvasElement;

  constructor(options: {
    /** canvas ID */
    canvasId: string;
    /** 背景地图链接 */
    map: string;
    /** 地图宽 */
    width?: number;
    /** 地图高 */
    height?: number;
    /** 已有点位信息 */
    points?: Point[];
  }) {
    this.canvasId = options.canvasId;
    this.map = options.map;
    this.width = options.width;
    this.height = options.height;
    this.points = options.points || [];
  }

  /** 初始化 */
  async init() {
    /** 初始化画笔 */
    this.initPainter();
    /** 绘制地图 */
    await this.initMap();
    /** 绘制点位信息 */
    this.render();
    /** 监听鼠标点击事件 */
    this.addMouseDownListener();
  }

  /** 初始化画笔 */
  initPainter() {
    // 得到画布
    const canvas: HTMLCanvasElement = document.querySelector(
      `#${this.canvasId}`,
    );
    const { width, height, left, top } = canvas.getBoundingClientRect();
    this._canvas = canvas;
    this.canvasLeft = left;
    this.canvasTop = top;
    canvas.width = this.width || width;
    canvas.height = this.height || height;
    // 创建画笔
    this._painter = canvas.getContext('2d');
  }

  /** 监听鼠标点击事件 */
  addMouseDownListener() {
    this._canvas.addEventListener('mousedown', this.add);
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

  /** 贴上背景图 */
  async initMap() {
    const map: any = await loadImage(this.map);
    this._painter.drawImage(map, 0, 0, this.width, this.height);
  }

  /** 添加点位信息 */
  add = (event) => {
    this.points.push(this.getMousePosition(event));
    this.render();
  };

  /** 渲染点位 */
  render() {
    if (!this.points.length) return;
    this.points.forEach((point, index) => {
      const marker = new Marker({ ...point, index: index + 1 });
      marker.init(this._painter);
    });
  }

  /** 删除点位信息 */
  delete() {}
}
