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
flock2.addMoths();

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

function BirdFlock() {
  this.birds = [];
  this.pos = [0,0,0];
  this.vel = [.1,.2,0];
  this.addBirds = function(n=10) {
    for (let i = 0; i < n; i++){
      let b = new Bird();
      b.vel = this.vel;
      b.solid.pos = this.pos;
      b.vel = v3.add(randomUniformVec(.01), b.vel);
      b.solid.pos = v3.add(randomUniformVec(3), b.solid.pos);
      b.solid.dir = v3.normalize(b.vel)

      b.solid.color = [Math.random(), Math.random(), Math.random(), 1]

      this.birds.push(b);
    }
  }
  this.update = function() {
    let n = this.birds.length;
    if (n <= 0) return 

    //calculate flock center & velocity
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

function MothFlock() {
  this.moths = [];
  this.pos = [10,20,-100];
  this.vel = [-.5, 0, 0];
  this.addMoths = function(n=10) {
    for (let i = 0; i < n; i++){
      let m = new Moth();
      m.vel = this.vel;
      m.solid.pos = this.pos;
      m.vel = v3.add(randomUniformVec(.05), m.vel);
      m.solid.pos = v3.add(randomUniformVec(10), m.solid.pos);
      m.solid.dir = v3.normalize(m.vel)
      m.solid.color = [Math.random(), Math.random(), Math.random(), 1]

      this.moths.push(m);
    }
  }
  this.update = function() {
    let n = this.moths.length;
    if (n <= 0) return 
    //calculate flock center & velocity
    let temp_pos = [0,0,0];
    let temp_vel = [0,0,0];

    // use this.pos and this.vel from last update

    for (let m of this.moths) {
      temp_pos = v3.add(m.solid.pos, temp_pos);
      temp_vel = v3.add(m.vel, temp_vel);

      // toward flock (cohesion)
      let coh = v3.normalize(v3.subtract(this.pos, m.solid.pos));
      // in direction of flock (alignment)
      let ali = v3.normalize(this.vel);

      //away from other birds (separation)
      let sep = [0,0,0];
      for (let otherMoth of this.moths) { //could improve efficiency
        if (otherMoth == m) continue;
        let diff = v3.subtract(m.solid.pos, otherMoth.solid.pos);
        let m_dist = v3.length(diff);
        if (m_dist > 10) {
          continue;
        } 
        let m_dir = v3.normalize(diff);
        //longer distance, less effect;
        let m_effect = (10 - m_dist) / 100;
        let m_part = v3.mulScalar(m_dir, m_effect);
        sep = v3.add(sep, m_part);
      }
      sep = v3.normalize(sep);
      // arbitrary weights
      ali = v3.mulScalar(ali, .01)
      coh = v3.mulScalar(coh, .02)
      sep = v3.mulScalar(sep, .015)
      let heur_vel = v3.add(v3.add(ali, coh), sep);

      m.vel = v3.add(m.vel, heur_vel)
      // m.vel = v3.add(orig_vel, heur_vel); //m.vel length = 2

      // scal_vel = .8 * (scal_vel) + .2 *(v3.length(this.vel))
      // scal_vel /= 2;
      // m.vel = v3.mulScalar(m.vel, scal_vel)
    }
    this.pos = v3.divScalar(temp_pos, n);
    this.vel = v3.divScalar(temp_vel, n);
  }
}

function Bird() {
  this.solid = new Pyramid();
  // each bird is responsible for making sure it gets drawn
  scene_objs.push(this.solid);
  this.vel = [0,0,1];
  this.update = function() {
    this.solid.move(this.vel)
  }
}

function Moth() {
  let s = new Cube();
  s.drawRotation = true;
  this.solid = s;
  scene_objs.push(this.solid);

  this.vel = [0,0,0];
  this.rxv = (Math.random()*2) - 1;
  this.ryv = (Math.random()*2) - 1;
  this.update = function(t) {
    this.solid.move(this.vel)
    this.solid.rot[0] = this.rxv * t;
    this.solid.rot[1] = this.ryv * t;
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

function Square() {
  Solid.call(this, sqrBuffer)
}