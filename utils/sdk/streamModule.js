import eventList from './eventlist'
export default class streamModule {
    constructor(userId, type, RemoteUserId) {
        this.element_ = null
        this.mediaStream = new MediaStream()
        this.userId_ = userId || null
        this.type_ = type
        this.audioOutputDeviceId_ = null
        this.audioProfile_ = { sampleRate: 48000, channelCount: 1, bitrate: 40 }
        this.audioVolume_ = 1
        this.audio_ = null
        this.cameraGroupId_ = null
        this.cameraId_ = null
        this.facingMode_ = undefined
        this.isRemote_ = false
        this.microphoneGroupId_ = null
        this.microphoneId_ = null
        this.mutedFlag_ = 0
        this.muted_ = true
        this.screenAudio_ = null
        this.screenProfile_ = { width: 1920, height: 1080, frameRate: 5, bitrate: 1600 }
        this.screen_ = null
        this.videoBitrate_ = null
        this.videoProfile_ = { width: 848, height: 480, frameRate: 18, bitrate: 610 }
        this.videoSetting_ = null
        this.source = null
        this.video_ = false
        this.remoteUserId = RemoteUserId || null
        this.remoteSid = null
        this.soundMeter = null
        this.pc_ = null
    }

    sourceType (TypeCofig) {
        console.log(TypeCofig)
        this.video_ = TypeCofig.videoType
        this.audio_ = TypeCofig.audioType
        this.screen_ = TypeCofig.screenType
        this.screenAudio_ = TypeCofig.screenAudioType
    }

    setSource (type) {
        this.source = type
    }
    setMediaStream (mediaStream) {
        this.mediaStream = mediaStream
    }
    setSid (id) {
        this.remoteSid = id
    }
    ontrack (tracks) {
        this.mediaStream.addTrack(tracks.track)

    }
    setPeer (pc) {
        this.pc_ = pc
    }
    // 播放音视频
    play (element) {
        if (element && (typeof element === 'object') && (element.nodeType === 1) && (typeof element.nodeName === 'string')) {
            this.element_ == element

            this.element_ = element
            element.srcObject = this.mediaStream

        } else {
            return Promise.reject(new TypeError('element Is not a DOM '));
        }
    }

    // 停止播放
    stop () {
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach((track) => {
                track.stop()
            })
            this.mediaStream = null
        }
    }
    // 设置音频约束
    setAudioProfile (profile) {
        // if(profile.hasOwnProperty())

    }

    // 设置视频约束
    setVideoProfile (profile) {

        if (this.video_ === false) {
            return Promise.reject(new TypeError('video is null'));
        } else {
            if (typeof profile == 'object') {
                if (profile.hasOwnProperty("width")) {
                    this.videoProfile_.width = profile.width
                }
                if (profile.hasOwnProperty("height")) {
                    this.videoProfile_.height = profile.height

                }
                if (profile.hasOwnProperty("frameRate")) {
                    this.videoProfile_.frameRate = profile.frameRate

                }
                if (profile.hasOwnProperty("bitrate")) {
                    this.videoProfile_.bitrate = profile.bitrate

                }

            } else {
                if (profile == '240p' || profile == '360p' || profile == '480p' || profile == '720p' || profile == '1080p') {
                    if (profile == '240p') {
                        this.videoProfile_ = { width: 240, height: 240, frameRate: 18, bitrate: 140 }
                    }
                    if (profile == '360p') {
                        this.videoProfile_ = { width: 360, height: 360, frameRate: 18, bitrate: 260 }
                    }
                    if (profile == '480p') {
                        this.videoProfile_ = { width: 848, height: 480, frameRate: 18, bitrate: 610 }
                    }
                    if (profile == '720p') {
                        this.videoProfile_ = { width: 1280, height: 720, frameRate: 18, bitrate: 1130 }
                    }
                    if (profile == '1080p') {
                        this.videoProfile_ = { width: 1920, height: 1080, frameRate: 30, bitrate: 4000 }
                    }
                }
            }

            let videoTrack = this.mediaStream.getVideoTracks()[0]
            if (videoTrack) {
                videoTrack.applyConstraints({
                    width: { ideal: this.videoProfile_.width },
                    height: { ideal: this.videoProfile_.height },
                    frameRate: { exact: this.videoProfile_.frameRate },
                }).catch((e) => {
                    return Promise.reject(new TypeError(e));
                })
            }
            if (this.pc_) {
                this.pc_._setBitrate(this.videoProfile_)
            }

        }

    }

    // 设置屏幕共享约束
    setScreenProfile () {


    }

    // 
    switchShart (type) {
        var _this = this
        navigator.mediaDevices.getDisplayMedia({ video: true, audio: false }).then((stream) => {

            if (_this.pc_) {
                var pc = _this.pc_._pc

                if (type == 'video') {
                    let videoTrack = stream.getVideoTracks()[0];
                    var videoSender = pc.getSenders().find(function (s) {
                        return s.track.kind == videoTrack.kind;
                    });
                    console.log(videoSender)
                    videoSender.replaceTrack(videoTrack);
                }
                if (type == 'audio') {
                    let audioTrack = stream.getAudioTracks()[0];
                    var audioSender = pc.getSenders().find(function (s) {
                        return s.track.kind == audioTrack.kind;
                    });
                    audioSender.replaceTrack(audioTrack);
                }
            }
            if (type == 'video') {
                let media = new MediaStream()
                media.addTrack(stream.getVideoTracks()[0])
                media.addTrack(_this.mediaStream.getAudioTracks()[0])

                _this.mediaStream = media
                console.log(media)

            }
            if (type == 'audio') {
                let media = new MediaStream()
                media.addTrack(stream.getAudioTracks()[0])
                media.addTrack(_this.mediaStream.getVideoTracks()[0])

                _this.mediaStream = media
            }
            if (_this.element_) {
                _this.element_.srcObject = _this.mediaStream
            }

        }).catch(e => {
            return Promise.reject(e)
        })

    }
    // 切换设备
    switchDevice (type, deviceId) {
        var _this = this
        if (type != 'audio' && type != 'video') {
            return Promise.reject(new TypeError('type Parameter error'));
        }
        if (deviceId == null || deviceId == undefined) {
            return Promise.reject(new TypeError('deviceId Parameter error'));
        }
        console.log(_this.mediaStream.getVideoTracks().length)
        if (type == 'video' && !_this.mediaStream.getVideoTracks().length) {
            return Promise.reject(new TypeError('VideoTracks is null'));
        }
        if (type == 'audio' && !_this.mediaStream.getAudioTracks().length) {
            return Promise.reject(new TypeError('AudioTrack is null'));
        }
        navigator.mediaDevices.getUserMedia({
            video: type == 'video' ? {
                width: {
                    ideal: this.videoProfile_.width
                },
                frameRate: { exact: this.videoProfile_.frameRate },
                height: {
                    ideal: this.videoProfile_.height
                },
                deviceId: {
                    exact: deviceId
                }

            } : false,
            audio: type == 'audio' ? {
                deviceId: {
                    exact: deviceId
                }
            } : false
        }).then((stream) => {


            if (_this.pc_) {
                var pc = _this.pc_._pc

                if (type == 'video') {
                    let videoTrack = stream.getVideoTracks()[0];
                    var videoSender = pc.getSenders().find(function (s) {
                        return s.track.kind == videoTrack.kind;
                    });
                    console.log(videoSender)
                    videoSender.replaceTrack(videoTrack);
                }
                if (type == 'audio') {
                    let audioTrack = stream.getAudioTracks()[0];
                    var audioSender = pc.getSenders().find(function (s) {
                        return s.track.kind == audioTrack.kind;
                    });
                    audioSender.replaceTrack(audioTrack);
                }
            }
            if (type == 'video') {
                let media = new MediaStream()
                media.addTrack(stream.getVideoTracks()[0])
                media.addTrack(_this.mediaStream.getAudioTracks()[0])

                _this.mediaStream = media
                console.log(media)

            }
            if (type == 'audio') {
                let media = new MediaStream()
                media.addTrack(stream.getAudioTracks()[0])
                media.addTrack(_this.mediaStream.getVideoTracks()[0])

                _this.mediaStream = media
            }
            if (_this.element_) {
                _this.element_.srcObject = _this.mediaStream
            }

        }).catch(e => {
            return Promise.reject(e)
        })


    }
    // 添加 轨道
    addTrack () {

    }
    // 删除轨道
    remoteTrack () {

    }
    // 更换音频或视频轨道
    replaceTrack (track) {
        var _this = this
        if (_this.pc_) {
            var pc = _this.pc_._pc
            var audioSender = pc.getSenders().find(function (s) {
                return s.track.kind == track.kind;
            });
            audioSender.replaceTrack(track);

            if (track.kind == 'video') {
                let media = new MediaStream()
                media.addTrack(track)
                media.addTrack(_this.mediaStream.getAudioTracks()[0])

                _this.mediaStream = media
                console.log(media)

            }
            if (track.kind == 'audio') {
                let media = new MediaStream()
                media.addTrack(track)
                media.addTrack(_this.mediaStream.getVideoTracks()[0])

                _this.mediaStream = media
            }
            if (_this.element_) {
                _this.element_.srcObject = _this.mediaStream
            }

        }



    }

    //  禁用音频轨道。
    muteAudio () {

        // return new Promise(function (resolve, reject) {
        let mediaStream = this.mediaStream
        if (mediaStream.getAudioTracks()[0]) {
            let videoTrack = mediaStream.getAudioTracks()[0];
            if (videoTrack.enabled == true) {
                videoTrack.enabled = false;
                if (this.pc_) {
                    this.pc_.trigger('videoTrackType', { userId: this.userId_, lind: 'audio', type: false })
                }
            }

        }

        // })


    }

    //  禁用视频轨道
    muteVideo () {
        // return new Promise(function (resolve, reject) {
        let mediaStream = this.mediaStream
        if (mediaStream.getVideoTracks()[0]) {
            let videoTrack = mediaStream.getVideoTracks()[0];
            if (videoTrack.enabled == true) {
                videoTrack.enabled = false;

                if (this.pc_) {
                    this.pc_.trigger('videoTrackType', { userId: this.userId_, lind: 'video', type: false })
                }
            }

        }

        // })

    }

    // 启用音频轨道。
    unmuteAudio () {
        // return new Promise(function (resolve, reject) {
        let mediaStream = this.mediaStream
        if (mediaStream.getAudioTracks()[0]) {
            let videoTrack = mediaStream.getAudioTracks()[0];
            if (videoTrack.enabled == false) {
                videoTrack.enabled = true;
                if (this.pc_) {
                    this.pc_.trigger('videoTrackType', { userId: this.userId_, lind: 'audio', type: true })
                }
            }

        }

        // })


    }
    // 启用视频轨道。
    unmuteVideo () {
        // return new Promise(function (resolve, reject) {
        let mediaStream = this.mediaStream
        if (mediaStream.getVideoTracks()[0]) {
            let videoTrack = mediaStream.getVideoTracks()[0];
            if (videoTrack.enabled == false) {
                videoTrack.enabled = true;
                if (this.pc_) {
                    this.pc_.trigger('videoTrackType', { userId: this.userId_, lind: 'video', type: true })
                }
            }

        }

        // })

    }

    // 获取该流所属的用户 ID。
    getUserId () {

    }

    // 设置声音输出设备。
    setAudioOutput (sinkId) {
        if (sinkId) {
            if (typeof this.element_.sinkId !== 'undefined') {
                this.element_.setSinkId(sinkId)
                    .then(() => {
                        console.log(`Success, audio output device attached: ${sinkId}`);
                    })
                    .catch(error => {
                        let errorMessage = error;
                        if (error.name === 'SecurityError') {
                            errorMessage = `You need to use HTTPS for selecting audio output device: ${error}`;
                        }
                        console.log(errorMessage);
                        // Jump back to first output device in the list as it's the default.
                        // audioOutputSelect.selectedIndex = 0;
                    });
            } else {
                console.warn('Browser does not support output device selection.');
            }
        }
    }

    // 获取当前音量大小
    getAudioLevel () {
        var _this = this
        return new Promise((resolve, reject) => {
            if (!window.AudioContext) {
                reject(new TypeError('您的浏览器不支持AudioContext'));
            } else {
                if (_this.soundMeter) {

                    resolve(_this.soundMeter.instant.toFixed(2));
                } else {
                    let audioCtxR = new (window.AudioContext || window.webkitAudioContext)();
                    let source = audioCtxR.createMediaStreamSource(this.mediaStream);
                    const soundMeter = new SoundMeter(source.context);
                    soundMeter.connectToSource(this.mediaStream, function (e) {
                        if (e) {
                            alert(e);
                            return;
                        }
                        // setInterval(() => {

                        _this.soundMeter = soundMeter

                        resolve(_this.soundMeter.instant.toFixed(2));

                        // }, 300);
                    });
                }


            }
        })
    }
    // 获取音频轨道。
    getAudioTrack () {
        if (!this.mediaStream.getAudioTracks().length) {
            return Promise.reject(new TypeError('AudioTrack is null'));
        }

        return this.mediaStream.getAudioTracks()[0]

    }

    // 获取视频轨道。
    getVideoTrack () {
        if (!this.mediaStream.getVideoTracks().length) {
            return Promise.reject(new TypeError('AudioTrack is null'));
        }

        return this.mediaStream.getVideoTracks()[0]
    }

    // 判断是否有音频
    hasAudio () {

        if (!this.mediaStream.getAudioTracks().length) {
            return false
        } else {
            return true
        }

    }

    // 判断是视频
    hasVideo () {

        if (!this.mediaStream.getVideoTracks().length) {
            return false
        } else {
            return true
        }

    }
    // 获取当前视频帧
    getVideoFrame () {

    }

    // 设置播放音量大小
    setAudioVolume (volumeValue) {
        if (!this.element_) {
            return Promise.reject(new TypeError('element is undefil'));
        }

        this.element_.volume = volumeValue;

    }



}
function SoundMeter (context) {
    this.context = context;
    this.instant = 0.0;
    this.slow = 0.0;
    this.clip = 0.0;
    this.script = context.createScriptProcessor(2048, 1, 1);
    const that = this;
    this.script.onaudioprocess = function (event) {
        const input = event.inputBuffer.getChannelData(0);
        let i;
        let sum = 0.0;
        let clipcount = 0;
        for (i = 0;i < input.length;++i) {
            sum += input[i] * input[i];
            if (Math.abs(input[i]) > 0.99) {
                clipcount += 1;
            }
        }
        that.instant = Math.sqrt(sum / input.length);
        that.slow = 0.95 * that.slow + 0.05 * that.instant;
        that.clip = clipcount / input.length;
    };

}

SoundMeter.prototype.connectToSource = function (stream, callback) {

    try {
        this.mic = this.context.createMediaStreamSource(stream);
        this.mic.connect(this.script);
        // necessary to make sample run, but should not be.
        this.script.connect(this.context.destination);
        if (typeof callback !== 'undefined') {
            callback(null);
        }
    } catch (e) {
        console.error(e);
        if (typeof callback !== 'undefined') {
            callback(e);
        }
    }
};