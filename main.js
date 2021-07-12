/**
 * Sample JavaScript code for youtube.videos.list
 * See instructions for running APIs Explorer code samples locally:
 * https://developers.google.com/explorer-help/guides/code_samples#javascript
 */

const CUTOFF_DATE = new Date("2017-01-03"); // Technically cutoff is the first, but want some leeway because I hate timezones


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

async function init() {
    await new Promise((resolve, reject) => gapi.load("client", resolve));
    await loadClient();
    console.log("Initialized");
    document.querySelector("#checkids").disabled = false;
}

async function checkIDs() {
    const RESULTS_ELEMENT = document.querySelector("#results");

    let vid_list_text = document.querySelector("#ids").value;
    let vids = Array.from(vid_list_text.matchAll(/[a-zA-Z0-9_-]{6,11}/g), match => match[0]);

    // TODO: Groups of 50
    let result = await execute(vids);
    let vid_results = result.result.items;
    let vulnerable_vids = vid_results.filter(item => item.status.privacyStatus === "unlisted" && new Date(item.snippet.publishedAt) < CUTOFF_DATE);
    for(let vulnerable_vid of vulnerable_vids) {
        let li = document.createElement("li");
        let a = document.createElement("a");
        a.textContent = vulnerable_vid.snippet.title;
        a.href = `https://youtu.be/${vulnerable_vid.id}`;
        li.append(a);
        RESULTS_ELEMENT.append(li);
    }
}

document.querySelector("#checkids").addEventListener("click", checkIDs);

init();

