var canvas = document.getElementById('canvas');
var gl = canvas.getContext('webgl2');
if (!gl) console.log('no gl!');
var cubeBuffer = generateCubeBuffer(gl, twgl);
var pyrBuffer = generatePyramidBuffer(gl, twgl);
var sqrBuffer = generateSqaureBuffer(gl, twgl);

var programInfo = twgl.createProgramInfo(gl, ["3d-vertex-shader", "3d-fragment-shader"]);
var m4 = twgl.m4;
var v3 = twgl.v3;

const UP = [0, 1, 0];
const VIEW_PLANE_DIST = 5; //Camera's target lies on a plane this far from it.

var keys = {};

var done = false;


twgl.resizeCanvasToDisplaySize(gl.canvas);

var scene_objs = [];

let floor = new Square();
floor.drawRotation = true;
floor.rot[0] = 3.14/2;
floor.pos = [0, 0, 0]
floor.color = [.7,.7,.7, 1]
floor.scale = 1000;
scene_objs.push(floor)


var camera_info = {
  pos: [0,10,20],
  tar: [0,10,0],
  tar_offset: [0,0,0],
  up: UP,
  fov: 60 * 3.14 / 180,
  zNear: 1,
  zFar: 2000,
  vel: [0, 0, 0]
};

let flock = new BirdFlock();
flock.addBirds();

let flock2 = new MothFlock();
flock2.addMoths(50);

function tick(time) {
  render(time);
  update(time);
  if (!done) requestAnimationFrame(tick)
}

function update(time){
  time *= 0.001;
  flock.birds.forEach(b => b.update());
  flock.update();
  flock2.moths.forEach(b => b.update(time));
  flock2.update();
  moveCamera();
}

function moveCamera() {
  if (keys[37] || keys[65]) { //left
    camera_info.tar_offset[0] -= .1;
  }
  else if (keys[39] || keys[68]) { //right
    camera_info.tar_offset[0] += .1;
  } else {
    camera_info.tar_offset[0] *= .9;
    if (Math.abs(camera_info.tar_offset[0]) < .01) camera_info.tar_offset[0] = 0;
  }
  if (keys[38] || keys[87]) { //up
    camera_info.tar_offset[1] += .1;
  }
  else if (keys[40] || keys[83]) { //down
    camera_info.tar_offset[1] -= .1;
  } else {
    camera_info.tar_offset[1] *= .9;
    if (Math.abs(camera_info.tar_offset[1]) < .01) camera_info.tar_offset[1] = 0;
  }
  camera_info.tar_offset[2] = -VIEW_PLANE_DIST
  camera_info.tar = v3.add(camera_info.pos, camera_info.tar_offset)
  camera_info.pos = v3.add(camera_info.pos, camera_info.vel)

}

function render() {
  twgl.resizeCanvasToDisplaySize(canvas);
  gl.viewport(0, 0, canvas.width, canvas.height);
  const aspect = canvas.clientWidth / canvas.clientHeight;
  const view_matrix = m4.inverse(m4.lookAt(camera_info.pos, camera_info.tar, camera_info.up));
  const proj_matrix = m4.perspective(camera_info.fov, aspect, camera_info.zNear, camera_info.zFar);
  
  gl.useProgram(programInfo.program);

  gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);

  for (let obj_info of scene_objs) {
    let uniforms = {
      view_matrix: view_matrix,
      proj_matrix: proj_matrix,
      model_matrix: model_matrix(obj_info),
      color: obj_info.color,
    };
    twgl.setBuffersAndAttributes(gl, programInfo, obj_info.buffer);
    twgl.setUniforms(programInfo, uniforms);
    twgl.drawBufferInfo(gl, obj_info.buffer);
  }
}

function model_matrix(info) {
  var T = m4.translation(info.pos);
  var S = m4.scaling([info.scale, info.scale, info.scale]);
  var R;
  if (info.drawRotation) {
    var Rx = m4.rotationX(info.rot[0]);
    var Ry = m4.rotationY(info.rot[1]);
    var Rz = m4.rotationZ(info.rot[2]);
    R = m4.multiply(Rx, m4.multiply(Ry, Rz));
  } else {
    R = lookTo(info.dir, UP)
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

function randomUniformVec(scale=1) {
  let newV = [0,0,0];
  newV[0] = (Math.random() - Math.random()) * scale;
  newV[1] = (Math.random() - Math.random()) * scale;
  newV[2] = (Math.random() - Math.random()) * scale;
  return newV
}

function lookTo(dir, up) {
  let matrix = m4.identity()
  dir = v3.normalize(dir); //maybe unnecessary
  m4.setAxis(matrix, dir, 2, matrix);
  let x_dir = v3.normalize(v3.cross(dir, up));
  m4.setAxis(matrix, x_dir, 0, matrix);
  let y_dir = v3.cross(x_dir, dir);
  m4.setAxis(matrix, y_dir, 1, matrix);
  return matrix;
}

function Solid(buffer) {
  this.pos = [0,0,0];
  this.dir = [0,0,1];
  this.scale = 1;
  this.color = [1, 1, 0, 1];
  this.buffer = buffer;
  
  this.drawRotation = false;
  this.rot = [0,0,0];
  
  this.move = function(v) {
    v3.add(this.pos, v, this.pos);
  }
}

function Cube() {
  Solid.call(this, cubeBuffer)
}

function Pyramid() {
  Solid.call(this, pyrBuffer)
}

function Square() {
  Solid.call(this, sqrBuffer)
}