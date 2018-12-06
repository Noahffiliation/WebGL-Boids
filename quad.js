function generateSqaureBuffer(gl, twgl) {
    const array = {
        // 4 vertices
        position: [
             1, 1, 0, // 0
            -1,-1, 0, // 1
            -1, 1, 0, // 2
             1,-1, 0, // 3
        ],
        // 2 triangles
        indices: [
            0, 1, 2, // 0, 1, 2, 3
            3, 1, 0, // -x
        ],
    };
    const buffer = twgl.createBufferInfoFromArrays(gl, array);
    return buffer;
}
