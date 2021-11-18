/*
 * @Descripttion: no
 * @version: 1.0.0
 * @Author: fugang
 * @Date: 2021-08-23 09:01:45
 * @LastEditors: fugang
 * @LastEditTime: 2021-09-17 11:06:17
 */
import { MessageBox, Message } from 'element-ui'
class websocketClient {
    constructor(param) {

        this.websocket = null
        // 连接状态
        this.isConnect = false
        // 重连
        this.timeoutNum = null
        // 是否主动关闭
        this.isActivelyClose = false
        this.param = param
        this.timer1 = null
        this.connect()
    }
    connect () {
        this.websocket = new WebSocket(this.param.url + this.param.userId + '&appid=' + this.param.appid)
        this.initSocket(this.param)
    }
    // 初始化
    initSocket (param) {
        this.isActivelyClose = false
        var test = function () {
            Message({
                message: '网络连接已断开，请检查网络',
                type: 'error',
                duration: 5 * 1000
            })
        }
        this.websocket.onclose = e => {
            console.log('websocket连接关闭~' + this.param.url)


            this.isConnect = false
            // 如果手动关闭则不进行重连
            if (!this.isActivelyClose) {
                this.reconnectSocket(param)
            }
        }
        this.websocket.onerror = e => {
            console.log('websocket发生异常~' + this.param.url + e)
            this.timer1 = setTimeout(test(), 5000)

            this.reconnectSocket(param)
        }


        this.websocket.onopen = () => {
            console.log('websocket已连接~ ' + this.param.url)
            this.isConnect = true

            if (param.hasOwnProperty('msg')) {
                this.send(param.msg || '')
            }
        }


        this.websocket.onmessage = e => {
            if (e.data !== "{}") {
                param.callback(JSON.parse(e.data))
            }

        }
    }

    // 重连
    reconnectSocket (param) {
        if (this.isConnect === true) {
            return false
        }
        console.log('websocket 重新连接~ ')
        clearTimeout(this.timer1)
        this.isConnect = true
        this.timeoutNum && clearTimeout(this.timeoutNum)
        this.timeoutNum = setTimeout(() => {
            this.connect(param)
            this.isConnect = false
        }, 1000)
    }
    // 发送消息
    send (msg) {
        // console.log(this.websocket.readyState)
        if (this.websocket.readyState == WebSocket.OPEN) {
            // console.log(msg)
            this.websocket.send(JSON.stringify(msg))
        } else {
            console.error("The socket is not open.");
        }

    }

    // 主动关闭
    close () {
        this.isActivelyClose = true
        if (this.websocket) {
            this.websocket.close()
        }
    }
}


export default websocketClient