<!--
 * @Descripttion: no
 * @version: 1.0.0
 * @Author: fugang
 * @Date: 2021-06-28 09:47:23
 * @LastEditors: fugang
 * @LastEditTime: 2021-12-10 18:21:48
-->
<template>
  <div class="Live-Column">
    <div class="Video-Column" id='LeftColumn' :style="{ width: activewidth}">
      <div class="navigation_bar">
        <div class="rightDiv_box">
          <el-button round type="primary" @click="sharedDeskEvent()">屏幕共享</el-button>
          <el-button round type="success" @click="drawEvent()">电子白板</el-button>
          <el-button round type="danger" @click="stratLive()">视频通话</el-button>
        </div>
      </div>
      <div class="HandoutDiv">
        <video id='fictitious-video' v-show="isCanvas == false" autoplay preload width=" 100%" height="100%"
          :poster="couserImage"></video>
        <div v-show="isCanvas" id="draw" class="draw">
          <div id="canvasBoxs">
            <div id="baseMap"><canvas id="the-canvas"></canvas></div>
            <canvas id="canvas" style=""></canvas>
            <canvas id="streamCanvas"></canvas>
          </div>
        </div>
        <!-- 电子画板 -->
        <div class="draw drawButton" v-show="isCanvas">
          <!-- <div class="swiper-containe"> -->
          <div id="kuang">
            <!-- 画笔 -->
            <div class="line k1 toolbar-active">
              <el-tooltip class="item" effect="dark" content="画笔" placement="right-start">
                <el-button id="Line" @click="lineDrawEvent" class="button button2"></el-button>
              </el-tooltip>
            </div>
            <!-- 直线 -->
            <div class="k1">
              <el-tooltip class="item" effect="dark" content="直线" placement="right-start">
                <el-button id="straight" @click="straightDrawEvent" class="button button2"></el-button>
              </el-tooltip>
            </div>

            <!-- 箭头 -->
            <div class="k1">
              <el-tooltip class="item" effect="dark" content="箭头" placement="right-start">
                <el-button id="jiantou" @click="arrowDrawEvent" class="button button2"></el-button>
              </el-tooltip>
            </div>
            <!-- 矩形 -->
            <div class="k1">
              <el-tooltip class="item" effect="dark" content="矩形" placement="right-start">
                <el-button id="juxing" @click="rectangleDrawEvent" class="button button2"></el-button>
              </el-tooltip>
            </div>
            <!-- 椭圆 -->
            <div class="k1">
              <el-tooltip class="item" effect="dark" content="圆形" placement="right-start">
                <el-button id="tuoyuan" @click="circularDrawEvent" class="button button2"></el-button>
              </el-tooltip>
            </div>
            <!-- 橡皮擦 -->
            <div class="k1">
              <el-tooltip class="item" effect="dark" content="橡皮擦" placement="right-start">
                <el-button id="xpc" @click="eraserDrawEvent" class="button button2"></el-button>
              </el-tooltip>
            </div>
            <!-- 删除 -->
            <div class="k1">
              <el-tooltip class="item" effect="dark" content="清屏" placement="right-start">
                <el-button id="qingping" @click="clearScreenDrawEvent" class="button button2"></el-button>
              </el-tooltip>
            </div>
            <!-- 撤销 -->

            <div class="color" title="颜色">
              <el-color-picker v-model="color" :predefine="predefineColors" size="mini"></el-color-picker>
              <input v-model="color" id="color" />
              <!-- <colorPicker v-model="color" v-on:change="headleChangeColor"></colorPicker> -->
              <!-- <input type="color" value="#ff0000" id="color" class="button button2"> -->
            </div>
          </div>
        </div>
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
  import $ from "jquery";

  import ZXEduBoard from "../../utils/sdk/canvasModule";
  import RTC from "../../utils/sdk/LIVS-Web-SDK_1.3.0.211009"
  import html2canvas from "html2canvas";
  export default {
    name: "home",
    data() {
      return {
        // 画图 sdk
        drawClient: null,
        color: "#000000",
        predefineColors: ["#FFC71C", "#FF0000", "#1E9FF2", "#28D094", "#6964E2", "#000000"],
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
        isShared: false,
        isCanvas: false,
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

      //开始视频直播
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
      // 开始屏幕共享
      sharedDeskEvent() {
        RTC.createStream({
          userId: this.userId,
          screen: true
        }).then((stream) => {
          this.localStream = stream
          let dd = document.getElementById("fictitious-video");
          this.localStream.play(dd);
        })
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
      // 画板添加背景
      adddrawImage() {
        var image = new Image();
        image.src = require("../assets/menu/canvas.png");
        image.onload = function () {
          let canvas = document.getElementById("streamCanvas");
          let ctx = canvas.getContext("2d");
          let w = $("#streamCanvas").width();
          let h = $("#streamCanvas").height() - 5;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(image, 0, 0, w, h);
        };
      },
      // 画板
      drawEvent() {
        var _this = this;
        if (this.isShared == false) {
          if (this.isCanvas == false) {
            $("#canvas").attr("width", document.body.offsetWidth - 400);
            $("#canvas").attr("height", document.body.offsetHeight - 122);
            $("#streamCanvas").attr("width", document.body.offsetWidth - 400);
            $("#streamCanvas").attr("height", document.body.offsetHeight - 122);

            this.isCanvas = true;
            var initParams = {
              id: "canvas", // canvasdom节点id
            };
            if (!this.drawClient) {
              this.drawClient = new ZXEduBoard(initParams);
              this.lineDrawEvent();
            }
            console.log(this.drawClient);
            // 给画板添加背景色
            this.adddrawImage()
            if (this.drawClient) {
              // let canvasRlt = document.querySelector("canvas");
              let canvasRlt = document.getElementById("streamCanvas");
              console.log(canvasRlt);
              let streamContext = canvasRlt.getContext("2d");
              streamContext.globalCompositeOperation = 'source-over'
              this.setTime = setInterval(() => {
                if ($('#xpc').parent('.k1').hasClass("toolbar-active")) {}
                let cas = document.getElementById("canvas");
                let context = cas.getContext("2d");
                let canvasID = document.getElementById('canvasBoxs')
                if ($('#xpc').parent().hasClass("toolbar-active")) {
                  html2canvas(canvasID).then(canvas => {
                    createImageBitmap(canvas, {
                      resizeWidth: cas.width,
                      resizeHeight: cas.height,
                    }).then((frame) => {
                      streamContext.clearRect(0, 0, canvasRlt.width, canvasRlt.height);
                      streamContext.drawImage(frame, 0, 0, cas.width, cas.height);
                    });

                  });
                } else {
                  createImageBitmap(canvas, {
                    resizeWidth: cas.width,
                    resizeHeight: cas.height,
                  }).then((frame) => {
                    streamContext.drawImage(frame, 0, 0, cas.width, cas.height);
                  });
                }
              }, 300);
            }
          } else {
            if (this.pdfShow) {
              $(".file-box").removeClass("active");
              let file = "closeFileEvent";
              this.url = file;
              this.pdfShow = false;
              this.handleInitPdf(this.pageNum);
            }

            this.isCanvas = false;
            clearInterval(_this.setTime)
          }
        } else {
          this.isShared = false;
          this.drawEvent();
        }
      },
      // ---------------画板事件--------------
      // 画线
      lineDrawEvent: function (e) {
        let dom = $(event.target);
        $(dom).parent().addClass("toolbar-active").siblings().removeClass("toolbar-active");

        this.drawClient.drawLine();
      },
      // 直线
      straightDrawEvent: function (e) {
        let dom = $(event.target);
        $(dom).parent().addClass("toolbar-active").siblings().removeClass("toolbar-active");
        this.drawClient.drawStraightline();
      },
      // 剪头
      arrowDrawEvent: function (e) {
        let dom = $(event.target);
        $(dom).parent().addClass("toolbar-active").siblings().removeClass("toolbar-active");
        this.drawClient.drawArrow();
      },
      // 矩形
      rectangleDrawEvent: function (e) {
        let dom = $(event.target);
        $(dom).parent().addClass("toolbar-active").siblings().removeClass("toolbar-active");
        this.drawClient.drawRectangle();
      },
      // 圆形
      circularDrawEvent: function (e) {
        let dom = $(event.target);
        $(dom).parent().addClass("toolbar-active").siblings().removeClass("toolbar-active");
        this.drawClient.drawCircular();
      },
      // 橡皮檫
      eraserDrawEvent: function (e) {
        let dom = $(event.target);
        $(dom).parent().addClass("toolbar-active").siblings().removeClass("toolbar-active");
        this.drawClient.drawEraser();
        // this.adddrawImage()
        // if (this.pdfShow) {
        //   setTimeout((e) => {
        //     this.pdfDrawEvent()
        //   }, 300)
        // }

      },
      // 清屏
      clearScreenDrawEvent: function () {
        this.drawClient.drawClear();
        this.adddrawImage()
        if (this.pdfShow) {
          setTimeout((e) => {
            this.pdfDrawEvent()
          }, 300)
        }
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

          span {
            position: relative;
            top: -6px;
          }
        }
      }

      .HandoutDiv {
        height: 80%;
        position: relative;
        background-size: 100% 100%;
        background-repeat: no-repeat;
        background: #30323e;
        margin: 20px;
        margin-top: 0px;

        .filexd {
          display: flex;
          height: 100%;
          width: 100%;
        }

        #fictitious-video {
          //   z-index: 998;
          //   position: absolute;
          //   display: none;
          // background-color: #38373e;
          background: url(../assets/menu/live.png) no-repeat center;
          background-size: 50px 50px;
        }

        .draw {
          width: 100%;
          height: 100%;

          #canvasBoxs {
            width: 100%;
            height: 100%;
            overflow: auto;
            position: relative;
            background: #fff;

            #the-canvas {
              position: relative;
              z-index: 99;
            }

            #canvas {
              height: 100%;
              width: 100%;
              position: absolute;
              z-index: 100;
              top: 0px;
              left: 0px;
              // background: #fff;
            }
          }
        }

        .drawButton {
          position: absolute;
          overflow: hidden;
          top: 20px;
          right: 40px;
          border-radius: 10px;

          z-index: 997;
          // opacity: 0.8;
          width: 50px;
          height: 433px;

          background: #30323e;
          box-shadow: 0px 0px 15px 0px rgba(16, 17, 21, 0.51);

          .k1 {
            width: 32px;
            height: 32px;
            cursor: pointer;
            transition: 0.2s linear;
            display: block;
            // opacity: 0.25;
            position: relative;
            margin: 14px 8px;

            // float: left;
            &.toolbar-active,
            &.toolbar-active:hover {
              background: #53586d;
              border-radius: 4px;
              opacity: 0.5;
            }
          }

          .k1:hover {
            opacity: 1;
          }

          .k1:hover .tooltip-inner-wrapper {
            display: block;
          }

          .button {
            border: none;
            color: white;
            text-align: center;
            text-decoration: none;
            display: inline-block;
            font-size: 16px;
            cursor: pointer;
            -webkit-transition-duration: 0.4s;
            transition-duration: 0.4s;
            position: absolute;
            top: 4px;
            left: 4px;
            width: 26px;
            height: 25px;
            padding: 0;
            margin: 0 auto;
          }

          .color {
            // margin: 20px auto;
            width: 28px;
            height: 28px;
            // border: 1px solid rgba(34, 34, 34, 0.28);
            // border-radius: 50%;
            cursor: pointer;
            transition: 0.2s linear;
            display: inline-block;
            position: relative;
            top: 6px;
            margin: 0px 10px;
            padding: 0px 1px;
          }

          #color {
            position: absolute;
            display: block;
            width: 18px;
            height: 18px;
            background-color: transparent;
            border-radius: 50%;
            top: 5px;
            left: 5px;
            visibility: hidden;
          }

          input[type="color"]:focus {
            outline: 0;
          }

          input[type="color"]::-webkit-color-swatch-wrapper {
            padding: 0;
            border-radius: 50%;
          }

          input[type="color"]::-webkit-color-swatch {
            border: 0;
            border-radius: 50%;
          }

          .k1 .button {
            width: 24px;
            height: 24px;
            display: block;
            -webkit-mask-size: 24px;
            background: #3a8ee6;
          }

          #Line {
            -webkit-mask: url(../assets/image/brush.png) no-repeat 0 0;
          }

          #straight {
            -webkit-mask: url(../assets/image/straight.png) no-repeat 0 0;
          }

          #jiantou {
            -webkit-mask-size: 24px;
            -webkit-mask: url(../assets/image/jiantou.png) no-repeat 0 0;
            display: block;
          }

          #juxing {
            -webkit-mask-size: 24px;
            -webkit-mask: url(../assets/image/juxing.png) no-repeat 0 0;
            display: block;
          }

          #tuoyuan {
            -webkit-mask-size: 24px;
            -webkit-mask: url(../assets/image/tuoyuan.png) no-repeat 0 0;
            display: block;
          }

          #xpc {
            -webkit-mask-size: 24px;
            -webkit-mask: url(../assets/image/eraser.png) no-repeat 0 0;
            display: block;
          }

          #qingping {
            -webkit-mask-size: 24px;
            -webkit-mask: url(../assets/image/del.png) no-repeat 0 0;
            display: block;
          }

          .tooltip-inner-wrapper {
            display: none;
            width: 400px;
            position: absolute;
            left: -200px;
            margin-left: 50%;
            bottom: 100%;
            margin-bottom: 8px;
            text-align: center;
            z-index: 10000;
          }

          .tooltip-inner-wrapper:after {
            content: "";
            position: absolute;
            border-top: 5px solid #222;
            border-left: 4px solid transparent;
            border-right: 4px solid transparent;
            bottom: -5px;
            left: 50%;
            margin-left: -5px;
          }

          .tooltip {
            background-color: #222;
            color: #fff;
            white-space: nowrap;
            padding: 6px 8px;
            display: inline-block;
            line-height: 16px;
            min-height: 16px;
            min-height: 16px;
            vertical-align: bottom;
            max-width: 100%;
            overflow: hidden;
            text-overflow: ellipsis;
            font-size: 12px;
          }

          .ftSize div.fontItem {
            width: 18px;
            height: 18px;
            background: rgba(34, 34, 34, 0.1);
            float: left;
            border-radius: 50%;
            position: relative;
            margin-right: 10px;
            cursor: pointer;
          }

          .upload {
            width: 28px;
            height: 28px;
            display: block;
            margin: 0px auto;
            // background: url(../assets/image/pg.png) no-repeat;
          }

          .upload_pic {
            display: block;
            width: 100%;
            height: 22px;
            position: absolute;
            left: 0;
            top: 0;
            opacity: 0;
            border-radius: 5px;
          }

          #svgBoxs {
            float: left;
            width: 100%;
            height: 100%;
            overflow: auto;
            position: relative;
          }

          .drawFb {
            font-size: 20px;
            font-family: MicrosoftYaHei;
            font-weight: 400;
            color: rgba(0, 160, 233, 1);
            margin-bottom: 30px;
            text-align: center;
            margin-top: 20px;
          }

          #textInput {
            position: absolute;
            top: 31px;
            left: -110px;
            width: 302px;
            margin: auto;
            height: 35px;
            background-color: #fff;
            padding: 4px;
            box-shadow: 0 0 1px 1px #ccc;
            border-radius: 3px;
            z-index: 1008;
          }

          #textInput>button {
            border: 1px solid #ccc;
          }

          #textInput .btn {
            display: inline-block;
            padding: 6px 10px;
            margin-bottom: 0;
            font-size: 14px;
            font-weight: 400;
            line-height: 1.42857143;
            text-align: center;
            white-space: nowrap;
            vertical-align: middle;
            touch-action: manipulation;
            cursor: pointer;
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
            border: 1px solid transparent;
            border-radius: 4px;
            color: #333;
            background-color: #fff;
            border-color: #ccc;
          }

          #textInput input {
            text-rendering: auto;
            color: initial;
            letter-spacing: normal;
            word-spacing: normal;
            text-transform: none;
            text-indent: 0px;
            text-shadow: none;
            display: inline-block;
            text-align: start;
            margin: 0em;
            font: 400 13.3333px Arial;
          }
        }
      }

      #streamCanvas {
        width: 100%;
        height: 100%;
        overflow: hidden;
        position: absolute;
        top: 0px;
        left: 0px;
        z-index: 10;
        display: none;
      }

      #SelectionBar {
        position: absolute;
        top: 0px;
        z-index: 997;
        // height: 81px;
        overflow: auto;
        height: 100%;

        &::-webkit-scrollbar {
          /*滚动条整体样式*/
          width: 6px;
          /*高宽分别对应横竖滚动条的尺寸*/
          height: 6px;
        }

        &::-webkit-scrollbar-thumb {
          /*滚动条里面小方块*/
          border-radius: 5px;
          background: #cccccc;
        }

        &::-webkit-scrollbar-track {
          /*滚动条里面轨道*/
          -webkit-box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.2);
          box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.2);
          border-radius: 0;
          background: transparent;
        }

        // .leftBar {
        //   width: 26px;
        //   height: 78px;
        //   background: url(../assets/left.png) no-repeat;
        //   position: absolute;
        //   left: 0;
        //   display: none;
        // }

        // .rightBar {
        //   width: 26px;
        //   height: 78px;
        //   background: url(../assets/right.png) no-repeat;
        //   position: absolute;
        //   right: 0;
        //   top: 0;
        //   display: none;
        // }

        .canvasDiv {
          margin: 5px 0px;

          cursor: pointer;
          border: 1px solid rgba(209, 209, 209, 1);

          a {
            position: absolute;
            color: rgba(255, 255, 255, 1);
            border: 2px solid rgba(98, 98, 255, 1);
            background: rgba(98, 98, 255, 1);
            border-radius: 2px;
          }
        }

        .canvasDiv.active {
          border: 1px solid rgba(98, 98, 255, 1);
        }
      }

      #whiteboardS {
        height: 436px;
        position: fixed;

        z-index: 1010;
        background: #fff;
        display: none;
        top: 100px;
        left: 300px;
        // left: 0px;
        border: 1px solid #c1bdbd;
        background-color: #fff;
        border: 1px solid #ebeef5;
        border-radius: 4px;
        -webkit-box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
        box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);

        .handout-title {
          height: 30px;
          line-height: 30px;
          // background: #f8f8fe;
          font-size: 14px;
          color: #7b7c7d;
          text-align: center;
          border-bottom: 1px solid #dde0e2;

          div {
            text-align: left;
            padding-left: 10px;
          }

          .close-icon {
            position: absolute;
            width: 17px;
            height: 17px;
            // background: url(../assets/closedraw-icon.png) no-repeat;
            background-size: 100% 100%;
            // top: -5px;
            // right: -4px;
            top: 6px;
            right: 6px;
            cursor: pointer;

            // &:hover {
            //   background: url(../assets/closedraw-icon_h.png) no-repeat;
            //   background-size: 100% 100%;

            // }
          }
        }

        .handout-content {
          text-align: center;
          margin: auto;
          overflow: auto;
          height: 360px;
          /* position: absolute; */
          width: 500px;
          /* z-index: 1001; */
          background: #fff;
          // padding: 10px 0px;

          &::-webkit-scrollbar {
            /*滚动条整体样式*/
            width: 6px;
            /*高宽分别对应横竖滚动条的尺寸*/
            height: 6px;
          }

          &::-webkit-scrollbar-thumb {
            /*滚动条里面小方块*/
            border-radius: 5px;
            background: #cccccc;
          }

          &::-webkit-scrollbar-track {
            /*滚动条里面轨道*/
            -webkit-box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.2);
            box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.2);
            border-radius: 0;
            background: transparent;
          }

          .handoutInput {
            width: 30%;
            margin: 5px 0px;
            float: right;
          }

          .handoutButton {
            float: right;

            padding: 6px;
            margin: 5px;
          }

          .file-box1 {
            background-color: #dedee8;
          }

          .file-box,
          .file-box1 {
            display: inline-block;
            width: calc(100% - 5px);
            /* height: 106px; */
            /* border: 1px dashed #C1C9D6; */
            /* border-radius: 5px; */
            cursor: pointer;
            position: relative;
            height: 28px;
            text-align: left;
            padding-left: 5px;
            border-bottom: 1px solid #f8f8fe;

            span {
              font-size: 12px;
              width: 25px;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              display: inline-block;
              height: 28px;
              line-height: 28px;
            }

            .close-icon {
              position: absolute;
              width: 17px;
              height: 17px;
              // background: url(../assets/close-icon-draw.png) no-repeat;
              background-size: 100% 100%;
              top: 5px;
              right: 60px;
              display: none;

              &:hover {
                // background: url(../assets/close-icon-draw_h.png) no-repeat;
                background-size: contain;
              }
            }

            &:hover {
              background-color: #f0f0ff;

              .close-icon {
                display: inline-block;
              }

              .active-icon {
                display: inline-block;
                // background: url(../assets/active-icon5.png) no-repeat;
                background-size: contain;

                &:hover {
                  // background: url(../assets/active-icon7.png) no-repeat;
                  background-size: contain;
                }
              }
            }

            .active-icon {
              position: absolute;
              width: 16px;
              height: 16px;
              // background: url(../assets/active-icon6.png) no-repeat;
              background-size: 100% 100%;
              top: 6px;
              display: none;
              // right: 30px;
              right: 110px;
              background-size: contain;
            }

            &.active {
              // border-style: solid;
              // border-color: #918df7;

              .active-icon {
                display: inline-block;
                position: absolute;
                width: 16px;
                height: 16px;
                // background: url(../assets/active-icon6.png) no-repeat;
                background-size: 100% 100%;
                top: 4px;
                // display: none;
                right: 30px;
              }

              .file-name {
                color: #6964e2;
              }
            }

            .file-icon {
              display: inline-block;
              width: 16px;
              height: 16px;

              background-repeat: no-repeat;
              background-size: 100% 100%;
              background-position: center;
              // top: 3px;
              position: relative;
              bottom: 6px;

              &.drawicon {
                background-image: url(../assets/fileType/draw-icon.png);
              }

              &.doc {
                background-image: url(../assets/fileType/doc-icon.png);
              }

              &.docx {
                background-image: url(../assets/fileType/doc-icon.png);
              }

              &.pdf {
                background-image: url(../assets/fileType/pdf-icon.png);
              }

              &.xlsx {
                background-image: url(../assets/fileType/elx-icon.png);
              }

              &.xls {
                background-image: url(../assets/fileType/elx-icon.png);
              }

              &.jpg {
                background-image: url(../assets/fileType/png-icon.png);
              }

              &.jpeg {
                background-image: url(../assets/fileType/png-icon.png);
              }

              &.ppt {
                background-image: url(../assets/fileType/ppt-icon.png);
              }

              &.pptx {
                background-image: url(../assets/fileType/ppt-icon.png);
              }

              &.txt {
                background-image: url(../assets/fileType/txt-icon.png);
              }

              &.png {
                background-image: url(../assets/fileType/png-icon.png);
              }

              &.gif {
                background-image: url(../assets/fileType/gif-icon.png);
              }
            }

            .file-name {
              color: #333;
              font-size: 12px;
              width: 180px;
              text-overflow: clip;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              display: inline-block;
              height: 28px;
              line-height: 28px;
              padding-left: 10px;
            }
          }
        }

        .handout-bar {
          // border-top: 1px solid #F2F2F2;

          padding: 5px 0px;
          text-align: center;
          // background: #f8f8fe;

          .my-upload {
            display: inline;
          }

          .option {
            width: 33%;
            display: inline-block;
            float: right;
            text-align: center;
            line-height: 40px;
            color: #aaaab3;
            font-size: 12px;
            cursor: pointer;
          }

          .el-icon-plus {
            // position: absolute;
            width: 16px;
            height: 16px;
            // background: url(../assets/up.png) no-repeat;
            background-size: 100% 100%;
            display: inline-block;
            vertical-align: middle;
            margin-right: 5px;

            &:before {
              content: "";
            }
          }

          .el-icon-loading {
            width: 16px;
            height: 16px;
            // background: url(../assets/loading-iocn.png) no-repeat;
            background-size: 100% 100%;
            display: inline-block;
            vertical-align: middle;

            &:before {
              content: "";
            }
          }

          .el-icon-name {
            display: inline-block;

            font-size: 13px;
            color: #333;
          }

          .percent-name {
            height: 34px;
            line-height: 34px;
            font-size: 13px;
            color: #aaaab3;
          }
        }
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

  #streamCanvas {
    width: 100%;
    height: 100%;
    overflow: hidden;
    position: absolute;
    top: 0px;
    left: 0px;
    z-index: 10;
    display: none;
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