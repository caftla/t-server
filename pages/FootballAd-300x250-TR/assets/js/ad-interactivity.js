window.onload = function (event){

	var
		i = 0,
		ii = 0,
		points = 0,
		blocked = 0,
		checker = 0,
		chances = 0,
		//Settings allowed click:
		allowed = 2,
		balls = 4,

		kick = false,

		trigger = document.getElementById("banner"),
		arrow = document.getElementById("arrow"),
		beam = document.getElementById("beam"),
		goalie = document.getElementById("goalie"),
		power = document.getElementById("power"),
		bars = power.getElementsByTagName("li"),
		score = document.getElementById("score"),
		miss = document.getElementById("miss"),
		title = document.getElementById("title"),
		goal = document.getElementById("goal"),
		caught = document.getElementById("catch"),

		powerBar = setInterval(powerUp, 200);

		trigger.addEventListener('click',function(){

			if(chances === allowed){

					kickBall();

					setTimeout(function(){

						//Add script here for redirection...

						console.log("Process banner redirection...");

						points = 0;
						blocked = 0;
						checker = 0;
						chances = 0;
						balls = 4;

						document.getElementById("ball1").style.display="inline-block";
						document.getElementById("ball2").style.display="inline-block";
						document.getElementById("ball3").style.display="inline-block";

						score.innerHTML = points;
						miss.innerHTML = blocked;

					},1200);


			}else{

				kickBall();

			}

		});

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

					kick = true;

					chances++;

					playerKick();

					balls--;

					document.getElementById("ball"+balls).style.display="none";

					removeClass(goalie,"active");
					removeClass(arrow,'play');
					removeClass(beam,'pulse');

					setTimeout(function(){

						goalie.style.left = "";
						ball.style.top = "190px";
						ball.style.left = "140px";
						ball.style.webkitTransform = "scale(1)";

						kick = false;

						checker = 0;

						titleReset();

						addClass(arrow,'play');
						addClass(beam,'pulse');
						addClass(goalie,"active");
						removeClass(player,'kickLeft');
						removeClass(player,'kickRight');
						removeClass(goalie,'guardLeft');
						removeClass(goalie,'guardRight');
						removeClass(goalie,'guardReset');

					},2000);

				}else{

					console.log("Tap Exceeded!");

				}

		}

		function playerKick(){

			var arrowDeg,
				playerRandom = Math.floor(Math.random() * 3) + 1,
				goalieRandom = Math.floor(Math.random() * 3) + 1;

			if(playerRandom == 1){

				arrowDeg = 10;
				playerNumber = 1;
				addClass(player,'kickLeft');

			}else if(playerRandom == 2){

				arrowDeg = 0;
				playerNumber = 2;
				addClass(player,'kickRight');

			}else{

				arrowDeg = -10;
				playerNumber = 3;
				addClass(player,'kickLeft');

			}

			ball.style.top = "50px";
			ball.style.webkitTransform = "scale(0.50)";

			arrow.style.webkitTransform = "rotate("+arrowDeg+"deg)";

			if(playerNumber === goalieRandom){

					if(goalieRandom == 1){

						gotcha();
						ball.style.top = 45 + "px";
						ball.style.left = 90 + "px";
						goalie.style.left = -60 + "px";
						addClass(goalie,'guardLeft');

					}else if(goalieRandom == 2){

						gotcha();
						ball.style.top = 65 + "px";
						addClass(goalie,'guardReset');

					}else{

						gotcha();
						ball.style.top = 45 + "px";
						ball.style.left = 200 + "px";
						goalie.style.left = 60 + "px";
						addClass(goalie,'guardRight');

					}

			}else{

				scored();
				ball.style.top = 90 + "px";

			}


			if(i > 3 || i == 5){

				ball.style.WebkitTransition = "150ms ease-in-out";


			}else if(i == 3 || i== 2){

				ball.style.WebkitTransition = "200ms ease-in-out";


			}else{

				ball.style.WebkitTransition = "300ms ease-in-out";

			}

		}

		function titleReset(){
			addClass(title,"active");
			removeClass(caught,"active");
			removeClass(goal,"active");
		}

		function scored(){

			addClass(goal,"active");
			removeClass(caught,"active");
			removeClass(title,"active");

			points = points + 1;
			score.innerHTML = points;

		}

		function gotcha(){

			addClass(caught,"active");
			removeClass(goal,"active");
			removeClass(title,"active");

			blocked = blocked + 1;
			miss.innerHTML = blocked;

		}

		function addClass(objId,objClass){objId.classList.add(objClass);}

		function removeClass(objId,objClass){objId.classList.remove(objClass);}

		function toggleClass(objId,objClass){objId.classList.toggle(objClass);}

};
