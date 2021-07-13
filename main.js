/**
 * Sample JavaScript code for youtube.videos.list
 * See instructions for running APIs Explorer code samples locally:
 * https://developers.google.com/explorer-help/guides/code_samples#javascript
 */

const CUTOFF_DATE = new Date("2017-01-03"); // Technically cutoff is the first, but want some leeway because I hate timezones

const RESULTS_ELEMENT = document.querySelector("#results");
const VIDEO_PROGRESS_ELEMENT = document.querySelector("#video_progress");


function loadClient() {
    gapi.client.setApiKey("AIzaSyC228Ik4RO2aP7kfmTmDRG1SOBpugc9uWY");
    return gapi.client.load("https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest");
}

function execute(ids) {
    return gapi.client.youtube.videos.list({
        "part": [
            "snippet,status"
        ],
        "id": [
            ids.join(",")
        ]
    });
}

async function* executePlaylist(id) {
    let nextPageToken = null;
    do {
        let options = {
            "part": [
                "contentDetails,status,snippet"
            ],
            "playlistId": id,
            "maxResults": 50
        };
        if(nextPageToken) {
            options.pageToken = nextPageToken;
        }
        let playlistItems = await gapi.client.youtube.playlistItems.list(options).then(r => r.result);
        nextPageToken = playlistItems.nextPageToken;
        VIDEO_PROGRESS_ELEMENT.max = playlistItems.pageInfo.totalResults;

        for(item of playlistItems.items) {
            yield item;
        }
        await new Promise((resolve, reject) => setTimeout(resolve, 1000));
    } while(nextPageToken);
}

async function init() {
    await new Promise((resolve, reject) => gapi.load("client", resolve));
    await loadClient();
    console.log("Initialized");
    document.querySelector("#checkids").disabled = false;
    document.querySelector("#checkplaylist").disabled = false;
}

// Lazily stolen from https://scotch.io/courses/the-ultimate-guide-to-javascript-algorithms/array-chunking
function chunkArray(array, size) {
    let result = []
    for (let i = 0; i < array.length; i += size) {
        let chunk = array.slice(i, i + size)
        result.push(chunk)
    }
    return result
}

function showVulnerableVideo(video) {
    let li = document.createElement("li");
    let a = document.createElement("a");
    a.textContent = video.title;
    a.href = `https://youtu.be/${video.id}`;
    li.append(a);
    RESULTS_ELEMENT.append(li);
}

function processItems(vid_results) {
    let vulnerable_vids = vid_results.filter(item => item.status.privacyStatus === "unlisted" && new Date(item.snippet.publishedAt) < CUTOFF_DATE);
    for(let vulnerable_vid of vulnerable_vids) {
        showVulnerableVideo({
            id: vulnerable_vid.id,
            title: vulnerable_vid.snippet.title
        });
    }
}

async function processIDs(vids) {
    VIDEO_PROGRESS_ELEMENT.max = vids.length;
    let vid_chunks = chunkArray(vids, 50);
    for(let [vid_chunks_index, vids] of vid_chunks.entries()) {
        let result = await execute(vids);
        let vid_results = result.result.items;
        processItems(vid_results);
        VIDEO_PROGRESS_ELEMENT.value = vid_chunks_index * 50 + vids.length;
        await new Promise((resolve, reject) => setTimeout(resolve, 1000));
    }
}

function clear() {
    RESULTS_ELEMENT.replaceChildren();
    VIDEO_PROGRESS_ELEMENT.max = 0;
    VIDEO_PROGRESS_ELEMENT.value = 0;
}

async function checkIDs() {
    clear();
    let vid_list_text = document.querySelector("#ids").value;
    let vids = Array.from(vid_list_text.matchAll(/[a-zA-Z0-9_-]{6,11}/g), match => match[0]);
    processIDs(vids);
}

async function checkPlaylist() {
    clear();
    let playlistId = document.querySelector("#playlist").value;
    let vids = [];
    for await(item of executePlaylist(playlistId)) {
        if(item.status.privacyStatus === "unlisted" && new Date(item.contentDetails.videoPublishedAt) < CUTOFF_DATE) {
            showVulnerableVideo({
                id: item.contentDetails.videoId,
                title: item.snippet.title
            });
        }
        VIDEO_PROGRESS_ELEMENT.value += 1;
    }
}

document.querySelector("#checkids").addEventListener("click", checkIDs);
document.querySelector("#checkplaylist").addEventListener("click", checkPlaylist);

init();

