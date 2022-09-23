const $start = document.querySelector(".fa");
const $stop = $start;
const $audioList = document.getElementById("audio-list");
const $formInputsDiv = document.getElementById("audio-inputs");

const $recorder = new entekVoiceRecorder();

$recorder.setStartRecordElement($start);
$recorder.setStopRecordElement($stop);
$recorder.setAudioDiv($audioList);
$recorder.setFormElement($formInputsDiv);

$recorder.setFormTemplateFunc(function (count) {
    const i = document.createElement("i");
    i.classList.add("fa", "fa-times", "fa-3x", $recorder.removeAudioClass);
    return i;
});