import matIV from "./minMatrixES6.js";


window.addEventListener('load', init);

function init() {
  // 画面サイズからcanvasのサイズを確定
  const width = document.querySelector('.wrap').clientWidth;
  const height = width * 0.8;
  
  // canvasエレメントを取得
  const c = document.querySelector('#myCanvas');
  c.width = width;
  c.height = height;
  
  // webglコンテキスト取得
  const gl = c.getContext('webgl');
  // canvasを黒でクリア(初期化)
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  // canvasを初期化する際の深度を設定
  gl.clearDepth(1.0);

  // canvasを初期化
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
  // 頂点シェーダとフラグメントシェーダの生成
  const v_shader = create_shader('vs');
  const f_shader = create_shader('fs');
  
  // プログラムオブジェクトの生成とリンク
  const prg = create_program(v_shader, f_shader);
  // attributeLocationの取得
  const attLocation = gl.getAttribLocation(prg, 'position');
  // attributeの要素数(この場合は xyz の3要素)
  const attStride = 3;
  // モデル(頂点)データ
  const vertex_position = [
    // x,   y,   z,
     0.0, 1.0, 0.0,
     1.0, 0.0, 0.0,
    -1.0, 0.0, 0.0
  ];
  // VBOの生成
  const vbo = create_vbo(vertex_position);
  // VBOをバインド
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  // attribute属性を有効にする
  gl.enableVertexAttribArray(attLocation);
  // attribute属性を登録
  gl.vertexAttribPointer(attLocation, attStride, gl.FLOAT, false, 0, 0);
  
  // minMatrix.js を用いた行列関連処理
  // matIVオブジェクトを生成
  const m = new matIV();
  // 各種行列の生成と初期化
  const mMatrix = m.identity(m.create());
  const vMatrix = m.identity(m.create());
  const pMatrix = m.identity(m.create());
  const mvpMatrix = m.identity(m.create());
  
  // ビュー座標変換行列
  m.lookAt([0.0, 1.0, 3.0],
           [  0,   0,   0],
           [  0,   1,   0],
           vMatrix);
  
  // プロジェクション座標変換行列
  m.perspective(90,
                c.width / c.height,
                0.1,
                100,
                pMatrix);
  
  // 各行列を掛け合わせ座標変換行列を完成させる
  m.multiply(pMatrix, vMatrix, mvpMatrix);
  m.multiply(mvpMatrix, mMatrix, mvpMatrix);
  
  // uniformLocationの取得
  const uniLocation = gl.getUniformLocation(prg, 'mvpMatrix');
  // uniformLocationへ座標変換行列を登録
  gl.uniformMatrix4fv(uniLocation, false, mvpMatrix);
  // モデルの描画
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  // コンテキストの再描画
  gl.flush();
  

  // シェーダを生成・コンパイルする関数
  function create_shader(id) {
    // シェーダを格納する変数
    let shader;
    // HTMLからscriptタグへの参照を取得
    const scriptElement = document.getElementById(id);
  
    // scriptタグが存在しない場合は抜ける
    if (!scriptElement) { return; }
    // scriptタグのtype属性をチェック
    switch (scriptElement.type) {
      // 頂点シェーダの場合
      case 'x-shader/x-vertex':
        shader = gl.createShader(gl.VERTEX_SHADER);
        break;
      // フラグメントシェーダの場合
      case 'x-shader/x-fragment':
        shader = gl.createShader(gl.FRAGMENT_SHADER);
        break;
      default :
        return;
    }
    // 生成されたシェーダにソースを割り当て
    gl.shaderSource(shader, scriptElement.text);
    // シェーダをコンパイル
    gl.compileShader(shader);
    // シェーダが正しくコンパイルされたかチェック
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      // 成功していたらシェーダを返し終了
      return shader;
    } else {
      // 失敗していたらエラーログをアラート
      alert(gl.getShaderInfoLog(shader));
    }
  }
  
  // プログラムオブジェクトの生成とシェーダのリンク
  function create_program(vs, fs) {
    // プログラムオブジェクトの生成
    const program = gl.createProgram();
    // プログラムオブジェクトにシェーダを割り当て
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    // シェーダをリンク
    gl.linkProgram(program);
    // シェーダのリンクが正しく行なわれたかチェック
    if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
      // 成功していたらプログラムオブジェクトを有効
      gl.useProgram(program);
      // プログラムオブジェクトを返して終了
      return program;
    } else {
      // 失敗していたらエラーログをアラート
      alert(gl.getProgramInfoLog(program));
    }
  }
  
  // VBOを生成する関数
  function create_vbo(data) {
    // バッファオブジェクトの生成
    const vbo = gl.createBuffer();
    // バッファをバインド
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    // バッファにデータをセット
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    // バッファのバインドを無効化
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    // 生成した VBO を返して終了
    return vbo;
  }
  
}

