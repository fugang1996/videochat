import Adapter from './adapter'
import * as MediaFormatModule from './mediaformat.js';
import * as streamClient from './createStreams'
import streamModule from './streamModule'
import unicomMiddle from "./unicomMiddle";
var RTC = {
    // 检测Web SDK 是否支持当前浏览器
    async checkSystemRequirements () {
        try {
            let testRTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection || window.RTCIceGatherer;
            if (testRTCPeerConnection) {
                let serverConfig = {
                    "iceServers": [{
                        urls: [
                            "stun:stun.l.google.com:19302",
                            "stun:stun1.l.google.com:19302",
                            "stun:stun2.l.google.com:19302",
                            "stun:stun.l.google.com:19302?transport=udp"
                        ]
                    }]
                };
                new RTCPeerConnection(serverConfig);
                return await true;
            } else {
                console.error('Your browser is not compatible with RTC');
                return await false
            }
        } catch (error) {
            console.error('Your browser is not compatible with RTC');
            return await false

        }
    },
    // 是否支持屏幕共享
    isScreenShareSupported () {
        if (navigator.mediaDevices && 'getDisplayMedia' in window.navigator.mediaDevices) {
            return true
        } else {
            return false
        }

    },
    // 返回媒体输入输出设备列表。
    getDevices () {
        return new Promise(function (resolve, reject) {
            navigator.mediaDevices.getUserMedia({
                audio: true,
                video: true
            }).then(function (stream) {
                stream.getTracks().forEach((track) => {
                    track.stop()
                })
                navigator.mediaDevices.enumerateDevices()
                    .then(function (deviceInfos) {
                        console.log(deviceInfos)
                        var data = [];
                        for (var i = 0;i !== deviceInfos.length;++i) {
                            var deviceInfo = deviceInfos[i];
                            let arrdate = {
                                deviceId: deviceInfo.deviceId,
                                groupId: deviceInfo.groupId,
                                kind: deviceInfo.kind,
                                label: deviceInfo.label || deviceInfo.kind + '_' + i
                            }
                            data.push(arrdate)
                        }
                        resolve(data)
                    }).catch(function (error) {
                        console.log('Error: ', error);
                        reject(error)
                    });

            }).catch(function (err) {
                reject(err)
            })
        })

    },
    // 返回摄像头设备列表s
    getCameras () {
        return new Promise(function (resolve, reject) {
            navigator.mediaDevices.getUserMedia({
                audio: true,
                video: true
            }).then(function (stream) {
                stream.getTracks().forEach((track) => {
                    track.stop()
                })
                navigator.mediaDevices.enumerateDevices()
                    .then(function (deviceInfos) {
                        var data = [];
                        for (var i = 0;i !== deviceInfos.length;++i) {
                            var deviceInfo = deviceInfos[i];
                            if (deviceInfo.kind === 'videoinput') {
                                let arrdate = {
                                    deviceId: deviceInfo.deviceId,
                                    groupId: deviceInfo.groupId,
                                    kind: deviceInfo.kind,
                                    label: deviceInfo.label || deviceInfo.kind + '_' + i
                                }
                                data.push(arrdate)
                            }
                        }
                        resolve(data)
                    }).catch(function (error) {
                        console.log('Error: ', error);
                        reject(error)
                    });

            }).catch(function (err) {
                reject(err)
            })
        })

    },
    // 返回麦克风设备列表
    getMicrophones () {
        return new Promise(function (resolve, reject) {
            navigator.mediaDevices.getUserMedia({
                audio: true,
                video: true
            }).then(function (stream) {
                stream.getTracks().forEach((track) => {
                    track.stop()
                })
                navigator.mediaDevices.enumerateDevices()
                    .then(function (deviceInfos) {
                        console.log(deviceInfos)
                        var data = [];
                        for (var i = 0;i !== deviceInfos.length;++i) {
                            var deviceInfo = deviceInfos[i];
                            if (deviceInfo.kind === 'audioinput') {
                                let arrdate = {
                                    deviceId: deviceInfo.deviceId,
                                    groupId: deviceInfo.groupId,
                                    kind: deviceInfo.kind,
                                    label: deviceInfo.label || deviceInfo.kind + '_' + i
                                }
                                data.push(arrdate)
                            }
                        }
                        resolve(data)
                    }).catch(function (error) {
                        console.log('Error: ', error);
                        reject(error)
                    });

            }).catch(function (err) {
                reject(err)
            })
        })

    },
    // 返回扬声器设备列表
    getSpeakers () {
        return new Promise(function (resolve, reject) {
            navigator.mediaDevices.getUserMedia({
                audio: true,
                video: true
            }).then(function (stream) {
                stream.getTracks().forEach((track) => {
                    track.stop()
                })
                navigator.mediaDevices.enumerateDevices()
                    .then(function (deviceInfos) {
                        console.log(deviceInfos)
                        var data = [];
                        for (var i = 0;i !== deviceInfos.length;++i) {
                            var deviceInfo = deviceInfos[i];
                            if (deviceInfo.kind === 'audiooutput') {
                                let arrdate = {
                                    deviceId: deviceInfo.deviceId,
                                    groupId: deviceInfo.groupId,
                                    kind: deviceInfo.kind,
                                    label: deviceInfo.label || deviceInfo.kind + '_' + i
                                }
                                data.push(arrdate)
                            }
                        }
                        resolve(data)
                    }).catch(function (error) {
                        console.log('Error: ', error);
                        reject(error)
                    });

            }).catch(function (err) {
                reject(err)
            })
        })

    },
    // 创建本地客户端client
    createClient (streamConfig) {

        if (typeof streamConfig !== 'object') {
            return Promise.reject(new TypeError('streamConfig should be an object.'));
        }
        if (!streamConfig.hasOwnProperty("userId")) {
            return Promise.reject(new TypeError('Must contain userid'));
        }

        if (!streamConfig.hasOwnProperty("AppId")) {
            return Promise.reject(new TypeError('Must contain AppId'));
        }

        // if (!streamConfig.hasOwnProperty("token")) {
        //     return Promise.reject(new TypeError('Must contain token'));
        // }

        if (!streamConfig.hasOwnProperty("mode")) {
            return Promise.reject(new TypeError('Must contain mode'));
        }

        let peam = {
            userId: streamConfig.userId,
            Appid: encodeURIComponent(streamConfig.AppId),
            mode: streamConfig.mode
        }





    },
    // 创建本地音视频流
    createStream (streamConfig) {

        return new Promise((resolve, reject) => {
            if (typeof streamConfig !== 'object') {
                // return Promise.
                reject(new TypeError('streamConfig should be an object.'));
            }
            if (!streamConfig.hasOwnProperty("userId")) {
                // return Promise.
                reject(new TypeError('Must contain userid'));
            }

            let audioConstraints
            let videoConstraints
            let Config = {
                videoType: false,
                audioType: false,
                screenType: false,
                screenAudioType: false
            }
            if (streamConfig.hasOwnProperty("audio") || streamConfig.hasOwnProperty("video") || streamConfig.hasOwnProperty("screen")) {



                if (streamConfig.hasOwnProperty("audio")) {
                    if (streamConfig.audio) {
                        audioConstraints = new streamClient.AudioTrackConstraints(MediaFormatModule.AudioSourceInfo.MIC);
                        Config.audioType = true
                        if (streamConfig.hasOwnProperty("microphoneId")) {
                            audioConstraints.deviceId = streamConfig.microphoneId
                        }
                    }
                }
                if (streamConfig.hasOwnProperty("video")) {
                    if (streamConfig.video) {
                        Config.videoType = true
                        videoConstraints = new streamClient.VideoTrackConstraints(MediaFormatModule.VideoSourceInfo.CAMERA);
                        if (streamConfig.hasOwnProperty("cameraId")) {
                            videoConstraints.deviceId = streamConfig.cameraId
                        }
                        if (streamConfig.hasOwnProperty("facingMode")) {
                            videoConstraints.facingMode = streamConfig.facingMode
                        }
                    }
                }
                if (streamConfig.hasOwnProperty("screen")) {
                    if (streamConfig.screen) {
                        Config.screenType = true
                        videoConstraints = new streamClient.VideoTrackConstraints(MediaFormatModule.VideoSourceInfo.SCREENCAST);

                    }
                }
                if (streamConfig.hasOwnProperty("screenAudio")) {
                    if (streamConfig.screenAudio) {
                        Config.screenAudioType = true
                        audioConstraints = new streamClient.VideoTrackConstraints(MediaFormatModule.AudioSourceInfo.SCREENCAST);
                    }

                }

                streamClient.MediaStreamFactory.createMediaStream(new streamClient.StreamConstraints(audioConstraints, videoConstraints))
                    .then((stream) => {

                        let mediaStream = new streamModule(streamConfig.userId, 'local')
                        console.log(stream)

                        mediaStream.setMediaStream(stream)
                        let mm = new MediaStream()
                        console.log(mm.getAudioTracks()[0])
                        console.log(Config)
                        mediaStream.sourceType(Config)
                        mediaStream.setSource(new streamClient.StreamConstraints(audioConstraints, videoConstraints))
                        if (Config.videoType) {
                            // mediaStream.setVideoProfile('480p')
                        }
                        resolve(mediaStream)
                    }).catch((err) => {
                        console.log(err);
                        reject(err)
                    });
            } else if (streamConfig.hasOwnProperty("videoTrack") || streamConfig.hasOwnProperty("audioTrack")) {
                let stream = new MediaStream()

                if (streamConfig.hasOwnProperty("videoTrack")) {
                    if (streamConfig.videoTrack) {
                        Config.videoType = true
                        stream.addTrack(streamConfig.videoTrack)
                    }
                }
                if (streamConfig.hasOwnProperty("audioTrack")) {
                    if (streamConfig.audioTrack) {
                        Config.audioType = true
                        stream.addTrack(streamConfig.audioTrack)
                    }
                }
                let mediaStream = new streamModule(streamConfig.userId, 'local')
                console.log(stream)

                mediaStream.setMediaStream(stream)

                console.log(Config)
                mediaStream.sourceType(Config)
                // mediaStream.setSource(new streamClient.StreamConstraints(audioConstraints, videoConstraints))
                // if (Config.videoType) {
                //     mediaStream.setVideoProfile('480p')
                // }
                resolve(mediaStream)

            }
        })

    }


}

export default RTC