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
      width: 1000,
      height: 1000,
      points: [
        { x: 20, y: 20 },
        { x: 200, y: 200 },
      ],
    });
    editor.init();
  }, []);
  return <canvas id={canvasId} />;
};

export default Main;
