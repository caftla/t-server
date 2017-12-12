window.onload = function(){
	
	var container = document.getElementById("container"),
		   goalie = document.getElementById("goalie"),
		   player = document.getElementById("player"),
		    power = document.getElementById("power"),
		     bars = power.getElementsByTagName("li"),
		    arrow = document.getElementById("arrow"),
		  trigger = document.getElementById("trigger"),
		     main = document.getElementById("main"),
	         goal = document.getElementById("goal"),
	       caught = document.getElementById("catch"),
	      blocker = document.getElementById("blocker"),
	   confirmBtn = document.getElementById("confirmBtn"),
	 subscribeBtn = document.getElementById("subscribeBtn"),
	        score = document.getElementById("score"),
	         miss = document.getElementById("miss"),
	         msg = document.getElementById("msg");
	
	var gameStart = true,
		     kick = false,
		  initial = false,
		   google = false,
	   prevention = false;
	
	var      i = 0,	
	  	   tap = 0,
	  tapCount = 1,
	   checker = 0,
	    points = 0,
	   blocked = 0;
	
	if(gameStart){
	
		removeClass(container,'preload');
		removeClass(blocker,'active');
		
		var powerBar = setInterval(powerUp, 200);
		
		trigger.addEventListener('click', kickBall);
		confirmBtn.addEventListener('click', function(){
			
			kickBall();
			
		});
		
		subscribeBtn.addEventListener('click', function(){
			
				kickBall();
				
				setTimeout(function(){		
					addClass(subscribeBtn,"vanish");
					addClass(confirmBtn,"active");
				},10);
		
		});
			
	}
	
	if(google){
	
		setTimeout(function(){
		
			gameStart = false;
			prevention = true;
			addClass(msg,"active");
			clearInterval(powerBar);
			addClass(trigger,"vanish");
			addClass(container,"stop-all-animations");
		
		}, 27000);
	
	}
	
	function powerUp(){
	
		if(!kick){
		
		i ++;
		
			if(i != 6){
				
				document.getElementById('color'+i).classList.add('active');	
				
			}else{
				
				i=0;
				
				var j;
				
				for (j = 0; j < bars.length; j++) { 
					
					bars[j].classList.remove('active');
					
				}
		
			}
		
		}
	
	}
	
	function kickBall(){
		
		checker ++;
		
		if(checker == 1){
		
			tap++;
			
			if(tap === tapCount){
			
				setTimeout(function(){
				
					addClass(trigger,"vanish");
					addClass(msg,"active");
				
				},10);
				
			}
				
				kick = true;
				
				if(prevention){
					
					initial = false;
					
				}else{

					initial = true;
				
				}
				
				removeClass(goalie,"active");
		
				
				if(initial){
				
						var el = document.getElementById("arrow");
						var st = window.getComputedStyle(el, null);
						var tr = st.getPropertyValue("-webkit-transform") ||
						     st.getPropertyValue("-moz-transform") ||
						     st.getPropertyValue("-ms-transform") ||
						     st.getPropertyValue("-o-transform") ||
						     st.getPropertyValue("transform") ||
						     "fail...";
						
						var values = tr.split('(')[1];			
						values = values.split(')')[0]
						values = values.split(',');

						var a = values[0];
						var b = values[1];
						var c = values[2];
						var d = values[3];

						
						var scale = Math.sqrt(a*a + b*b);
						
						
						var sin = b/scale;
						var angle = Math.round(Math.asin(sin) * (180/Math.PI));
						
						
						if(angle < 1){
							
								addClass(player,'kickLeft');
								playerNumber = 1;
								
							
						}else if(angle > 1){
								addClass(player,'kickRight');
								playerNumber = 2;
								
								
						}else{
							
							playerNumber = 3;
							addClass(player,'kickLeft');
							
						}
						
						removeClass(arrow,'play');
						removeClass(beam,'pulse');
						
						arrow.style.webkitTransform = "rotate("+angle*2+"deg)";
						
						ball.style.top = "90px";
						ball.style.webkitTransform = "scale(0.65)";
						
						var goalieRandom = Math.floor(Math.random() * 3) + 1;
						
						if(playerNumber === goalieRandom){
						
							if(goalieRandom === 1){
								
								addClass(goalie,'guardLeft');
								goalie.style.left = "-60px";
								gotcha();
								
							}else if(goalieRandom === 2){
								
								addClass(goalie,'guardRight');
								goalie.style.left = "80px";
								gotcha();
								
							}else if(goalieRandom === 3){
								
								addClass(goalie,'guardReset');
								ball.style.top = "110px";
								gotcha();
								
							}else{
								ball.style.top = "140px";
								scored();
							}
							
						}else{
						
							scored();
																	
							if(!player.classList.contains('kickLeft') && !player.classList.contains('kickRight')){
								
								addClass(player,'kickLeft');
								ball.style.top = "140px";
								
								
							}else{
							
								ball.style.top = "140px";
							
							}
						
						}
						
						if(i > 3 || i == 5){
							
							ball.style.WebkitTransition = "150ms ease-in-out";
							
							if(player.classList.contains('kickLeft') == true){
							
								ball.style.left = "77px";
							
							}else{
							
								ball.style.left = "217px";
							
							}
							
							}else if(i == 3 || i== 2){
							
								ball.style.WebkitTransition = "200ms ease-in-out";
							
							if(player.classList.contains('kickLeft') == true){
								
								ball.style.left = "77px";
							
							}else{
							
								ball.style.left = "217px";
							
							}
							
							}else{
							
								ball.style.WebkitTransition = "300ms ease-in-out";
							
							if(player.classList.contains('kickLeft') == true){
							
								ball.style.left = "77px";
							
							}else{
							
								ball.style.left = "217px";
							
							}
							
						}		
							
						
				}
					
				setTimeout(function(){
				
					kick = false;
					initial = false;
					
					checker = 0;
					
					titleReset();
					
					addClass(goalie,"active");
					
					goalie.style.left = "";
					
					ball.style.top = "260px";
					ball.style.left = "137px";
					ball.style.webkitTransform = "scale(1)";
					
					addClass(arrow,'stopped');
					addClass(beam,'pulse');
					removeClass(player,'kickLeft');
					removeClass(player,'kickRight');
					
					removeClass(goalie,'guardLeft');
					removeClass(goalie,'guardRight');
					removeClass(goalie,'guardReset');
					
					setTimeout(function(){
					
						removeClass(arrow,'stopped');
						removeClass(goalie,'guardReset');
						addClass(arrow,'play');
					
					
					}, 100);
					
				
				},2000);

		
		}else{
			
			console.log('exceed click!');
			
		}
		
		
	}
	
	function titleReset(){
		addClass(main,"active");
		removeClass(caught,"active");
		removeClass(goal,"active");
	}
	
	function scored(){
		
		addClass(goal,"active");
		removeClass(caught,"active");
		removeClass(main,"active");
		
		points = points + 1;
		score.innerHTML = points;
		
	}
	
	function gotcha(){
		addClass(caught,"active");
		removeClass(goal,"active");
		removeClass(main,"active");
		
		blocked = blocked + 1;
		miss.innerHTML = blocked;
	}
	
	function addClass(objId,objClass){objId.classList.add(objClass);}
	
	function removeClass(objId,objClass){objId.classList.remove(objClass);}
	
	function toggleClass(objId,objClass){objId.classList.toggle(objClass);}	

}