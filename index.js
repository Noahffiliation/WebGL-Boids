var canvas = document.getElementById('canvas');
var gl = canvas.getContext('webgl2');
if (!gl) console.log('no gl!');
var cubeBuffer = generateCubeBuffer(gl, twgl);
var pyrBuffer = generatePyramidBuffer(gl, twgl);

var programInfo = twgl.createProgramInfo(gl, ["3d-vertex-shader", "3d-fragment-shader"]);
var m4 = twgl.m4;
var v3 = twgl.v3;

var keys = {};

var done = false;


twgl.resizeCanvasToDisplaySize(gl.canvas);
var cube_info = {
  pos: [0,0,0],
  rot_x: 0,
  rot_y: 0,
  rot_z: 0,
  scale: 0.5,
  color: [1, 1, 0, 1],
}

// cube_info = {
//   pos: [0,0,0],
//   dir: [1,1,1],
//   scale: 0.5,
//   color: [1, 1, 0, 1],
// }

var pyr_info = {
  pos: [0,0,-.5],
  // dir: [1,1,1],
  rot_x: 0,
  rot_y: 0,
  rot_z: 0,
  scale: 0.5,
  color: [1, 0, 0, 1],
}

var camera_info = {
  pos: [0,0,5],
  tar: [0,0,0],
  up: [0,1,0],
  fov: 60 * 3.14 / 180,
  zNear: 0.1,
  zFar: 100,
};

function tick(time) {
  render(time);
  update(time);
  if (!done) requestAnimationFrame(tick)
}

function update(time){
  time *= 0.0005;
  pyr_info.rot_x = time * 1.2;
  pyr_info.rot_y = -time;
  // cube_info.pos[2] -= .001
  // cube_info.pos[1] -= .001

  moveCamera();
}

function moveCamera() {
  if (keys[37] || keys[65]) { //left
    camera_info.tar[0] -= .1;
  }
  else if (keys[39] || keys[68]) { //right
    camera_info.tar[0] += .1;
  } else {
    camera_info.tar[0] *= .9;
    if (Math.abs(camera_info.tar[0]) < .01) camera_info.tar[0] = 0;
  }
  if (keys[38] || keys[87]) { //up
    camera_info.tar[1] += .1;
  }
  else if (keys[40] || keys[83]) { //down
    camera_info.tar[1] -= .1;
  } else {
    camera_info.tar[1] *= .9;
    if (Math.abs(camera_info.tar[1]) < .01) camera_info.tar[1] = 0;
  }

}

function render(time) {

  twgl.resizeCanvasToDisplaySize(canvas);
  gl.viewport(0, 0, canvas.width, canvas.height);
  const aspect = canvas.clientWidth / canvas.clientHeight;
  const view_matrix = m4.inverse(m4.lookAt(camera_info.pos, camera_info.tar, camera_info.up));
  const proj_matrix = m4.perspective(camera_info.fov, aspect, camera_info.zNear, camera_info.zFar);
  
  gl.useProgram(programInfo.program);

  gl.enable(gl.CULL_FACE);
  // gl.enable(gl.DEPTH_TEST);

  let uniforms = {
    view_matrix: view_matrix,
    proj_matrix: proj_matrix,
    model_matrix: model_matrix(cube_info),
    color: cube_info.color,
  };
  twgl.setBuffersAndAttributes(gl, programInfo, cubeBuffer);
  twgl.setUniforms(programInfo, uniforms);
  twgl.drawBufferInfo(gl, cubeBuffer);

  gl.useProgram(programInfo.program);

  uniforms = {
    view_matrix: view_matrix,
    proj_matrix: proj_matrix,
    model_matrix: model_matrix(pyr_info),
    color: pyr_info.color,
  };
  twgl.setBuffersAndAttributes(gl, programInfo, pyrBuffer);
  twgl.setUniforms(programInfo, uniforms);
  twgl.drawBufferInfo(gl, pyrBuffer);
}

function model_matrix(info) {
  var T = m4.translation(info.pos);
  var S = m4.scaling([info.scale, info.scale, info.scale]);
  var R;
  if (info.rot_x != null) {
    var Rx = m4.rotationX(info.rot_x);
    var Ry = m4.rotationY(info.rot_y);
    var Rz = m4.rotationZ(info.rot_z);
    R = m4.multiply(Rx, m4.multiply(Ry, Rz));
  } else {
    R = m4.identity()
    info.dir = v3.normalize(info.dir);
    m4.setAxis(R, info.dir, 2, R);
    let up = [0, 1, 0];
    let x_dir = v3.normalize(v3.cross(info.dir, up));
    m4.setAxis(R, x_dir, 0, R);
    let y_dir = v3.cross(x_dir, info.dir);
    m4.setAxis(R, y_dir, 1, R);
  }
  var M = m4.multiply(T, m4.multiply(R, S));
  return M;
}

onkeydown = e => {
  let k = e.keyCode;
  keys[k] = true;
}

onkeyup = e => {
  let k = e.keyCode;
  keys[k] = false;
}
requestAnimationFrame(tick);
