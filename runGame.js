/**
 * 画面のサイズは 1000 *  500
 * 
 * 参考文献
 * https://developer.mozilla.org/ja/docs/Games/Workflows/2D_Breakout_game_pure_JavaScript
 * 
 */

// キャンバス要素を取得
const canvas = document.getElementById('canvas');
// 要素のコンテキストを取得
const ctx = canvas.getContext('2d');

/**
 * 動作用の変数
 */
// 1フレームで移動するビット
const BIT_PER_FRAME = 7;
// どれだけ動かすかの変数(上限は1000)
let move_i = 0;
// なめらかにジャンプするための変数
let jump_i = 0;
// 上昇中かどうか
let doJump = false;

/**
 * 障害物
 */
// 障害物を格納する
let obstacles = [];
// 障害物分類用
const RHOMBUS = 'rhombus';
const GOOMBA = 'goomba';
const IMAGE = 'image';

/**
 * 地面
 */
const block_width = 40;
const block_height = 20;
// 地面の基準値(左端)
const GRAND_X = -40;
const GRAND_Y = 400;  

/**
 * 人間
 */
const HEAD_X = 100;
const HEAD_Y = 270;
let head_x = HEAD_X;
let head_y = HEAD_Y;
// ジャンプの上限(グランドからどれくらいか)
const upper = GRAND_Y - 160;
const head_radius = 10;  // 顔の半径
const tall = 30;


/*--------------------*
 * 操作
 *--------------------*/

/**
 * キーが押されたときの処理
 * @param {*} event 
 */
function keydown_func(event){
    // スペースキー
    if(event.key === ' '){
        if(head_y >= GRAND_Y-tall-head_radius){ // 落下中でない
            doJump=true;
        }
    }
    // デバック用
    if(event.key === 'c'){
        clearInterval(routin);
    }
}

/*--------------------*
 * draw parts
 *--------------------*/

/**
 * 地面を描く(動く)
 */
function draw_grand(){
    let grand_x = GRAND_X;
    let grand_y = GRAND_Y;
    ctx.fillStyle = 'rgb(121, 91, 55)';
    grand_x = grand_x - move_i%block_width + 20;
    for(let i = 0; i < 10; i++){
        for(let j = 0; j < 27; j++){  // 一つ多く描画
            let block_x = grand_x+block_width*j+block_width*0.5*(i%2);
            let block_y = grand_y+block_height*i;
            roundedRectFill(ctx, block_x, block_y, block_width, block_height, 3);
        }
    }
}

/**
 * 人間を描く
 */
function draw_human(){
    let height = 30; // height
    ctx.fillStyle='black';
    // ジャンプ(上昇中)
    if(doJump){
        head_y -= BIT_PER_FRAME*0.5;
        head_x += 0.05;
        if(head_y <= upper){
            doJump = false;
        }
    }else if(!doJump && head_y < GRAND_Y-tall-head_radius){  // 浮遊中
        head_x += 0.05;
        head_y += BIT_PER_FRAME*0.5;
    }else if(head_x > HEAD_X){  // xを戻す
        head_x -= 0.05;
    }
    
    ctx.fillStyle='black';
    ctx.beginPath();
    ctx.arc(head_x, head_y - head_radius, head_radius, 0, Math.PI*2);
    ctx.stroke();

    // 身丈
    ctx.beginPath();
    ctx.moveTo(head_x, head_y);
    ctx.lineTo(head_x, head_y+tall);
    ctx.stroke();

    // 前足
    ctx.beginPath();
    ctx.moveTo(head_x, head_y+tall);
    ctx.lineTo(head_x+10, head_y+tall+10);
    ctx.stroke();

    // 後ろ足
    ctx.beginPath();
    ctx.moveTo(head_x, head_y+tall);
    ctx.lineTo(head_x-10, head_y+tall+10);
    ctx.stroke();

    // 前腕
    ctx.beginPath();
    ctx.moveTo(head_x, head_y+head_radius);
    ctx.lineTo(head_x+10, head_y+head_radius+10);
    ctx.stroke();

    // 後ろ腕
    ctx.beginPath();
    ctx.moveTo(head_x, head_y+head_radius);
    ctx.lineTo(head_x-10, head_y+head_radius+10);
    ctx.stroke();

    return {'x': head_x, 'y': head_y};
}

/**
 * 障害物を描く(動く)
 */
function draw_obstacles(ob){
    let shape = ob.shape;
    if(shape === RHOMBUS){
        draw_rhombus(ob.x, ob.y);
    }else if(shape === GOOMBA){
        draw_goomba(ob.x, ob.y)
    }else if(shape === IMAGE){
        draw_image(ob.x, ob.y)
    }
    
}

/**
 * ひし形を描く
 * @param {中心のx} x 
 * @param {中心のy} y 
 * @param {対角線} diagonal 
 */
function draw_rhombus(x, y){
    y = y - 10;
    let diagonal = 40;
    let size = diagonal/2;  // 大体の半径
    ctx.beginPath();
    ctx.moveTo(x, y-size);  // 上
    ctx.lineTo(x-size, y);  // 左
    ctx.lineTo(x, y+size);  // 下
    ctx.lineTo(x+size, y);  // 右
    ctx.lineTo(x, y-size);  // 上
    ctx.fill();
    return {'x': x, 'y': y, 'shape': RHOMBUS};
}

/**
 * クリボー
 * @param {*} x 
 * @param {*} y 
 */
function draw_goomba(x, y){
    y = y - 15;
    let width = 30*2;
    let height = 40*2;
    let radius = 7;
    let sub = 2 * radius * Math.sin(Math.PI*3/8)**2;
    let sub_up = Math.tan(Math.PI*3/8)*radius*Math.sin(Math.PI*3/8);
    // console.log(sub);

    // 身
    ctx.beginPath();
    roundedRect(ctx, x-12, y+height*2/3-height/2, 24, 12, 8);
    ctx.stroke();

    // 顔
    ctx.beginPath();
    ctx.moveTo(x-radius*Math.sin(Math.PI*3/8), y-height/2+sub_up);  // 上
    ctx.lineTo(x-width/2+sub, y+(height*2/3-height/2)-sub);
    ctx.arcTo(x-width/2, y+height*2/3-height/2, x+width/2, y+height*2/3-height/2, radius);
    ctx.lineTo(x+width/2-sub, y+height*2/3-height/2);
    ctx.arcTo(x+width/2, y+height*2/3-height/2, x, y-height/2, radius);
    ctx.lineTo(x+radius*Math.sin(Math.PI*3/8), y-height/2+sub_up);
    ctx.arcTo(x, y-height/2, x-width/2, y+height/2, radius);
    // 口
    ctx.moveTo(x-10, y+6);
    ctx.quadraticCurveTo(x, y+2, x+10, y+6);
    // 左牙
    ctx.moveTo(x-10, y+6);
    ctx.lineTo(x-10, y);
    ctx.lineTo(x-2, y+5);
    // 右牙
    ctx.moveTo(x+10, y+6);
    ctx.lineTo(x+10, y);
    ctx.lineTo(x+2, y+5);
    ctx.stroke();

    // 左足
    ctx.fillStyle= 'black';
    ctx.beginPath();
    ctx.ellipse(x-12, y+25, 10, 5, 0, 0, Math.PI*2);
    ctx.fill();

    // 右足
    ctx.beginPath();
    ctx.ellipse(x+12, y+25, 10, 5, 0, 0, Math.PI*2);
    ctx.fill();

    // 目隠し
    rect(ctx, x-20, y-15, 40, 10);
    // ctx.endPath();
    return {'x': x, 'y': y, 'shape': GOOMBA};
}

function draw_image(x, y){
    y = y - 40;
    const chara = new Image();
    chara.src="genshijin_fight.png";
    // console.log(chara);
    // chara.onload = () => {
    ctx.drawImage(chara, x, y, 80, 80);
    // }
    return {'x': x, 'y': y, 'shape': IMAGE};
}



/*--------------------*
 * tools
 *--------------------*/
function rect(ctx, x, y, width, height){
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.fill();
}

/**
 * Create Rounded Stroke Rect
 * @param {*} ctx 
 * @param {*} x 
 * @param {*} y 
 * @param {*} width 
 * @param {*} height 
 * @param {*} radius // 半径
 */
function roundedRect(ctx, x, y, width, height, radius){
    ctx.beginPath(); // パスの開始
    ctx.moveTo(x, y + radius);
    // height分下に
    ctx.lineTo(x, y + height - radius);
    // arcTo(x1, y1, x2, y2, radius);  直線の座標と直線でつながる円弧を作成
    // (x0, y0) => (x1, y1) => (x2, y2)の角に対する半径radiusの円弧を描く
    ctx.arcTo(x, y + height, x + radius, y + height, radius);
    // width分右へ
    ctx.lineTo(x + width - radius, y + height);
    ctx.arcTo(x + width, y + height, x + width, y + height - radius, radius);
    // 右下
    ctx.lineTo(x + width, y + radius);
    ctx.arcTo(x + width, y, x + width - radius, y, radius);
    // もとに戻る
    ctx.lineTo(x + radius, y);
    ctx.arcTo(x, y, x, y + radius, radius);
    ctx.stroke();
}

/**
 * Create Rounded fill Rect
 * @param {*} ctx 
 * @param {*} x 
 * @param {*} y 
 * @param {*} width 
 * @param {*} height 
 * @param {*} radius // 半径
 */
function roundedRectFill(ctx, x, y, width, height, radius){
    ctx.beginPath(); // パスの開始
    ctx.moveTo(x, y + radius);
    // height分下に
    ctx.lineTo(x, y + height - radius);
    // arcTo(x1, y1, x2, y2, radius);  直線の座標と直線でつながる円弧を作成
    // (x0, y0) => (x1, y1) => (x2, y2)の角に対する半径radiusの円弧を描く
    ctx.arcTo(x, y + height, x + radius, y + height, radius);
    // width分右へ
    ctx.lineTo(x + width - radius, y + height);
    ctx.arcTo(x + width, y + height, x + width, y + height - radius, radius);
    // 右下
    ctx.lineTo(x + width, y + radius);
    ctx.arcTo(x + width, y, x + width - radius, y, radius);
    // もとに戻る
    ctx.lineTo(x + radius, y);
    ctx.arcTo(x, y, x, y + radius, radius);
    ctx.fill();
    roundedRect(ctx, x, y, width, height, radius);
}



/*--------------------*
 * メインルーチン
 *--------------------*/
function draw(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    /*
     * 画面の描画
     */
    draw_grand();
    let human_c = draw_human();
    // 障害物を描く
    obstacles.forEach(ob => draw_obstacles(ob));

    /**
     * ゲームオーバの判定
     */
    if(obstacles !== null){
        let isGameOver = false;
        obstacles.forEach(ob =>{
            // 障害物に重なりがあるか
            if((ob.x-3 <= human_c.x && human_c.x <= ob.x + 3) 
                && human_c.y+tall+head_radius >= ob.y){
                    isGameOver=true;
            }
        });
        // ゲームオーバなら
        if(isGameOver){
            // ルーチンの停止
            clearInterval(routin);
            // cancelAnimationFrame(callback);
            alert('GAME OVER');
            return;
        }
    }

    /**
     * 更新作業
     */
    // 新しく障害物を作成
    if(Math.random()*1000 > 997){
        obstacles.push(draw_rhombus(canvas.width, GRAND_Y));
    }
    if(Math.random()*1000 > 997){
        obstacles.push(draw_image(canvas.width, GRAND_Y));
    }
    if(Math.random()*1000 > 999){
        obstacles.push(draw_goomba(canvas.width, GRAND_Y));
    }
    // 障害物の移動
    obstacles.forEach(ob => ob.x -= BIT_PER_FRAME);
    // カウント
    move_i = (move_i+BIT_PER_FRAME) % canvas.width;
}

/*--------------------*
 * ゲーム開始
 *--------------------*/
function game(){
    window.addEventListener('keypress', keydown_func);
    routin = setInterval(draw, 10);
}

// let callback;
// window.addEventListener('keypress', keydown_func);
// function game_with_animation(){
//     draw();
//     callback = requestAnimationFrame(game_with_animation);
// }
// requestAnimationFrame(game_with_animation);

function start(){
    setTimeout(game, 3000);
}
/**
 * ロードしたら読み込み
 */
window.addEventListener('load', ()=>{
    
    let startButton = document.getElementById("start-button");
    startButton.addEventListener('click', ()=>{
        startButton.disabled = true;
        start();
    });
    // game();
    // draw_goomba(100, 100);
    // console.log(draw_image(100, 100));
});
