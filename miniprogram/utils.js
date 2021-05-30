function roundedRect(ctx, x, y, w, h, r = px(5)) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.fill();
}

function inside(x, y, startX, startY, w, h) {
  return (
    x > startX &&
    x < startX + w &&
    y > startY &&
    y < startY + h
  )
}

// matrix start ---------
function createMatrix(size) {
  let matrix = [];
  for (let i = 0; i < size; i++) {
    matrix[i] = [];
    for (let j = 0; j < size; j++) {
      if (i === size - 1 && j === size - 1) {
        matrix[i][j] = 0;
      } else {
        matrix[i][j] = i * size + j + 1;
      }
    }
  }
  return matrix;
}

function transformMatrix(matrix, i, j) {
  let num = matrix[i][j];
  const [i0, j0] = getZeroPostion(matrix);
  if (i === i0) {
    // 同行
    if (j < j0) {
      for (let k = j0 - 1; k >= j; k--) {
        matrix[i][k + 1] = matrix[i][k];
      }
    } else if (j > j0) {
      for (let k = j0 + 1; k <= j; k++) {
        matrix[i][k - 1] = matrix[i][k];
      }
    }
    matrix[i][j] = 0;
  } else if (j === j0) {
    if (i < i0) {
      for (let k = i0 - 1; k >= i; k--) {
        matrix[k + 1][j] = matrix[k][j];
      }
    } else if (i > i0) {
      for (let k = i0 + 1; k <= i; k++) {
        matrix[k - 1][j] = matrix[k][j];
      }
    }
    matrix[i][j] = 0;
  }
  return matrix;
}

function iterateMatrix(matrix, fn) {
  let m = matrix.length;
  let n = matrix[0].length;
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      fn(i, j);
    }
  }
}

function isIdentical(matrix1, matrix2) {
  let flag = true;
  iterateMatrix(matrix1, (i, j) => {
    if (matrix1[i][j] !== matrix2[i][j]) {
      flag = false;
    }
  });
  return flag;
}

function getZeroPostion(matrix) {
  let position = [-1, -1];
  iterateMatrix(matrix, (i, j) => {
    if (matrix[i][j] === 0) {
      position = [i, j];
    }
  });
  return position;
}
// matrix end -------------

function format(time) {
  const minute = Math.floor(time / (1000 * 60))
  const second = Math.floor((time % (1000 * 60)) / 1000)
  const ms = Math.floor(time % 1000 / 10)
  return `${pad(minute)} : ${pad(second)} : ${pad(ms)}`
}
function pad(num) {
  return num < 10 ? '0' + num : num + ''
}

exports.roundedRect = roundedRect
exports.inside = inside
exports.createMatrix = createMatrix
exports.transformMatrix = transformMatrix
exports.iterateMatrix = iterateMatrix
exports.isIdentical = isIdentical
exports.getZeroPostion = getZeroPostion
exports.format = format