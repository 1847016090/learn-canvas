import BasicMapEditor from './BasicMapEditor';
import Marker from './Marker';

export const loadImage = (url): Promise<HTMLImageElement> =>
  new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = url;
    img.onload = () => {
      resolve(img);
    };
  });

export type Point = {
  contentListPoiId?: string;
  contentListPoiName?: string;
  usingGuideBookIdx?: number;
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
  /** 拖拽地图：去除 因为可能和其他几个同时触发 */
  // DragMap = 'dragMap',
  /** 跟鼠标随点 */
  CursorPoint = 'cursorPoint',
  /** 无 */
  None = 'none',
}

export enum FnCacheStatusEnum {
  /** 新增点位回调 */
  Add = 'add',
  /** 信息更新 */
  Update = 'update',
  /** 选中点位 */
  Select = 'select',
}

let _clickRight = false;

export default class MapEditor implements BasicMapEditor {
  /** 编辑器状态 */
  status: EditorStatusEnum = EditorStatusEnum.Normal;

  canvasId: string;
  /** 地图链接 */
  map: string;
  otherImages: string[];
  /** 比列 */
  ratio: number;
  /** 点位信息 */
  points: Point[] = [];
  private _defaultPoint: Point[] = [];
  private _unselectPointImage: HTMLImageElement;
  private _selectedPointImage: HTMLImageElement;
  /**
   * 暂时不用
   */
  _canvasLeft: number = 0;
  canvasTop: number = 0;

  /** 当前模式 */
  private _mode: EditorModeEnum = EditorModeEnum.None;
  /** 背景地图信息 */
  private _mapInfo: HTMLImageElement;
  private _selectedPoint: Point;
  private _hoverPoint: Point;
  private _painter: CanvasRenderingContext2D;
  private _canvas: HTMLCanvasElement;
  private _listenFnCache: Map<FnCacheStatusEnum, Function> = new Map();
  /** 是否按下右键：右键在contextMenu里面执行不生效*/
  // private _clickRight: boolean = false;
  private _mouseDownX: number = 0;
  private _mouseDownY: number = 0;

  private _moveX: number = 0;
  private _previousMoveX: number = 0;

  /** 展示弹窗 */
  _showPop: Boolean = true;
  constructor(options: {
    /** canvas ID */
    canvasId: string;
    /** 背景地图链接 */
    map: string;
    /** 已有点位信息 */
    points?: Point[];
    /** 点信息配置 */
    pointOptions: {
      /** 未选中点图片 */
      unselectUrl: string;
      /** 已选中点图片 */
      selectedUrl: string;
    };
  }) {
    this.canvasId = options.canvasId;
    this.map = options.map;
    this.points = options.points || [];
    this.otherImages = [
      options.pointOptions.unselectUrl,
      options.pointOptions.selectedUrl,
    ];
  }

  switchTo(status: EditorStatusEnum) {
    this.status = status;
    this._reset();
    if (status === EditorStatusEnum.New) {
      this._showPop = false;
      /** 新增模式，圆点跟随鼠标 */
      this._mode = EditorModeEnum.CursorPoint;
    }
  }

  addListener(status: FnCacheStatusEnum, fn: Function) {
    this._listenFnCache.set(status, fn);
  }

  update(p: Point[]) {
    console.log('===接受到的可更新的点位===p', p);
    this.points = p;
    this._rerender();
    if (this.status === EditorStatusEnum.New) {
      this.status = EditorStatusEnum.Normal;
      this._mode = EditorModeEnum.None;
    }
  }

  private _reset() {
    this._selectedPoint = undefined;
    this._rerender();
  }

  private _getRatio() {
    const ratio = window.innerHeight / this._mapInfo.height;
    this.ratio = ratio;
  }

  /** 初始化 */
  async init() {
    /** 请求地图 */
    await this._initMap();
    /** 获取比例 */
    this._getRatio();
    /** 初始化画笔 */
    this._initPainter();
    /** 绘制背景地图 */
    this._drawMap();
    /** 根据比列更细点位 */
    this._updatePointsByRatio();
    /** 绘制点位信息 */
    this._drawPoints();
    /** 先移除监听 */
    this._removeMouseListener();
    /** 监听鼠标点击事件 */
    this._addMouseListener();
  }

  _repaintByWindow() {
    /** 还原点位数据 */
    this.points = this.getOriginPoints();
    /** 获取比例 */
    this._getRatio();
    /** 初始化画笔 */
    this._initPainter();
    /** 绘制背景地图 */
    this._drawMap();
    /** 根据比列更细点位 */
    this._updatePointsByRatio();
    /** 绘制点位信息 */
    this._drawPoints();
  }

  /** 更新为窗口高度的信息 */
  private _updatePointsByRatio() {
    const ratio = this.ratio;
    this.points = this.points.map((p) => {
      const {
        position: { x, y },
        ...rest
      } = p;
      return {
        ...rest,
        position: {
          x: x * ratio + this._moveX,
          y: y * ratio,
        },
      };
    });
  }

  /** 还原对应原始图片尺寸的位置信息 */
  getOriginPoints() {
    const ratio = this.ratio;
    return this.points.map((p) => {
      const {
        position: { x, y },
        marker,
        ...rest
      } = p;
      return {
        ...rest,
        position: {
          x: (x - this._moveX) / ratio,
          y: y / ratio,
        },
      };
    });
  }

  private async _initMap() {
    const promiseArr = [
      loadImage(this.map),
      ...this.otherImages.map((url) => loadImage(url)),
    ];
    const [map, unselectPoint, selectedPoint]: HTMLImageElement[] =
      await Promise.all(promiseArr);
    console.log('unselectPoint', unselectPoint);
    console.log('selectedPoint', selectedPoint);
    // const map: HTMLImageElement = await loadImage(this.map);
    this._mapInfo = map;
    this._unselectPointImage = unselectPoint;
    this._selectedPointImage = selectedPoint;
  }

  /** 初始化画笔 */
  private async _initPainter() {
    // 得到画布
    const canvas: HTMLCanvasElement = document.querySelector(
      `#${this.canvasId}`,
    );
    /** 获取canvas已经图片宽高 */
    const canvasHeight = window.innerHeight;

    const mapWidth = this.ratio * this._mapInfo.width;
    const canvasWidth =
      mapWidth > window.innerWidth ? window.innerWidth : mapWidth;
    this._canvas = canvas;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const { x } = canvas.getBoundingClientRect();
    this._canvasLeft = x;
    // canvas.style.cursor = "move"
    /** 创建画笔 */
    this._painter = canvas.getContext('2d');
  }

  /** 绘制地图 */
  private _drawMap() {
    const mapWidth = this.ratio * this._mapInfo.width;
    const mapHeight = this.ratio * this._mapInfo.height;
    /** 绘制背景 */
    this._painter.drawImage(this._mapInfo, this._moveX, 0, mapWidth, mapHeight);
  }

  /** 清除画布重新绘制 */
  private _clear() {
    this._painter.clearRect(0, 0, this._canvas.width, this._canvas.height);
  }

  /** 重新绘制 */
  private _rerender() {
    this._drawMap();
    this._drawPoints();
  }

  /** 对齐坐标 */
  _getMousePosition({ clientX, x, clientY, y }: MouseEvent) {
    const clientXBase = clientX - this._canvasLeft;
    const xBase = x - this._canvasLeft;
    return {
      clientY,
      y,
      clientX: clientXBase,
      x: xBase,
    };
  }
  /** 鼠标点击 */
  private _onMouseClick = (event) => {
    console.log('====鼠标点击====');
    // const { clientX, clientY } = event;
    const { clientX, clientY } = this._getMousePosition(event);
    switch (this.status) {
      case EditorStatusEnum.New:
        break;
      case EditorStatusEnum.Normal:
        console.log('===普通模式===', clientX, clientY);
        const point = this.points.find((p) =>
          p.marker.checkSelected(clientX, clientY),
        );
        const selectFn = this._listenFnCache.get(FnCacheStatusEnum.Select);

        /** 点击同一个点不绘制 */
        if (
          point &&
          point.contentListPoiId === this._selectedPoint?.contentListPoiId
        ) {
          this._selectedPoint = point;
          const { marker, ...p } = this._selectedPoint;
          selectFn?.(p);
        } else if (
          point &&
          point.contentListPoiId !== this._selectedPoint?.contentListPoiId
        ) {
          /** 点击不同点清除画布重新绘制 */
          this._selectedPoint = point;
          const { marker, ...p } = this._selectedPoint;
          selectFn?.(p);
          this._clear();
          this._rerender();
        } else {
          /** 重置 */
          console.log('重置');
          this._selectedPoint = undefined;
          selectFn(undefined);
          this._clear();
          this._rerender();
        }
        break;
      default:
    }
  };

  /** 鼠标右键 */
  private _onContextMenu(event: MouseEvent) {
    /** 阻止默认的右键事件 */
    event.preventDefault();
    console.log('===鼠标右键触发====');
    _clickRight = true;
  }

  /** 鼠标点下 */
  private _onMouseDown = (event: MouseEvent) => {
    console.log('====鼠标按下====');
    console.log('event.clientX', event.clientX);
    this._showPop = false;
    const newEvent = this._getMousePosition(event);
    const { clientX, clientY } = newEvent;
    console.log(
      '鼠标按下 clientX, clientY',
      clientX,
      clientY,
      this._canvasLeft,
    );
    this._mouseDownX = clientX;
    this._mouseDownY = clientY;
    this._defaultPoint = this.points.map((p) => ({
      ...p,
      position: {
        ...p.position,
        x: p.position.x - this._moveX,
      },
    }));

    this._onMouseClick(event);
    if (this._selectedPoint) {
      this._mode = EditorModeEnum.DragPoint;
    }
  };

  private _getFilterPoints = () => {
    return this.points
      .map((p) => {
        const { marker, ...rest } = p;
        return rest;
      })
      .filter((p) => p.contentListPoiId);
  };

  /** 鼠标抬起 */
  private _onMouseUp = (event: MouseEvent) => {
    _clickRight = false;
    this._canvas.style.cursor = 'auto';
    this._previousMoveX = this._moveX;
    console.log('====鼠标抬起====');
    switch (this.status) {
      case EditorStatusEnum.New:
        const { clientX, clientY } = this._getMousePosition(event);
        const addFn = this._listenFnCache.get(FnCacheStatusEnum.Add);
        addFn?.({ x: clientX, y: clientY }, this._getFilterPoints());
        break;
      case EditorStatusEnum.Normal:
        this._mode = EditorModeEnum.None;
        this._showPop = true;
        this._rerender();
        const updateFn = this._listenFnCache.get(FnCacheStatusEnum.Update);
        updateFn?.(
          this.points.map((p) => {
            const { marker, ...rest } = p;
            return rest;
          }),
        );
        break;
      default:
    }
  };
  /**
   * 获取移动地图的横移距离
   */
  getMoveX = (x) => {
    /** 1. 获取地图在Canvas里面的宽度 */
    const mapWidth = this.ratio * this._mapInfo.width;
    /** 2. 如果地图小于屏幕宽度 */
    if (mapWidth < window.innerWidth) {
      return 0;
    }

    /** --边界值-- */
    const border = mapWidth - window.innerWidth;
    console.log('===border===', border);
    console.log('x - this._mouseDownX', x - this._mouseDownX);
    const distance = x - this._mouseDownX + this._previousMoveX;
    if (distance >= -border && distance <= 0) {
      /** 3. 返回横移距离 */
      return distance;
    } else if (distance < -border) {
      return this._moveX;
    } else if (distance > 0) {
      return 0;
    }
    return 0;
  };

  /**鼠标移动 */
  private _onMouseMove = (event) => {
    const { x, y, clientX, clientY } = this._getMousePosition(event);
    console.log('x, y', x, y);
    console.log('clientX,clientY', clientX, clientY);
    /** 判断 */
    const point = this.points.find((p) => p.marker.checkSelected(x, y));
    this._hoverPoint = point;
    if (this._showPop) {
      this._clear();
      this._rerender();
    }
    /** 按下右键执行 */
    if (_clickRight) {
      this._canvas.style.cursor = 'move';
      this.switchTo(EditorStatusEnum.Normal);
      this._clear();
      const moveX = this.getMoveX(x);
      this._moveX = moveX;
      this._drawMap();
      this.points = this._defaultPoint.map((p) => {
        const nx = p.position.x + moveX;
        p.marker?.update(nx, p.position.y);
        return {
          ...p,
          position: {
            ...p.position,
            x: p.position.x + moveX,
          },
        };
      });
      this._drawPoints();
    }
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

        break;
      case EditorModeEnum.CursorPoint:
        /** 1. 移除新增的点 */
        this.points = this.points.filter((p) => p.contentListPoiId);
        /** 2. 重新生成一个新点 */
        if (this.status === EditorStatusEnum.New) {
          this.points.push({
            position: { x, y },
          });
        }

        /** 3. 重新绘制 */
        this._rerender();
        break;
      default:
    }
  };

  _onWindowResize = () => {
    this._repaintByWindow();
  };

  destroy() {
    this._removeMouseListener();
    this._clear();
  }
  /** 监听鼠标点击事件 */
  private _addMouseListener() {
    this._canvas.addEventListener('click', this._onMouseClick);
    this._canvas.addEventListener('mousedown', this._onMouseDown);
    this._canvas.addEventListener('mouseup', this._onMouseUp);
    this._canvas.addEventListener('contextmenu', this._onContextMenu);
    this._canvas.addEventListener('mousemove', this._onMouseMove);
    window.addEventListener('resize', this._onWindowResize);
  }
  /** 移出事件监听 */
  private _removeMouseListener() {
    this._canvas.removeEventListener('mousedown', this._onMouseDown);
    this._canvas.removeEventListener('mouseup', this._onMouseUp);
    this._canvas.removeEventListener('mousemove', this._onMouseMove);
    this._canvas.removeEventListener('click', this._onMouseClick);
    this._canvas.removeEventListener('contextmenu', this._onContextMenu);
    window.removeEventListener('resize', this._onWindowResize);
  }

  /** 渲染点位 */
  private _drawPoints() {
    if (!this.points.length) return;
    this.points = this.points.map((point) => {
      const marker = new Marker({
        ...point.position,
        name: point.contentListPoiName,
        id: point.contentListPoiId,
        options: {
          unselectImage: this._unselectPointImage,
          selectedImage: this._selectedPointImage,
          canvasLeft: this._canvasLeft,
        },
      });

      /** 是否选中 */
      const shouldSelect =
        this._selectedPoint?.contentListPoiId === point.contentListPoiId &&
        this._mode !== EditorModeEnum.DragPoint &&
        this._mode !== EditorModeEnum.CursorPoint;

      const isExistedPoint = !!point.contentListPoiId;
      marker.update(point.position.x, point.position.y);
      marker.init(this._painter, {
        existed: isExistedPoint,
      });
      console.log('this._canvasLeft', this._canvasLeft);
      if (
        this._showPop &&
        this._hoverPoint?.contentListPoiId === point.contentListPoiId
      ) {
        marker.popUp();
      } else {
        marker.popDown();
      }
      if (shouldSelect) {
        marker.select();
      }
      return {
        marker,
        ...point,
      };
    }) as Point[];
  }
}
