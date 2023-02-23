const fs = require("fs")
const chokidar = require("chokidar")
const config = require("./config.json")
let watcher = null
require("isomorphic-fetch")

function upload (replay) {
    let server = "https://replay.kerrigansurvival.com/upload"
    fetch(server, {
        method: "POST",
        body: replay,
        headers: {
            "User-Agent": "kerrigan-survival-uploader/1.06"
        }
    }).then(async res => {
        if (res.status == 200) {
            writeToLog("Replay uploaded successfully.")
            writeToLog(await res.text())
        }
    })
}

function addToIgnore (path) {
    let ignore = fs.readFileSync("./ignore.json")
    ignore = JSON.parse(ignore)
    ignore.push(path)
    fs.writeFileSync("./ignore.json", JSON.stringify(ignore))
}

function removeFromIgnore (path) {
    let ignore = fs.readFileSync("./ignore.json")
    ignore = JSON.parse(ignore)
    ignore.splice(ignore.indexOf(path), 1)
    fs.writeFileSync("./ignore.json", JSON.stringify(ignore))
}

function writeToLog (str) {
    let date = new Date()
    let time = date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds()
    let log = fs.readFileSync("./log.txt")
    log = log + `[${time}] ` + str + "\n"
    fs.writeFileSync("./log.txt", log)
    console.log(str)
}

function check (path) {
    if (path.endsWith(".SC2Replay") === false) return false
    if (path.includes("Kerrigan Survival") === false) return false
    return true
}

function initWatcher () {
    watcher = chokidar.watch(config.path, {
        persistent: true,
        ignoreInitial: true
    }).on("add", async (path) => {
        if (check(path) === false) return
        setTimeout(async () => {
            let replay = await fs.readFileSync(path)
            writeToLog("Uploading replay: " + path.split("\\")[path.split("\\").length - 1])
            upload(replay)
            addToIgnore(path)
        }, 5000);
    }).on("unlink", (path) => {
        if (check(path) === false) return
        writeToLog("Replay removed from folder: " + path.split("\\")[path.split("\\").length - 1])
        removeFromIgnore(path)
    })
}

initWatcher()
writeToLog("KS2 Auto Uploader started. Watching path " + config.path + " for new replays.")
writeToLog("/claim credits handle:" + config.id)

// set console title
process.title = "KS2 Auto Uploader | " + config.id