import React, { useEffect } from 'react';

const canvasId = 'myCanvas';
const map =
  'https://static.rokidcdn.com/test/rokid-dcg-manage/1.0.0/assets/login-bg-48e90a23.png';

import MapEditor from './MapEditor';

const Main = () => {
  useEffect(() => {
    let editor = new MapEditor({
      canvasId,
      map,
      points: [
        {
          contentListPoiId: '1',
          contentListPoiName: '哈哈哈哈',
          usingGuideBookIdx: 0,
          position: {
            x: 20,
            y: 20,
          },
        },
        {
          contentListPoiId: '2',
          contentListPoiName: '嘻嘻嘻嘻',
          usingGuideBookIdx: 0,
          position: { x: 200, y: 200 },
        },
      ],
    });
    editor.init();
  }, []);

  const onAdd = () => {
    console.log('11111', 11111);
  };

  return (
    <div>
      <canvas id={canvasId} />
    </div>
  );
};

export default Main;
