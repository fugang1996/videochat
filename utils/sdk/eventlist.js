// 自定义监听回调方式

class eventList {
    constructor() {
        this.listenerList = {
            //插件事件数组
            "message": function (e) {
                console.log(e)
            },
            'stream-added': function (e) {
                console.log(e)
            },
            'live-stream-added': function (e) {

            },
            'join': function (e) {
                console.log(e)
            },
            'leave': function (e) {
                console.log(e)
            },
            'create': function (e) {
                console.log(e)
            },
            'getrooms': function (e) {
                console.log(e, 11)
            },
            // 有用户加入房间

            'peer-join': function (e) {

            },
            'peer-join-pubs': function (e) {

            },
            'pubulish': function (e) {

            },
            // 取消订阅
            'unpublish': function (e) {

            },
            'subscribe': function (e) {

            },
            // 订阅远端流成功
            'stream-subscribed': function (e) {

            },
            // 远端流取消发布
            'stream-removed': function (e) {

            },
            // 合流退出
            'live-removed': function (e) {

            },
            // 取消订阅远端流
            'unsubscribe': function (e) {

            },

            // 用户离开房间

            'peer-leave': function (e) {

            },

            //  用户被挤
            'peer-kickout': function (e) {

            },
            // 内部发信令
            'videoTrackType': function (params) {

            },

            // 关闭摄像头
            'unmute-video': function (params) {

            },
            // 关闭摄像头
            'mute-video': function (params) {

            },
            // 关闭摄像头
            'unmute-audio': function (params) {

            },
            // 关闭摄像头
            'unmute-audio': function (params) {

            },
            'onTextChat': function () {
            },
            'get-rooms': function (params) {

            },
            'get-ownrooms': function (params) {

            },

            'create-room': function (params) {

            },
            'recvmsg': function (params) {

            },
            'update-livelayout': function (params) {

            },
            'destroy': function (params) {

            },
            'keepalive': function (params) {

            },
            'room-destroyed': function (params) {

            }

        };
    }

    trigger (eventKey) {
        var args = Array.prototype.slice.call(arguments, 1);
        this.listenerList[eventKey].apply(this, args);
        return this;
    }
    on (eventKey, callback) {
        if (typeof eventKey === "string" && typeof callback === "function") {
            this.listenerList[eventKey] = callback;
        }
        return this;
    }
}

// let eventli=new eventlis()
// console.log(eventli)
// eventli.on("message", function (args) {
//     console.log(this)
//     console.log("事件参数信息3", args);
// })
// eventli.trigger("message", { a: "senbo" });//测试一下

export default eventList
