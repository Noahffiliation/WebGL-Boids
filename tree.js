function generateTreeBuffer(gl, twgl) {
  // 1 cube beneath 2 square pyramids.
  // origin is at the center of the bottom face (square) of the tree.
  const array = {
    position: [-1,0,-1,-1,0,1,-1,2,-1,-1,2,1,1,0,-1,1,0,1,1,2,-1,1,2,1,0,8,0,-2,2,-2,-2,2,2,2,2,2,2,2,-2,0,11,0,-2,5,-2,-2,5,2,2,5,2,2,5,-2],
    indices: [0,1,2,2,1,3,1,0,4,1,4,5,0,2,4,4,2,6,5,4,6,5,6,7,2,3,6,6,3,7,3,1,5,3,5,7,8,10,9,8,11,10,8,12,11,8,9,12,9,10,11,9,11,12,13,15,14,13,16,15,13,17,16,13,14,17,14,15,16,14,16,17]
  };

  const buffer = twgl.createBufferInfoFromArrays(gl, array);
  return buffer;
}
