var loopdebug = 0;
var loopdebug2 = 0;

var canvas;
var gl;
var colorLoc;
var modelViewLoc;
var projectionLoc;
var diceHeight = 0.4;

var vertices = [];
var colors = [];
var indices = [];
var theta = [];
var angles  = [];
var c = [];
var s = [];

// dice object - keeps track of meta info about dice
// more info stored, but not initialized here
// dice default position: <4 or 6>, boardHeight + diceHeight = 2.4, 5
var dice = {
	active: false,	//are dice rolling?
	rolled: [6 , 6], //rolled value
	aniLength: 2000,
	animate: {
		times: [0, 500, 1000, 1250, 1500, 1750, 2000],
		x: [
			{v: 0, r: 0}, //v = value (position), r = total # of rotations
			{v: 2, r: 0.75},
			{v: 3, r: 1.5},
			{v: 4, r: 1.5},
			{v: 5, r: 2.5},
			{v: 4.5, r: 2.75},
			{v: 4, r: 3}
		],
		y: [
			{v: 7.2, r: 0}, 
			{v: 4.2, r: 0.75},
			{v: 2.4, r: 1.5},
			{v: 4.2, r: 1.0},
			{v: 2.4, r: 0.5},
			{v: 3.7, r: 0.75},
			{v: 2.4, r: 1}
		],
		z: [
			{v: 3, r: 0}, 
			{v: 4, r: 0.5},
			{v: 5, r: 1},
			{v: 5.5, r: -0.25},
			{v: 6, r: -0.5},
			{v: 5.5, r: 0.25},
			{v: 5, r: 1}
		],
	},
	animate2: {
		times: [0, 500, 1000, 1500, 1750, 2000],
		x: [
			{v: 0, r: 0}, //v = value (position), r = total # of rotations
			{v: 2, r: 0.75},
			{v: 4, r: 1.5},
			{v: 5, r: 2.5},
			{v: 5.5, r: 2.75},
			{v: 6, r: 3}
		],
		y: [
			{v: 6.4, r: 0}, 
			{v: 8.4, r: 1},
			{v: 6.4, r: 2},
			{v: 2.4, r: 3},
			{v: 3.4, r: 2.5},
			{v: 2.4, r: 2}
		],
		z: [
			{v: 6, r: 0}, 
			{v: 5.5, r: 1},
			{v: 5, r: 2},
			{v: 4.5, r: 3},
			{v: 4.75, r: 2.5},
			{v: 5, r: 2}
		],
	},
	getFrame: function(time, animate) {
			let i;
			for (i = 0; i < animate.times.length; i++) {
				if (animate.times[i] > time)
					break;
			} 
			if (i == animate.times.length) i--;
			//times[i] is to next frame, times[i-1] is what we are coming from
			let xv1 = animate.x[i-1].v, xr1 = animate.x[i-1].r, 
				yv1 = animate.y[i-1].v, yr1 = animate.y[i-1].r, 
				zv1 = animate.z[i-1].v, zr1 = animate.z[i-1].r,
				xv2 = animate.x[i].v, xr2 = animate.x[i].r, 
				yv2 = animate.y[i].v, yr2 = animate.y[i].r, 
				zv2 = animate.z[i].v, zr2 = animate.z[i].r,
				tRatio = (time - animate.times[i-1]) / (animate.times[i] - animate.times[i-1]);

			return {
				xv: xv1 + (tRatio * (xv2 - xv1)),
				xr: xr1 + (tRatio * (xr2 - xr1)),
				yv: yv1 + (tRatio * (yv2 - yv1)),
				yr: yr1 + (tRatio * (yr2 - yr1)),
				zv: zv1 + (tRatio * (zv2 - zv1)),
				zr: zr1 + (tRatio * (zr2 - zr1))
			}				
		}
}

// base vertecies for dice (untransformed)
var dice_init = [
	[-diceHeight, -diceHeight, diceHeight, 1.0],
	[-diceHeight, diceHeight, diceHeight, 1.0],
	[diceHeight, diceHeight, diceHeight, 1.0],
	[diceHeight, -diceHeight, diceHeight, 1.0],
	[-diceHeight, -diceHeight, -diceHeight, 1.0],
	[-diceHeight, diceHeight, -diceHeight, 1.0],
	[diceHeight, diceHeight, -diceHeight, 1.0],
	[diceHeight, -diceHeight, -diceHeight, 1.0]
];

var boardHeight = 2;
var boardSideLength  = 10;

var boardHeight2 = boardHeight / 2.0;
var boardSideLength2 = boardSideLength / 2.0;
var windowMin = -boardSideLength2;
var windowMax = boardSideLength + boardSideLength2;

var xAxis = 0;
var yAxis = 1;
var zAxis = 2;
var axis = 0;

var projection;
var modelView;
var aspect;

//design basic piece
var piece = [];
var pieceSides = 20;
var pieceHeight = 0.5;
var pieceRadius = 0.35;
var pieceWidth = pieceRadius*2;
piece.push(vec4(0,pieceHeight,0,1));
piece = piece.concat(drawShape3D(0, pieceHeight, 0, pieceRadius, pieceSides, 2*Math.PI, 0));
piece.push(vec4(0,0,0,1));
piece = piece.concat(drawShape3D(0, 0, 0, pieceRadius, pieceSides, 2*Math.PI, 0));

var hoverSpace = 2;
var selectedSpace = null;

var gameBoard = [];

let triangleWidth = boardSideLength/14;
let triangleHeight = triangleWidth*5;
let triangleZ = boardHeight + 0.01;

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    initializeBoard();

	// Load vertices and colors for board faces
	
	vertices = [
	   vec4(0, 0, boardSideLength, 1.0),
	   vec4(0.0, boardHeight, boardSideLength, 1.0),
	   vec4(boardSideLength, boardHeight, boardSideLength, 1.0),
	   vec4(boardSideLength, 0.0, boardSideLength, 1.0),
	   vec4(0.0, 0.0, 0.0, 1.0),
	   vec4(0.0, boardHeight, 0.0, 1.0),
	   vec4(boardSideLength, boardHeight, 0.0, 1.0),
	   vec4(boardSideLength, 0.0, 0.0, 1.0)
	];

	//Add vertices for top triangles
	vertices.push(vec4(triangleWidth,triangleZ,triangleWidth,1.0));
	for(let i = 0; i<12; i++){
		vertices.push(vec4((i+2)*triangleWidth,triangleZ,triangleWidth,1.0));
		vertices.push(vec4((i+1.5)*triangleWidth,triangleZ,triangleWidth + triangleHeight,1.0));
	}

	//Add vertices for bottom triangles
	vertices.push(vec4(triangleWidth,triangleZ,boardSideLength - triangleWidth,1.0));
	for(let i = 0; i<12; i++){
		vertices.push(vec4((i+2)*triangleWidth,triangleZ,boardSideLength - triangleWidth,1.0));
		vertices.push(vec4((i+1.5)*triangleWidth,triangleZ,boardSideLength - (triangleWidth + triangleHeight),1.0));
	}

	let backgroundZ = boardHeight + 0.005;

	//Add vertices for game board background
	vertices.push(vec4(triangleWidth,backgroundZ,triangleWidth,1.0));
	vertices.push(vec4(boardSideLength - triangleWidth,backgroundZ,triangleWidth,1.0));
	vertices.push(vec4(triangleWidth,backgroundZ,boardSideLength - triangleWidth,1.0));
	vertices.push(vec4(boardSideLength - triangleWidth,backgroundZ,boardSideLength - triangleWidth,1.0));

	//This is where dice vertices will go
	dice.vPos = vertices.length;

	//Set colors
	colors = [
	 	colorVecFromRGB(205,133,63), // brown
	 	vec4(1.0, 1.0, 1.0, 1.0),  // white
	 	vec4(0.0, 0.0, 0.0, 1.0),  // black
	    vec4(1.0, 0.0, 0.0, 1.0),  // red
	    vec4(1.0, 1.0, 0.0, 1.0), // yellow
	    vec4(0.0, 1.0, 0.0, 1.0), // green
	 	vec4(0.9, 0.9, 0.9, 0.9)  // off-white
	];

	// Load indices to represent the triangles that will draw each face
	
	indices = [
	   1, 0, 3, 3, 2, 1,  // front face
	   2, 3, 7, 7, 6, 2,  // right face
	   3, 0, 4, 4, 7, 3,  // bottom face
	   6, 5, 1, 1, 2, 6,  // top face
	   4, 5, 6, 6, 7, 4,  // back face
	   5, 4, 0, 0, 1, 5   // left face
	];

	//Add indexes for top triangles
	for(let i = 0; i<12; i++){
		indices.push(7+(i+1)*2);
		if(i===0){
			indices.push(8);
		} else {
			indices.push(7+i*2)
		}
		indices.push(8+(i+1)*2);
	}

	//Add indexes for bottom triangles
	for(let i = 0; i<12; i++){
		if(i===0){
			indices.push(33);
		} else {
			indices.push(32+i*2)
		}
		indices.push(32+(i+1)*2);
		indices.push(33+(i+1)*2);
	}

	//Add indexes for game board background
	indices.push(58);
	indices.push(60);
	indices.push(59);
	indices.push(60);
	indices.push(61);
	indices.push(59);

	// Dice indicies. 
	//First elems of indices describe a cube, so we're just going to copy those and offset them
	for (i = 0; i < 36; i++) //dice1
		indices.push(dice.vPos + indices[i]);
	for (i = 0; i < 36; i++) //dice2
		indices.push(8  + dice.vPos + indices[i]);

	// Pieces indicies 
	let base, base2, // base = start of piece, base2 = start of piece bottom
		piece_vcount = 2 + (2 * pieceSides);
	for (let i = 0; i < 30; i++) { // index 30 pieces
		base = (dice.vPos + 16) + (i * piece_vcount);
		base2 = base + pieceSides + 1;
		console.log("Base: ", base, "\tBase2: ", base2);
		for (let j = 1; j < pieceSides; j++) {
			//top triangle
			indices.push(base);
			indices.push(base + j);
			indices.push(base + j + 1);
			console.log("TOP: (", base, ',', base + j, ',', base + j + 1, ")");
			//bottom triangle
			indices.push(base2);
			indices.push(base2 + j);
			indices.push(base2 + j + 1);
			console.log("BOT: (", base2, ',', base2 + j, ',', base2 + j + 1, ")");
			//side rectangle (2x triangles)
			indices.push(base + j);
			indices.push(base + j + 1);
			indices.push(base2 + j);

			indices.push(base + j + 1);
			indices.push(base2 + j);
			indices.push(base2 + j + 1);
			console.log("SIDE: (", base + j, ',', base + j + 1, ',', base2 + j, ") (", base + j + 1, ',', base2 + j, ',', base2 + j + 1, ')');
		}
	}

	console.log(indices);

	// Set pieces indicies
	
	var input = document.getElementById("horizontalSlider");
	var input1 = document.getElementById("verticalSlider");

	theta[0] = (360)*(input.value/1000);
	theta[1] = 0;
	theta[2] = (360)*(input1.value/1000);
	
    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
	aspect = canvas.width / canvas.height;
    gl.clearColor( 0.7, 0.7, 0.7, 1.0 );
	gl.enable(gl.DEPTH_TEST);
	// projection = ortho (windowMin, windowMax, windowMin, windowMax, windowMin, windowMax+boardSideLength);
	// Register event listeners for the buttons
	
	//
	// Set event listeners
	//
	document.getElementById("Roll")
		.addEventListener("click", function() {
			dice.active = true;
			dice.startTime = c_time();
			dice.rolled = [
				Math.floor((Math.random() * 6) + 1),
				Math.floor((Math.random() * 6) + 1)
			];
		});

	document.getElementById("Player1View")
		.addEventListener("click", function() {
			theta[0] = (360)*(100/1000);
			theta[2] = (360)*(0/1000);
			input.value = 100;
			input1.value = 0;
		});

	document.getElementById("Player2View")
		.addEventListener("click", function() {
			theta[0] = (360)*(400/1000);
			theta[2] = (360)*(500/1000);
			input.value = 400;
			input1.value = 500;
		});

	// Set up slider key listenters
	input.addEventListener("input", function() {
			theta[0] = (360)*(input.value/1000);
		});
	input1.addEventListener("input", function() {
			theta[2] = (360)*(input1.value/1000);
		});

	// Set up key listener
	window.onkeyup = function(e) {
	   var keyCode = e.keyCode ? e.keyCode : e.which;
	   if (keyCode === 37) { //left
	   		if(hoverSpace !== 0 &&
	   			(selectedSpace === null  || (selectedSpace - hoverSpace) < 6
	   			|| ((selectedSpace === 27) && (selectedSpace - hoverSpace) < 7))){
	   			hoverSpace--;
	   		}
	   } else if (keyCode === 39) { //right
	   	console.log(hoverSpace - selectedSpace);
	   		if(hoverSpace !== 27 &&
	   			(selectedSpace === null  || (hoverSpace - selectedSpace) < 6
	   			|| ((selectedSpace === 0) && (hoverSpace - selectedSpace) < 7))){
	   			hoverSpace++;
	   		}
	   } else if (keyCode === 13) { //enter
	   		if(selectedSpace === null){
	   			selectedSpace = hoverSpace;
	   		} else {
	   			if(gameBoard[selectedSpace] === undefined  || selectedSpace === 1 || selectedSpace === 26){
	   				//do nothing
	   			} else if(hoverSpace === 0 || hoverSpace === 27){
	   				//error
	   			} else if (gameBoard[hoverSpace] === undefined){
	   				gameBoard[hoverSpace] = {black:gameBoard[selectedSpace].black,amount:1};
	   				if(gameBoard[selectedSpace] === 1){
	   					gameBoard[selectedSpace] = undefined;
	   				} else {
	   					gameBoard[selectedSpace].amount = gameBoard[selectedSpace].amount - 1;
	   				}
	   			} else {
	   				if(gameBoard[hoverSpace].black === gameBoard[selectedSpace].black){
	   					gameBoard[hoverSpace].amount = gameBoard[hoverSpace].amount + 1;
	   					if(gameBoard[selectedSpace] === 1){
	   						gameBoard[selectedSpace] = undefined;
	   					} else {
	   						gameBoard[selectedSpace].amount = gameBoard[selectedSpace].amount - 1;
	   					}
	   				} else {
	   					if(gameBoard[hoverSpace].amount === 1){
	   						let barIndex = 27;
	   						if(gameBoard[hoverSpace].black){
	   							barIndex = 0;
	   						}
	   						if(gameBoard[barIndex] === undefined){
	   							gameBoard[barIndex] = {black:gameBoard[hoverSpace].black,amount:1};
	   						} else {
	   							gameBoard[barIndex].amount = gameBoard[barIndex].amount + 1;
	   						}
	   						gameBoard[hoverSpace] = {black:gameBoard[selectedSpace].black,amount:1};
	   						if(gameBoard[selectedSpace] === 1){
	   							gameBoard[selectedSpace] = undefined;
	   						} else {
	   							gameBoard[selectedSpace].amount = gameBoard[selectedSpace].amount - 1;
	   						}
	   					} else {
	   						//error
	   					}
	   				}
	   			}
	   			selectedSpace = null;
	   		}
	   }
	}

    //  Load shaders and initialize attribute buffers
    
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
	colorLoc = gl.getUniformLocation (program, "color");
	modelViewLoc = gl.getUniformLocation (program, "modelView");
	projectionLoc  = gl.getUniformLocation (program, "projection");
	
    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(getVertices()), gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
	
	var iBuffer = gl.createBuffer();
	gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, iBuffer);
	gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
	
    render();
};

function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	//update dice if we need to - seperate function becuase theres a lot to do
	if (dice.active)
		rollDiceTick();

	//update buffers
    gl.bufferData( gl.ARRAY_BUFFER, flatten(getVertices()), gl.STATIC_DRAW );
	
	for (i=0; i<3; i++) {
		angles[i] = radians(theta[i]);
		c[i] = Math.cos(angles[i]);
		s[i] = Math.sin(angles[i]);
	}
	
	rx = mat4 (1.0, 0.0, 0.0, 0.0,
	           0.0, c[0], -s[0], 0.0,
			   0.0, s[0], c[0], 0.0,
			   0.0, 0.0, 0.0, 1.0);
				   
	ry = mat4 (c[1], 0.0, s[1], 0.0,
			   0.0, 1.0, 0.0, 0.0,
			   -s[1], 0.0, c[1], 0.0,
			   0.0, 0.0, 0.0, 1.0);
	
	rz = mat4 (c[2], -s[2], 0.0, 0.0,
			   s[2], c[2], 0.0, 0.0,
			   0.0, 0.0, 1.0, 0.0,
			   0.0, 0.0, 0.0, 1.0);
	
	tz1 = mat4 (1.0, 0.0, 0.0, -boardSideLength2,
			   0.0, 1.0, 0.0, -boardHeight2,
			   0.0, 0.0, 1.0, -boardSideLength2,
			   0.0, 0.0, 0.0, 1.0);
			   
	tz2 = mat4 (1.0, 0.0, 0.0, boardSideLength2,
			   0.0, 1.0, 0.0, boardHeight2,
			   0.0, 0.0, 1.0, boardSideLength2,
			   0.0, 0.0, 0.0, 1.0);
	
	looking = lookAt (vec3(boardSideLength2,boardHeight2,4*boardSideLength), vec3(boardSideLength2,boardHeight2,0), vec3(0.0, 1.0, 0.0));
	projection = perspective (45.0, aspect, 1, 10*boardSideLength);
	rotation = mult (rz, mult(ry, rx));
	modelView = mult(looking, mult(tz2, mult (rotation, tz1)));
	gl.uniformMatrix4fv (modelViewLoc, false, flatten(modelView));
	gl.uniformMatrix4fv (projectionLoc, false, flatten(projection));

	//Draw board
	let currentBufferIndex = 0;
	let tempBufferIndex = 0;
	gl.uniform4fv (colorLoc, colors[0]);
	gl.drawElements( gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
	currentBufferIndex = 36*2;

	// Draw Triangles
	for (let i =0; i<24; i++){
		if((i/12) < 1){
			if(i === selectedSpace - 2){
				gl.uniform4fv (colorLoc, colors[5]);
			} else if (i === hoverSpace - 2){
				gl.uniform4fv (colorLoc, colors[4]);
			} else {
				gl.uniform4fv (colorLoc, colors[(i%2) + 2]);
			}
		} else {
			if(i ===  37 - selectedSpace){
				gl.uniform4fv (colorLoc, colors[5]);
			} else if (i === 37 - hoverSpace){
				gl.uniform4fv (colorLoc, colors[4]);
			} else {
				gl.uniform4fv (colorLoc, colors[3 -(i%2)]);
			}
		}
		gl.drawElements( gl.TRIANGLES, 3, gl.UNSIGNED_SHORT, currentBufferIndex + 6*i );
		tempBufferIndex += 6;
	}
	currentBufferIndex += tempBufferIndex;
	tempBufferIndex = 0;

	//Draw background
	gl.uniform4fv (colorLoc, colors[1]);
	gl.drawElements( gl.TRIANGLES, 3, gl.UNSIGNED_SHORT, currentBufferIndex);
	currentBufferIndex += 6;
	gl.drawElements( gl.TRIANGLES, 3, gl.UNSIGNED_SHORT, currentBufferIndex);
	currentBufferIndex += 6;

	//Draw dice
	gl.uniform4fv(colorLoc, colors[5]);
	gl.drawElements( gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, currentBufferIndex); //dice1
	currentBufferIndex += 36*2;
	gl.drawElements( gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, currentBufferIndex); //dice2
	currentBufferIndex += 36*2;

	//Draw black pieces
	
	gl.uniform4fv (colorLoc, colors[2]);
	for (let j = 0; j < ( 15 * ((pieceSides - 1) * 4)); j++) {
		gl.drawElements( gl.TRIANGLES, 3, gl.UNSIGNED_SHORT, currentBufferIndex);
		currentBufferIndex += 6;
	}

	//Draw red pieces

	gl.uniform4fv (colorLoc, colors[3]);
	for (let j = 0; j < ( 15 * ((pieceSides - 1) * 4)); j++) {
		gl.drawElements( gl.TRIANGLES, 3, gl.UNSIGNED_SHORT, currentBufferIndex);
		currentBufferIndex += 6;
	}

	requestAnimFrame(render);
};

function colorVecFromRGB(red, green, blue){
	return vec4(red/255,green/255,blue/255);
}

function drawShape3D(x, y, z, length, sides, fullAngle, startAngle) {
    let shape = [];
    let disp = fullAngle / sides;
    for(let i = 0; i < sides; i++){
        shape.push(vec4(x + Math.cos(startAngle+disp*i)*length, y, z + Math.sin(startAngle+disp*i)*length, 1.0));
    }
    return shape;
}


//Notes on gameBoard
//gameBoard[0] is black's bar space
//gameBoard[1] is white's home space
//gameBoard[26] is black's home space
//gameBoard[27] is white's bar space
function initializeBoard() {
	gameBoard = [];
	gameBoard[2]  = {black:false,amount:2};
	gameBoard[7]  = {black:true,amount:5};
	gameBoard[9]  = {black:true,amount:3};
	gameBoard[13] = {black:false,amount:5};
	gameBoard[14] = {black:true,amount:5};
	gameBoard[18] = {black:false,amount:3};
	gameBoard[20] = {black:false,amount:5};
	gameBoard[25] = {black:true,amount:2};
}


// Does one animation tick for the dice roll animation. Only called if dice are actively rolling
function rollDiceTick() {
	console.log("Dice roll tick");
	//do animation stuff
	dice.lastTime = c_time();
	dice.active = (dice.aniLength > (dice.lastTime - dice.startTime));
}

// Shorthand to get time as milliseconds since last epoch
function c_time() {
	return (new Date().getTime());
}

// Dices + Pieces stuff -> how we get the verticies in the right place without changing indexes

// Vertices + Dice vertices
function getVertices() {
	let dice1 = dice_init.slice(), dice2 = dice_init.slice();
	//if no start time -> not been rolled yet. put in a default position
	if ( !(dice.startTime) || !dice.active) {
		return vertices
			.concat( translateObject(dice1, 4, boardHeight + diceHeight, 5) )
			.concat( translateObject(dice2, 6, boardHeight + diceHeight, 5) )
			.concat( getBlackPieces() )
			.concat( getRedPieces() );
	}
	else {
		let time = dice.lastTime - dice.startTime;
		let f1 = dice.getFrame(time, dice.animate),
			f2 = dice.getFrame(time, dice.animate2);

		calculateDice(dice1, f1)
		calculateDice(dice2, f2)

		return vertices
			.concat( dice1 )
			.concat( dice2 )
			.concat( getBlackPieces() )
			.concat( getRedPieces() );
	}

	//gets verticies of all black pieces
	function getBlackPieces() {
		let pieces = [];
		for (let i = 0; i < 28; i++) {
			if(gameBoard[i] !== undefined && gameBoard[i].black){
				for(let j = 0; j < gameBoard[i].amount; j++){
					if(i === 0){
						pieces = pieces.concat(
							translateObject(piece.slice(), 7.5*triangleWidth, boardHeight+j*pieceHeight, 0.5*pieceWidth)
						);
					} else if(i < 14){
						pieces = pieces.concat(
							translateObject(piece.slice(), (i-0.5)*triangleWidth, boardHeight+Math.floor(j/5)*pieceHeight, triangleWidth + ((j%5)+0.5)*pieceWidth)
						);
					} else {
						pieces = pieces.concat(
							translateObject(piece.slice(), ((26-i) + 0.5)*triangleWidth, boardHeight+Math.floor(j/5)*pieceHeight, boardSideLength - (triangleWidth + ((j%5)+0.5)*pieceWidth))
						);
					}
				}
			}
		}
		return pieces;
	}

	function getRedPieces() {
		let pieces = [];
		for (let i = 0; i < 28; i++) {
			if(gameBoard[i] !== undefined && !gameBoard[i].black){
				for(let j = 0; j < gameBoard[i].amount; j++){
					if(i === 27){
						pieces = pieces.concat(
							translateObject(piece.slice(), 7.5*triangleWidth, boardHeight+j*pieceHeight, boardSideLength - 0.5*pieceWidth)
						);
					} else if(i < 14){
						pieces = pieces.concat(
							translateObject(piece.slice(), (i-0.5)*triangleWidth, boardHeight+Math.floor(j/5)*pieceHeight, triangleWidth + ((j%5)+0.5)*pieceWidth)
						);
					} else {
						pieces = pieces.concat(
							translateObject(piece.slice(), ((26-i) + 0.5)*triangleWidth, boardHeight+Math.floor(j/5)*pieceHeight, boardSideLength - (triangleWidth + ((j%5)+0.5)*pieceWidth))
						);
					}
				}
			}
		}
		return pieces;
	}

	//rotate and translate dice based on frame spec
	function calculateDice(d, frame) {
		rotateObjectX(d, frame.xr);
		rotateObjectY(d, frame.yr);
		rotateObjectZ(d, frame.zr);
		translateObject(d, frame.xv, frame.yv, frame.zv);
		//console.log("Frame: ", JSON.stringify(frame));
	}

	// Here are some functions to do translation / rotation since I don't want to use a matrix library and it's easier to just write these based on a matrix than use an actual m4 device

	// Translates a dice
	function translateObject(d, x, y, z) {
		for (i = 0; i < d.length; i++) {	
			d[i] = vec4(d[i][0] + x, d[i][1] + y, d[i][2] + z, d[i][3]);
		}
		//if (loopdebug++ < 5) console.log("Dice:", JSON.stringify(d), "(x,y,z): ", x, y, z);
		return d;
	}

	// Rotates t times around x-axis
	function rotateObjectX(d, t) {
		let r = (2 * t) * Math.PI;
		let c = Math.cos(r), s = Math.sin(r);
		for (i = 0; i < d.length; i++) {
			d[i] = [
				d[i][0],
				(d[i][1]*c) + (d[i][2]*s),
				(d[i][1]*-s) + (d[i][2]*c),
				d[i][3]
			];
		}
		return d;
	}

	// Rotates t times around y-axis
	function rotateObjectY(d, t) {
		let r = (2 * t) * Math.PI;
		let c = Math.cos(r), s = Math.sin(r);
		for (i = 0; i < d.length; i++) {
			d[i] = [
				(d[i][0]*c) + (d[i][2]*-s),
				d[i][1],
				(d[i][0]*s) + (d[i][2]*c),
				d[i][3]
			];
		}
		return d;
	}

	// Rotates t times around z-axis
	function rotateObjectZ(d, t) {
		let r = (2 * t) * Math.PI;
		let c = Math.cos(r), s = Math.sin(r);
		for (i = 0; i < d.length; i++) {
			d[i] = [
				(d[i][0]*c) + (d[i][1]*-s),
				(d[i][0]*s) + (d[i][1]*c),
				d[i][2],
				d[i][3]
			];
		}
		return d;
	}
}