<!--
 * @Descripttion: no
 * @version: 1.0.0
 * @Author: fugang
 * @Date: 2021-06-28 09:47:23
 * @LastEditors: fugang
 * @LastEditTime: 2021-11-19 16:13:11
-->
<template>
  <div class="Live-Column">
    <div class="Video-Column" id='LeftColumn' :style="{ width: activewidth}">
      <div class="navigation_bar">
        <div class="rightDiv_box">
          <div class="rightDiv_right">
            <button @click="stratLive()">
              {{ liveType == true ? "结束直播" : "开始直播" }}</button>
          </div>
        </div>
      </div>
      <div class="HandoutDiv">
        <video id='fictitious-video' autoplay preload width="100%" height="100%" :poster="couserImage"></video>
      </div>
      <section class="top_bar_right gdright">
        <img src="../assets/sxt.png" alt="" @click="toRemoteht('Video',mute)" v-show="!mute">
        <img src="../assets/dssxt.png" alt="" @click="toRemoteht('Video',mute)" v-show="mute">
        <img src="../assets/audio.png" alt="" @click="toRemoteht('Audio',mute)" v-show="!isAudio">
        <img src="../assets/dsaudio.png" alt="" @click="toRemoteht('Audio',mute)" v-show="isAudio">
        <img src="../assets/gd.png" alt="" @click="gddialog">
        <el-select size="mini" class="toselct" v-model="constraint" @change="select()" placeholder="切换分辨率">
          <el-option v-for="(item, index) in optionA" :key="index" :label="item.name" :value="item.type">
          </el-option>
        </el-select>
      </section>
    </div>
    <div class="seconddialog">
      <el-dialog title="更多" :center='true' :visible.sync="isShowSelectCModal" width="518px"
        :before-close="handleCloseCameraRoom" :close-on-click-modal="false">
        <div class="dialogsetting">摄像头设置</div>

        <div class="cameraContent">
          <video v-show="sourceType != 'audio'" autoplay id="video002"></video>
          <audio v-show="sourceType == 'audio'" autoplay id="audio002"></audio>
        </div>
        <el-select v-model="videoCamer" placeholder="请选择摄像头" lass="derviceList" @change="selectedCamera()">
          <el-option v-for="item in videoDeviceList" :key="item.deviceId" :label="item.label" :value="item.deviceId">
          </el-option>
        </el-select>
        <div class=" dialogsetting">麦克风设置
        </div>
        <el-select v-model="audioCamer" placeholder="请选择麦克风" lass="derviceList" @change="selectedAudioItem()">
          <el-option v-for="item in audioDerviceList" :key="item.deviceId" :label="item.label" :value="item.deviceId">
          </el-option>
        </el-select>
        <span slot="footer" class="dialog-footer">
          <el-button size="mini" class="left-p-btn" type="primary" @click="switchDevice('video')">确 定
          </el-button>
          <el-button size="mini" class="right-p-btn" @click="isShowSelectCModal = false">取 消</el-button>
        </span>
      </el-dialog>
    </div>

  </div>
</template>

<script>
  import RTC from "../../utils/sdk/rtc"
  export default {
    name: "home",
    data() {
      return {

        flag: 0,
        couserImage: "@/assets/menu/live.png",
        constraint: null,
        isAudio: false,
        optionA: [{
            name: "标清",
            type: "SD",
          },
          {
            name: "高清",
            type: "HD",
          },
          {
            name: "超高清",
            type: "UHD",
          },
        ],
        liveType: false,

        activewidth: 'auto',
        isActive: true,
        userId: null,
        localStream: null,
        cameraTrack: null,
        sourceType: "",
        videoDeviceList: [], //视频设备视频
        audioDerviceList: [], // 音频设备
        selectedAudioIndex: null, //麦克风设备选择项
        videoCamer: null, //摄像头设置
        audioCamer: null, //麦克风设置
        isShowSelectCModal: false,
        mute: false,
      };
    },
    methods: {
      // 分辨率
      select() {
        console.log(this.constraint);
        let constraints;
        if (this.constraint == "SD") {
          constraints = {
            width: {
              min: 640,
              ideal: 640,
              max: 640
            },
            height: {
              min: 360,
              ideal: 360,
              max: 360
            },
            aspectRatio: 1.777778,
          };
        } else if (this.constraint == "HD") {
          constraints = {
            width: {
              min: 1280,
              ideal: 1280,
              max: 1280
            },
            height: {
              min: 720,
              ideal: 720,
              max: 720
            },
            aspectRatio: 1.777778,
          };
        } else if (this.constraint == "UHD") {
          constraints = {
            width: {
              min: 1280,
              ideal: 1920,
              max: 1920
            },
            height: {
              min: 720,
              ideal: 1080,
              max: 1080
            },
            aspectRatio: 1.777778,
          };
        }
        if (this.localStream) {
          console.log(this.localStream);
          this.localStream.setVideoProfile(constraints.height.ideal + "p");
        }
      },
      // 更多
      gddialog() {
        this.isShowSelectCModal = true
        this.openCameraModal()
        this.openMicrophones()
      },
      //开关音视频
      toRemoteht(type, mute) {
        if (type == 'Audio') {
          if (this.isAudio == false) {
            this.localStream.muteAudio()
            this.isAudio = true
          } else {
            this.localStream.unmuteAudio()
            this.isAudio = false
          }
        } else
        if (type == 'Video') {
          if (mute == false) {
            this.localStream.muteVideo()
            this.mute = true
          } else {
            this.localStream.unmuteVideo()
            this.mute = false
          }
        }
        this.isActive = !this.isActive
      },

      //开始直播
      stratLive() {
        var _this = this;
        const configStream = {
          userId: this.userId,
          video: true,
          audio: true,
        };
        RTC.createStream(configStream).then((stream) => {
          _this.localStream = stream;
          _this.liveType = true;
          _this.cameraTrack = _this.localStream.getVideoTrack()
          _this.localStream.setVideoProfile({
            width: 1080,
            height: 720,
            frameRate: 30 //帧率
          })
          let dd = document.getElementById('fictitious-video')
          _this.localStream.play(dd)

        });
      },
      //关闭摄像头弹框
      handleCloseCameraRoom() {
        this.isShowSelectCModal = false;
      },
      /****获取摄像头列表 */
      openCameraModal() {
        if (this.videoDeviceList.length == 0) {
          RTC.getCameras().then((res) => {
            if (res && res.length > 0) {
              res.forEach((item) => {
                this.videoDeviceList.push(item)
              });
            }
          });
        }
        this.isShowSelectCModal = true;
      },
      // 获取麦克风列表
      openMicrophones() {
        if (this.audioDerviceList.length == 0) {
          RTC.getMicrophones().then((res) => {
            if (res && res.length > 0) {
              res.forEach((item) => {
                this.audioDerviceList.push(item)
              })
            }
          })
        }
      },
      /***切换设备 */
      switchDevice(type) {
        let deviceId = null
        type == 'video' ? deviceId = this.videoDeviceId : deviceId = null
        type == 'video' ? this.isShowSelectCModal = false : this.isShowSelectAModal = false
        this.localStream.switchDevice(type, deviceId)

        this.currentSelectedStream.getTracks().forEach((item) => {
          item.stop()
        })
      },
      //切换摄像头
      selectedCamera() {
        this.videoDeviceId = this.videoCamer;
        if (navigator.mediaDevices.getUserMedia) {
          navigator.getUserMedia({
              video: {
                width: 480,
                height: 270,
                deviceId: this.videoDeviceId
              },
              audio: true,
            },
            (stream) => {
              this.currentSelectedStream = stream
              var video = document.getElementById("video002");
              video.srcObject = stream;
              video.onloadedmetadata = function (e) {
                video.play();
              };
            },
            (error) => {
              console.log(error.name || error);
            }
          );
        }
      },
      /***选择麦克风事件 */
      selectedAudioItem() {
        this.audioDeviceId = this.audioCamer

      },
      startlive() {
        this.dialogVisibleLianmai = true
        this.livemethods()
      },
      livemethods() {
        const configStream = {
          userId: this.userId,
          video: true,
          audio: true,
        };
        RTC.createStream(configStream).then((stream) => {
          this.localStream = stream
          this.cameraTrack = this.localStream.getVideoTrack()
          this.localStream.setVideoProfile({
            width: 720,
            height: 540,
            frameRate: 15
          })
        })
      },
    },
  };
</script>
<style lang="less" scoped>
  .Live-Column {
    .Video-Column {
      height: auto;
      position: absolute;
      top: 0px;
      bottom: 0px;
      right: 0;
      left: 0;
      overflow: hidden;
      margin-top: 60px;
      background: #f5f5f5;

      .navigation_bar {
        position: relative;
        height: 32px;
        background: #fff;
        overflow: hidden;
        text-align: left;
        padding: 15px 0px;
        border: 1px solid #EEEEEE;
        margin: 0px 20px 0 20px;


        .rightDiv_box {
          height: 40px;
          margin-right: 20px;

          img {
            width: 30px;
            height: 30px;
            border-radius: 50%;
            background: #fff;
            line-height: 30px;
            margin-left: 30px;
            margin-right: 10px;
          }

          .rightDiv_right {
            float: right;

            button {
              width: 150px;
              height: 42px;
              background: linear-gradient(270deg, #FED534 0%, #FFB120 100%);
              border-radius: 21px;
              border: 0px;
              color: #fff;
              cursor: pointer;
            }
          }

          span {
            position: relative;
            top: -6px;
          }
        }
      }

      .HandoutDiv {
        height: 80%;
        //   height: calc(100% - 82px);
        position: relative;
        background-size: 100% 100%;
        background-repeat: no-repeat;
        background: linear-gradient(180deg, #312105 0%, #121D36 100%);
        margin: 20px 20px 0px 20px;
        margin-top: 0px;
        position: relative;
      }

      .top_bar_right {
        height: 32px;

        .audioOput-icon {
          display: inline-block;
          width: 32px;
          height: 32px;
          vertical-align: text-bottom;
          background: url(../assets/menu/on-audioOupt.png) no-repeat;
          background-size: 100% 100%;
          margin-right: 5px;
          cursor: pointer;
        }

        .video-icon {
          display: inline-block;
          width: 32px;
          height: 32px;
          vertical-align: text-bottom;
          background: url(../assets/menu/on-video.png) no-repeat;
          background-size: 100% 100%;

          margin-right: 5px;
          cursor: pointer;

          &.off {
            background-image: url(../assets/menu/off-video.png);
          }
        }

        .audio-icon {
          display: inline-block;
          width: 32px;
          height: 32px;
          vertical-align: text-bottom;
          background: url(../assets/menu/on-audio.png) no-repeat;
          background-size: 100% 100%;
          cursor: pointer;

          &.off {
            background-image: url(../assets/menu/off-audio.png);
          }
        }
      }
    }
  }

  .seconddialog /deep/ .el-dialog {
    background: rgba(51, 51, 51, 0.9);
    position: absolute;
    right: 0;
    bottom: 0;
  }

  .seconddialog /deep/ .el-dialog__wrapper {
    z-index: 2005;
  }

  .seconddialog /deep/ .el-dialog__header {
    border-bottom: 1px solid rgba(238, 238, 238, 0.2);
  }

  .firstdialog /deep/ .el-dialog__header {
    padding: 0;
  }

  .firstdialog /deep/.el-radio__label {
    color: #fff;
  }

  .firstdialog /deep/ .el-dialog {
    background: rgba(0, 0, 0, 0.5);
  }

  .seconddialog /deep/ .el-select {
    width: 100%;
    background: #343440;
  }

  .seconddialog /deep/ .el-dialog__title {
    color: #fff;
  }

  .dialogsetting {
    color: #fff;
    padding: 10px 5px;
    text-align: left;
  }

  .firstdialog /deep/ .el-textarea__inner {
    background: #30323E;
    border: none;
    color: #fff;
  }


  .firstdialog /deep/ .el-input__inner {
    background: rgba(0, 0, 0, 0);
    border: 1px solid rgba(0, 0, 0, 0);
    color: #fff;
    margin-top: 5px;
    margin-left: 15px;
  }

  .description {
    display: flex;
    position: relative;

    .flushed {
      width: 29px;
      height: 29px;
      position: relative;
      left: -30px;
      bottom: -70px;
      cursor: pointer;
    }
  }



  .gdright {
    text-align: right;

    img {
      margin: 10px;
      cursor: pointer;
    }

    .fullscreen-button {
      position: relative;
      top: -100px;
      margin-right: 20px;
    }

    .fbl {
      position: relative;
      top: -19px;
      margin-right: 20px;
      background: rgba(61, 62, 60, 0.9);
      border-radius: 6px;
      font-size: 12px;
      padding: 5px;
      color: #fff;
      cursor: pointer;
      border: 0;
    }
  }

  .gdright /deep/ .el-switch {
    position: relative;
    top: -20px;
    margin: 0 10px;
  }

  .toselct {
    width: 110px;
    position: relative;
    top: -20px;
    margin-right: 20px;
  }
</style>