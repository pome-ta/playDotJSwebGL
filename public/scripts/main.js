import matIV from './minMatrixES6.js';

window.addEventListener('load', init);

function init() {
  // 画面サイズからcanvasのサイズを確定
  const width = document.querySelector('.wrap').clientWidth;
  const height = width * 1.8;

  const c = document.querySelector('#myCanvas');
  c.width = width;
  c.height = height;

  // webglコンテキスト取得
  const gl = c.getContext('webgl');

  // 頂点シェーダとフラグメントシェーダの生成
  const v_shader = create_shader('vs');
  const f_shader = create_shader('fs');

  // プログラムオブジェクトの生成とリンク
  const prg = create_program(v_shader, f_shader);

  // attributeLocationを配列に取得
  const attLocation = new Array(2);
  attLocation[0] = gl.getAttribLocation(prg, 'position');
  attLocation[1] = gl.getAttribLocation(prg, 'color');

  // attributeの要素数を配列に格納
  const attStride = new Array(2);
  // xyz の3要素
  attStride[0] = 3;
  // color 情報
  attStride[1] = 4;
  
  // トーラスの頂点データを生成
  const torusData = torus(16, 16, 1.0, 2.0);
  const position = torusData[0];
  const color = torusData[1];
  const index = torusData[2];

  // VBO の生成
  const pos_vbo = create_vbo(position);
  const col_vbo = create_vbo(color);
  // VBO を登録
  set_attribute([pos_vbo, col_vbo], attLocation, attStride);

  // IBOの生成
  const ibo = create_ibo(index);
  // IBO をバインドして登録
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
  // uniformLocationの取得
  const uniLocation = gl.getUniformLocation(prg, 'mvpMatrix');

  /* minMatrix.js を用いた行列関連処理 */
  // matIVオブジェクトを生成
  const m = new matIV();
  // 各種行列の生成と初期化
  const mMatrix = m.identity(m.create());
  const vMatrix = m.identity(m.create());
  const pMatrix = m.identity(m.create());
  const tmpMatrix = m.identity(m.create());
  const mvpMatrix = m.identity(m.create());

  // ビュー × プロジェクション座標変換行列
  m.lookAt([0.0, 0.0, 16.0], [0.0, 0.0, 0.0], [0.0, 1.0, 0.0], vMatrix);
  m.perspective(45, c.width / c.height, 0.1, 100, pMatrix);
  m.multiply(pMatrix, vMatrix, tmpMatrix);

  // カリングと深度テストを有効
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.enable(gl.CULL_FACE);
  
  let count = 0;
  loop();
  function loop() {
    requestAnimationFrame(loop);
    // canvas 初期化
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    count++;
    // count からラジアンを算出
    const rad = (count % 360) * Math.PI / 180;

    // モデル座標変換行列の生成
    m.identity(mMatrix);
    m.rotate(mMatrix, rad, [-0.3, 1.0, 0.8], mMatrix);
    m.multiply(tmpMatrix, mMatrix, mvpMatrix);
    gl.uniformMatrix4fv(uniLocation, false, mvpMatrix);
    
    //gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0);
    //gl.drawElements(gl.POINTS, index.length, gl.UNSIGNED_SHORT, 0);
    //gl.drawElements(gl.LINE, index.length, gl.UNSIGNED_SHORT, 0);
    //gl.drawElements(gl.LINE_STRIP, index.length, gl.UNSIGNED_SHORT, 0);
    gl.drawElements(gl.LINE_LOOP, index.length, gl.UNSIGNED_SHORT, 0);

    // コンテキストの再描画
    gl.flush();
  }

  /* シェーダを生成・コンパイル */
  function create_shader(id) {
    let shader;

    // HTMLからscriptタグへの参照を取得
    const scriptElement = document.querySelector(`#${id}`);
    // scriptタグが存在しない場合は抜ける
    if (!scriptElement) {
      return;
    }

    // scriptタグのtype属性をチェック
    switch (scriptElement.type) {
      case 'x-shader/x-vertex': // 頂点シェーダ
        shader = gl.createShader(gl.VERTEX_SHADER);
        break;
      case 'x-shader/x-fragment': // フラグメントシェーダ
        shader = gl.createShader(gl.FRAGMENT_SHADER);
        break;

      default:
        return;
    }
    // 生成されたシェーダにソースを割り当て
    gl.shaderSource(shader, scriptElement.text);
    gl.compileShader(shader);

    // シェーダが正しくコンパイルされたかチェック
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      return shader;
    } else {
      console.log(gl.getShaderInfoLog(shader));
    }
  }

  /* プログラムオブジェクトの生成とシェーダのリンク */
  function create_program(vs, fs) {
    const program = gl.createProgram();

    // プログラムオブジェクトにシェーダを割り当て
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);

    gl.linkProgram(program);

    // シェーダのリンクが正しく行なわれたかチェック
    if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
      // 成功していたらプログラムオブジェクトを有効
      gl.useProgram(program);

      return program;
    } else {
      console.log(gl.getProgramInfoLog(program));
    }
  }

  /* VBOを生成 */
  function create_vbo(data) {
    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    // バッファにデータをセット
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    // バッファのバインドを無効化
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    return vbo;
  }

  /* IBOを生成 */
  function create_ibo(data) {
    let ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    // バッファにデータをセット
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(data), gl.STATIC_DRAW
    );
    // バッファのバインドを無効化
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    return ibo;
  }

  /* VBOをバインドし登録 */
  function set_attribute(vbo, attL, attS) {
    for (const i in vbo) {
      gl.bindBuffer(gl.ARRAY_BUFFER, vbo[i]);
      // attributeLocationを有効にする
      gl.enableVertexAttribArray(attL[i]);
      // attributeLocationを通知し登録する
      gl.vertexAttribPointer(attL[i], attS[i], gl.FLOAT, false, 0, 0);
    }
  }
  
  function rndm() {
    const max = 1
    const min = -1
    const value = Math.random() * (max - min) + min;
    //console.log(value);
    return value / 1;
  }
  
  
  function torus(row, column, irad, orad) {
    const pos = new Array();
    const col = new Array();
    const idx = new Array();
    let r;
    for(let i = 0; i <= row; i++) {
      r = Math.PI * 2 / row * i;
      const rr = Math.cos(r);
      const ry = Math.sin(r);
      for(let ii = 0; ii <= column; ii++) {
        const tr = Math.PI * 2 / column * ii;
        const tx = (rr * irad + orad) * Math.cos(tr);
        const ty = ry * irad;
        const tz = (rr * irad + orad) * Math.sin(tr);
        pos.push(tx  + rndm(), ty  + rndm(), tz  + rndm());
        const tc = hsva(360 / column * ii, 1, 1, 1);
        col.push(tc[0], tc[1], tc[2], tc[3]);
      }
    }
    for(let i = 0; i < row; i++) {
      for(let ii = 0; ii < column; ii++) {
        r = (column + 1) * i + ii;
        idx.push(r, r + column + 1, r + 1);
        idx.push(r + column + 1, r + column + 2, r + 1);
      }
    }
    return [pos, col, idx];
  }
  
  // HSVカラー取得用関数
  function hsva(h, s, v, a) {
    if(s > 1 || v > 1 || a > 1) {
      return;
    }
    const th = h % 360;
    const i = Math.floor(th / 60);
    const f = th / 60 - i;
    const m = v * (1 - s);
    const n = v * (1 - s * f);
    const k = v * (1 - s * (1 - f));
    const color = new Array();
    
    if(!s > 0 && !s < 0) {
      color.push(v, v, v, a);
    } else {
      const r = new Array(v, n, m, m, k, v);
      const g = new Array(k, v, v, n, m, m);
      const b = new Array(m, m, k, v, v, n);
      //color.push(r[i], g[i], b[i], a);
      color.push(r[i], g[i], b[i], Math.abs(rndm()));
    }
    return color;
  }
}

