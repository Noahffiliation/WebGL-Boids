function generateCubeBuffer(gl, twgl) {
    const array = {
        // 8 vertices
        position: [
            -1,-1,-1, // 0
            -1,-1, 1, // 1
            -1, 1,-1, // 2
            -1, 1, 1, // 3
             1,-1,-1, // 4
             1,-1, 1, // 5
             1, 1,-1, // 6
             1, 1, 1, // 7
        ],
        //6 faces
        indices: [
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
        ],
    };
    const buffer = twgl.createBufferInfoFromArrays(gl, array);
    return buffer;
}
