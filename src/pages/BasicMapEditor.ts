import { EditorStatusEnum, FnCacheStatusEnum, Point } from './MapEditor';

export default abstract class BasicMapEditor {
  /**
   * 初始化编辑器
   */
  abstract init: () => void;
  /**
   * 切换地图编辑器状态
   * @param {EditorStatusEnum} status
   */
  abstract switchTo: (status: EditorStatusEnum) => void;
  /**
   * 添加监听事件
   */
  abstract addListener?: (status: FnCacheStatusEnum, fn: Function) => void;
  /**
   * 更新点位信息
   * @param {Point[]} points
   */
  abstract update: (p: Point[]) => void;
  /**
   * 获取相对于原始图片大小的点位信息
   */
  abstract getOriginPoints: () => Point[];
  /**
   * 销毁
   */
  abstract destroy: () => void;
}
