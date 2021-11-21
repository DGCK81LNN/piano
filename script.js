/**
 * @typedef {{ osc: OscillatorNode, gain: GainNode, el: Element }} Key
 */

var svg = document.getElementById("svg")
setTimeout(window.onresize = function () {
  svg.classList.toggle("forceRepaintHack")
}, 0)

var auCtx = new (window.AudioContext || window.webkitAudioContext)()
var wav = auCtx.createPeriodicWave(new Float32Array([0, 1, 2, 3, 4]), new Float32Array([0, 0, 0, 0, 0]))
/** @type {Map<number, Key>} */
var keys = new Map() // pressed keys


function startNote(note, el) {
  if (keys.get(note)) return // alredy pressed

  var key = {}
  keys.set(note, key)
  var osc = key.osc = auCtx.createOscillator()
  var gain = key.gain = auCtx.createGain()
  key.el = el

  osc.setPeriodicWave(wav)
  osc.detune.value = note * 100
  osc.connect(key.gain)
  gain.connect(auCtx.destination)

  osc.start(auCtx.currentTime)
  gain.gain.setValueAtTime(0.5, auCtx.currentTime)
  gain.gain.setTargetAtTime(0, auCtx.currentTime, 0.75)

  el.classList.add("pressed")
}

function endNote(note) {
  var key = keys.get(note)
  if (!key) return
  var osc = key.osc
  var gain = key.gain

  var currentGain = key.gain.gain.value
  gain.gain.cancelScheduledValues(auCtx.currentTime)
  gain.gain.setValueAtTime(currentGain, auCtx.currentTime)
  gain.gain.linearRampToValueAtTime(0, auCtx.currentTime + 0.2)
  osc.stop(auCtx.currentTime + 0.2)

  keys.delete(note)

  key.el.classList.remove("pressed")
}

function keyPressed(event) {
  if (!event.currentTarget.dataset.note) return
  var note = Number(this.dataset.note)
  event.preventDefault()
  startNote(note, event.currentTarget)
}

function keyReleased(event) {
  if (Array.from(event.touches).some(function (touch) {
    return touch.target === event.currentTarget
  })) return
  if (!this.dataset.note) return
  var note = Number(event.currentTarget.dataset.note)
  endNote(note)
}

function allKeysReleased(_event) {
  keys.forEach(function (_key, note) {
    endNote(note)
  })
}

Array.prototype.forEach.call(document.querySelectorAll("[data-note]"), function (el) {
  el.addEventListener("touchstart", keyPressed)
  el.addEventListener("mousedown", keyPressed)
  el.addEventListener("touchend", keyReleased)
  el.addEventListener("touchcancel", keyReleased)
})
document.documentElement.addEventListener("mouseup", allKeysReleased)
