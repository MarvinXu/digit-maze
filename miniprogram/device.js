const menuRect = wx.getMenuButtonBoundingClientRect();
// https://developers.weixin.qq.com/minigame/dev/api/base/system/system-info/wx.getSystemInfoSync.html
const sysInfo = wx.getSystemInfoSync();
const { pixelRatio, windowWidth, windowHeight } = sysInfo;

const px = (x) => x * pixelRatio;

const CANVAS_W = px(windowWidth);
const CANVAS_H = px(windowHeight);

const MENU_BOTTOM = px(menuRect.bottom);

const COLOR1 = '#5c58bb'
const COLOR2 = '#b957ce'
const COLOR3 = '#5994ce'
const COLOR4 = '#3a4e93'

exports.MENU_BOTTOM = MENU_BOTTOM
exports.px = px;
exports.CANVAS_W = CANVAS_W;
exports.CANVAS_H = CANVAS_H;
exports.COLOR1 = COLOR1;
exports.COLOR2 = COLOR2;
exports.COLOR3 = COLOR3;
exports.COLOR4 = COLOR4;
