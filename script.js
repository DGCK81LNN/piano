/**
 * @typedef {{ oscNode: OscillatorNode, gainNode: GainNode, el: Element }} PressedKey
 */

var svg = document.getElementById("svg")
function forceRepaint() {
  svg.classList.toggle("forceRepaintHack")
}
window.addEventListener("resize", forceRepaint)
setTimeout(forceRepaint, 0)

/** @type {AudioContext} */
var auCtx = new (window.AudioContext || window.webkitAudioContext)()
var wav = auCtx.createPeriodicWave(new Float32Array([0, 0, 0, 0]), new Float32Array([0, 1, 1, 1]))
/** @type {Map<number, PressedKey>} */
var pressedKeys = new Map()


/** @param {number} note */
/** @param {Element} el */
function startNote(note, el) {
  if (pressedKeys.has(note)) return

  var oscNode = auCtx.createOscillator()
  var gainNode = auCtx.createGain()

  oscNode.setPeriodicWave(wav)
  oscNode.detune.value = note * 100
  oscNode.connect(gainNode)
  gainNode.connect(auCtx.destination)

  oscNode.start(auCtx.currentTime)
  gainNode.gain.setValueAtTime(0.5, auCtx.currentTime)
  gainNode.gain.setTargetAtTime(0, auCtx.currentTime, 0.75)

  el.classList.add("pressed")

  pressedKeys.set(note, { oscNode, gainNode, el })
}

function endNote(note) {
  var key = pressedKeys.get(note)
  if (!key) return
  var oscNode = key.oscNode
  var gainNode = key.gainNode

  // Safari 9 doesn't support AudoParam.cancelAndHoldAtTime
  // using cancelScheduledValues(now) + setValueAtTme(valueBeforeCanceling, now) instead
  var currentGainValue = key.gainNode.gain.value
  gainNode.gain.cancelScheduledValues(auCtx.currentTime)
  gainNode.gain.setValueAtTime(currentGainValue, auCtx.currentTime)
  gainNode.gain.linearRampToValueAtTime(0, auCtx.currentTime + 0.2)
  oscNode.stop(auCtx.currentTime + 0.2)

  key.el.classList.remove("pressed")
  
  pressedKeys.delete(note)
}

function keyPressed(event) {
  if (event instanceof MouseEvent && event.button !== 0) return

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
  pressedKeys.forEach(function (_key, note) {
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
