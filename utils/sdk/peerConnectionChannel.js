// import * as StreamModule from '/streamModule';
import Logger from './logger.js';
import * as Utils from './utils.js';
import {
  EventDispatcher,
  MessageEvent,
  zhuanxinEvent,
  ErrorEvent,
  MuteEvent,
} from './event.js';
import eventList from './eventlist'
import * as SdpUtils from './sdputils.js';
import { ConferenceError } from './error.js';
export default class ConferencePeerConnectionChannel extends eventList {
  constructor(config) {
    super();
    this._config = {
      rtcConfiguration: undefined,
      webTransportConfiguration: undefined
    };
    this._videoCodecs = null
    this._pc = null;
    this._internalId = null; // It's publication ID or subscription ID.
    this._pendingCandidates = [];
    // this._eventList = new eventList()
    // console.log(this._eventList)
    this._publishTransceivers = new Map(); // internalId => { id, transceivers: [Transceiver] }
    this._subscribeTransceivers = new Map(); // internalId => { id, transceivers: [Transceiver] }
    this._publishPromises = new Map(); // internalId => { resolve, reject }
    this._subscribedStreams = new Map(); // intenalId => RemoteStream
    this._publications = new Map(); // PublicationId => Publication
    this._subscriptions = new Map(); // SubscriptionId => Subscription
    this._reverseIdMap = new Map(); // PublicationId || SubscriptionId => internalId
    this._subscribePromises = new Map(); // internalId => { resolve, reject }
    // Channel ID assigned by conference
    this._id = undefined;
    this._internalCount = 0;
    this._sdpPromise = Promise.resolve();
    this._sdpResolverMap = new Map(); // internalId => {finish, resolve, reject}
    this._sdpResolvers = []; // [{finish, resolve, reject}]

  }
  async publish (stream, options, videoCodecs) {
    if (options === undefined) {
      options = {
        audio: !!stream.mediaStream.getAudioTracks().length,
        video: !!stream.mediaStream.getVideoTracks().length,
      };
    }
    console.log(options)
    if (typeof options !== 'object') {
      return Promise.reject(new TypeError('Options should be an object.'));
    }
    if ((this._isRtpEncodingParameters(options.audio) &&
      this._isZXEncodingParameters(options.video)) ||
      (this._isZXEncodingParameters(options.audio) &&
        this._isRtpEncodingParameters(options.video))) {
      return Promise.reject(new ConferenceError(
        'Mixing RTCRtpEncodingParameters and ' +
        'AudioEncodingParameters/VideoEncodingParameters is not allowed.'));
    }
    if (options.audio === undefined) {
      options.audio = !!stream.mediaStream.getAudioTracks().length;
    }
    if (options.video === undefined) {
      options.video = !!stream.mediaStream.getVideoTracks().length;
    }
    if ((!!options.audio && !stream.mediaStream.getAudioTracks().length) ||
      (!!options.video && !stream.mediaStream.getVideoTracks().length)) {
      return Promise.reject(new ConferenceError(
        'options.audio/video is inconsistent with tracks presented in the ' +
        'MediaStream.'
      ));
    }
    if ((options.audio === false || options.audio === null) &&
      (options.video === false || options.video === null)) {
      return Promise.reject(new ConferenceError(
        'Cannot publish a stream without audio and video.'));
    }
    if (typeof options.audio === 'object') {
      if (!Array.isArray(options.audio)) {
        return Promise.reject(new TypeError(
          'options.audio should be a boolean or an array.'));
      }
      for (const parameters of options.audio) {
        if (!parameters.codec || typeof parameters.codec.name !== 'string' || (
          parameters.maxBitrate !== undefined && typeof parameters.maxBitrate
          !== 'number')) {
          return Promise.reject(new TypeError(
            'options.audio has incorrect parameters.'));
        }
      }
    }
    const mediaOptions = {};
    this._createPeerConnection();
    console.log(stream.mediaStream.getAudioTracks().length > 0, options.audio !==
      false, options.audio !== null)
    if (stream.mediaStream.getAudioTracks().length > 0 && options.audio !==
      false && options.audio !== null) {
      if (stream.mediaStream.getAudioTracks().length > 1) {
        Logger.warning(
          'Publishing a stream with multiple audio tracks is not fully'
          + ' supported.'
        );
      }
      if (typeof options.audio !== 'boolean' && typeof options.audio !==
        'object') {
        return Promise.reject(new ConferenceError(
          'Type of audio options should be boolean or an object.'
        ));
      }
      mediaOptions.audio = {};
      mediaOptions.audio.source = stream.source.audio;
    } else {
      mediaOptions.audio = false;
    }
    if (stream.mediaStream.getVideoTracks().length > 0 && options.video !==
      false && options.video !== null) {
      if (stream.mediaStream.getVideoTracks().length > 1) {
        Logger.warning(
          'Publishing a stream with multiple video tracks is not fully '
          + 'supported.'
        );
      }
      mediaOptions.video = {};
      mediaOptions.video.source = stream.source.video;
      const trackSettings = stream.mediaStream.getVideoTracks()[0]
        .getSettings();
      mediaOptions.video.parameters = {
        resolution: {
          width: trackSettings.width,
          height: trackSettings.height,
        },
        framerate: trackSettings.frameRate,
      };
    } else {
      mediaOptions.video = false;
    }

    const internalId = stream.userId_;
    // const internalId = this._createInternalId();
    console.log(internalId)

    // Waiting for previous SDP negotiation if needed
    // await this._chainSdpPromise(internalId);
    // // console.log(await this._chainSdpPromise(internalId))
    const offerOptions = {};
    const transceivers = [];
    if (typeof this._pc.addTransceiver === 'function') {
      if (stream.screen_ == true) {
        const transceiverInit = {
          direction: 'sendonly',
          streams: [stream.mediaStream],
        };
        const transceiver = this._pc.addTransceiver(
          'audio', transceiverInit);

        transceivers.push({
          type: 'audio',
          transceiver,
          // source: mediaOptions.audio.source,
          // option: { audio: options.audio },
        });

      }
      if (mediaOptions.audio && stream.mediaStream.getAudioTracks().length >
        0) {
        const transceiverInit = {
          direction: 'sendonly',
          streams: [stream.mediaStream],
        };
        if (this._isRtpEncodingParameters(options.audio)) {
          transceiverInit.sendEncodings = options.audio;
        }
        const transceiver = this._pc.addTransceiver(
          stream.mediaStream.getAudioTracks()[0],
          transceiverInit);
        transceivers.push({
          type: 'audio',
          transceiver,
          source: mediaOptions.audio.source,
          option: { audio: options.audio },
        });

        if (Utils.isFirefox()) {
          // Firefox does not support encodings setting in addTransceiver.
          const parameters = transceiver.sender.getParameters();
          parameters.encodings = transceiverInit.sendEncodings;
          await transceiver.sender.setParameters(parameters);
        }
      }
      if (stream.audio_ == true && stream.video_ == false) {
        const transceiverInit = {
          direction: 'sendonly',
          streams: [stream.mediaStream],
        };
        const transceiver = this._pc.addTransceiver(
          'video', transceiverInit);

        transceivers.push({
          type: 'video',
          transceiver,
          // source: mediaOptions.audio.source,
          // option: { audio: options.audio },
        });

      }
      if (mediaOptions.video && stream.mediaStream.getVideoTracks().length >
        0) {
        const transceiverInit = {
          direction: 'sendonly',
          streams: [stream.mediaStream],
        };

        if (this._isRtpEncodingParameters(options.video)) {
          transceiverInit.sendEncodings = options.video;
          this._videoCodecs = videoCodecs;
        }
        console.log()
        const transceiver = this._pc.addTransceiver(
          stream.mediaStream.getVideoTracks()[0],
          transceiverInit);

        transceivers.push({
          type: 'video',
          transceiver,
          source: mediaOptions.video.source,
          option: { video: options.video },
        });

        if (Utils.isFirefox()) {
          // Firefox does not support encodings setting in addTransceiver.
          const parameters = transceiver.sender.getParameters();
          parameters.encodings = transceiverInit.sendEncodings;

          await transceiver.sender.setParameters(parameters);
        }

      }
    } else {
      console.log('33555')
      if (mediaOptions.audio &&
        stream.mediaStream.getAudioTracks().length > 0) {
        for (const track of stream.mediaStream.getAudioTracks()) {
          this._pc.addTrack(track, stream.mediaStream);
        }
      }
      if (mediaOptions.video &&
        stream.mediaStream.getVideoTracks().length > 0) {
        for (const track of stream.mediaStream.getVideoTracks()) {
          this._pc.addTrack(track, stream.mediaStream);
        }
      }
      offerOptions.offerToReceiveAudio = false;
      offerOptions.offerToReceiveVideo = false;
    }
    this._publishTransceivers.set(internalId, { transceivers });

    let localDesc;
    console.log(offerOptions)
    return await this._pc.createOffer(offerOptions).then((desc) => {

      localDesc = desc;
      console.log(offerOptions)
      let localSdpObject = localDesc.sdp;
      let videoBegin = localSdpObject.indexOf("m=video");
      let audioBegin = localSdpObject.indexOf("m=audio");


      if (audioBegin < videoBegin && audioBegin > 0) {
        let videoDescription = localSdpObject.substring(videoBegin);
        let headerExt = videoDescription.indexOf("a=extmap");
        videoDescription = videoDescription.replace(/a=extmap.*\r\n/g, "");
        videoDescription =
          videoDescription.slice(0, headerExt) +
          "a=extmap:1 urn:ietf:params:rtp-hdrext:sdes:mid\r\na=extmap:4 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r\na=extmap:5 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r\na=extmap:11 urn:3gpp:video-orientation\r\na=extmap:12 urn:ietf:params:rtp-hdrext:toffset\r\n" +
          videoDescription.slice(headerExt);

        let audioDescription = localSdpObject.substring(audioBegin, videoBegin);
        headerExt = audioDescription.indexOf("a=extmap");
        audioDescription = audioDescription.replace(/a=extmap.*\r\n/g, "");
        audioDescription =
          audioDescription.slice(0, headerExt) +
          "a=extmap:1 urn:ietf:params:rtp-hdrext:sdes:mid\r\na=extmap:4 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r\na=extmap:10 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r\n" +
          audioDescription.slice(headerExt);

        localSdpObject =
          localSdpObject.slice(0, audioBegin) + audioDescription + videoDescription;
        console.log('33')
      }

      if (audioBegin > 0 && videoBegin == -1) {

        let audioDescription = localSdpObject.substring(audioBegin);
        let headerExt = audioDescription.indexOf("a=extmap");
        audioDescription = audioDescription.replace(/a=extmap.*\r\n/g, "");
        audioDescription =
          audioDescription.slice(0, headerExt) +
          "a=extmap:1 urn:ietf:params:rtp-hdrext:sdes:mid\r\na=extmap:4 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r\na=extmap:10 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r\n" +
          audioDescription.slice(headerExt);

        localSdpObject =
          localSdpObject.slice(0, audioBegin) + audioDescription
      }

      localDesc.sdp = localSdpObject;
      return this._pc.setLocalDescription(localDesc);
    }).then((date) => {
      console.log(date)
      const trackOptions = [];
      transceivers.forEach(({ type, transceiver, source }) => {
        trackOptions.push({
          type,
          mid: transceiver.mid,
          source,
        });

      });


      // const publicationId = data.id;
      // const messageEvent = new MessageEvent('id', {
      //   message: publicationId,
      //   origin: this._remoteId,
      // });
      // this.dispatchEvent(messageEvent);



      // Modify local SDP before sending
      console.log(localDesc)

      if (stream.audio_ && stream.video_) {
        console.log(options)
        console.log(transceivers)
        options.audio = true
        transceivers.forEach(({ type, transceiver, option }) => {
          localDesc.sdp = this._setRtpReceiverOptions(
            localDesc.sdp, option, transceiver.mid);
          localDesc.sdp = this._setRtpSenderOptions(
            localDesc.sdp, option, transceiver.mid);
        });
      }

      return localDesc
      // this._signaling.sendSignalingMessage('soac', {
      //   id: this._id,
      //   signaling: localDesc,
      // });
    }).catch((e) => {
      Logger.error('Failed to create offer or set SDP. Message: '
        + e.message);
      if (this._publishTransceivers.get(internalId).id) {
        this._unpublish(internalId);
        this._rejectPromise(e);
        this._fireEndedEventOnPublicationOrSubscription();
      } else {
        this._unpublish(internalId);
      }
    });

  }
  async subscribe (stream, options) {

    if (options === undefined) {
      options = {
        audio: !!stream.settings.audio,
        video: !!stream.settings.video,
      };
    }
    if (typeof options !== 'object') {
      return Promise.reject(new TypeError('Options should be an object.'));
    }
    if (options.audio === undefined) {
      options.audio = !!stream.settings.audio;
    }
    if (options.video === undefined) {
      options.video = !!stream.settings.video;
    }
    if ((options.audio !== undefined && typeof options.audio !== 'object' &&
      typeof options.audio !== 'boolean' && options.audio !== null) || (
        options.video !== undefined && typeof options.video !== 'object' &&
        typeof options.video !== 'boolean' && options.video !== null)) {
      return Promise.reject(new TypeError('Invalid options type.'));
    }
    if (options.audio && !stream.settings.audio || (options.video &&
      !stream.settings.video)) {
      return Promise.reject(new ConferenceError(
        'options.audio/video cannot be true or an object if there is no '
        + 'audio/video track in remote stream.'
      ));
    }
    if (options.audio === false && options.video === false) {
      return Promise.reject(new ConferenceError(
        'Cannot subscribe a stream without audio and video.'));
    }
    const mediaOptions = {};
    if (options.audio) {
      if (typeof options.audio === 'object' &&
        Array.isArray(options.audio.codecs)) {
        if (options.audio.codecs.length === 0) {
          return Promise.reject(new TypeError(
            'Audio codec cannot be an empty array.'));
        }
      }
      mediaOptions.audio = {};
      mediaOptions.audio.from = stream.id;
    } else {
      mediaOptions.audio = false;
    }
    if (options.video) {
      if (typeof options.video === 'object' &&
        Array.isArray(options.video.codecs)) {
        if (options.video.codecs.length === 0) {
          return Promise.reject(new TypeError(
            'Video codec cannot be an empty array.'));
        }
      }
      mediaOptions.video = {};
      mediaOptions.video.from = stream.id;
      if (options.video.resolution || options.video.frameRate || (options.video
        .bitrateMultiplier && options.video.bitrateMultiplier !== 1) ||
        options.video.keyFrameInterval) {
        mediaOptions.video.parameters = {
          resolution: options.video.resolution,
          framerate: options.video.frameRate,
          bitrate: options.video.bitrateMultiplier ? 'x'
            + options.video.bitrateMultiplier.toString() : undefined,
          keyFrameInterval: options.video.keyFrameInterval,
        };
      }
      if (options.video.rid) {
        // Use rid matched track ID as from if possible
        const matchedSetting = stream.settings.video
          .find((video) => video.rid === options.video.rid);
        if (matchedSetting && matchedSetting._trackId) {
          mediaOptions.video.from = matchedSetting._trackId;
          // Ignore other settings when RID set.
          delete mediaOptions.video.parameters;
        }
        options.video = true;
      }
    } else {
      mediaOptions.video = false;
    }
    console.log(mediaOptions)
    // const internalId = this._createInternalId();
    const internalId = stream.id
    const offerOptions = {};
    const transceivers = [];
    this._createPeerConnection();
    if (typeof this._pc.addTransceiver === 'function') {
      // |direction| seems not working on Safari.
      if (mediaOptions.audio) {
        const transceiver = this._pc.addTransceiver(
          'audio', { direction: 'recvonly' });
        transceivers.push({
          type: 'audio',
          transceiver,
          from: mediaOptions.audio.from,
          option: { audio: options.audio },
        });
      }
      if (mediaOptions.video) {
        const transceiver = this._pc.addTransceiver(
          'video', { direction: 'recvonly' });
        transceivers.push({
          type: 'video',
          transceiver,
          from: mediaOptions.video.from,
          parameters: mediaOptions.video.parameters,
          option: { video: options.video },
        });
      }
    } else {
      offerOptions.offerToReceiveAudio = !!options.audio;
      offerOptions.offerToReceiveVideo = !!options.video;
    }
    this._subscribeTransceivers.set(internalId, { transceivers });
    this._subscribedStreams.set(internalId, stream);
    console.log(offerOptions)
    let localDesc;
    return await this._pc.createOffer(offerOptions).then((desc) => {
      localDesc = desc;
      console.log(offerOptions)
      let localSdpObject = localDesc.sdp;
      let videoBegin = localSdpObject.indexOf("m=video");
      let audioBegin = localSdpObject.indexOf("m=audio");


      if (audioBegin < videoBegin && audioBegin > 0) {
        let videoDescription = localSdpObject.substring(videoBegin);
        let headerExt = videoDescription.indexOf("a=extmap");
        videoDescription = videoDescription.replace(/a=extmap.*\r\n/g, "");
        videoDescription =
          videoDescription.slice(0, headerExt) +
          "a=extmap:1 urn:ietf:params:rtp-hdrext:sdes:mid\r\na=extmap:4 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r\na=extmap:5 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r\na=extmap:11 urn:3gpp:video-orientation\r\na=extmap:12 urn:ietf:params:rtp-hdrext:toffset\r\n" +
          videoDescription.slice(headerExt);

        let audioDescription = localSdpObject.substring(audioBegin, videoBegin);
        headerExt = audioDescription.indexOf("a=extmap");
        audioDescription = audioDescription.replace(/a=extmap.*\r\n/g, "");
        audioDescription =
          audioDescription.slice(0, headerExt) +
          "a=extmap:1 urn:ietf:params:rtp-hdrext:sdes:mid\r\na=extmap:4 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r\na=extmap:10 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r\n" +
          audioDescription.slice(headerExt);

        localSdpObject =
          localSdpObject.slice(0, audioBegin) + audioDescription + videoDescription;
        console.log('33')
      }

      if (audioBegin > 0 && videoBegin == -1) {

        let audioDescription = localSdpObject.substring(audioBegin);
        let headerExt = audioDescription.indexOf("a=extmap");
        audioDescription = audioDescription.replace(/a=extmap.*\r\n/g, "");
        audioDescription =
          audioDescription.slice(0, headerExt) +
          "a=extmap:1 urn:ietf:params:rtp-hdrext:sdes:mid\r\na=extmap:4 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r\na=extmap:10 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r\n" +
          audioDescription.slice(headerExt);

        localSdpObject =
          localSdpObject.slice(0, audioBegin) + audioDescription
      }

      localDesc.sdp = localSdpObject;

      return this._pc.setLocalDescription(desc)
        .catch((errorMessage) => {
          Logger.error('Set local description failed. Message: ' +
            JSON.stringify(errorMessage));
          throw errorMessage;
        });
    }, function (error) {
      Logger.error('Create offer failed. Error info: ' + JSON.stringify(
        error));
      throw error;
    }).then(() => {
      const trackOptions = [];
      transceivers.forEach(({ type, transceiver, from, parameters, option }) => {
        trackOptions.push({
          type,
          mid: transceiver.mid,
          from: from,
          parameters: parameters,
        });
      });


      // const subscriptionId = data.id;


      // this._subscribeTransceivers.get(internalId).id = subscriptionId;
      // this._reverseIdMap.set(subscriptionId, internalId);
      // if (this._id && this._id !== data.transportId) {
      //   Logger.warning('Server returns conflict ID: ' + data.transportId);
      // }
      // this._id = data.transportId;

      // Modify local SDP before sending
      if (options) {
        transceivers.forEach(({ type, transceiver, option }) => {
          localDesc.sdp = this._setRtpReceiverOptions(
            localDesc.sdp, option, transceiver.mid);
        });
      }
      return localDesc

    }).catch((e) => {
      Logger.error('Failed to create offer or set SDP. Message: '
        + e.message);
      if (this._subscribeTransceivers.get(internalId).id) {
        this._unsubscribe(internalId);
        this._rejectPromise(e);
        this._fireEndedEventOnPublicationOrSubscription();
      } else {
        this._unsubscribe(internalId);
      }
    });
    return new Promise((resolve, reject) => {
      this._subscribePromises.set(internalId, {
        resolve: resolve,
        reject: reject,
      });
    });

  }

  _createInternalId () {
    return this._internalCount++;
  }

  async _unpublish (internalId) {
    console.log(internalId)
    if (this._publishTransceivers.has(internalId)) {
      console.log(this._publishTransceivers)
      const { id, transceivers } = this._publishTransceivers.get(internalId);
      console.log(id, transceivers)

      // Clean transceiver
      transceivers.forEach(({ transceiver }) => {
        if (this._pc.signalingState === 'stable') {
          transceiver.sender.replaceTrack(null);
          this._pc.removeTrack(transceiver.sender);

        }
      });
      // console.log(     this._pc)
      // if (this._pc) {
      //   this._pc.close()
      //   this._pc = null
      // }

      console.log(this._pc)
      this._publishTransceivers.delete(internalId);
      // Fire ended event
      if (this._publications.has(id)) {
        const event = new zhuanxinEvent('ended');
        this._publications.get(id).dispatchEvent(event);
        this._publications.delete(id);
        console.log(this._publications)
      } else {
        Logger.warning('Invalid publication to unpublish: ' + id);
        if (this._publishPromises.has(internalId)) {
          console.log(3)
          this._publishPromises.get(internalId).reject(
            new ConferenceError('Failed to publish'));
        }
      }
      if (this._sdpResolverMap.has(internalId)) {

        const resolver = this._sdpResolverMap.get(internalId);
        console.log(resolver)
        if (!resolver.finish) {
          resolver.resolve();
          resolver.finish = true;
        }
        this._sdpResolverMap.delete(internalId);
      }
      if (transceivers) {
        // this._pc.close()
        // this._pc.dispose()

        return { code: 'ok' }
      }

    }
  }

  async _unsubscribe (internalId) {
    if (this._subscribeTransceivers.has(internalId)) {
      const { id, transceivers } = this._subscribeTransceivers.get(internalId);

      // Clean transceiver
      transceivers.forEach(({ transceiver }) => {
        transceiver.receiver.track.stop();
      });
      this._subscribeTransceivers.delete(internalId);
      // Fire ended event
      if (this._subscriptions.has(id)) {
        const event = new zhuanxinEvent('ended');
        this._subscriptions.get(id).dispatchEvent(event);
        this._subscriptions.delete(id);
      } else {
        Logger.warning('Invalid subscription to unsubscribe: ' + id);
        if (this._subscribePromises.has(internalId)) {
          this._subscribePromises.get(internalId).reject(
            new ConferenceError('Failed to subscribe'));
        }
      }
      // Clear media stream
      if (this._subscribedStreams.has(internalId)) {
        this._subscribedStreams.get(internalId).mediaStream = null;
        this._subscribedStreams.delete(internalId);
      }
      if (this._sdpResolverMap.has(internalId)) {
        const resolver = this._sdpResolverMap.get(internalId);
        if (!resolver.finish) {
          resolver.resolve();
          resolver.finish = true;
        }
        this._sdpResolverMap.delete(internalId);
      }
      console.log(this._pc)
      if (transceivers) {
        // this._pc.close()
        return { code: 'ok' }
      }
      // Disable media in remote SDP
      // Set remoteDescription and set localDescription
    }
  }
  _createPeerConnection (stream) {
    if (this._pc) {
      return;
    }
    const pcConfiguration = this._config.rtcConfiguration || {};
    if (Utils.isChrome()) {
      pcConfiguration.sdpSemantics = 'unified-plan';
      pcConfiguration.bundlePolicy = 'max-bundle';
    }
    console.log(pcConfiguration)
    this._pc = new RTCPeerConnection(pcConfiguration);
    console.log(this._pc)
    this._pc.onicecandidate = (event) => {
      this._onLocalIceCandidate.apply(this, [event]);
    };
    this._pc.ontrack = (event) => {
      this._onRemoteStreamAdded.apply(this, [event]);
    };
    this._pc.oniceconnectionstatechange = (event) => {
      this._onIceConnectionStateChange.apply(this, [event]);
    };
    this._pc.onconnectionstatechange = (event) => {
      this._onConnectionStateChange.apply(this, [event]);
    };
  }
  // 产生sdp 
  _chainSdpPromise (internalId) {
    const prior = this._sdpPromise;
    const negotiationTimeout = 10000;
    this._sdpPromise = prior.then(
      () => new Promise((resolve, reject) => {
        const resolver = { finish: false, resolve, reject };
        this._sdpResolvers.push(resolver);
        this._sdpResolverMap.set(internalId, resolver);
        setTimeout(() => reject('Timeout to get SDP answer'),
          negotiationTimeout);
      }));
    console.log(prior)
    return prior.catch((e) => {
      //
    });
  }
  // 匹配answer
  _sdpHandler (sdp) {
    return new Promise((resolve, reject) => {
      if (sdp.type === 'answer') {
        this._pc.setRemoteDescription(sdp).then(() => {

          resolve({ code: 'ok' })
          if (this._pendingCandidates.length > 0) {
            for (const candidate of this._pendingCandidates) {
              // this._sendCandidate(candidate);
            }
          }
        }, (error) => {
          Logger.error('Set remote description failed: ' + error);
          this._rejectPromise(error);
          this._fireEndedEventOnPublicationOrSubscription();
        }).then(() => {

          // if (!this._nextSdpPromise()) {
          //   Logger.warning('Unexpected SDP promise state');
          // }
        });
      }
    })

  }

  // 本地ice
  _onLocalIceCandidate (event) {
    if (event.candidate) {
      if (this._pc.signalingState !== 'stable') {
        this._pendingCandidates.push(event.candidate);
      } else {
        // this._sendCandidate(event.candidate);
      }
    } else {
      Logger.debug('Empty candidate.');
    }
  }
  // 远端媒体流
  _onRemoteStreamAdded (event) {
    Logger.debug('Remote stream added.');
    let find = false;
    for (const [internalId, sub] of this._subscribeTransceivers) {
      const subscriptionId = sub.id;
      if (sub.transceivers.find((t) => t.transceiver === event.transceiver)) {
        find = true;
        const subscribedStream = this._subscribedStreams.get(internalId);

        if (!subscribedStream.mediaStream) {
          this._subscribedStreams.get(internalId).mediaStream =
            event.streams[0];
          // Resolve subscription if ready handler has been called
          const subscription = this._subscriptions.get(subscriptionId);
          if (subscription) {
            this._subscribePromises.get(internalId).resolve(subscription);
          }
        } else {
          // Add track to the existing stream
          subscribedStream.mediaStream.addTrack(event.track);
        }

        this.trigger('stream-subscribed', { 'TrackEvent': event, "subscribedStream": subscribedStream })
      }
    }
    if (!find) {
      // This is not expected path. However, this is going to happen on Safari
      // because it does not support setting direction of transceiver.
      Logger.warning('Received remote stream without subscription.');
    }
  }
  //   连接的ICE代理的状态
  _onIceConnectionStateChange (event) {
    if (!event || !event.currentTarget) {
      return;
    }

    Logger.debug('ICE connection state changed to ' +
      event.currentTarget.iceConnectionState);
    if (event.currentTarget.iceConnectionState === 'closed' ||
      event.currentTarget.iceConnectionState === 'failed') {
      if (event.currentTarget.iceConnectionState === 'failed') {
        this._handleError('connection failed.');
      } else {
        // Fire ended event if publication or subscription exists.
        this._fireEndedEventOnPublicationOrSubscription();
      }
    }
  }
  // peer 连接状态
  _onConnectionStateChange (event) {
    if (this._pc.connectionState === 'closed' ||
      this._pc.connectionState === 'failed') {
      if (this._pc.connectionState === 'failed') {
        this._handleError('connection failed.');
      } else {
        // Fire ended event if publication or subscription exists.
        this._fireEndedEventOnPublicationOrSubscription();
      }
    }
  }
  _fireEndedEventOnPublicationOrSubscription () {
    if (this._ended) {
      return;
    }
    this._ended = true;
    const event = new zhuanxinEvent('ended');
    for (const [/* id */, publication] of this._publications) {
      publication.dispatchEvent(event);
      publication.stop();
    }
    for (const [/* id */, subscription] of this._subscriptions) {
      subscription.dispatchEvent(event);
      subscription.stop();
    }
    // this.dispatchEvent(event);
    // this.close();
  }

  // peer 连接断开
  _handleError (errorMessage) {
    const error = new ConferenceError(errorMessage);
    if (this._ended) {
      return;
    }
    const errorEvent = new ErrorEvent('error', {
      error: error,
    });
    for (const [/* id */, publication] of this._publications) {
      publication.dispatchEvent(errorEvent);
    }
    for (const [/* id */, subscription] of this._subscriptions) {
      subscription.dispatchEvent(errorEvent);
    }
    // Fire ended event when error occured
    this._fireEndedEventOnPublicationOrSubscription();
  }

  _setCodecOrder (sdp, options, mid) {
    if (options.audio) {
      if (options.audio.codecs) {
        const audioCodecNames = Array.from(options.audio.codecs, (codec) =>
          codec.name);
        sdp = SdpUtils.reorderCodecs(sdp, 'audio', audioCodecNames, mid);
      } else {
        const audioCodecNames = Array.from(options.audio,
          (encodingParameters) => encodingParameters.codec.name);
        sdp = SdpUtils.reorderCodecs(sdp, 'audio', audioCodecNames, mid);
      }
    }
    if (options.video) {
      if (options.video.codecs) {
        const videoCodecNames = Array.from(options.video.codecs, (codec) =>
          codec.name);
        sdp = SdpUtils.reorderCodecs(sdp, 'video', videoCodecNames, mid);
      } else {
        const videoCodecNames = Array.from(options.video,
          (encodingParameters) => encodingParameters.codec.name);
        sdp = SdpUtils.reorderCodecs(sdp, 'video', videoCodecNames, mid);
      }
    }
    return sdp;
  }

  _setMaxBitrate (sdp, options, mid) {
    if (typeof options.audio === 'object') {
      sdp = SdpUtils.setMaxBitrate(sdp, options.audio, mid);
    }
    if (typeof options.video === 'object') {
      sdp = SdpUtils.setMaxBitrate(sdp, options.video, mid);
    }
    return sdp;
  }
  // SDP mugling is deprecated, moving to `setParameters`.
  _setRtpSenderOptions (sdp, options, mid) {

    if (this._isRtpEncodingParameters(options.audio) ||
      this._isRtpEncodingParameters(options.video)) {
      return sdp;
    }
    sdp = this._setMaxBitrate(sdp, options, mid);
    return sdp;
  }
  _setBitrate (mid) {
    const bandwidth = mid.bitrate;
    var pc = this._pc
    const sender = this._pc.getSenders()[1]
    console.log(sender)
    var parameters = sender.getParameters();
    if (
      'RTCRtpSender' in window &&
      'setParameters' in window.RTCRtpSender.prototype) {

      if (!parameters.encodings) {
        parameters.encodings = [{}];
      }
      if (bandwidth === 'unlimited') {
        delete parameters.encodings[0].maxBitrate;
      } else {
        parameters.encodings[0].maxBitrate = bandwidth * 1000;
      }
      console.log(parameters)
      sender.setParameters(parameters)
        .then(() => {
        })
        .catch(e => console.error(e));
      // return;
    }
    pc.createOffer()
      .then(offer => pc.setLocalDescription(offer))
      .then(() => {
        const desc = {
          type: pc.remoteDescription.type,
          sdp: bandwidth === 'unlimited' ?
            this.removeBandwidthRestriction(pc.remoteDescription.sdp) :
            this.updateBandwidthRestriction(pc.remoteDescription.sdp, bandwidth, parameters)
        };

        // console.log('Applying bandwidth restriction to setRemoteDescription:\n' +
        //     desc.sdp);
        return pc.setRemoteDescription(desc);
      })
      .then(() => {
        // bandwidthSelector.disabled = false;
      })
      .catch(this.onSetSessionDescriptionError);

  }
  removeBandwidthRestriction (sdp) {
    console.log(sdp)
    return sdp.replace(/b=AS:.*\r\n/, '').replace(/b=TIAS:.*\r\n/, '');
  }

  updateBandwidthRestriction (sdp, bandwidth, parameters) {
    // console.log(sdp)
    console.log(parameters)
    let clockRate = parameters.codecs[0].clockRate
    let payloadType = parameters.codecs[0].payloadType
    let mimeType = parameters.codecs[0].mimeType
    let sdpFmtpLine = parameters.codecs[0].sdpFmtpLine

    let modifier = 'AS';

    if (sdp.indexOf('b=' + modifier + ':') === -1) {
      sdp = sdp.replace(/c=IN (.*)\r\n/, 'c=IN $1\r\nb=' + modifier + ':' + bandwidth + '\r\n');
    } else {
      sdp = sdp.replace(new RegExp('b=' + modifier + ':.*\r\n'), 'b=' + modifier + ':' + bandwidth + '\r\n');
    }
    if (mimeType == "video/H264") {

      if (sdp.indexOf('x-google-max-bitrate=') == -1) {
        sdp = sdp.replace(sdpFmtpLine,
          sdpFmtpLine + ';x-google-max-bitrate=' + bandwidth + ';x-google-min-bitrate=' +
          bandwidth +
          ';x-google-start-bitrate=' + bandwidth)

      } else {
        sdp = sdp.replace(new RegExp(sdpFmtpLine + ';x-google-max-bitrate=' + '.*\r\n'),
          sdpFmtpLine + ';x-google-max-bitrate=' + bandwidth + ';x-google-min-bitrate=' + bandwidth +
          ';x-google-start-bitrate=' + bandwidth + '\r\n')
        // console.log(sdp)
      }
    }
    if (mimeType == "video/VP8") {

      if (sdp.indexOf('a=fmtp:' + payloadType + ' x-google-max-bitrate=') === -1) {
        sdp = sdp.replace("a=rtpmap:" + payloadType + " VP8/90000",
          'a=rtpmap:' + payloadType + ' VP8/90000\r\na=fmtp:' + payloadType + ' x-google-max-bitrate=' + bandwidth + ';x-google-min-bitrate=' +
          bandwidth +
          ';x-google-start-bitrate=' + bandwidth)
      } else {
        sdp = sdp.replace(new RegExp('a=rtpmap:' + payloadType + ' x-google-max-bitrate=' + '.*\r\n'),
          'a=rtpmap:' + payloadType + ' x-google-max-bitrate=' + bandwidth + ';x-google-min-bitrate=' + bandwidth +
          ';x-google-start-bitrate=' + bandwidth + '\r\n')
      }
    }

    return sdp;
  }

  onSetSessionDescriptionError (error) {
    console.log('Failed to set session description: ' + error.toString());
  }
  // Add legacy simulcast in SDP for safari.
  _setRtpReceiverOptions (sdp, options, mid) {

    if (this._isRtpEncodingParameters(options.video) && Utils.isSafari()) {
      if (options.video.length > 1) {
        sdp = SdpUtils.addLegacySimulcast(
          sdp, 'video', options.video.length, mid);
      }
    }

    // _videoCodecs is a workaround for setting video codecs. It will be moved to RTCRtpSendParameters.
    if (this._isRtpEncodingParameters(options.video) && this._videoCodecs) {
      sdp = SdpUtils.reorderCodecs(sdp, 'video', this._videoCodecs, mid);
      return sdp;
    }
    if (this._isRtpEncodingParameters(options.audio) ||
      this._isRtpEncodingParameters(options.video)) {
      return sdp;
    }
    sdp = this._setCodecOrder(sdp, options, mid);
    return sdp;
  }

  _isRtpEncodingParameters (obj) {
    if (!Array.isArray(obj)) {
      return false;
    }
    // Only check the first one.
    const param = obj[0];
    return param.codecPayloadType || param.dtx || param.active ||
      param.ptime || param.maxFramerate || param.scaleResolutionDownBy ||
      param.rid;
  }

  _isZXEncodingParameters (obj) {
    if (!Array.isArray(obj)) {
      return false;
    }
    // Only check the first one.
    const param = obj[0];
    return !!param.codec;
  }
  // 
  _videoTrackType (type) {

  }
}