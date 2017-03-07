var time = document.getElementsByClassName('time')[0];

setInterval(function(){
  if (time.style.fontSize == "20px") {
    time.style.fontSize = "25px";
  }
  else {
    time.style.fontSize = "20px";
  }
},1000);
