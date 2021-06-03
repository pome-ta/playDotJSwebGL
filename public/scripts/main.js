'use strict';

window.addEventListener('load', init);

function init() {
  const width = document.querySelector('.wrap').clientWidth;
  const height = width * 0.8;
  const c = document.querySelector('#myCanvas');
  c.width = width;
  c.height = height;
  const gl = c.getContext('webgl');
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  // canvasを初期化する際の深度を設定する
  //gl.clearDepth(1.0);

  // canvasを初期化
  //gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  console.log(gl)
  
}