const express = require('express')
const http = require('http')
const path = require('path')
const socketio = require('socket.io')
const WavEncoder = require('wav-encoder')
const fs = require('fs')
const app = express()

app.use('/', express.static(path.join(__dirname, 'public')))

server = http.createServer(app).listen(3000, function() {
    console.log('Example app listening on port 3000')
})

const io = socketio.listen(server)

io.on('connection', (socket) => {
    let sampleRate = 48000
    let buffer = []

    socket.on('start', (data) => {
        sampleRate = data.sampleRate
        console.log(`Sample Rate: ${sampleRate}`)
    })

    socket.on('send_pcm', (data) => {
        // data: { "1": 11, "2": 29, "3": 33, ... }
        const itr = data.values()
        const buf = new Array(data.length)
        for (var i = 0; i < buf.length; i++) {
            buf[i] = itr.next().value
        }
        buffer = buffer.concat(buf)
    })

    socket.on('stop', (data, ack) => {
        const f32array = toF32Array(buffer)
        const filename = `public/wav/${String(Date.now())}.wav`
        exportWAV(f32array, sampleRate, filename)
        ack({ filename: filename })
    })
})

// Convert byte array to Float32Array
const toF32Array = (buf) => {
    const buffer = new ArrayBuffer(buf.length)
    const view = new Uint8Array(buffer)
    for (var i = 0; i < buf.length; i++) {
        view[i] = buf[i]
    }
    return new Float32Array(buffer)
}

// data: Float32Array
// sampleRate: number
// filename: string
const exportWAV = (data, sampleRate, filename) => {
    const audioData = {
        sampleRate: sampleRate,
        channelData: [data]
    }
    WavEncoder.encode(audioData).then((buffer) => {
        fs.writeFile(filename, Buffer.from(buffer), (e) => {
            if (e) {
                console.log(e)
            } else {
                console.log(`Successfully saved ${filename}`)
            }
        })
    })
}
