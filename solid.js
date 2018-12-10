function Solid(buffer) {
  this.kill = false;
  this.pos = [0,0,0];
  this.dir = [0,0,1];
  this.scale = 1;
  this.color = [1, 0, 1, 1];
  this.buffer = buffer;
  
  this.drawRotation = false;
  this.rot = [0,0,0];
  
  this.move = function(v) {
    v3.add(this.pos, v, this.pos);
  }
}
