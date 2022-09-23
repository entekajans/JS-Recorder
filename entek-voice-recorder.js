/**
 * Entek Voice Recorder
 */

const entekVoiceRecorder = function () {
    this.audioDiv = null;
    this._startTime = 0;
    this._endTime = 0;
    this.onStart = null;
    this.onEnd = null;
    this.startRecordElement = null;
    this.stopRecordElement = null;
    this._areStartAndStopElementSame = false;
    this.form = null;
    this.formTemplateFunc = null;
    this.count = 0;
    this.mediaRecorderOptions = {
        mimeType: "audio/ogg;codecs=opus",
    };
    this.mime = "audio/ogg";
    this._classStatusTrue = "entek-recorder-status-true";
    this._classStatusFalse = "entek-recorder-status-false";
    this.removeAudioClass = "entek-recorder-remove-audio";
    this.idAttrName = "entek-recorder-id";

    this.clearConfig = function () {
        this.recording = false;
        this.recorderTime = 0;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.audioBlob = null;
        this.audioUrl = null;
        this.base64 = null;
        this.base64URL = null;
        this._startTime = 0;
        this._endTime = 0;
    };

    document.addEventListener("click", (event) => {
        if (
            event.target &&
            event.target.classList.contains(this.removeAudioClass)
        ) {
            this.removeAudioOnClick(event.target.getAttribute(this.idAttrName));
        }
    });

    this.clearConfig();
};

entekVoiceRecorder.prototype.setRecording = function (status) {
    if (status) {
        this._startTime = new Date().getTime();
        this.recording = true;
        console.log("Recording!..");
        this.onStart instanceof Function && this.onStart();
    } else {
        this._endTime = new Date().getTime();
        this.recording = false;
        this.count++;
        console.log("Record stopped!..");
        this.onEnd instanceof Function && this.onStart();
    }

    this.updateStartAndStopElementClass();
};

entekVoiceRecorder.prototype.updateStartAndStopElementClass = function () {
    if (this.recording) {
        this.startRecordElement?.classList?.add(this._classStatusTrue);
        this.startRecordElement?.classList?.remove(this._classStatusFalse);

        this.stopRecordElement?.classList?.add(this._classStatusTrue);
        this.stopRecordElement?.classList?.remove(this._classStatusFalse);
    } else {
        this.startRecordElement?.classList?.add(this._classStatusFalse);
        this.startRecordElement?.classList?.remove(this._classStatusTrue);

        this.stopRecordElement?.classList?.add(this._classStatusFalse);
        this.stopRecordElement?.classList?.remove(this._classStatusTrue);
    }
};

entekVoiceRecorder.prototype.calculateDuration = function () {
    return Math.floor((this._endTime - this._startTime) / 1000);
};

entekVoiceRecorder.prototype.setOnStart = function (callback) {
    this.onStart = callback;
};

entekVoiceRecorder.prototype.setOnEnd = function (callback) {
    this.onEnd = callback;
};

entekVoiceRecorder.prototype.setAudioDiv = function (element) {
    if (!(element instanceof HTMLElement)) {
        console.error("Audio element must be HTMLElement");
        return;
    }
    this.audioDiv = element;
};

entekVoiceRecorder.prototype.setFormElement = function (element) {
    if (!(element instanceof HTMLElement)) {
        console.error("Form element must be HTMLElement");
        return;
    }
    this.form = element;
};

entekVoiceRecorder.prototype.setStartRecordElement = function (element) {
    if (!(element instanceof HTMLElement)) {
        console.error("Record start element must be HTMLElement");
        return;
    }
    this.startRecordElement = element;

    this.startRecordElement.addEventListener(
        "click",
        this.startRecord.bind(this)
    );

    this.updateStartAndStopElementClass();
};

entekVoiceRecorder.prototype.setStopRecordElement = function (element) {
    if (!(element instanceof HTMLElement)) {
        console.error("Record stop element must be HTMLElement");
        return;
    }
    this.stopRecordElement = element;

    if (this.startRecordElement === this.stopRecordElement) {
        this.areStartAndStopElementSame = true;
    } else {
        this.startRecordElement.addEventListener(
            "click",
            this.stopRecord.bind(this)
        );
        this.updateStartAndStopElementClass();
    }
};

entekVoiceRecorder.prototype.setForm = function (element) {
    if (!(element instanceof HTMLElement)) {
        console.error("Form element must be HTMLElement");
        return;
    }

    this.form = element;
};

entekVoiceRecorder.prototype.checkMicrophonePermission = async function () {
    return navigator.permissions
        .query({
            name: "microphone",
        })
        .then(function (permissionStatus) {
            return {
                state: permissionStatus.state,
                status: permissionStatus.state === "granted",
            };
        });
};

entekVoiceRecorder.prototype.startRecord = async function () {
    if (this.recording) {
        if (this.areStartAndStopElementSame) {
            this.stopRecord();
            return;
        }
        return;
    }

    const $permission = await this.checkMicrophonePermission();

    if (!$permission.status) {
        console.error("Microphone permission denied!");
    }

    this.clearConfig();

    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        this.mediaRecorder = new MediaRecorder(stream);
        this.mediaRecorder.start();
        this.setRecording(true);

        this.mediaRecorder.addEventListener("dataavailable", (event) => {
            this.audioChunks.push(event.data);
        });

        this.mediaRecorder.addEventListener("stop", () => {
            this.audioBlob = new Blob(this.audioChunks);
            this.audioUrl = URL.createObjectURL(this.audioBlob);
            this.setRecording(false);
        });
    });
};

entekVoiceRecorder.prototype.stopRecord = function () {
    this.mediaRecorder.stop();
    this.runIfStop(this.createAudioElement.bind(this));
};

entekVoiceRecorder.prototype.runIfStop = function (callback) {
    const $interval = setInterval(() => {
        if (!this.recording) {
            clearInterval($interval);
            callback();
        }
    }, 100);
};

entekVoiceRecorder.prototype.createAudioElement = function () {
    if (!this.audioDiv) return;

    const $reader = new FileReader();
    const $audio = document.createElement("audio");
    const $div = document.createElement("div");
    $div.classList.add("entek-voice-recorder-audio-item");

    $div.appendChild($audio);

    $audio.controls = true;
    $audio.setAttribute(this.idAttrName, this.count);

    if (this.formTemplateFunc) {
        const $template = this.formTemplateFunc(this.count);

        if ($template instanceof HTMLElement) {
            $template.setAttribute(this.idAttrName, this.count);

            $div.appendChild($template);
        }
    }

    $reader.readAsDataURL(this.audioBlob);

    $reader.onloadend = () => {
        this.base64 = $reader.result;
        this.base64 = this.base64.split(",")[1];
        this.base64URL = `data:${this.mime};base64,${this.base64}`;

        $audio.src = this.base64URL;
        this.audioDiv.appendChild($div);

        this.addAudioToForm();
    };
};

entekVoiceRecorder.prototype.addAudioToForm = async function () {
    if (!this.form) return;

    const $input = document.createElement("input");
    $input.name = "entek_voice_recorder_sound[]";
    $input.type = "text"; // hidden
    $input.value = this.base64URL;
    $input.setAttribute(this.idAttrName, this.count);
    this.form.appendChild($input);
};

entekVoiceRecorder.prototype.setFormTemplateFunc = function (callback) {
    if (!(callback instanceof Function)) return;

    this.formTemplateFunc = callback;
};

entekVoiceRecorder.prototype.removeAudioOnClick = function (id) {
    document
        .querySelectorAll(`[entek-recorder-id='${id}']`)
        .forEach((newElement) => {
            newElement.remove();
        });
};
