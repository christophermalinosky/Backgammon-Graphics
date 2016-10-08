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
var dice = {
	active: false,	//are dice rolling?
	rolled: [6 , 6], //rolled value
	aniLength: 0,
	animate: {

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

var piece = [];
var pieceSides = 20;
piece.push(vec4(0,5,0,1));
piece = piece.concat(drawShape3D(0, 5, 0, 0.5, pieceSides, 2*Math.PI, 0));
piece.push(vec4(0,4.5,0,1));
piece = piece.concat(drawShape3D(0, 4.5, 0, 0.5, pieceSides, 2*Math.PI, 0));

var hoverSpace = 2;
var selectedSpace = null;

var gameBoard = [];

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


	let triangleWidth = boardSideLength/14;
	let triangleHeight = triangleWidth*5;
	let triangleZ = boardHeight + 0.01;

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

	//Add vertices for piece
	vertices = vertices.concat(piece);

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

	//Add indexes for a game piece
	let pieceSize = piece.length;
	let startingIndex = 62;

	//Top
	for(let i = 0; i < pieceSize/2 - 1; i++){
		indices.push(startingIndex);
		indices.push(startingIndex + i + 1);
		if(i === pieceSize/2 - 2){
			indices.push(startingIndex + 1);
		} else {
			indices.push(startingIndex + i + 2);
		}
	}

	//Sides
	startingIndex += 1;
	for(let i = 0; i < pieceSize/2 - 1; i++){
		indices.push(startingIndex + i);
		indices.push(startingIndex + i + pieceSize/2);
		if(i === pieceSize/2 - 2){
			indices.push(startingIndex + pieceSize/2);
		} else {
			indices.push(startingIndex + i + pieceSize/2 + 1);
		}

		indices.push(startingIndex + i);
		if(i === pieceSize/2 - 2){
			indices.push(startingIndex + pieceSize/2);
			indices.push(startingIndex);
		} else {
			indices.push(startingIndex + i + pieceSize/2 + 1);
			indices.push(startingIndex + i + 1);
		}
	}
	startingIndex -= 1;

	//Bottom
	startingIndex += piece.length/2;
	for(let i = 0; i < pieceSize/2 - 1; i++){
		indices.push(startingIndex);
		if(i === pieceSize/2 - 2){
			indices.push(startingIndex + 1);
		} else {
			indices.push(startingIndex + i + 2);
		}
		indices.push(startingIndex + i + 1);
	}

	// Dice indicies. 
	//First elems of indices describe a cube, so we're just going to copy those and offset them
	for (i = 0; i < 36; i++) //dice1
		indices.push(dice.vPos + indices[i]);
	for (i = 0; i < 36; i++) //dice2
		indices.push(8  + dice.vPos + indices[i]);

	console.log(indices);
	
	theta[0] = 0.0;
	theta[1] = 0.0;
	theta[2] = 0.0;
	
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
	document.getElementById("XButton")
		.addEventListener ("click", function() { 
			axis = xAxis; 
		});
	document.getElementById("YButton")
		.addEventListener ("click", function () { 
			axis = yAxis; 
		});
	document.getElementById("ZButton")
		.addEventListener ("click", function () { 
			axis = zAxis; 
		});
	document.getElementById("Pause")
		.addEventListener ("click", function () { 
			axis = null; 
		});
	document.getElementById("Reset")
		.addEventListener ("click", function () { 
			theta = [0.0, 0.0, 0.0]; axis = xAxis 
		});
	document.getElementById("Roll")
		.addEventListener("click", function() {
			dice.active = true;
			dice.startTime = c_time();
			dice.rolled = [
				Math.floor((Math.random() * 6) + 1),
				Math.floor((Math.random() * 6) + 1)
			];
		});

	// Set up key listener
	window.onkeyup = function(e) {
	   var keyCode = e.keyCode ? e.keyCode : e.which;
	   if (keyCode === 37) { //left
	   		if(hoverSpace !== 0){
	   			hoverSpace--;
	   		}
	   } else if (keyCode === 39) { //right
	       if(hoverSpace !== 25){
	   			hoverSpace++;
	   		}
	   } else if (keyCode === 13) { //enter
	   		if(selectedSpace === null){
	   			selectedSpace = hoverSpace;
	   		} else {
	   			//do a movement
	   			selectedSpace = null;
	   		}
	   }
	   console.log(35-hoverSpace);
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
	gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(indices), gl.STATIC_DRAW);
	
    render();
};

function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //update board position
	theta[axis] += 0.3;

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
	for (var i=0; i<6; i++) {
		gl.uniform4fv (colorLoc, colors[0]);
		gl.drawElements( gl.TRIANGLES, 6, gl.UNSIGNED_BYTE, 6*i );
		tempBufferIndex += 6;
	}
	currentBufferIndex += tempBufferIndex;
	tempBufferIndex = 0;

	//Draw Triangles
	for (var i=0; i<24; i++){
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
		gl.drawElements( gl.TRIANGLES, 3, gl.UNSIGNED_BYTE, currentBufferIndex + 3*i );
		tempBufferIndex += 3;
	}
	currentBufferIndex += tempBufferIndex;
	tempBufferIndex = 0;

	//Draw background
	gl.uniform4fv (colorLoc, colors[1]);
	gl.drawElements( gl.TRIANGLES, 3, gl.UNSIGNED_BYTE, currentBufferIndex);
	currentBufferIndex += 3;
	gl.drawElements( gl.TRIANGLES, 3, gl.UNSIGNED_BYTE, currentBufferIndex);
	currentBufferIndex += 3;

	//Draw piece
	gl.uniform4fv (colorLoc, colors[2]);
	for (let i = 0; i < piece.length*2 - 4; i++){
		gl.drawElements( gl.TRIANGLES, 3, gl.UNSIGNED_BYTE, currentBufferIndex + i*3 );
		tempBufferIndex += 3;
	}
	currentBufferIndex += tempBufferIndex;
	tempBufferIndex = 0;

	if (loopdebug2++ < 3) 
		console.log("Before dice: ", currentBufferIndex, "Need to draw: ", 72, "Index Size: ", indices.length, "B+D=", currentBufferIndex + 72);

	//Draw dice
	gl.uniform4fv(colorLoc, colors[5]);
	gl.drawElements( gl.TRIANGLES, 36, gl.UNSIGNED_BYTE, currentBufferIndex); //dice1
	currentBufferIndex += 36;
	gl.drawElements( gl.TRIANGLES, 36, gl.UNSIGNED_BYTE, currentBufferIndex); //dice2
	currentBufferIndex += 36;

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

//color 0 is black
//color 1 is white
function initializeBoard() {
	gameBoard = [];
	gameBoard[2] = {color:0,amount:2};
	gameBoard[7] = {color:1,amount:5};
	gameBoard[9] = {color:1,amount:3};
	gameBoard[13] = {color:0,amount:5};
	gameBoard[14] = {color:1,amount:5};
	gameBoard[18] = {color:0,amount:3};
	gameBoard[20] = {color:0,amount:5};
	gameBoard[25] = {color:1,amount:2};
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

//////////////// Dice stuff

// Vertices + Dice vertices
function getVertices() {
	let dice1 = dice_init.slice(), dice2 = dice_init.slice();
	//if no start time -> not been rolled yet. put in a default position
	if (!(dice.startTime)) {
		//add dice1
		return vertices
			.concat( translateDice(dice1, 4, boardHeight + (diceHeight / 2), 5) )
			.concat( translateDice(dice2, 6, boardHeight + (diceHeight / 2), 5) );
	}
	else {
		console.log("Compute dice animation frame");
		return vertices;
	}

	// Here are some functions to do translation / rotation since I don't want to use a matrix library and it's easier to just write these based on a matrix than use an actual m4 device

	// Translates a dice
	function translateDice(d, x, y, z) {
		for (i = 0; i < d.length; i++) {	
			d[i] = vec4(d[i][0] + x, d[i][1] + y, d[i][2] + z, d[i][3]);
		}
		if (loopdebug++ < 5)
			console.log("Dice:", JSON.stringify(d), "(x,y,z): ", x, y, z);
		return d;
	}

	// Rotates t times around x-axis
	function rotateDiceX(d, t) {
		let r = (2 * t) * Math.PI;
		let c = Math.cos(), s = Math.sin(r);
		for (i = 0; i < d.length; i++) {
			d[i] = vec4(
				d[i][0],
				(d[i][1]*c) + (d[i][2]*s),
				(d[i][1]*-s) + (d[i][2]*c),
				d[i][3]);
		}
		return d;
	}

	// Rotates t times around y-axis
	function rotateDiceY(d, t) {
		let r = (2 * t) * Math.PI;
		let c = Math.cos(), s = Math.sin(r);
		for (i = 0; i < d.length; i++) {
			d[i] = vec4(
				(d[i][0]*c) + (d[i][2]*-s),
				d[i][1],
				(d[i][0]*s) + (d[i][2]*c),
				d[i][3]);
		}
		return d;
	}

	// Rotates t times around z-axis
	function rotateDiceZ(d, t) {
		let r = (2 * t) * Math.PI;
		let c = Math.cos(), s = Math.sin(r);
		for (i = 0; i < d.length; i++) {
			d[i] = vec4(
				(d[i][0]*c) + (d[i][1]*-s),
				(d[i][0]*s) + (d[i][1]*c),
				d[i][2],
				d[i][3]);
		}
		return d;
	}
}