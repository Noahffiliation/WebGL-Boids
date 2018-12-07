function BirdFlock() {
  this.birds = [];
  this.pos = [0, 0, 0];
  this.vel = [0, .2, 0];
  this.addBirds = function (n = 10) {
    for (let i = 0; i < n; i++) {
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

  this.removeAll = function() {
    this.birds.forEach(bird => {
      bird.solid.kill = true;
    });
  }

  this.update = function () {
    let n = this.birds.length;
    if (n <= 0) return

    //calculate flock center & velocity
    let pos = [0, 0, 0];
    let vel = [0, 0, 0];
    for (let b of this.birds) {
      pos = v3.add(b.solid.pos, pos);
      vel = v3.add(b.vel, vel);
    }
    let temp_pos = [0, 0, 0];
    let temp_vel = [0, 0, 0];

    // use this.pos and this.vel from last update
    for (let b of this.birds) {
      temp_pos = v3.add(b.solid.pos, temp_pos);
      temp_vel = v3.add(b.vel, temp_vel);
      // toward flock (cohesion)
      let coh = v3.normalize(v3.subtract(this.pos, b.solid.pos));
      // in direction of flock (alignment)
      let ali = v3.normalize(this.vel);
      //away from other birds (separation)
      let sep = [0, 0, 0];
      for (let otherBird of this.birds) { //could improve efficiency
        if (otherBird == b) continue;
        let diff = v3.subtract(b.solid.pos, otherBird.solid.pos);
        let b_dist = v3.length(diff);
        if (b_dist > 10) {
          continue;
        }
        let b_dir = v3.normalize(diff);
        //longer distance, less effect;
        let b_effect = (10 - b_dist) / 100;
        let b_part = v3.mulScalar(b_dir, b_effect);
        sep = v3.add(sep, b_part);
      }
      sep = v3.normalize(sep);

      ali = v3.mulScalar(ali, .03)
      coh = v3.mulScalar(coh, .02)
      sep = v3.mulScalar(sep, .03)
      let heur_vel = v3.add(v3.add(ali, coh), sep);
      b.vel = v3.add(b.vel, heur_vel);
    }

    this.pos = v3.divScalar(pos, n);
    this.vel = v3.divScalar(vel, n);
  }
}

function MothFlock() {
  this.moths = [];
  this.pos = [10, 20, -100];
  this.vel = [-.5, 0, 0];
  this.addMoths = function(n = 10) {
    for (let i = 0; i < n; i++) {
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

  this.removeAll = function() {
    this.moths.forEach(moth => {
      moth.solid.kill = true;
    });
  }

  this.update = function() {
    let n = this.moths.length;
    if (n <= 0) return
    //calculate flock center & velocity
    let temp_pos = [0, 0, 0];
    let temp_vel = [0, 0, 0];

    // use this.pos and this.vel from last update

    for (let m of this.moths) {
      temp_pos = v3.add(m.solid.pos, temp_pos);
      temp_vel = v3.add(m.vel, temp_vel);

      // toward flock (cohesion)
      let coh = v3.normalize(v3.subtract(this.pos, m.solid.pos));
      // in direction of flock (alignment)
      let ali = v3.normalize(this.vel);

      //away from other birds (separation)
      let sep = [0, 0, 0];
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

      m.vel = v3.add(m.vel, heur_vel);
    }
    this.pos = v3.divScalar(temp_pos, n);
    this.vel = v3.divScalar(temp_vel, n);
  }
}

function Bird() {
  this.solid = new Pyramid();
  // each bird is responsible for making sure it gets drawn
  scene_objs.push(this.solid);
  this.vel = [0, 0, 1];
  this.update = function(t) {
    this.solid.move(this.vel)
  }
}

function Moth() {
  let s = new Cube();
  s.drawRotation = true;
  this.solid = s;
  scene_objs.push(this.solid);

  this.vel = [0, 0, 0];
  this.rxv = (Math.random() * 2) - 1;
  this.ryv = (Math.random() * 2) - 1;
  this.update = function(t) {
    this.solid.move(this.vel)
    this.solid.rot[0] = this.rxv * t;
    this.solid.rot[1] = this.ryv * t;
  }
}
