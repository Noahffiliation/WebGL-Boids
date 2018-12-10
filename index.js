var canvas = document.getElementById('canvas');
var gl = canvas.getContext('webgl2');
if (!gl) console.log('no gl!');
var cubeBuffer = generateCubeBuffer(gl, twgl);
var pyrBuffer = generatePyramidBuffer(gl, twgl);
var sqrBuffer = generateSqaureBuffer(gl, twgl);
var treeBuffer = generateTreeBuffer(gl, twgl);
var snowBuffer = generateSnowflakeBuffer(gl, twgl);

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

for (let i=0; i<100; i++){
  let pos = [-100 + Math.random() * 200, 0, -100 + Math.random() * 200];
  let tree = new Tree();
  tree.pos = pos;
  tree.color = [0,.5+Math.random()*.5,0,1]
  tree.scale = 1 + Math.random()*2;
  scene_objs.push(tree)
}

let snowflake = new Snowflake();
snowflake.solid.pos = [0, 100, 0];


var camera_info = {
  pos: [0,50,20],
  tar: [0,50,0],
  tar_offset: [0,0,0],
  up: UP,
  fov: 60 * 3.14 / 180,
  zNear: 1,
  zFar: 2000,
  vel: [0, 0, 0],
  baseZVel: -.4
};

let fSpawnTimer = 1000;
let lastUpdateTime = 0;
let flocks = [];

function tick(time) {
  render(time);
  update(time);
  if (!done) requestAnimationFrame(tick)
}

function update(time){
  let elapsedTime = time - lastUpdateTime;
  fSpawnTimer -= elapsedTime;
  if (fSpawnTimer <= 0) {
    // spawn flock
    let isBird = Math.random() < .5;
    let f = isBird ? new BirdFlock() : new MothFlock;
    let theta = Math.random() * Math.PI * 2;
    let dir = [Math.cos(theta), 0, Math.sin(theta)];
    let dist = 2000;
    let offset = v3.mulScalar(dir, dist);
    let pos = v3.add(offset, camera_info.pos);
    pos = v3.add(pos, [0, 10 + Math.random() * 300, 0]);
    f.pos = pos;
    let vel = .1 + Math.random() * .5;
    f.vel = v3.mulScalar(dir, -vel);
    
    let amt = 5 + Math.floor(Math.random() * 30);
    isBird ? f.addBirds(amt) : f.addMoths(amt);
    flocks.push(f);
    fSpawnTimer = 500 + Math.floor(Math.random() * 100)
  }
  let t = time * 0.001;

  for (let i in flocks) {
    let flock = flocks[i];
    if (outOfRange(flock)) {
      flock.removeAll();
      flocks.splice(i--, 1);
      continue;
    }
    flock.update();
    if (flock.birds) flock.birds.forEach(b => b.update(t));
    if (flock.moths) flock.moths.forEach(m => m.update(t));
  }
  snowflake.update(t);
  moveCamera(t);
  floor.pos[0] = camera_info.pos[0];
  floor.pos[2] = camera_info.pos[2];

  lastUpdateTime = time;
}

function outOfRange(obj) {
  let distsq = v3.distanceSq(obj.pos, camera_info.pos);
  return distsq >= 2500*2500;
}

function moveCamera(t) {
  if (keys[65]) camera_info.vel[0] = -.5;      //a
  else if (keys[68]) camera_info.vel[0] = .5;  //d
  else {
    camera_info.vel[0] *= .8;
    if (Math.abs(camera_info.vel[0] < .01)) camera_info.vel[0] = 0;
  } 
  if (keys[87]) camera_info.vel[2] = -.5;      //w
  else if (keys[83]) camera_info.vel[2] = .5; //s
  else {
    camera_info.vel[2] *= .8;
    if (Math.abs(camera_info.vel[2] < .01)) camera_info.vel[2] = 0;
  }

  camera_info.vel[1] = Math.sin(2*t) * .1
  camera_info.pos = v3.add(camera_info.pos, camera_info.vel)
  camera_info.pos[2] += camera_info.baseZVel;

  if (keys[37]) { //left
    camera_info.tar_offset[0] -= .1;
  }
  else if (keys[39]) { //right
    camera_info.tar_offset[0] += .1;
  } else {
    camera_info.tar_offset[0] *= .9;
    if (Math.abs(camera_info.tar_offset[0]) < .01) camera_info.tar_offset[0] = 0;
  }
  if (keys[38]) { //up
    camera_info.tar_offset[1] += .1;
  }
  else if (keys[40]) { //down
    camera_info.tar_offset[1] -= .1;
  } else {
    camera_info.tar_offset[1] *= .9;
    if (Math.abs(camera_info.tar_offset[1]) < .01) camera_info.tar_offset[1] = 0;
  }

  camera_info.tar_offset[2] = -VIEW_PLANE_DIST
  camera_info.tar = v3.add(camera_info.pos, camera_info.tar_offset)
}

function render() {
  twgl.resizeCanvasToDisplaySize(canvas);
  gl.viewport(0, 0, canvas.width, canvas.height);
  const aspect = canvas.clientWidth / canvas.clientHeight;
  const view_matrix = m4.inverse(m4.lookAt(camera_info.pos, camera_info.tar, camera_info.up));
  const proj_matrix = m4.perspective(camera_info.fov, aspect, camera_info.zNear, camera_info.zFar);
  
  gl.useProgram(programInfo.program);

  //gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);

  for (let i in scene_objs) {
    let obj_info = scene_objs[i];
    if (obj_info.kill === true) {
      scene_objs.splice(i--, 1);
      continue;
    }
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

function Cube() {
  Solid.call(this, cubeBuffer)
}

function Pyramid() {
  Solid.call(this, pyrBuffer)
}

function Square() {
  Solid.call(this, sqrBuffer)
}

function Tree() {
  Solid.call(this, treeBuffer)
}

function SnowflakeSolid() {
  Solid.call(this, snowBuffer)
  this.color = [1,1,1,1]
  // this.scale = 0.12
  this.drawRotation = true;
}

function Snowflake() {
  this.solid = new SnowflakeSolid();
  scene_objs.push(this.solid);
  this.vel = [0, -0.4, 0];
  this.update = function(t) {
    this.solid.move(this.vel)
    this.solid.rot = [0, 2*t, 0];
  }
  this.kill = function() {
    this.solid.kill = true;
  }
}