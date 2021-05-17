const isWx = typeof wx === "object";
if (isWx) {
  require("./weapp-adapter");
}
const ctx = canvas.getContext("2d");
const px = (x) => x * window.devicePixelRatio;

const CANVAS_W = px(screen.availWidth);
const CANVAS_H = px(screen.availHeight);
const BOARD_X = px(20);
const BOARD_Y = px(100);
const BOARD_W = CANVAS_W - px(20) * 2;
const ANIM_DURATION = 80;

let size = 4;
let sliderMargin = px(5);
let sliderWidth = (BOARD_W - sliderMargin * (size + 1)) / size;
let fontSize = Math.floor(sliderWidth * 0.8);

let matrix = createMatrix(size);

let clickStamp = 0;
let clickPosition = [-1, -1];
let animOn = false;
let playing = true;

// ------ start script
// scale
canvas.width = CANVAS_W;
canvas.height = CANVAS_H;

draw();

window.addEventListener("touchstart", (e) => {
  const { clientX, clientY } = e.touches[0];
  let x = clientX;
  let y = clientY;
  if (isWx) {
    x = px(clientX);
    y = px(clientY);
  }
  iterateMatrix(matrix, (i, j) => {
    let startX = BOARD_X + sliderMargin * (j + 1) + sliderWidth * j;
    let startY = BOARD_Y + sliderMargin * (i + 1) + sliderWidth * i;
    if (
      x > startX &&
      x < startX + sliderWidth &&
      y > startY &&
      y < startY + sliderWidth
    ) {
      onSliderClick(i, j);
    }
  });
});

// ------- functions
function draw() {
  drawBoard();

  const [i0, j0] = getZeroPostion(matrix);
  const [i1, j1] = clickPosition;

  let now = Date.now();
  let distance = sliderWidth + sliderMargin;
  let offset = 0;

  if (clickStamp !== 0 && animOn) {
    offset = Math.min(
      distance,
      (distance / ANIM_DURATION) * (now - clickStamp)
    );
  }

  iterateMatrix(matrix, (i, j) => {
    let x = BOARD_X + sliderMargin * (j + 1) + sliderWidth * j;
    let y = BOARD_Y + sliderMargin * (i + 1) + sliderWidth * i;
    const num = matrix[i][j];

    if (num) {
      // calculate transition
      if (animOn) {
        if (i1 === i0 && i === i0) {
          if (j1 < j0 && j < j0 && j >= j1) {
            x = x + offset;
          } else if (j1 > j0 && j > j0 && j <= j1) {
            x = x - offset;
          }
        } else if (j1 === j0 && j === j0) {
          if (i1 < i0 && i < i0 && i >= i1) {
            y = y + offset;
          } else if (i1 > i0 && i > i0 && i <= i1) {
            y = y - offset;
          }
        }
      }
      drawSlider(x, y, num);
    }
  });

  // if (start !== 0 && now - start > ANIM_DURATION) {
  //   transformMatrix(matrix, i1, j1)
  // }

  requestAnimationFrame(draw);
}

function onSliderClick(i, j) {
  let now = Date.now();
  if (playing) {
    if (!animOn || now - clickStamp > ANIM_DURATION || clickStamp === 0) {
      console.log("clicked " + i + "," + j);
      clickStamp = now;
      clickPosition = [i, j];
      // setTimeout(transformMatrix, animOn ? ANIM_DURATION : 0, matrix, i, j);
      setTimeout(
        () => {
          transformMatrix(matrix, i, j);
        },
        animOn ? ANIM_DURATION : 0
      );
      // transformMatrix(matrix, i, j)
    }
  }
}

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

function getZeroPostion(matrix) {
  let position = [-1, -1];
  iterateMatrix(matrix, (i, j) => {
    if (matrix[i][j] === 0) {
      position = [i, j];
    }
  });
  return position;
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

function drawBoard() {
  ctx.fillStyle = "#b8aea5";
  ctx.fillRect(BOARD_X, BOARD_Y, BOARD_W, BOARD_W);
}

function drawSlider(x, y, text) {
  ctx.fillStyle = "#ece4cd";
  roundedRect(ctx, x, y, sliderWidth, sliderWidth);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#e98f3f";
  ctx.font = fontSize + "px serif";
  ctx.fillText(text, x + sliderWidth / 2, y + sliderWidth / 2);
}

// ----------- utils
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

function iterateMatrix(matrix, fn) {
  let m = matrix.length;
  let n = matrix[0].length;
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      fn(i, j);
    }
  }
}
