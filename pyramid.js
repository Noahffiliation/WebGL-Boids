function generatePyramidBuffer(gl, twgl) {
    const array = {
        // 5 vertices
        position: [
             0, 0, 2, // 0
            -1,-1,-1, // 1
            -1, 1,-1, // 2
             1, 1,-1, // 3
             1,-1,-1, // 4
        ],
        indices: [
            // 4 triangles
            0, 2, 1,
            0, 3, 2,
            0, 4, 3,
            0, 1, 4,
            // 1 quad
            1, 2, 3,
            1, 3, 4,
        ],
    };
    const buffer = twgl.createBufferInfoFromArrays(gl, array);
    return buffer;
}
