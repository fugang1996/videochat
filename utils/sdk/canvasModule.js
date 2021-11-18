class ZXEduBoard {
    constructor(param) {
        if (!!this.drawId) {
            return new TypeError('id cannot be empty');
        }
        this.drawId = param.id
        this.canvas = null
        this.context = null
        // 线条粗细
        this.lineWidth = 3
        // lineCap 属性设置或返回线条末端线帽的样式。
        this.lineCap = "round";
        // lineJoin 属性设置或返回所创建边角的类型，当两条线交汇时。
        this.lineJoin = "round";
        // 线条颜色
        this.strokeColor = '#000000'
        // rectObject 获取canvas 对于视窗的位置集合
        this.rectObject = null

        // 操作状态
        this.operationType = false
        // 鼠标状态
        this.painting = false
        // 鼠标按下起点坐标
        this.pointCoordinates = null
        this.clearRectWh = 15
        // 画线坐标记录
        this.lineKK = []


        this.connect()
    }

    connect () {
        this.canvas = document.getElementById(this.drawId);
        this.context = this.canvas.getContext('2d');

        // this.context.fillStyle = '#f5f7fa'
        // this.context.shadowColor = '#f5f7fa'
        this.context.lineCap = this.lineCap
        this.context.lineJoin = this.lineJoin
        this.context.lineWidth = this.lineWidth
        this.context.strokeStyle = this.strokeColor
        this.rectObject = this.canvas.getBoundingClientRect();
        this.canvasCapture()
        console.log(this.context)

    }
    //  初始化
    canvasCapture () {
        this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this), false);
        this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this), false);
        this.canvas.addEventListener('mouseout', this.onMouseUp.bind(this), false);
        this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this), false);

        // Touch support for mobile devices
        // this.canvas.addEventListener('touchstart', onMouseDown, false);
        // this.canvas.addEventListener('touchend', onMouseUp, false);
        // this.canvas.addEventListener('touchcancel', onMouseUp, false);
        // this.canvas.addEventListener('touchmove', throttle(onMouseMove, 10), false);

    }

    //鼠标按下
    onMouseDown (e) {
        console.log(this.operationType)

        var _this = this
        if (this.operationType != false) {
            this.painting = true
            this.rectObject = this.canvas.getBoundingClientRect();
            this.pointCoordinates = ''
            this.context.lineWidth = this.lineWidth
            if (this.operationType == 'line') {
                this.lineKK = []
                let p_x = e.pageX - _this.rectObject.x;
                let p_y = e.pageY - _this.rectObject.y;

                _this.context.beginPath();
                this.context.strokeStyle = this.strokeColor
                _this.context.moveTo(p_x, p_y);
                this.pointCoordinates = {
                    x: p_x,
                    y: p_y
                }
                console.log(this.pointCoordinates)
            }

            if (this.operationType == 'straightline') {

                let p_x = e.pageX - _this.rectObject.x;
                let p_y = e.pageY - _this.rectObject.y;
                this.pointCoordinates = {
                    x: p_x,
                    y: p_y
                }
                console.log(this.pointCoordinates)
            }
            if (this.operationType == 'arrow') {

                let p_x = e.pageX - _this.rectObject.x;
                let p_y = e.pageY - _this.rectObject.y;
                this.pointCoordinates = {
                    x: p_x,
                    y: p_y
                }

            }

            if (this.operationType == 'rectangle') {

                let p_x = e.pageX - _this.rectObject.x;
                let p_y = e.pageY - _this.rectObject.y;
                this.pointCoordinates = {
                    x: p_x,
                    y: p_y
                }

            }

            if (this.operationType == 'circular') {
                let p_x = e.pageX - _this.rectObject.x;
                let p_y = e.pageY - _this.rectObject.y;
                this.pointCoordinates = {
                    x: p_x,
                    y: p_y
                }

            }

            if (this.operationType == 'eraser') {
                let p_x = e.pageX - _this.rectObject.x;
                let p_y = e.pageY - _this.rectObject.y;

                _this.context.beginPath();
                _this.context.moveTo(p_x, p_y);
                _this.context.clearRect(p_x, p_x, _this.clearRectWh, _this.clearRectWh);
                this.pointCoordinates = {
                    x: p_x,
                    y: p_y
                }
            }


        }
    }

    // 鼠标在某个元素上时持续发生
    onMouseMove (e) {
        var _this = this
        if (this.painting) {
            if (this.operationType == 'line') {

                var x = e.pageX - this.rectObject.x;
                var y = e.pageY - this.rectObject.y;
                var obj = {
                    x: x,
                    y: y
                }
                this.lineKK.push(obj)
                if (this.lineKK.length > 3) {
                    const lastTwoPoints = this.lineKK.slice(-2);
                    const controlPoint = lastTwoPoints[0];
                    const endPoint = {
                        x: (lastTwoPoints[0].x + lastTwoPoints[1].x) / 2,
                        y: (lastTwoPoints[0].y + lastTwoPoints[1].y) / 2,
                    }

                    this.context.beginPath();
                    this.context.moveTo(this.pointCoordinates.x, this.pointCoordinates.y);
                    this.context.quadraticCurveTo(controlPoint.x, controlPoint.y, endPoint.x, endPoint.y);
                    this.context.stroke();
                    this.context.closePath();
                    this.pointCoordinates = endPoint;
                }
            }
            if (this.operationType == 'eraser') {

                var x = e.pageX - this.rectObject.x;
                var y = e.pageY - this.rectObject.y;

                _this.context.clearRect(x, y, _this.clearRectWh, _this.clearRectWh);

                _this.context.stroke();
            }
        }

    }
    // 鼠标松开或者离开
    onMouseUp (e) {
        var _this = this
        if (this.operationType !== false) {

            if (this.operationType == 'line') {
                this.context.stroke()
                this.context.closePath();
                this.painting = false
            }
            if (this.operationType == 'straightline') {
                if (this.painting) {
                    let toX = e.pageX - this.rectObject.x;
                    let toY = e.pageY - this.rectObject.y;
                    this.context.strokeStyle = this.strokeColor

                    // const lastTwoPoints = this.lineKK.slice(-2);
                    // const controlPoint = lastTwoPoints[0];
                    const endPoint = {
                        x: (toX + this.pointCoordinates.x) / 2,
                        y: (toX + this.pointCoordinates.y) / 2,
                    }

                    this.context.beginPath();
                    this.context.moveTo(this.pointCoordinates.x, this.pointCoordinates.y);
                    this.context.quadraticCurveTo(this.pointCoordinates.x, this.pointCoordinates.y, toX, toY);

                    // this.context.beginPath();
                    // this.context.moveTo(this.pointCoordinates.x, this.pointCoordinates.y);
                    this.context.lineTo(toX, toY);
                    this.context.stroke();
                    this.painting = false
                }


            }
            if (this.operationType == 'arrow') {
                if (this.painting) {
                    let toX = e.pageX - this.rectObject.x;
                    let toY = e.pageY - this.rectObject.y;
                    let theta = 30,
                        headlen = 15;

                    this.onArrow(
                        this.context,
                        this.pointCoordinates.x,
                        this.pointCoordinates.y,
                        toX,
                        toY,
                        theta,
                        headlen,
                        this.lineWidth,
                        this.strokeColor
                    );
                    this.painting = false
                }


            }

            if (this.operationType == 'rectangle') {
                if (this.painting) {
                    let toX = e.pageX - this.rectObject.x - this.pointCoordinates.x;
                    let toY = e.pageY - this.rectObject.y - this.pointCoordinates.y;
                    this.context.strokeStyle = this.strokeColor
                    _this.context.strokeRect(this.pointCoordinates.x, this.pointCoordinates.y, toX, toY); //绘制矩形（无填充）
                    this.painting = false
                }

            }

            if (this.operationType == 'circular') {
                if (this.painting) {
                    let toX = e.pageX - this.rectObject.x - this.pointCoordinates.x;
                    let toY = e.pageY - this.rectObject.y - this.pointCoordinates.y;
                    this.context.strokeStyle = this.strokeColor

                    this.onEvenCompEllipse(this.context,
                        this.pointCoordinates.x,
                        this.pointCoordinates.y,
                        toX,
                        toY)
                    this.painting = false

                }

            }

            if (this.operationType == 'eraser') {
                console.log('eraser')
                if (this.painting) {
                    _this.context.stroke();
                    _this.context.closePath();
                    this.painting = false
                }
            }
        }
    }

    // 画线
    drawLine () {
        console.log(33)
        this.operationType = 'line'
    }
    // 画直线
    drawStraightline () {
        this.operationType = 'straightline'
    }

    // 画箭头
    drawArrow () {
        this.operationType = 'arrow'
    }
    // 画矩形
    drawRectangle () {
        this.operationType = 'rectangle'
    }
    // 画圆形
    drawCircular () {
        this.operationType = 'circular'
    }
    // 橡皮檫
    drawEraser () {
        this.operationType = 'eraser'
    }
    // 清屏
    drawClear () {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    // 设置颜色
    setBrushColor (e) {
        this.strokeColor = e
    }
    // 设置线条粗细
    setBrushThin (e) {
        this.lineWidth = e
    }
    onArrow (ctx, fromX, fromY, toX, toY, theta, headlen, width, color) {
        theta = typeof theta != "undefined" ? theta : 30;
        headlen = typeof theta != "undefined" ? headlen : 10;
        width = typeof width != "undefined" ? width : 1;
        color = typeof color != "color" ? color : "#000";

        // 计算各角度和对应的P2,P3坐标
        var angle = (Math.atan2(fromY - toY, fromX - toX) * 180) / Math.PI,
            angle1 = ((angle + theta) * Math.PI) / 180,
            angle2 = ((angle - theta) * Math.PI) / 180,
            topX = headlen * Math.cos(angle1),
            topY = headlen * Math.sin(angle1),
            botX = headlen * Math.cos(angle2),
            botY = headlen * Math.sin(angle2);

        ctx.save();
        ctx.beginPath();

        var arrowX = fromX - topX,
            arrowY = fromY - topY;

        ctx.moveTo(arrowX, arrowY);
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        arrowX = toX + topX;
        arrowY = toY + topY;
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(toX, toY);
        arrowX = toX + botX;
        arrowY = toY + botY;
        ctx.lineTo(arrowX, arrowY);
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.stroke();
        ctx.restore();
    }
    onEvenCompEllipse (context, x, y, a, b) {
        context.save();
        //选择a、b中的较大者作为arc方法的半径参数
        a = Math.abs(a)
        b = Math.abs(b)

        var r = (a > b) ? a : b;
        // var ratioX = a / r; //横轴缩放比率
        // var ratioY = b / r; //纵轴缩放比率
        // context.scale(ratioX, ratioY); //进行缩放（均匀压缩）
        context.beginPath();
        //从椭圆的左端点开始逆时针绘制
        // context.moveTo((x + a) / ratioX, y / ratioY);
        // context.arc(x / ratioX, y / ratioY, r, 0, 2 * Math.PI);
        context.arc(x, y, r, 0, Math.PI * 2, false);
        context.closePath();
        context.stroke();
        context.restore();

    }
}

export default ZXEduBoard