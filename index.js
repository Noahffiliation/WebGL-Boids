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

var scene_objs = [];

// var cube_info = {
//   pos: [0,0,0],
//   rot_x: 0,
//   rot_y: 0,
//   rot_z: 0,
//   scale: 0.5,
//   color: [1, 1, 0, 1],
//   buffer: cubeBuffer
// }
let a = new Cube();
a.pos = [0,1,0]
scene_objs.push(a);

// cube_info = {
//   pos: [0,0,0],
//   dir: [1,1,1],
//   scale: 0.5,
//   color: [1, 1, 0, 1],
// }

// let p = {
//   pos: [2,0,-10],
//   // dir: [1,1,1],
//   rot_x: 0,
//   rot_y: 0,
//   rot_z: 0,
//   scale: 0.5,
//   color: [1, 0, 0, 1],
//   buffer: pyrBuffer
// }

// let p = new Pyramid();
// scene_objs.push(p);

var camera_info = {
  pos: [0,0,100],
  tar: [0,0,0],
  up: [0,1,0],
  fov: 60 * 3.14 / 180,
  zNear: 1,
  zFar: 2000,
};

let flock = new Flock();
flock.addBirds();

function tick(time) {
  render(time);
  update(time);
  if (!done) requestAnimationFrame(tick)
}

function update(time){
  time *= 0.0005;
  flock.birds.forEach(b => b.update());
  flock.update();

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

function addVecRandomUniform(vec, amt=1) {
  vec[0] += (Math.random() - Math.random()) * amt;
  vec[1] += (Math.random() - Math.random()) * amt;
  vec[2] += (Math.random() - Math.random()) * amt;
  return vec;
}

function Flock() {
  this.birds = [];
  this.pos = [0,0,0];
  this.vel = [1,0,0];
  this.addBirds = function(n=10) {
    for (let i = 0; i < n; i++){
      let b = new Bird();
      b.vel = flock.vel;
      b.solid.pos = flock.pos;
      b.vel = addVecRandomUniform(b.vel, .01);
      b.solid.pos = addVecRandomUniform(b.solid.pos, 10);

      console.log(b.vel, b.solid.pos)

      b.solid.color = [Math.random(), Math.random(), Math.random(), 1]

      this.birds.push(b);
    }
  }
  this.update = function() {
    let n = this.birds.length;
    if (n <= 0) return 

    //calculate flock center & velection
    let pos = [0,0,0];
    let vel = [0,0,0];
    for (let b of this.birds) {
      pos = v3.add(b.solid.pos, pos);
      vel = v3.add(b.vel, vel);
    }
    this.pos = v3.divScalar(pos, n);
    this.vel = v3.divScalar(vel, n);
    
  }
}

function Bird() {
  this.solid = new Pyramid();
  // each bird is responsible for making sure it gets drawn
  scene_objs.push(this.solid);
  this.vel = [0,0,1];
  this.update = function() {
    this.solid.move(this.vel)
    console.log(this.vel)
  }
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