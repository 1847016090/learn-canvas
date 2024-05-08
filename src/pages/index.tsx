import React, { useEffect, useRef, useState } from 'react';
import _ from 'lodash';
const canvasId = 'myCanvas';
const map =
  'https://static.rokidcdn.com/test/rokid-dcg-manage/1.0.0/assets/login-bg-48e90a23.png';

import MapEditor, {
  BasicMapEditor,
  EditorStatusEnum,
  FnCacheStatusEnum,
  Point,
} from './MapEditor';

// [
// {
//   contentListPoiId: '1',
//   contentListPoiName: '哈哈哈哈',
//   usingGuideBookIdx: 0,
//   position: {
//     x: 120,
//     y: 20,
//   },
// },
// {
//   contentListPoiId: '2',
//   contentListPoiName: '嘻嘻嘻嘻',
//   usingGuideBookIdx: 0,
//   position: { x: 200, y: 200 },
// },
// ]

const Main = () => {
  const [state, setState] = useState({
    points: [
      // {
      //   contentListPoiId: '1',
      //   contentListPoiName: '哈哈哈哈',
      //   usingGuideBookIdx: 0,
      //   position: {
      //     x: 1240,
      //     y: 580,
      //   },
      // },
      // {
      //   contentListPoiId: '2',
      //   contentListPoiName: '嘻嘻嘻嘻',
      //   usingGuideBookIdx: 0,
      //   position: { x: 200, y: 200 },
      // },
    ],
  });
  const editorRef = useRef<BasicMapEditor>();
  const pointsRef = useRef<Point[]>([
    // {
    //   contentListPoiId: '1',
    //   contentListPoiName: '哈哈哈哈',
    //   usingGuideBookIdx: 0,
    //   position: {
    //     x: 20,
    //     y: 20,
    //   },
    // },
    // {
    //   contentListPoiId: '2',
    //   contentListPoiName: '嘻嘻嘻嘻',
    //   usingGuideBookIdx: 0,
    //   position: { x: 200, y: 200 },
    // },
  ]);
  console.log('===points====', state.points);

  const onAddPoint = ({ x, y }) => {
    console.log('收到回调===x,y', x, y);
    console.log('points', state.points);
    const p = _.cloneDeep(state.points);
    console.log('p', p);
    pointsRef.value = [
      {
        contentListPoiId: `${new Date().valueOf()}`,
        contentListPoiName: `点位${new Date().valueOf()}`,
        usingGuideBookIdx: 0,
        position: {
          x,
          y,
        },
      },
      ...(pointsRef?.value || []),
    ];
    editorRef.value?.update(pointsRef.value);
    /** ????? 为啥直接更新上一次的会被清空？？？？ */
    setState({ points: pointsRef.value });
  };

  const onUpdatePoint = (points: Point[]) => {
    pointsRef.value = points;
    setState({ points });
  };

  useEffect(() => {
    let editor = new MapEditor({
      canvasId,
      map,
      points: state.points,
    });
    editor.init();
    editor.addListener(FnCacheStatusEnum.Add, onAddPoint);
    editor.addListener(FnCacheStatusEnum.Update, onUpdatePoint);
    editorRef.value = editor;
    // setInterval(() => setA(new Date().valueOf()), 1000);
  }, []);

  const onAdd = () => {
    editorRef.value.switchTo(EditorStatusEnum.New);
  };

  const onSave = () => {
    console.log('====待保存的点位信息===', editorRef.value.getOriginPoints());
  };
  return (
    <div>
      <div
        style={{
          position: 'fixed',
          display: 'flex',
          left: '50%',
          gap: 10,
          transform: 'translateX(-50%)',
          top: 0,
          cursor: 'pointer',
        }}
      >
        <div onClick={onAdd} style={{ background: 'red', padding: '10px' }}>
          新增
        </div>
        <div onClick={onSave} style={{ background: 'green', padding: '10px' }}>
          保存
        </div>
      </div>

      <canvas id={canvasId} />
    </div>
  );
};

export default Main;
