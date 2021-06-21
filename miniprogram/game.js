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
  SoundManager,
  RecordManager
} = require("./utils");
const canvas = wx.createCanvas();
const ctx = canvas.getContext("2d");

// load resource
const font1 = wx.loadFont("static/Excluded-z8XrX.ttf");
console.log("font loaded:" + font1);
const titleImg = wx.createImage()
titleImg.src = 'static/title.png'

// records
let recordManager = new RecordManager()

// game settings
let animOn = true;
let soundOn = true;

class Home {
  titleY = MENU_BOTTOM + CANVAS_H * 0.1;
  titleW = CANVAS_W * 0.8;
  titleH = this.titleW / 924 * 125;
  menuW = CANVAS_W * 0.7;
  menuH = px(85);
  menuFontSize = this.menuH * 0.5;
  menuSubFontSize = this.menuFontSize * 0.6
  menuX = (CANVAS_W - this.menuW) / 2;
  menuY = this.titleY + px(100);
  menuMargin = px(20);
  menuTexts = ["3 × 3", "4 × 4", "5 × 5"];
  constructor() {
    this.menus = this.menuTexts.reduce((prev, text, i) => {
      const record = recordManager.get(text[0])
      prev.push({
        text,
        y: this.menuY + i * (this.menuH + this.menuMargin),
        record: record ? format(record) : 'PLAY Now!'
      });
      return prev;
    }, []);

    // load records

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

    ctx.shadowColor = "#383573";
    ctx.shadowBlur = px(10);
    ctx.drawImage(titleImg, (CANVAS_W - this.titleW) / 2, this.titleY, this.titleW, this.titleH)

    this.drawMenu();
  }
  drawMenu() {
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    this.menus.forEach((menu, i) => {
      const { text, y, record } = menu;
      ctx.fillStyle = COLOR3;
      ctx.fillRect(this.menuX, y, this.menuW, this.menuH);
      
      ctx.fillStyle = "#fff";
      ctx.font = `${this.menuFontSize}px ${font1}`;
      ctx.fillText(text, this.menuX + this.menuW / 2, y + this.menuH * 0.1);
      
      ctx.font = `${this.menuSubFontSize}px ${font1}`;
      ctx.fillText(record, this.menuX + this.menuW / 2, y + this.menuFontSize + this.menuH * 0.1);
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
  menuW = CANVAS_W * 0.75;
  menuH = px(65);
  menuX = (CANVAS_W - this.menuW) / 2;
  menuMargin = px(20);
  menuFontSize = this.menuH * 0.55;
  timeX = px(130);
  timeY = this.pauseY + this.pauseH / 2;
  timeFontsize = px(30);
  tileMargin = px(10);
  successTitleY = MENU_BOTTOM + px(80);
  successTitleFontSize = CANVAS_W * 0.12;
  successTimeFontSize = CANVAS_W * 0.1;
  successTimeY = this.successTitleY + px(100);
  successMenuY = this.successTimeY + px(100);

  clickPosition = [-1, -1];
  clickStamp = 0;
  animationDuration = 80;
  timeElapsed = 0;
  timeOffset = 0;
  playing = false;
  winning = false;
  newRecord = false;

  clickSound = null
  beepSound = null

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
        }
      },
      {
        text: "SOUND: ${x}",
        handle: () => {
          soundOn = !soundOn
        }
      }
    ];

    const pauseMenuLength = 4;
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

    this.successMenus = this.menuButtons.slice(1, 3).reduce((prev, cur, i) => {
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

    // sound
    this.clickSound = new SoundManager('static/click.m4a')
    this.beepSound = new SoundManager('static/beep.m4a')

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
            // console.log("clicked " + i + "," + j);
            if (soundOn) {
              if (this.isMovable(i, j)) {
                this.clickSound.play();
              } else {
                this.beepSound.play();
              }
            }
            this.clickStamp = now;
            this.clickPosition = [i, j];
            // 小游戏真机不支持第三个参数
            // setTimeout(transformMatrix, animOn ? ANIM_DURATION : 0, matrix, i, j);
            setTimeout(
              () => {
                transformMatrix(this.matrix, i, j);
                if (isIdentical(this.matrix, this.defaultMatrix)) {
                  // success
                  this.playing = false;
                  this.winning = true;
                  console.log("success");

                  // set new record
                  const currentRecord = recordManager.get(this.size)
                  if (!currentRecord || this.timeElapsed < currentRecord) {
                    this.newRecord = true
                    recordManager.set(this.size, this.timeElapsed)
                  }
                  
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
    ctx.font = `${this.fontSize}px ${font1}`;
    ctx.fillText(text, x + this.tileW / 2, y + this.tileW / 2);
  }
  drawPauseButton() {
    ctx.fillStyle = COLOR3;
    ctx.fillRect(this.pauseX, this.pauseY, this.pauseW, this.pauseH);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#fff";
    ctx.font = `${px(30)}px ${font1}`;
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
    ctx.font = `${this.timeFontsize}px ${font1}`;
    ctx.fillText(text, this.timeX, this.timeY);
  }
  drawPauseMenu() {
    ctx.fillStyle = "rgba(0,0,0,0.75)";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.font = `${this.menuFontSize}px ${font1}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    this.pauseMenus.forEach((menu, i) => {
      let { text, y } = menu;
      ctx.fillStyle = COLOR3;
      ctx.fillRect(this.menuX, y, this.menuW, this.menuH);
      ctx.fillStyle = "#fff";
      if (i === 3) {
        text = text.replace('${x}', soundOn ? 'ON' : 'OFF')
      }
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
    let text = "SUCCESS!"
    if (this.newRecord) {
      text = "NEW RECORD!"
    }
    ctx.fillText(text, CANVAS_W / 2, this.successTitleY);

    ctx.font = `${this.successTimeFontSize}px ${font1}`;
    ctx.fillText(format(this.timeElapsed), CANVAS_W / 2, this.successTimeY);

    ctx.font = `${this.menuFontSize}px ${font1}`;
    this.successMenus.forEach((menu, i) => {
      const { text, y } = menu;
      ctx.fillStyle = COLOR3;
      ctx.fillRect(this.menuX, y, this.menuW, this.menuH);
      ctx.fillStyle = "#fff";
      ctx.fillText(text, this.menuX + this.menuW / 2, y + this.menuH / 2);
    });
  }
  shuffle() {
    for (let i = 0; i < 100; i++) {
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
  isMovable(i, j) {
    const [i0, j0] = getZeroPostion(this.matrix);
    return (i === i0 || j === j0) && !(i === i0 && j === j0)
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
