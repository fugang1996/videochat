
/* 关于媒体设置 */
'use strict';
/**
 * @class AudioSourceInfo
 * @classDesc Source info about an audio track. Values: 'mic', 'screen-cast',
 * 'file', 'mixed'.
 * @memberOf 
 * @readonly
 * @enum {string}
 */
export const AudioSourceInfo = {
    MIC: 'mic',
    SCREENCAST: 'screen-cast',
    FILE: 'file',
    MIXED: 'mixed',
};

/**
 * @class VideoSourceInfo
 * @classDesc Source info about a video track. Values: 'camera', 'screen-cast',
 * 'file', 'mixed'.
 * @memberOf 
 * @readonly
 * @enum {string}
 */
export const VideoSourceInfo = {
    CAMERA: 'camera',
    SCREENCAST: 'screen-cast',
    FILE: 'file',
    MIXED: 'mixed',
};

/**
 * @class TrackKind
 * @classDesc Kind of a track. Values: 'audio' for audio track, 'video' for
 * video track, 'av' for both audio and video tracks.
 * @memberOf 
 * @readonly
 * @enum {string}
 */
export const TrackKind = {
    /**
     * Audio tracks.
     * @type string
     */
    AUDIO: 'audio',
    /**
     * Video tracks.
     * @type string
     */
    VIDEO: 'video',
    /**
     * Both audio and video tracks.
     * @type string
     */
    AUDIO_AND_VIDEO: 'av',
};
/**
 * @class Resolution
 * @memberOf 
 * @classDesc The Resolution defines the size of a rectangle.
 * @constructor
 * @param {number} width
 * @param {number} height
 */
export class Resolution {
    // eslint-disable-next-line require-jsdoc
    constructor(width, height) {
        /**
         * @member {number} width
         * @instance
         * @memberof Resolution
         */
        this.width = width;
        /**
         * @member {number} height
         * @instance
         * @memberof Resolution
         */
        this.height = height;
    }
}
