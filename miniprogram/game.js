const {
  px,
  CANVAS_W,
  CANVAS_H,
  MENU_BOTTOM,
  COLOR1,
  COLOR2,
  COLOR3,
  COLOR4,
} = require("./device");
const {
  inside,
  createMatrix,
  transformMatrix,
  iterateMatrix,
  isIdentical,
  getZeroPostion,
  format,
} = require("./utils");
const canvas = wx.createCanvas();
const ctx = canvas.getContext("2d");
const font1 = wx.loadFont("./static/SportypoReguler-OVGwe.ttf");
console.log("font loaded:" + font1);

// game settings
let animOn = true;
class Home {
  titleY = MENU_BOTTOM + px(80);
  titleFontSize = CANVAS_W * 0.09;
  menuW = CANVAS_W * 0.6;
  menuH = px(65);
  menuFontSize = this.menuH * 0.7;
  menuX = (CANVAS_W - this.menuW) / 2;
  menuY = px(300);
  menuMargin = px(20);
  menuTexts = ["3 × 3", "4 × 4", "5 × 5"];
  constructor() {
    this.menus = this.menuTexts.reduce((prev, text, i) => {
      prev.push({
        text: text,
        y: this.menuY + i * (this.menuH + this.menuMargin),
      });
      return prev;
    }, []);
    this.touchListener = this.handleTouch.bind(this);
    wx.onTouchStart(this.touchListener);
  }
  handleTouch(e) {
    const { clientX, clientY } = e.touches[0];
    const x = px(clientX);
    const y = px(clientY);
    this.menus.forEach((menu, i) => {
      if (inside(x, y, this.menuX, menu.y, this.menuW, this.menuH)) {
        scene.destory();
        scene = new Play(parseInt(menu.text));
      }
    });
  }
  draw() {
    ctx.fillStyle = COLOR1;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.fillStyle = "#fff";
    ctx.font = `${this.titleFontSize}px ${font1}`;
    ctx.textAlign = "center";
    ctx.shadowColor = "#383573";
    ctx.shadowBlur = px(10);
    ctx.fillText("Digit Maze", CANVAS_W / 2, this.titleY);

    this.drawMenu();
  }
  drawMenu() {
    ctx.font = `${this.menuFontSize}px fantasy`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    this.menus.forEach((menu, i) => {
      const { text, y } = menu;
      ctx.fillStyle = COLOR3;
      ctx.fillRect(this.menuX, y, this.menuW, this.menuH);
      ctx.fillStyle = "#fff";
      ctx.fillText(text, this.menuX + this.menuW / 2, y + this.menuH / 2);
    });
  }
  destory() {
    wx.offTouchStart(this.touchListener);
  }
}

class Play {
  frameW = CANVAS_W * 0.8;
  frameX = (CANVAS_W - this.frameW) / 2;
  pauseX = this.frameX;
  pauseY = MENU_BOTTOM + px(30);
  pauseW = px(40);
  pauseH = px(40);
  frameY = this.pauseY + this.pauseH + px(50);
  menuW = px(200);
  menuH = px(65);
  menuX = (CANVAS_W - this.menuW) / 2;
  menuMargin = px(20);
  menuFontSize = this.menuH * 0.7;
  timeX = px(130);
  timeY = this.pauseY + this.pauseH / 2;
  timeFontsize = px(30);
  tileMargin = px(10);
  successTitleY = MENU_BOTTOM + px(80);
  successTitleFontSize = CANVAS_W * 0.09;
  successTimeFontSize = px(35);
  successTimeY = this.successTitleY + px(100);
  successMenuY = this.successTimeY + px(100);

  clickPosition = [-1, -1];
  clickStamp = 0;
  animationDuration = 80;
  timeElapsed = 0;
  timeOffset = 0;
  playing = false;
  winning = false;

  constructor(size) {
    // data init
    this.size = size;
    this.init();
  }
  init() {
    const { size } = this;
    this.defaultMatrix = createMatrix(size);
    this.matrix = createMatrix(size);

    // ui init
    this.tileW = (this.frameW - (size + 1) * this.tileMargin) / size;
    this.fontSize = this.tileW * 0.8;

    // resusable buttons
    this.menuButtons = [
      {
        text: "RESUME",
        handle: () => {
          this.playing = true;
          this.timeOffset += Date.now();
        },
      },
      {
        text: "RESTART",
        handle: () => {
          this.destory();
          scene = new Play(this.size);
        },
      },
      {
        text: "HOME",
        handle: () => {
          this.destory();
          scene = new Home();
        },
      },
    ];

    const pauseMenuLength = 3;
    this.pauseMenuY =
      (CANVAS_H -
        (this.menuH * pauseMenuLength +
          this.menuMargin * (pauseMenuLength - 1))) /
      2;
    this.pauseMenus = this.menuButtons.reduce((prev, cur, i) => {
      prev.push(
        Object.assign({}, cur, {
          y: this.pauseMenuY + i * (this.menuH + this.menuMargin),
        })
      );
      return prev;
    }, []);

    this.successMenus = this.menuButtons.slice(1).reduce((prev, cur, i) => {
      prev.push(
        Object.assign({}, cur, {
          y: this.successMenuY + i * (this.menuH + this.menuMargin),
        })
      );
      return prev;
    }, []);

    // bind click
    this.touchListener = this.handleTouch.bind(this);
    wx.onTouchStart(this.touchListener);

    this.shuffle();
    this.playing = true;
    this.startTime = Date.now();
  }
  handleTouch(e) {
    const { clientX, clientY } = e.touches[0];
    const x = px(clientX);
    const y = px(clientY);

    if (this.playing) {
      // handle tile click
      iterateMatrix(this.matrix, (i, j) => {
        let startX = this.frameX + this.tileMargin * (j + 1) + this.tileW * j;
        let startY = this.frameY + this.tileMargin * (i + 1) + this.tileW * i;

        if (inside(x, y, startX, startY, this.tileW, this.tileW)) {
          let now = Date.now();
          if (
            !animOn ||
            now - this.clickStamp > this.animationDuration ||
            this.clickStamp === 0
          ) {
            console.log("clicked " + i + "," + j);
            this.clickStamp = now;
            this.clickPosition = [i, j];
            // 小游戏真机不支持第三个参数
            // setTimeout(transformMatrix, animOn ? ANIM_DURATION : 0, matrix, i, j);
            setTimeout(
              () => {
                transformMatrix(this.matrix, i, j);
                if (isIdentical(this.matrix, this.defaultMatrix)) {
                  this.playing = false;
                  this.winning = true;
                  console.log("success");
                }
              },
              animOn ? this.animationDuration : 0
            );
          }
        }
      });

      // handle pause button
      if (inside(x, y, this.pauseX, this.pauseY, this.pauseW, this.pauseH)) {
        console.log("PAUSE");
        this.playing = false;
        this.timeOffset -= Date.now();
      }
    } else if (this.winning) {
      // handle winning menu
      this.successMenus.forEach((menu) => {
        if (inside(x, y, this.menuX, menu.y, this.menuW, this.menuH)) {
          console.log(menu.text);
          menu.handle();
        }
      });
    } else {
      // handle pause menu
      this.pauseMenus.forEach((menu) => {
        if (inside(x, y, this.menuX, menu.y, this.menuW, this.menuH)) {
          console.log(menu.text);
          menu.handle();
        }
      });
    }
  }
  getAnimationStep() {
    let distance = this.tileW + this.tileMargin;
    let step = 0;
    if (this.clickStamp !== 0 && animOn) {
      step = Math.min(
        distance,
        (distance / this.animationDuration) * (Date.now() - this.clickStamp)
      );
    }
    return step;
  }
  draw() {
    ctx.fillStyle = COLOR1;
    ctx.shadowColor = "#383573";
    ctx.shadowBlur = px(10);
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    if (this.playing) {
      this.timeElapsed = Date.now() - this.startTime - this.timeOffset;
    }

    this.drawPauseButton();
    this.drawFrame();
    this.drawTime();

    const [i0, j0] = getZeroPostion(this.matrix);
    const [i1, j1] = this.clickPosition;
    let step = this.getAnimationStep();

    iterateMatrix(this.matrix, (i, j) => {
      let x = this.frameX + this.tileMargin * (j + 1) + this.tileW * j;
      let y = this.frameY + this.tileMargin * (i + 1) + this.tileW * i;
      const num = this.matrix[i][j];

      if (num) {
        if (animOn) {
          if (i1 === i0 && i === i0) {
            if (j1 < j0 && j < j0 && j >= j1) {
              x = x + step;
            } else if (j1 > j0 && j > j0 && j <= j1) {
              x = x - step;
            }
          } else if (j1 === j0 && j === j0) {
            if (i1 < i0 && i < i0 && i >= i1) {
              y = y + step;
            } else if (i1 > i0 && i > i0 && i <= i1) {
              y = y - step;
            }
          }
        }
        this.drawTile(x, y, num);
      }
    });

    if (!this.playing) {
      if (this.winning) {
        this.drawWinningMenu();
      } else {
        this.drawPauseMenu();
      }
    }
  }
  drawFrame() {
    ctx.fillStyle = COLOR4;
    ctx.fillRect(this.frameX, this.frameY, this.frameW, this.frameW);
  }
  drawTile(x, y, text) {
    ctx.fillStyle = COLOR3;
    ctx.fillRect(x, y, this.tileW, this.tileW);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#fff";
    ctx.font = this.fontSize + "px fantasy";
    ctx.fillText(text, x + this.tileW / 2, y + this.tileW / 2);
  }
  drawPauseButton() {
    ctx.fillStyle = COLOR3;
    ctx.fillRect(this.pauseX, this.pauseY, this.pauseW, this.pauseH);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#fff";
    ctx.font = `${px(30)}px fantasy`;
    ctx.fillText(
      "||",
      this.pauseX + this.pauseW / 2,
      this.pauseY + this.pauseH / 2
    );
  }
  drawTime() {
    const text = format(this.timeElapsed);
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#fff";
    ctx.font = `${this.timeFontsize}px fantasy`;
    ctx.fillText(text, this.timeX, this.timeY);
  }
  drawPauseMenu() {
    ctx.fillStyle = "rgba(0,0,0,0.75)";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.font = `${this.menuFontSize}px fantasy`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    this.pauseMenus.forEach((menu, i) => {
      const { text, y } = menu;
      ctx.fillStyle = COLOR3;
      ctx.fillRect(this.menuX, y, this.menuW, this.menuH);
      ctx.fillStyle = "#fff";
      ctx.fillText(text, this.menuX + this.menuW / 2, y + this.menuH / 2);
    });
  }
  drawWinningMenu() {
    ctx.fillStyle = "rgba(0,0,0,0.75)";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.fillStyle = "#fff";
    ctx.font = `${this.successTitleFontSize}px ${font1}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("SUCCESS!", CANVAS_W / 2, this.successTitleY);

    ctx.font = `${this.successTimeFontSize}px fantasy`;
    ctx.fillText(format(this.timeElapsed), CANVAS_W / 2, this.successTimeY);

    ctx.font = `${this.menuFontSize}px fantasy`;
    this.successMenus.forEach((menu, i) => {
      const { text, y } = menu;
      ctx.fillStyle = COLOR3;
      ctx.fillRect(this.menuX, y, this.menuW, this.menuH);
      ctx.fillStyle = "#fff";
      ctx.fillText(text, this.menuX + this.menuW / 2, y + this.menuH / 2);
    });
  }
  shuffle() {
    for (let i = 0; i < 5; i++) {
      this.randomMove();
    }
  }
  randomMove() {
    const [i0, j0] = getZeroPostion(this.matrix);
    let possibleMoves = [];
    for (let i = 0; i < this.size; i++) {
      if (i !== i0) {
        possibleMoves.push([i, j0]);
      }
    }
    for (let j = 0; j < this.size; j++) {
      if (j !== j0) {
        possibleMoves.push([i0, j]);
      }
    }
    let index = Math.ceil(Math.random() * possibleMoves.length) - 1;
    let [i, j] = possibleMoves[index];
    transformMatrix(this.matrix, i, j);
  }
  destory() {
    wx.offTouchStart(this.touchListener);
  }
}

function loop() {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  scene.draw();

  requestAnimationFrame(loop);
}

// scale
canvas.width = CANVAS_W;
canvas.height = CANVAS_H;

let scene = new Home();
// let scene = new Play(3);

loop();
