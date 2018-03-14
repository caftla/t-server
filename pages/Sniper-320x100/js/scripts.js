window.onload = function (event){
	
	var ad = document.getElementById("ad")
	    shakyHands = document.getElementById("shakyHands"),
	    pulse = document.getElementById("pulse"),
	    triggerClick  = document.getElementById("trigger"),
	    ammo = document.getElementById("ammo"),
	    ammoLi = ammo.getElementsByTagName("li"),
	    btn = document.getElementById("btn"),
	    bang = document.getElementById("bang"),
	    hitMap = document.getElementById("hitMap"),
	    artDead = document.getElementById("artDead");
	
		//Positioning
		var artSize = 480;
		var artHalf = artSize / 2;
		var adWidth =  ad.clientWidth;
		var adHeight = ad.clientHeight;
		var padding = 20; // to compensate for shaky effect	
		var offsetX = adWidth - artHalf + padding;
		var offsetY = adHeight - artHalf + padding;
		
		//Ammo & Targets
		var targetsRemaining = 1;
		var ammoRemaining = 3;
		
		
		var gyroPresent = false;
		
		window.addEventListener("devicemotion", function(event){
			
			if(event.rotationRate.alpha || event.rotationRate.beta || event.rotationRate.gamma) {
				
				gyroPresent = true;
				removeClass(shakyHands,'animate-shakyhands');
				
			}
		
		});	
	
		checkAmmo();
		
		
		triggerClick.addEventListener('click', trigger);
		
		//Check Bullets
		function checkAmmo(){
			
			ammoRecount = 0;
		
			for(var i=0; i < ammoLi.length; i++){
				
				removeClass(ammoLi[i],"full");
				
				if(ammoRecount < ammoRemaining) {
					
					addClass(ammoLi[i],"full");
					
				}
				
				ammoRecount ++;
					
			}	
		}
	
		//Shooting
		function trigger(){
			
			addClass(btn,"down");
			
			setTimeout(function(){
				
				removeClass(btn,"down");
				
			}, 200);
			
			if(ammoRemaining > 0) {
				
				ammoRemaining--;
				checkAmmo();
				
				addClass(bang,"now");
				
				setTimeout(function(){
					
					removeClass(bang,"now");
					
				}, 1);
				
				if(hitCheck() == true) {
					
					gameOver();
					
					return;
					
				}

			}
			
			if (ammoRemaining <= 0) {
				
				gameOver();
				
			}
			
		}
		
		//Hit Check
		function hitCheck(){
		
			var targetPos = hitMap.getBoundingClientRect();
			var targetWidth =    hitMap.clientWidth;
			var targetHeight = hitMap.clientHeight;
			var bannerCenterX = ad.getBoundingClientRect().left + ( ad.clientWidth / 2 );
			var bannerCenterY = ad.getBoundingClientRect().top + ( ad.clientHeight / 2 );
			
			//console.log(targetPos);
			//console.log(bannerCenterX,bannerCenterY);
			
			if(
				targetPos.left > bannerCenterX - targetWidth &&
				targetPos.left < bannerCenterX  &&
				targetPos.top > bannerCenterY - targetHeight &&
				targetPos.top < bannerCenterY  
			){
			
				console.log("hit");
				
				targetsRemaining--;
				
				append(ad,"HIT!","feedback");
				
				artDead.style.display="block";
				
				return true;
			
			
			}else{
			
				console.log("miss");
				append(ad,"MISS!","feedback bad");
			
			}
	
		}
		
		//Game Over
		function gameOver() {
			
			console.log("game over");
			
			setTimeout(function(){
			
				if(targetsRemaining > 0)
				
					append(ad,"<span>GAME OVER</span>","final-feedback bad");
					
				else
				
					append(ad,"<span>GÖREV<br/>TAMAMLANDI</span>","final-feedback");
								
				setTimeout(function(){
					console.log("exit URL")
				}, 2000)
				
				
			},1500);
					
		}
		
		//Kill Animation
		function killAnimations(){
		
			console.log("stop animations");
			removeClass(shakyHands,'animate-shakyhands');
			removeClass(pulse,'animate-pulse');
		
		}
		
		setTimeout(killAnimations, 28000);
		
		function append(objName,objContent,objClass){
		
			// Grab an element
			var el = objName,
			// Make a new div
			elChild = document.createElement('div');
			elChild.className = objClass;
			
			// Give the new div some content
			elChild.innerHTML = objContent;
			
			// Jug it into the parent element
			el.appendChild(elChild);
		
		}

		function addClass(objId,objClass){objId.classList.add(objClass);}
		
		function removeClass(objId,objClass){objId.classList.remove(objClass);}
		
		function toggleClass(objId,objClass){objId.classList.toggle(objClass);}	

};

window.addEventListener('load', function() {

    var backgroundParallax = document.getElementById('art');

    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', function(eventData) {
            var LR = eventData.gamma;
            var FB = eventData.beta;
            var DIR = eventData.alpha;
            deviceOrientationHandler(LR, FB, DIR);
        }, false);
    }

	
	
    function deviceOrientationHandler(LR, FB, DIR) {


			if(LR < 80 && LR > -80 && FB < 80 && FB > -80) {
				var portraitPosition = "translate3d("+(LR/1)+"px, "+(FB/1)+"px, 0)";
	
	            backgroundParallax.style.webkitTransform = portraitPosition;
	            backgroundParallax.style.MozTransform = portraitPosition;
	            backgroundParallax.style.msTransform = portraitPosition;
	            backgroundParallax.style.OTransform = portraitPosition;
	            backgroundParallax.style.transform = portraitPosition;
				
			}
			
    }

    // low end device

    if (navigator.userAgent.match(/GT-S/i)) {

        if (navigator.userAgent.match(/Chrome/i)) {
        
            if (window.DeviceMotionEvent != undefined) {
            
                window.ondevicemotion = function(e) {
                        // porttrait

                        var x = e.accelerationIncludingGravity.x * -3;
                        var y = e.accelerationIncludingGravity.y * 3;        
                        var translate = "translate3d("+x+"px,"+y+"px,0)";
                        
                        backgroundParallax.style.webkitTransform = translate;
                        backgroundParallax.style.MozTransform = translate;
                        backgroundParallax.style.msTransform = translate;
                        backgroundParallax.style.OTransform = translate;
                        backgroundParallax.style.transform = translate;
                    
                }
                
            }
            
        }

    }

});