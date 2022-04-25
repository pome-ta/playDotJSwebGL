import matIV from './minMatrixES6.js';

window.addEventListener('load', init);

function init() {
  // 画面サイズからcanvasのサイズを確定
  const width = document.querySelector('.wrap').clientWidth;
  const height = width * 0.8;

  // チェックボックスたち
  const che_culling = document.getElementById('cull');
  const che_front = document.getElementById('front');
  const che_depth_test = document.getElementById('depth');

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

  // 頂点の位置情報を格納する配列
  const position = [
    // x,   y,   z,
     0.0,  1.0,  0.0,
     1.0,  0.0,  0.0,
    -1.0,  0.0,  0.0,
     0.0, -1.0,  0.0,
  ];
  // 頂点の色情報を格納する配列
  const color = [
    1.0, 0.0, 0.0, 1.0,
    0.0, 1.0, 0.0, 1.0,
    0.0, 0.0, 1.0, 1.0,
    1.0, 1.0, 1.0, 1.0,
  ];
  // 頂点のインデックスを格納する配列
  const index = [0, 1, 2, 1, 2, 3];

  // VBOの生成
  const pos_vbo = create_vbo(position);
  const col_vbo = create_vbo(color);
  // VBO を登録する
  set_attribute([pos_vbo, col_vbo], attLocation, attStride);

  // IBOの生成
  const ibo = create_ibo(index);
  // IBOをバインドして登録する
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
  m.lookAt([0.0, 0.0, 5.0], [0.0, 0.0, 0.0], [0.0, 1.0, 0.0], vMatrix);
  m.perspective(45, c.width / c.height, 0.1, 100, pMatrix);
  m.multiply(pMatrix, vMatrix, tmpMatrix);

  let count = 0;

  // 深度テストの比較方法を指定
  gl.depthFunc(gl.LEQUAL);

  loop();
  function loop() {
    requestAnimationFrame(loop);

    if (che_culling.checked) {
      gl.enable(gl.CULL_FACE);
    } else {
      gl.disable(gl.CULL_FACE);
    }
    if (che_front.checked) {
      gl.frontFace(gl.CCW);
    } else {
      gl.frontFace(gl.CW);
    }
    if (che_depth_test.checked) {
      gl.enable(gl.DEPTH_TEST);
    } else {
      gl.disable(gl.DEPTH_TEST);
    }

    // canvas 初期化
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    count++;
    // count からラジアンを算出
    const rad = ((count % 360) * Math.PI) / 180;
    const x = Math.cos(rad) * 1.5;
    const z = Math.sin(rad) * 1.5;

    // モデル座標変換行列の生成(X軸による回転)
    m.identity(mMatrix);
    m.translate(mMatrix, [x, 0.0, z], mMatrix);
    m.rotate(mMatrix, rad, [1, 0, 0], mMatrix);
    m.multiply(tmpMatrix, mMatrix, mvpMatrix);
    gl.uniformMatrix4fv(uniLocation, false, mvpMatrix);
    gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0);

    // モデル座標変換行列の生成(Y軸による回転)
    m.identity(mMatrix);
    m.translate(mMatrix, [-x, 0.0, -z], mMatrix);
    m.rotate(mMatrix, rad, [0, 1, 0], mMatrix);
    m.multiply(tmpMatrix, mMatrix, mvpMatrix);
    gl.uniformMatrix4fv(uniLocation, false, mvpMatrix);
    gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0);

    // コンテキストの再描画
    gl.flush();
  }

  /* シェーダを生成・コンパイル */
  function create_shader(id) {
    let shader;

    // HTMLからscriptタグへの参照を取得
    const scriptElement = document.getElementById(id);
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
      alert(gl.getShaderInfoLog(shader));
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
      alert(gl.getProgramInfoLog(program));
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
    gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      new Int16Array(data),
      gl.STATIC_DRAW
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
}
