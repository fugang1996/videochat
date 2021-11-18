/* 创建client */
import websocketClient from "./websocketClient";
import eventList from './eventlist'
import streamModule from './streamModule'
import ConferencePeerConnectionChannel from './peerConnectionChannel'
// 长连接状态
const SignalingState = {
    READY: 1,
    CONNECTING: 2,
    CONNECTED: 3,
};

// 处理客户端与服务端之前的peerconntion
class conferenceClient extends eventList {
    constructor(param) {
        super();
        this.sid = null
        this.sfuid = null
        this.mode = param.mode
        // 发布流 mid
        this.publishMid = null
        // 订阅流 sid
        this.subscribeSid = null
        this.subscribeRTCPeer = new Map()
        // 用户id 
        this.userId = param.userId
        // 房间号
        this.roomNumber = null
        this.signalingState = SignalingState.READY;
        // 录制权限
        this.recordEnabled = true
        // 192.168.1.250 8.129.55.41 47.113.89.168 dev-biz.zhuanxin.com
        let socketConfig = {
            // url: "wss:/media-biz.zhuanxin.com/ws?peer=",
            url: "wss://dev-media-signal-live.phh4.com/ws?peer=",
            // url: "wss://media-signal.zhuanxin.com/ws?peer=",
            // url: 'ws:/120.78.209.92:8443/ws?peer=',
            // url: 'ws://39.108.87.16:8445/ws?peer=',
            userId: this.userId,
            appid: param.Appid,
            token: param.token,
            callback: this.onSignalingMessage.bind(this),
        };
        // this.role = 'anchor'
        //建立websocket 连接
        this.signaling = new websocketClient(socketConfig);
        // 监听
        // mcu id
        this.mcuMid = null
        this.eventList = null
        this.lid = null
        this.connect()
        // 定时器
        this.sendHeartTimer = null
        // 建立推流peer
        this.PubRTCPeerConnectionChannel = null;
        // 建立订阅peer
        this.SubRTCPeerConnectionChannel = null;
        // 加入房间
        this.COMMAND_LIVS_CODE_JOIN_ID = parseInt(this.getRandomNumber(7));
        // 离开房间
        this.COMMAND_LIVS_CODE_LEAVE_ID = parseInt(this.getRandomNumber(7));
        // 心跳
        this.COMMAND_LIVS_CODE_HEART_ID = parseInt(this.getRandomNumber(7));
        // 发布流
        this.COMMAND_LIVS_CODE_PUBLISH_ID = parseInt(this.getRandomNumber(7));
        // 取消发布流
        this.COMMAND_LIVS_CODE_UNPUBLISH_ID = parseInt(this.getRandomNumber(7));
        // 订阅
        this.COMMAND_LIVS_CODE_SUBSCRIBE_ID = parseInt(this.getRandomNumber(7));
        // 取消订阅
        this.COMMAND_LIVS_CODE_UNSUBSCRIBE_ID = parseInt(this.getRandomNumber(7));
        // ice
        this.COMMAND_LIVS_CODE_TRICKLE_ID = parseInt(this.getRandomNumber(7));
        // 广播
        this.COMMAND_LIVS_CODE_BROADCAST_ID = parseInt(this.getRandomNumber(7));
        // 直播
        this.COMMAND_LIVS_CODE_SFUSTART_ID = parseInt(this.getRandomNumber(7));

        this.COMMAND_LIVS_CODE_SFUSTOP_ID = parseInt(this.getRandomNumber(7));
        // 查询房间
        this.COMMAND_GET_ROOMS_ID = parseInt(this.getRandomNumber(7))
        // 创建直播房间
        this.COMMAND_CREATE_ID = parseInt(this.getRandomNumber(7))
        // 连麦发送消息
        this.COMMAND_SENDMSG_ID = parseInt(this.getRandomNumber(7))
        // 销毁房间
        this.COMMAND_DESTROY_ROOMS_ID = parseInt(this.getRandomNumber(7))
        // 获取个人房间
        this.COMMAND_GETOWNROOMS_ID = parseInt(this.getRandomNumber(7))
        // 更新混流布局
        this.COMMAND_UPDATELAYOUT_ID = parseInt(this.getRandomNumber(7))
    }
    connect () {
        this.eventList = new eventList()
    }
    // 无资源包或权限
    errorDetail () {

        clearInterval(this.sendHeartTimer)
        this.signaling.close()
    }
    // 录制资源包
    recordEvent () {
        this.recordEnabled = false
    }
    /* 监听websocket onMessage 消息返回*/
    onSignalingMessage (msg) {
        console.log(msg)
        // 加入房间
        if (msg.id == this.COMMAND_LIVS_CODE_JOIN_ID) {
            this.eventList.trigger("join", msg)
        }
        // 发布流
        if (msg.id === this.COMMAND_LIVS_CODE_PUBLISH_ID) {
            this.eventList.trigger("pubulish", msg)
            console.log(msg)

        }
        // 取消发布流
        if (msg.id === this.COMMAND_LIVS_CODE_UNPUBLISH_ID) {
            this.eventList.trigger("unpublish", msg)

        }
        // 订阅
        if (msg.id === this.COMMAND_LIVS_CODE_SUBSCRIBE_ID) {

            this.eventList.trigger("subscribe", msg)
            console.log(msg)
            this.sid = msg.data.sid

        }
        // 取消订阅
        if (msg.id === this.COMMAND_LIVS_CODE_UNSUBSCRIBE_ID) {

            this.eventList.trigger("unsubscribe", msg)
        }

        // 离开房间
        if (msg.id === this.COMMAND_LIVS_CODE_LEAVE_ID) {
            this.eventList.trigger("leave", msg)
        }
        // 销毁房间
        if (msg.id === this.COMMAND_DESTROY_ROOMS_ID) {
            this.eventList.trigger('destroy', msg)
        }
        // 心跳
        if (msg.id === this.COMMAND_LIVS_CODE_HEART_ID) {
            if (msg.hasOwnProperty('errorCode')) {
                this.signaling.close()
            }
        }

        // 广播 
        if (msg.id === this.COMMAND_LIVS_CODE_BROADCAST_ID) { }
        // 获取房间列表
        if (msg.id === this.COMMAND_GET_ROOMS_ID) {
            this.eventList.trigger("getrooms", msg)
        }
        // 心跳
        if (msg.id == this.COMMAND_LIVS_CODE_HEART_ID) {
            this.eventList.trigger('keepalive', msg)
        }
        // 个人房间
        if (msg.id === this.COMMAND_GETOWNROOMS_ID) {
            this.eventList.trigger('getownrooms', msg)
        }
        // 更新混流布局
        if (msg.id == this.COMMAND_UPDATELAYOUT_ID) {
            this.eventList.trigger('updatelivelayout')
        }
        // 直播

        if (msg.id === this.COMMAND_LIVS_CODE_SFUSTART_ID) {
            console.log(msg)
            this.mcuId = msg.data.mcuid
            this.mcuMid = msg.data.mid
            this.lid = msg.data.lid
            sessionStorage.setItem('lid', this.lid)
        }
        // 创建直播房间
        if (msg.id === this.COMMAND_CREATE_ID) {
            this.eventList.trigger('create', msg)
        }
        // 页面接受参数
        if (msg['notification']) {
            // 有用户加入房间
            if (msg.method === 'peer-join') {
                console.log(msg)
                this.trigger("peer-join", msg)
            }
            if (msg.method === 'peer-join-pubs') {
                this.trigger('peer-join-pubs', msg)
            }
            // 发布流成功
            if (msg.method === 'stream-add') {
                msg.data.userId = this.userId
                this.sfuid = msg.data.sfuid
                this.trigger("stream-added", msg)
            }
            // 直播流
            if (msg.method === 'live-add') {
                console.log(msg, 11)
                this.trigger("live-stream-added", msg)
            }
            // 结束发布流
            if (msg.method === 'stream-remove') {

                this.trigger("stream-removed", msg)
            }
            // 合流退出
            if (msg.method === 'live-remove') {
                this.trigger('live-removed', msg)
            }
            // 房间销毁
            if (msg.method === 'room-destroy') {
                this.trigger('room-destroyed')
            }
            if (msg.method === 'get-rooms') {
                this.trigger('get-rooms', msg)
            }
            if (msg.method === 'get-ownrooms') {
                this.trigger('get-ownrooms', msg)

            }
            // 离开房间
            if (msg.method === 'peer-leave') {
                this.trigger("peer-leave", msg)
            }
            // 用户被挤
            if (msg.method == 'peer-kick') {
                this.trigger("peer-kickout", msg)
                let _this = this
                setTimeout((e) => {
                    clearInterval(_this.sendHeartTimer)
                    _this.signaling.close()
                }, 3000)

            }
            // 创建房间
            if (msg.method == 'create-room') {
                this.trigger('create-room', msg)
            }
            if (msg.method == 'keepalive') {
                this.trigger('keepalive', msg)
            }
            if (msg.method == 'recvmsg') {
                this.trigger('recvmsg', msg)
            }
            if (msg.method == 'update-livelayout') {
                this.trigger('update-livelayout', msg)
            }
            if (msg.method === 'broadcast') {
                if (msg.data['method']) {
                    let trackKind = msg.data['method']
                    if (trackKind == 'video') {
                        if (msg.data.data.enabled) {
                            this.trigger("unmute-video", msg.data)
                        } else {
                            this.trigger("mute-video", msg.data)
                        }
                    } else if (trackKind == 'microphone') {
                        if (msg.data.data.enabled) {
                            this.trigger("unmute-audio", msg.data)
                        } else {
                            this.trigger("mute-audio", msg.data)
                        }
                    }
                }

                if (msg.data['data']) {

                    let da = msg.data['data']
                    console.log(da)
                    if (da['method'] == 'TextChat') {
                        console.log('3333')
                        this.trigger("onTextChat", msg.data)
                    }
                }
            }
        }
    }
    // 更新混流布局
    updatelivelayout (layout) {
        var _this = this
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                let message = {
                    request: true,
                    id: _this.COMMAND_UPDATELAYOUT_ID,
                    method: 'updatelivelayout',
                    data: {
                        rid: _this.roomNumber,
                        mcuid: _this.mcuId,
                        layout
                    }
                }
                _this.signaling.send(message)
            }, 500)
            _this.eventList.on('updatelivelayout', function (args) {
                if (args["ok"]) {
                    let data = args.data
                    _this.trigger('update-livelayout', {
                        "data": data
                    })
                }
            })
        })

    }
    // 获取个人房间
    getownrooms () {
        var _this = this
        return new Promise((resolve, reject) => {
            setTimeout(function () {
                let message = {
                    request: true,
                    id: _this.COMMAND_GETOWNROOMS_ID,
                    method: 'getownrooms',
                    data: {}
                }
                _this.signaling.send(message)
            }, 500)
            _this.eventList.on("getownrooms", function (args) {
                if (args["ok"]) {
                    if (args.data.rooms.length > 0) {
                        let rooms = args.data.rooms
                        console.log(rooms)
                        _this.trigger('get-ownrooms', {
                            "data": rooms
                        })
                    }

                } else {
                    reject(args)
                }
            })
        })
    }
    // 获取房间列表
    getrooms () {
        var _this = this
        return new Promise((resolve, reject) => {
            setTimeout(function () {
                let message = {
                    request: true,
                    id: _this.COMMAND_GET_ROOMS_ID,
                    method: 'getrooms',
                    data: {}
                }
                _this.signaling.send(message)
            }, 500)
            _this.eventList.on("getrooms", function (args) {
                if (args["ok"]) {
                    if (args.data.hasOwnProperty('rooms') && args.data.rooms !== null) {
                        if (args.data.rooms.length > 0) {
                            let rooms = args.data.rooms
                            // rooms.forEach(item => {
                            _this.trigger('get-rooms', {
                                "data": rooms
                            })
                            // })
                        } else {
                            resolve(args.data)
                        }
                    }
                } else {
                    reject(args)
                }
            })
            _this.sendHeartTimer = setInterval(function () {
                if (!!_this.sendHeartTimer) {
                    _this.heart();
                }
            }, 30000);
        })
    }
    // 连麦
    sendmsg (roomNumber, uid, type) {
        var _this = this
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                let message = {
                    request: true,
                    id: _this.COMMAND_SENDMSG_ID,
                    method: 'sendmsg',
                    data: {
                        rid: roomNumber,
                        uid: uid,
                        type: type,
                        msg: "lianmai"
                    }
                }
                _this.signaling.send(message)
            }, 500)
            _this.eventList.on("sendmsg", function (args) {
                if (args['ok']) {
                    let data = args.data
                    _this.trigger('recvmsg', {
                        "data": data
                    })
                }
            })
        })
    }
    //创建直播房间
    create (nameC, nameR, headC, headR, type) {
        var _this = this
        type = Number(type)
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                let message = {
                    request: true,
                    id: _this.COMMAND_CREATE_ID,
                    method: 'create',
                    data: {
                        info: {
                            name: nameC,
                            head: headC || 'https://gss0.baidu.com/70cFfyinKgQFm2e88IuM_a/forum/w=580/sign=580e773405f431adbcd243317b37ac0f/50f2f9dde71190ef9c7f0079c71b9d16fffa60dc.jpg'
                        },
                        rinfo: {
                            name: nameR,
                            head: headR || 'https://fuss10.elemecdn.com/e/5d/4a731a90594a4af544c0c25941171jpeg.jpeg',
                            type: type
                        }
                    }
                }
                _this.signaling.send(message)
            }, 500);
            _this.eventList.on("create", function (args) {
                console.log(args)
                if (args['ok']) {
                    let rid = args.data.rid
                    _this.trigger("create-room", {
                        "rid": rid
                    })
                }
            })
        })
    }
    // 加入房间
    join (roomID, nameC, head) {
        var _this = this
        return new Promise((resolve, reject) => {
            _this.roomNumber = roomID.toString()
            setTimeout(function () {
                console.log(_this)
                let message = {
                    request: true,
                    id: _this.COMMAND_LIVS_CODE_JOIN_ID,
                    method: "join",
                    data: {
                        rid: _this.roomNumber,
                        info: {
                            name: nameC || "zhou",
                            head: head
                        },
                    },
                };
                _this.signaling.send(message)

            }, 500)
            _this.eventList.on("join", function (args) {

                if (args["ok"]) {
                    if (args.data.hasOwnProperty('users') && args.data.users !== null) {
                        if (args.data.users.length > 0) {
                            console.log(args.data, 1)
                            let users = args.data.users
                            let pubs = args.data.pubs
                            let lives = args.data.lives
                            pubs.forEach(item => {
                                console.log(item)
                                _this.sfuid = item.sfuid
                                _this.trigger("peer-join-pubs", {
                                    "data": item
                                })
                                if (JSON.stringify(item.minfo) == "{}") { } else {
                                    console.log(item)
                                    _this.trigger("stream-added", {
                                        data: item
                                    })

                                }
                            });
                            console.log(users)
                            users.forEach(item => {
                                _this.trigger("peer-join", {
                                    "data": item
                                })
                            })
                            lives.forEach(item => {
                                _this.trigger("live-stream-added", {
                                    data: item
                                })
                            })

                            resolve(args.data)
                        } else {
                            resolve(args.data)
                        }

                    }

                } else {

                    reject(args)
                }


            })

            _this.sendHeartTimer = setInterval(function () {
                if (!!_this.sendHeartTimer) {
                    _this.heart();
                }
            }, 30000);

        })
    }
    // 发布流
    publish (stream, comfig) {

        // if (!(stream instanceof StreamModule.LocalStream)) {
        //     return Promise.reject(new ConferenceError('Invalid stream.'));
        // }
        var _this = this
        return new Promise((resolve, reject) => {
            if (!this.PubRTCPeerConnectionChannel) {

                this.PubRTCPeerConnectionChannel = new ConferencePeerConnectionChannel();
                console.log(this.PubRTCPeerConnectionChannel)
                // this.RTCPeerConnectionChannel.addEventListener('ended', () => {
                //     this.RTCPeerConnectionChannel = null;
                // });
            }
            let publishOption = {
                video: [{
                    rid: 'q',
                    active: true /*, scaleResolutionDownBy: 4.0*/
                },
                {
                    rid: 'h',
                    active: true /*, scaleResolutionDownBy: 2.0*/
                },
                {
                    rid: 'f',
                    active: true
                }
                ]
            };
            let codecs = ['vp8', 'h264']
            // publishOption, codecs
            let canvasType = false
            let indextype = 0
            let recordType = 0
            if (comfig) {

                if (comfig.hasOwnProperty('canvas')) {
                    canvasType = comfig.canvas
                }

                if (comfig.hasOwnProperty('role')) {
                    if (comfig.role == 'anchor') {
                        indextype = 1
                    }
                }

                if (comfig.hasOwnProperty('record')) {
                    if (comfig.record) {
                        if (_this.recordEnabled) {
                            recordType = 1
                        } else {
                            reject('无录制资源包')
                        }
                    }

                }

            }



            console.log(stream)
            this.PubRTCPeerConnectionChannel.publish(stream).then((sdp) => {
                console.log(stream.videoProfile_.height)
                let message = {
                    request: true,
                    id: _this.COMMAND_LIVS_CODE_PUBLISH_ID,
                    method: "publish",
                    data: {
                        rid: _this.roomNumber,
                        jsep: sdp,
                        minfo: {
                            "video": stream.video_,
                            "audio": true,
                            "videotype": 0,
                            "resolution": "1080p",
                            isWeb: true,
                        }
                    }

                };
                this.signaling.send(message)
                // this.stream
                stream.setPeer(this.PubRTCPeerConnectionChannel)
                _this.eventList.on("pubulish", function (args) {

                    if (args["ok"]) {
                        _this.publishMid = {
                            mid: args.data.mid,
                            minfo: args.data.minfo,
                            nid: args.data.nid
                        }
                        console.log(_this.PubRTCPeerConnectionChannel)
                        _this.PubRTCPeerConnectionChannel._sdpHandler(args.data.jsep).then((e) => {
                            if (stream.video_) {
                                _this.PubRTCPeerConnectionChannel._setBitrate(stream.videoProfile_)
                            }

                            resolve(e)
                        })
                        if (_this.mode == 'live') {


                            let mgs = {
                                request: true,
                                id: _this.COMMAND_LIVS_CODE_SFUSTART_ID,
                                method: "startlive",
                                data: {
                                    uid: args.data.uid,
                                    rid: _this.roomNumber,
                                    mid: args.data.mid,
                                    sfuid: args.data.sfuid,
                                    linfo: {
                                        record: recordType,
                                        type: indextype,

                                    }

                                }

                            };
                            _this.signaling.send(mgs)
                        }

                    } else {

                    }
                })
                this.PubRTCPeerConnectionChannel.on('videoTrackType', function (params) {
                    console.log(params)


                    let message = {
                        request: true,
                        id: _this.COMMAND_LIVS_CODE_BROADCAST_ID,
                        method: "broadcast",
                        data: {
                            rid: _this.roomNumber,
                            method: params.lind == 'video' ? 'video' : 'microphone',
                            data: {
                                // trackKind: params.lind,
                                enabled: params.type
                            }
                        }

                    };
                    _this.signaling.send(message)

                })
            }).catch((err) => {
                console.log(err)
            })
        })
    };

    // 取消发布流
    unpublish (stream) {

        var _this = this
        return new Promise((resolve, reject) => {
            console.log(stream)
            this.PubRTCPeerConnectionChannel._unpublish(stream.userId_).then((e) => {
                if (_this.mode == 'live') {
                    let mgs = {

                        request: true,
                        id: _this.COMMAND_LIVS_CODE_SFUSTOP_ID,
                        method: "stoplive",
                        data: {
                            rid: _this.roomNumber,
                            sfuid: _this.sfuid,
                            lid: _this.lid,
                            mcuid: _this.mcuId
                        }

                    };
                    _this.signaling.send(mgs)
                }
                setTimeout(() => {
                    let message = {
                        request: true,
                        id: _this.COMMAND_LIVS_CODE_UNPUBLISH_ID,
                        method: "unpublish",
                        data: {
                            rid: _this.roomNumber,
                            mid: _this.publishMid.mid,
                            sfuid: _this.sfuid,
                        }

                    };
                    _this.signaling.send(message)
                }, 500)


                _this.eventList.on("unpublish", function (args) {
                    console.log(args)
                    if (args['ok']) {
                        stream.stop()
                        _this.PubRTCPeerConnectionChannel = null
                        resolve({
                            code: 'ok'
                        })
                    }

                })

            })
        })
    }
    // 订阅流
    subscribe (stream, options) {

        var _this = this
        return new Promise((resolve, reject) => {
            let streams = {
                settings: {
                    audio: stream.minfo.audio,
                    video: stream.minfo.video === true ? true : (stream.minfo.screen == true ? true : false),
                },
                id: stream.uid,
                date: stream
            }
            console.log(stream)
            console.log(new streamModule())
            // console.log(new streamModule(stream.userId, 'remote', stream.uid))
            // if (!this.SubRTCPeerConnectionChannel) {
            let RemoteMedia = new streamModule(stream.userId, 'remote', stream.uid)
            console.log(RemoteMedia)
            RemoteMedia.sourceType({
                videoType: stream.minfo.video,
                audioType: stream.minfo.audio,
                screenType: stream.minfo.screen,
                screenAudioType: false
            })

            console.log(RemoteMedia)
            let SubRTCPeerConnectionChannel = new ConferencePeerConnectionChannel();



            SubRTCPeerConnectionChannel.subscribe(streams).then((sdp) => {
                console.log(sdp)
                let message = {
                    request: true,
                    id: _this.COMMAND_LIVS_CODE_SUBSCRIBE_ID,
                    method: "subscribe",
                    data: {
                        rid: _this.roomNumber,
                        jsep: sdp,
                        mid: stream.mid,
                        sfuid: _this.sfuid,
                        // minfo: { "codec": "vp8", "video": stream.minfo.video, "audio": stream.minfo.audio, "screen": stream.minfo.screen, resolution: stream.minfo.resolution }
                    }

                };
                this.signaling.send(message)


                _this.eventList.on("subscribe", function (args) {
                    if (args["ok"]) {
                        console.log(args)
                        RemoteMedia.setSid(args.data.sid)
                        console.log(args.data)

                        const subRTC = _this.subscribeRTCPeer.get(args.data.uid)
                        console.log(_this.subscribeRTCPeer.get(args.data.uid))

                        // console.log(subRTC.setSid(args.data.sid))
                        // subRTC.setSid(args.data.sid)
                        subRTC._sdpHandler(args.data.jsep).then((e) => {
                            console.log(e)
                            resolve(e)
                        })
                    } else {

                    }


                })
                SubRTCPeerConnectionChannel.on('stream-subscribed', (event) => {
                    console.log(event)
                    if (event.TrackEvent.track.kind == "audio") {
                        RemoteMedia.ontrack(event.TrackEvent)
                        if (stream.minfo.video == false) {
                            _this.trigger('stream-subscribed', RemoteMedia)
                        }
                    }
                    if (event.TrackEvent.track.kind == "video") {
                        RemoteMedia.ontrack(event.TrackEvent)
                        _this.trigger('stream-subscribed', RemoteMedia)
                    }

                    // if (options === undefined) {
                    //     mediaStream.
                    // }
                })
                console.log(SubRTCPeerConnectionChannel)
                this.subscribeRTCPeer.set(stream.uid, SubRTCPeerConnectionChannel)

            }).catch((err) => {
                console.log(err)
            })
        })
    }

    // 取消订阅流
    unsubscribe (stream) {

        var _this = this

        console.log(stream)
        return new Promise((resolve, reject) => {

            const subRTC = _this.subscribeRTCPeer.get(stream.remoteUserId)
            const subscribedStream = subRTC._subscribedStreams.get(stream.remoteUserId)
            console.log(subRTC)
            console.log(subscribedStream)
            subRTC._unsubscribe(stream.remoteUserId).then((e) => {
                console.log(e)


                let message = {
                    request: true,
                    id: _this.COMMAND_LIVS_CODE_UNSUBSCRIBE_ID,
                    method: "unsubscribe",
                    data: {
                        rid: _this.roomNumber,
                        sfuid: _this.sfuid,
                        sid: _this.sid,

                    }

                };
                _this.signaling.send(message)

                _this.eventList.on("unsubscribe", function (args) {
                    console.log(args)
                    if (args['ok']) {
                        resolve({
                            code: 'ok'
                        })
                    }

                })

            })
        })

    }
    // 销毁房间
    destroy (roomNumber) {
        console.log(111)
        var _this = this
        return new Promise((resolve, reject) => {

            let message = {
                request: true,
                id: _this.COMMAND_DESTROY_ROOMS_ID,
                method: 'destroy',
                data: {
                    rid: roomNumber.toString(),
                }
            }
            this.signaling.send(message)
        })
    }
    // 离开房间
    leave (roomId) {
        var _this = this
        return new Promise((resolve, reject) => {
            if (this.PubRTCPeerConnectionChannel) {
                this.PubRTCPeerConnectionChannel = null
            }
            if (this.SubRTCPeerConnectionChannel) {
                this.SubRTCPeerConnectionChannel = null
            }
            let message = {
                request: true,
                id: _this.COMMAND_LIVS_CODE_LEAVE_ID,
                method: "leave",
                data: {
                    rid: roomId.toString(),

                }

            };
            this.signaling.send(message)
            _this.eventList.on("leave", function (args) {
                console.log(args)
                if (args['ok']) {
                    clearInterval(_this.sendHeartTimer)
                    _this.signaling.close()
                    resolve({
                        code: 'ok'
                    })
                }
            })


        })


    };

    // 消息
    textChat (msg) {
        let message = {
            request: true,
            id: this.COMMAND_LIVS_CODE_BROADCAST_ID,
            method: "broadcast",
            data: {


                data: {
                    method: 'TextChat',
                    userId: msg.userId,
                    nickname: msg.nickname,
                    content: msg.content,
                    sendTime: msg.sendTime
                },
                rid: this.roomNumber,

            }

        };
        this.signaling.send(message)
    }
    // 心跳
    heart () {
        if (this.roomNumber) {
            let message = {
                request: true,
                id: this.COMMAND_LIVS_CODE_HEART_ID,
                method: "keepalive",

                data: {
                    rid: this.roomNumber.toString(),
                },
            };
            this.signaling.send(message)
            this.eventList.on("keepalive", function (args) {
                console.log(args)
                if (args['ok']) {
                    let data = args.data
                    this.trigger("keepalive", {
                        "data": data
                    })
                }
            })
        }


    }

    // 随机产生7为数字
    getRandomNumber (n) {
        var arr = new Array(n); //用于存放随机数
        var randomNumber = ""; //存放随机数
        for (i = 0;i < arr.length;i++) arr[i] = parseInt(Math.random() * 10);
        var flag = 0;
        for (i = 0;i < arr.length - 1;i++) {
            for (let j = i + 1;j < arr.length;j++) {
                if (arr[i] == arr[j]) {
                    flag = 1;
                    break;
                }
            }
            if (flag) break;
        }
        for (var i = 0;i < arr.length;i++) {
            randomNumber += arr[i];
        }
        return randomNumber;
    }
}

export default conferenceClient