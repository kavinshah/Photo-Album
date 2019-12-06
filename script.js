let apigClient = apigClientFactory.newClient({ apiKey: "ZHVVJ84EWN5ZuvlpnFfvT2fAjRyJTE7Y3igz3Fxu" });

let inputBox = document.getElementById("searchInput");

let recognizing = false;
let recognition;

function searchImages() {

    let searchQuery = inputBox.value;
    console.log(searchQuery);
    if(!searchQuery){
        alert("Please provide an input");
    }
    else{
        apigClient.searchGet({ "q": searchQuery })
            .then(function (result) {
                // console.log(result.data.body.imagePaths);
                showImages(result.data.body.imagePaths);
            }).catch(function (result) {
                alert("Error in Fetching Images");
        });
    }
}

function voiceSearch() {
    let micButton = document.getElementById("micSearchButton");
    if (!recognizing) {
        micButton.innerHTML = "Stop";
        micButton.style.color = "red";
        window.SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
        let finalTranscript = '';
        recognition = new window.SpeechRecognition();
        recognition.interimResults = false;
        recognition.maxAlternatives = 10;
        recognition.continuous = true;
        recognition.onstart = function() {
            recognizing = true;
        };
        recognition.onend = function() {
            recognizing = false;
        };
        recognition.onresult = (event) => {
          let interimTranscript = '';
          for (let i = event.resultIndex, len = event.results.length; i < len; i++) {
            let transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }
          document.getElementById("searchInput").value = finalTranscript + "";
        }
        recognition.start();
    } else {
        micButton.innerHTML = "Voice";
        micButton.style.color = "Gray";
        recognition.stop();
    }
}

async function showImages(images) {
    $("#imageContainer").empty();
   
    let promises = images.map(async (image) => {
        let response = await fetch(`https://s3.amazonaws.com/${image}`, {
            method: 'GET'
        });
        return response;
    });

    let tempResponses = await Promise.all(promises);
    
    let imagesPaths = tempResponses.filter((r) => {
        return r.status === 200;
    }).map((item) => item.url);

    if(!imagesPaths.length){
        alert("No Images Found!");
    }else{
        imagesPaths.forEach(path => {
            $('#imageContainer').append(`<div class="col-md-4 nopadding"><div class="thumbnail">
                <a href="${path}" target="_blank">
                <img src="${path}" alt="Lights" style="width:100%"></a></div></div>`)
        });
    }
}

inputBox.addEventListener("keyup", function (event) {
    if (event.keyCode === 13) {
        event.preventDefault();
        document.getElementById("searchButton").click();
    }
});


$(document).on('change', '#inputGroupFile02', function () {
    
    let input = $(this),
    label = input.val().replace(/\\/g, '/').replace(/.*\//, '');
    input.trigger('fileselect', [label]);

    let labalElem = document.getElementById("photoLabel");
    labalElem.innerText = label
    
    readURL(this, label);

});


function readURL(input, label) {

    if (input.files && input.files[0]) {
        let reader = new FileReader();
        reader.onload = function (e) {
            upload(reader.result, label );
        }
        reader.onerror = function () {
            console.log(`Error in reader`);
        };
        reader.readAsBinaryString(input.files[0]);
    }
}

function upload(image, imglabel) {
   
    let imageNameS3 = `${imglabel.replace(/\.[^/.]+$/, "")}-${Date.now()}.${imglabel.split(".").pop()}`
    
    let params = { "bucket":"photo-album-b2", "key": imageNameS3, "Content-Type": "image/***" };
    
    let additionalParams = {
        headers: {
            "Content-Type": "image/***",
        }
    };

    apigClient.uploadBucketKeyPut(params, btoa(image), additionalParams)
        .then(function (result) {
            console.log(result);
            alert(`Image ${imglabel},has been uploded`);
            document.getElementById("photoLabel").value  = '';
            document.getElementById("photoLabel").innerText = '';

        }).catch(function (err) {
            console.log(err);
            alert(`Error -${err}`);
    });	

}