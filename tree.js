function generateTreeBuffer(gl, twgl) {
  stumpPositions = [
    -1,-1,-1, // 0
    -1,-1, 1, // 1
    -1, 1,-1, // 2
    -1, 1, 1, // 3
     1,-1,-1, // 4
     1,-1, 1, // 5
     1, 1,-1, // 6
     1, 1, 1, // 7
  ];
  for (let i=1; i<stumpPositions.length; i+=3) {
    //increase y values
    stumpPositions[i] += 1;
  }
  stumpIdx = [
    0, 1, 2, // 0, 1, 2, 3
    2, 1, 3, // -x
    1, 0, 4, // 0, 1, 4, 5
    1, 4, 5, // -y
    0, 2, 4, // 0, 2, 4, 6
    4, 2, 6, // -z
    5, 4, 6, // 4, 5, 6, 7
    5, 6, 7, // +x
    2, 3, 6, // 2, 3, 6, 7
    6, 3, 7, // +y
    3, 1, 5, // 1, 3, 5, 7
    3, 5, 7, // +z
  ];

  midPositions = [
     0, 4, 0, // 0
    -2,-2,-2, // 1
    -2,-2, 2, // 2
     2,-2, 2, // 3
     2,-2,-2, // 4
  ];
  for (let i=1; i<midPositions.length; i+=3) {
    //increase y values
    midPositions[i] += 4;
  }

  midIdx = [
    // 4 triangles
    0, 2, 1,
    0, 3, 2,
    0, 4, 3,
    0, 1, 4,
    // 1 quad
    1, 2, 3,
    1, 3, 4,
  ];
  for (let i in midIdx) {
    //increase indices
    midIdx[i] += 8;
  }
  topPositions = [
    0, 4, 0, // 0
    -2,-2,-2, // 1
    -2,-2, 2, // 2
     2,-2, 2, // 3
     2,-2,-2, // 4
  ];
  for (let i=1; i<topPositions.length; i+=3) {
    //increase y values
    topPositions[i] += 7;
  }
  topIdx = [
    // 4 triangles
    0, 2, 1,
    0, 3, 2,
    0, 4, 3,
    0, 1, 4,
    // 1 quad
    1, 2, 3,
    1, 3, 4,
  ];
  for (let i in midIdx) {
    //increase indices
    topIdx[i] += 8 + 5;
  }
  const array = {
    position: stumpPositions.concat(midPositions).concat(topPositions),
    indices: stumpIdx.concat(midIdx).concat(topIdx)
  };

  const buffer = twgl.createBufferInfoFromArrays(gl, array);
  return buffer;
}
