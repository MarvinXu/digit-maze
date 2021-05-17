const canvas = wx.createCanvas();
const ctx = canvas.getContext("2d"); // 创建一个 2d context
const {
  windowWidth,
  windowHeight,
  statusBarHeight,
  pixelRatio,
} = wx.getSystemInfoSync();
const px = (x) => x * pixelRatio;
const WIN_W = px(windowWidth);
const WIN_H = px(windowHeight);
canvas.width = WIN_W;
canvas.height = WIN_H;
const BOARD_MARGIN = px(20);
const BOARD_W = WIN_W - BOARD_MARGIN * 2;
const STATUS_Y = px(70 + statusBarHeight);
const BOARD_X = BOARD_MARGIN;
const BOARD_Y = px(100 + statusBarHeight);
const GAP_LENGTH = px(10);
const SLIDE_W = (BOARD_W - GAP_LENGTH * 5) / 4;
const BUTTON_X = px(40);
const BUTTON_Y = BOARD_Y + BOARD_W + px(40);
const BUTTON_W = WIN_W - BUTTON_X * 2;
const BUTTON_H = px(60);

const fin = [
  [1, 2, 3, 4],
  [5, 6, 7, 8],
  [9, 10, 11, 12],
  [13, 14, 15, 0],
];
let arr = clone(fin);
let playing = false;
let timeElapsed = 0;
let start = 0;

requestAnimationFrame(draw);

wx.onTouchStart((e) => {
  const { pageX, pageY } = e.touches[0];
  const x = px(pageX);
  const y = px(pageY);

  if (!playing) {
    if (
      x > BUTTON_X &&
      x < BUTTON_X + BUTTON_W &&
      y > BUTTON_Y &&
      y < BUTTON_Y + BUTTON_H
    ) {
      playing = true;
      start = 0;
      arr = shuffle(fin);
    }
  } else {
    iterate(arr, (i, j) => {
      let startX = BOARD_X + GAP_LENGTH * (j + 1) + SLIDE_W * j;
      let startY = BOARD_Y + GAP_LENGTH * (i + 1) + SLIDE_W * i;
      if (
        x > startX &&
        x < startX + SLIDE_W &&
        y > startY &&
        y < startY + SLIDE_W
      ) {
        onSlideClick(i, j);
      }
    });
  }
});


function draw(timestamp) {
  // ctx.clearRect(0, 0, winW, winH);

  // 背景色
  ctx.fillStyle = "#fef7ed";
  ctx.fillRect(0, 0, WIN_W, WIN_H);

  drawStatusBar();

  drawBoard();

  if (!playing) {
    drawStartButton();
  } else {
    if (start === 0) start = timestamp;
    timeElapsed = Math.floor(timestamp - start);
  }
  

  iterate(arr, (i, j) => {
    let num = arr[i][j];
    if (num !== 0) {
      drawSlide(
        BOARD_X + GAP_LENGTH * (j + 1) + SLIDE_W * j,
        BOARD_Y + GAP_LENGTH * (i + 1) + SLIDE_W * i,
        num
      );
    }
  });

  requestAnimationFrame(draw);
}

function onSlideClick(i, j) {
  let res = getResult(arr, i, j);
  if (res) {
    arr = res;
    if (isIdentical(arr, fin)) {
      playing = false;
      wx.showToast({
        title: "success!",
      });
    }
  }
}

function shuffle(arr) {
  const random = () => Math.ceil(Math.random() * arr.length) - 1;
  for (let i = 0; i < 1000; i++) {
    let res = getResult(arr, random(), random());
    if (res) {
      arr = res;
    }
  }
  return arr;
}

function getResult(arr, i, j) {
  arr = clone(arr);
  let num = arr[i][j];
  if (num === 0) return false;
  const [i0, j0] = getZeroPos(arr);
  if (i === i0) {
    // 同行
    if (j < j0) {
      for (let k = j0 - 1; k >= j; k--) {
        arr[i][k + 1] = arr[i][k];
      }
    } else if (j > j0) {
      for (let k = j0 + 1; k <= j; k++) {
        arr[i][k - 1] = arr[i][k];
      }
    }
    arr[i][j] = 0;
    return arr;
  } else if (j === j0) {
    if (i < i0) {
      for (let k = i0 - 1; k >= i; k--) {
        arr[k + 1][j] = arr[k][j];
      }
    } else if (i > i0) {
      for (let k = i0 + 1; k <= i; k++) {
        arr[k - 1][j] = arr[k][j];
      }
    }
    arr[i][j] = 0;
    return arr;
  } else {
    return false;
  }
}

function getZeroPos(arr) {
  let pos = [-1, -1];
  iterate(arr, (i, j) => {
    if (arr[i][j] === 0) {
      pos = [i, j];
    }
  });
  return pos;
}

function clone(obj) {
  let res = [];
  for (let i in obj) {
    for (let j in obj[i]) {
      if (!res[i]) {
        res[i] = [];
      }
      res[i][j] = obj[i][j];
    }
  }
  return res;
}

function isIdentical(arr1, arr2) {
  let flag = true;
  iterate(arr1, (i, j) => {
    if (arr1[i][j] !== arr2[i][j]) {
      flag = false;
    }
  });
  return flag;
}


function iterate(arr, cb) {
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr[i].length; j++) {
      cb(i, j);
    }
  }
}

function roundedRect(x, y, w, h, r = px(5)) {
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

function drawSlide(x, y, text) {
  ctx.fillStyle = "#ece4cd";
  roundedRect(x, y, SLIDE_W, SLIDE_W, px(5));
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#e98f3f";
  ctx.font = "150px serif";
  // let measure = ctx.measureText(text)
  // const {actualBoundingBoxDescent, actualBoundingBoxAscent} = measure
  // let offsetY = (actualBoundingBoxDescent - actualBoundingBoxAscent) / 2
  // console.log(measure)
  ctx.fillText(text, x + SLIDE_W / 2, y + SLIDE_W / 2);
}

function drawBoard() {
  ctx.fillStyle = "#b8aea5";
  ctx.fillRect(BOARD_X, BOARD_Y, BOARD_W, BOARD_W);
}

function drawStatusBar() {
  ctx.fillStyle = "#b8aea5";
  ctx.font = "75px serif";
  ctx.textAlign = "left";
  const text = "Time elapsed: " + (timeElapsed / 1000).toFixed(2) + "s";
  ctx.fillText(text, BOARD_X, STATUS_Y);
}

function drawStartButton() {
  ctx.fillStyle = "#b8aea5";
  roundedRect(BUTTON_X, BUTTON_Y, BUTTON_W, BUTTON_H);
  ctx.fillStyle = "#ece4cd";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "75px serif";
  // ctx.shadowOffsetX = px(2);
  // ctx.shadowOffsetY = px(2);
  // ctx.shadowBlur = px(2);
  // ctx.shadowColor = "rgba(255, 255, 255, 0.5)";
  ctx.fillText("Start", BUTTON_X + BUTTON_W / 2, BUTTON_Y + BUTTON_H / 2);
}
