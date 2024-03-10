let myShader
function setupShader() {
  sg = createGraphics(D, D, WEBGL);
  // uniform float c[20];
  let frag = `
    precision highp float;
    varying vec2 vPos;
  
    uniform sampler2D noise_tex;
    uniform float progress;
  
    mat2 rotate(float a){
        return mat2(cos(a),-sin(a),
                    sin(a),cos(a));
    }
    
    void main() {
      vec2 uv = vPos.xy*vec2(1., -1.)/2.+.5;
      gl_FragColor = texture2D(my_tex, vec2(uv.x, 1.-uv.y));
    }`
  myShader = sg.createShader(vert, frag);
  sg.shader(myShader);
  sg.noStroke()

  addNoiseTex()

  updateShader()
}

function updateShader() {
  sg.quad(-1, -1, 1, -1, 1, 1, -1, 1)
}

let vert = `
    precision highp float; 
    varying vec2 vPos;
    attribute vec3 aPosition;
  void main() {
    vPos = (gl_Position = vec4(aPosition, 1.0)).xy;
  }`;

function addNoiseTex() {
  let noiseTex = createGraphics(D, D)
  noiseTex.noStroke()
  let gap = 1
  for (let i = 0; i < D; i += gap) {
    for (let j = 0; j < D; j += gap) {
      let m = 400
      let m2 = map(sn(i / m, j / m, 100), -1, 1, 60, 200)
      let f = sn(i / m2, j / m2) + sn(i / 30, j / 30, 200) / 10

      noiseTex.fill(map(f, -1.1, 1.1, 0, 255))
      noiseTex.rect(i, j, gap)
    }
  }
  // image(noiseTex, 0, 0, D, D)
  myShader.setUniform('noise_tex', noiseTex)
}