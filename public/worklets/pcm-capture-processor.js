class PcmCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this.targetSampleRate = 16000
    this.downsampleBuffer = []
  }

  downsample(float32Array) {
    if (this.targetSampleRate === sampleRate) return float32Array
    const ratio = sampleRate / this.targetSampleRate
    const newLength = Math.floor(float32Array.length / ratio)
    const result = new Float32Array(newLength)
    let offsetResult = 0
    let offsetBuffer = 0
    while (offsetResult < result.length) {
      const nextOffsetBuffer = Math.min(float32Array.length, Math.round((offsetResult + 1) * ratio))
      let accum = 0
      let count = 0
      for (let index = offsetBuffer; index < nextOffsetBuffer; index += 1) {
        accum += float32Array[index]
        count += 1
      }
      result[offsetResult] = count > 0 ? accum / count : 0
      offsetResult += 1
      offsetBuffer = nextOffsetBuffer
    }
    return result
  }

  toInt16(float32Array) {
    const int16Array = new Int16Array(float32Array.length)
    for (let i = 0; i < float32Array.length; i += 1) {
      const sample = Math.max(-1, Math.min(1, float32Array[i]))
      int16Array[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff
    }
    return int16Array
  }

  level(float32Array) {
    let sum = 0
    for (let i = 0; i < float32Array.length; i += 1) {
      sum += Math.abs(float32Array[i])
    }
    return sum / float32Array.length
  }

  process(inputs) {
    const input = inputs[0]
    if (!input || input.length === 0) return true
    const channelData = input[0]
    if (!channelData || channelData.length === 0) return true

    const downsampled = this.downsample(channelData)
    const int16 = this.toInt16(downsampled)
    this.port.postMessage(
      {
        pcm: int16.buffer,
        level: this.level(downsampled),
      },
      [int16.buffer],
    )
    return true
  }
}

registerProcessor('pcm-capture-processor', PcmCaptureProcessor)

