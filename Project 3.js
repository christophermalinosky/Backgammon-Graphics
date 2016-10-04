
var canvas;
var gl;
var colorLoc;
var modelViewLoc;
var projectionLoc;

var vertices = [];
var colors = [];
var indices = [];
var theta = [];
var angles  = [];
var c = [];
var s = [];

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

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

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

	 colors = [
	 	colorVecFromRGB(205,133,63), // brown
	 	vec4(1.0, 1.0, 1.0, 1.0),  // white
	 	vec4(0.0, 0.0, 0.0, 1.0),  // black
	    vec4(1.0, 0.0, 0.0, 1.0)  // red
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
	
	var a=document.getElementById ("XButton");
	a.addEventListener ("click", function() { axis = xAxis; });
	var b=document.getElementById ("YButton");
	b.addEventListener ("click", function () { axis = yAxis; });
	var c=document.getElementById ("ZButton");
	c.addEventListener ("click", function () { axis = zAxis; });
	var e=document.getElementById ("Pause");
	e.addEventListener ("click", function () { axis = null; });
	var d=document.getElementById ("Reset");
	d.addEventListener ("click", function () { theta = [0.0, 0.0, 0.0]; axis = xAxis });

    //  Load shaders and initialize attribute buffers
    
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
	colorLoc = gl.getUniformLocation (program, "color");
	modelViewLoc = gl.getUniformLocation (program, "modelView");
	projectionLoc  = gl.getUniformLocation (program, "projection");
	
    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW );

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
	theta[axis] += 0.3;
	
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
			gl.uniform4fv (colorLoc, colors[(i%2) + 2]);
		} else {
			gl.uniform4fv (colorLoc, colors[3 -(i%2)]);
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

	requestAnimFrame (render);
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