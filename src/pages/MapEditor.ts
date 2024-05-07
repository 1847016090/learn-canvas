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

type Point = { x: number; y: number };

export enum EditorStatusEnum {
  /** 普通模式：可拖拽 */
  Normal = 'normal',
  /** 新增模式：可新增点位 */
  New = 'new',
}

export default class MapEditor {
  /** 编辑器状态 */
  status: EditorStatusEnum.Normal;
  canvasId: string;
  /** 地图链接 */
  map: string;
  /** 比列 */
  ratio: number;
  /** 点位信息 */
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
    /** 已有点位信息 */
    points?: Point[];
  }) {
    this.canvasId = options.canvasId;
    this.map = options.map;
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
  async initPainter() {
    // 得到画布
    const canvas: HTMLCanvasElement = document.querySelector(
      `#${this.canvasId}`,
    );
    // const { width, height, left, top } = canvas.getBoundingClientRect();
    const map: HTMLImageElement = await loadImage(this.map);

    /** 获取canvas已经图片款高 */
    const canvasHeight = window.innerHeight;
    const ratio = window.innerHeight / map.height;
    this.ratio = ratio;
    const mapWidth = ratio * map.width;
    const mapHeight = map.height;
    const canvasWidth =
      mapWidth > window.innerWidth ? window.innerWidth : mapWidth;
    this._canvas = canvas;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    /** 创建画笔 */
    this._painter = canvas.getContext('2d');
    this._painter.drawImage(map, 0, 0, mapWidth, mapHeight);
  }

  /** 监听鼠标点击事件 */
  addMouseDownListener() {
    this._canvas.addEventListener('mousedown', this.add);
    this._canvas.addEventListener('mouseup', () => {
      console.log('鼠标浮起');
    });
    this._canvas.addEventListener('mousemove', ({ clientX, clientY }) => {
      console.log('clientX,clientY', clientX, clientY);
    });
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
    console.log('window.width', window.innerWidth);
    console.log('window.innerHeight', window.innerHeight);
    console.log('map.width', map.width);
    console.log('map.height', map.height);
    this._painter.drawImage(map, 0, 0, this.width, this.height);
  }

  /** 添加点位信息 */
  add = (event) => {
    console.log('鼠标按下');
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
