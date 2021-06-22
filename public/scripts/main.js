import matIV from "./minMatrixES6.js";


window.addEventListener('load', init);

function init() {
  // 画面サイズからcanvasのサイズを確定
  const width = document.querySelector('.wrap').clientWidth;
  const height = width * 0.8;
  
  const c = document.querySelector('#myCanvas');  // canvasエレメントを取得
  c.width = width;
  c.height = height;
  
  const gl = c.getContext('webgl');  // webglコンテキスト取得
  // canvasを黒でクリア(初期化)
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  
  gl.clearDepth(1.0);  // canvasを初期化する際の深度を設定
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);  // canvasを初期化
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
  attStride[0] = 3;    // xyz の3要素
  attStride[1] = 4;    // color 情報

  // 頂点の位置情報を格納する配列
  const vertex_position = [
    // x,   y,   z,
     0.0, 1.0, 0.0,
     1.0, 0.0, 0.0,
    -1.0, 0.0, 0.0
  ];
  
  // 頂点の色情報を格納する配列
  const vertex_color = [
    1.0, 0.0, 0.0, 1.0,
    0.0, 1.0, 0.0, 1.0,
    0.0, 0.0, 1.0, 1.0
  ];
  
  // VBOの生成
  const position_vbo = create_vbo(vertex_position);
  const color_vbo = create_vbo(vertex_color);
  
  // VBOをバインドし登録する(位置情報)
  gl.bindBuffer(gl.ARRAY_BUFFER, position_vbo);
  gl.enableVertexAttribArray(attLocation[0]);
  gl.vertexAttribPointer(attLocation[0], attStride[0], gl.FLOAT, false, 0, 0);
  
  // VBOをバインドし登録する(色情報)
  gl.bindBuffer(gl.ARRAY_BUFFER, color_vbo);
  gl.enableVertexAttribArray(attLocation[1]);
  gl.vertexAttribPointer(attLocation[1], attStride[1], gl.FLOAT, false, 0, 0);
  
  /* minMatrix.js を用いた行列関連処理 */
  const m = new matIV();  // matIVオブジェクトを生成
  // 各種行列の生成と初期化
  const mMatrix = m.identity(m.create());
  const vMatrix = m.identity(m.create());
  const pMatrix = m.identity(m.create());
  const mvpMatrix = m.identity(m.create());
  
  // ビュー座標変換行列
  m.lookAt([0.0, 1.0, 3.0],
           [0.0, 0.0, 0.0],
           [0.0, 1.0, 0.0],
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
  const uniLocation = gl.getUniformLocation(prg, 'mvpMatrix');  // uniformLocationの取得
  gl.uniformMatrix4fv(uniLocation, false, mvpMatrix);  // uniformLocationへ座標変換行列を登録
  gl.drawArrays(gl.TRIANGLES, 0, 3);  // モデルの描画
  //console.log({gl});
  gl.flush();  // コンテキストの再描画
  

  /* シェーダを生成・コンパイルする関数 */
  function create_shader(id) {
    let shader;  // シェーダを格納する変数
    const scriptElement = document.getElementById(id);  // HTMLからscriptタグへの参照を取得
    // scriptタグが存在しない場合は抜ける
    if (!scriptElement) { return; }
    // scriptタグのtype属性をチェック
    switch (scriptElement.type) {
      case 'x-shader/x-vertex':  // 頂点シェーダの場合
        shader = gl.createShader(gl.VERTEX_SHADER);
        break;
      case 'x-shader/x-fragment':  // フラグメントシェーダの場合
        shader = gl.createShader(gl.FRAGMENT_SHADER);
        break;
      default :
        return;
    }
    
    gl.shaderSource(shader, scriptElement.text);  // 生成されたシェーダにソースを割り当て
    gl.compileShader(shader);  // シェーダをコンパイル
    // シェーダが正しくコンパイルされたかチェック
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      //console.log({shader});
      return shader;  // 成功していたらシェーダを返し終了
    } else {
      alert(gl.getShaderInfoLog(shader));  // 失敗していたらエラーログをアラート
    }
  }
  
  /* プログラムオブジェクトの生成とシェーダのリンク */
  function create_program(vs, fs) {
    const program = gl.createProgram();  // プログラムオブジェクトの生成
    // プログラムオブジェクトにシェーダを割り当て
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    
    gl.linkProgram(program);  // シェーダをリンク
    // シェーダのリンクが正しく行なわれたかチェック
    if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.useProgram(program);  // 成功していたらプログラムオブジェクトを有効
      //console.log({program});
      return program;  // プログラムオブジェクトを返して終了
    } else {
      alert(gl.getProgramInfoLog(program));  // 失敗していたらエラーログをアラート
    }
  }
  
  /* VBOを生成する関数 */
  function create_vbo(data) {
    const vbo = gl.createBuffer();  // バッファオブジェクトの生成
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);  // バッファをバインド
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);  // バッファにデータをセット
    gl.bindBuffer(gl.ARRAY_BUFFER, null);  // バッファのバインドを無効化
    return vbo;  // 生成した VBO を返して終了
  }
}

