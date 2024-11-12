import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import blackBoxNeonTexture from '../../images/blackBoxNeon.png';
import blackBoxEyeTexture from '../../images/blackBoxEye.png';

// Tools from THREE Library
export const scene = new THREE.Scene();
export const sceneRaycaster = new THREE.Raycaster();
export const userController = new THREE.Vector2();
export const textureLoader = new THREE.TextureLoader();
export const sceneCamera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);

// Grid Variables
export const mazeGridSize = 11;
export const halfGrid = Math.floor(mazeGridSize * 0.5);
export const gridMin = -5.5;
export const gridMax = 5.5;

// Sprite Velocity and damper (no damping 1)
// 0.1
export const spriteVelocityMultiplier = 0.01;
export const spriteVelocityDamper = 1;

// Sprite diam and ini direction
export const spriteDiameter = 0.5;
export const spriteInitialAngle = 140;
export const spriteInitialRadians = spriteInitialAngle * (Math.PI / 180);

// This increment is the distance between path checks
// Needs looked at as it can miss when skewing cells
export const spriteSweeperIncrement = 0.0001;

// DistanceToImapactOffset (To include angle yet)
// Side imapacting and glancing from corners also to add
export const distanceToImpactOffset = 0.05 + (spriteDiameter * 0.5);

export let mazeGridFloor = undefined;
export let mazeArray = undefined;
export let selectionHighlighter = undefined;
export let sysPause = true;

export const scenePause = (_pausedState) => { sysPause = _pausedState; };

// Should not be using listeners in react (To change)
export const sceneLoadListeners = () => {
	window.addEventListener('mousemove', (event) => {
		userController.x = (event.clientX / window.innerWidth) * 2 - 1;
		userController.y = -(event.clientY / window.innerHeight) * 2 + 1;
		updateSelectionHighlighter(mazeGridSize);
	}, false);
	window.addEventListener('dblclick', (event) => {
		userController.x = (event.clientX / window.innerWidth) * 2 - 1;
		userController.y = -(event.clientY / window.innerHeight) * 2 + 1;
		placeMazeWall(mazeGridSize);
	}, false);
};

export const sceneWebGLRenderer = (_mountRef) => {
	const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(_mountRef.current.clientWidth, _mountRef.current.clientHeight);
	renderer.setClearColor(0x000000, 0);
	window.addEventListener('resize', () => {
		const width = _mountRef.current.clientWidth;
		const height = _mountRef.current.clientHeight;
		renderer.setSize(width, height);
		sceneCamera.aspect = width / height;
		sceneCamera.updateProjectionMatrix();
	});
	return renderer;
};

export const sceneOrbitalControls = (_camera, _renderer) => {
	const controls = new OrbitControls(_camera, _renderer.domElement);
	controls.target.set(0, 0, 0);
	return controls;
};

export const sceneLightingSetup = () => {
	const light = new THREE.DirectionalLight(0xffffff, 1);
	light.position.set(0, 20, 10).normalize();
	return light;
};

export const arrayToGrid = (_arrayLocationX, _arrayLocationY, _gridSize) => {
	return [_arrayLocationX - halfGrid, _arrayLocationY - halfGrid];
};

export const gridToArray = (_gridPositionX, _gridPositionY, _gridSize) => {
	return [Math.floor(_gridPositionX + halfGrid + 0.5), Math.floor(_gridPositionY + halfGrid + 0.5)];
};

export const isArrayMatch = (array1, array2) => {
	const checkArrays = (array1.length === array2.length) && array1.every(function (element, index) {
		return element === array2[index];
	});
	return checkArrays;
};

export const createMazeGrid = (_gridSizeX, _gridSizeY, _gridSizeZ) => {
	const mazeFloor = new THREE.BoxGeometry(_gridSizeX, _gridSizeY, _gridSizeZ);
	const mazeArray = Array.from({ length: parseInt(_gridSizeX) }, () => Array(parseInt(_gridSizeZ)).fill(0));
	const mazeGridFloor = new THREE.Mesh(mazeFloor, 0);
	mazeGridFloor.position.y = -_gridSizeY * 0.5;
	return [mazeGridFloor, mazeArray];
};

export const createMazeBoundaryWall = (_gridSizeX, _gridSizeY, _gridSizeZ) => {
	const mazeBoundaryWall = new THREE.BoxGeometry(1, 1, 1);
	const mazeBoundaryWallTexture = new THREE.MeshBasicMaterial({ color: 0x333399 });
	const mazeBoundaryWallObject = new THREE.Mesh(mazeBoundaryWall, mazeBoundaryWallTexture);
	mazeBoundaryWallObject.position.set(_gridSizeX, _gridSizeY, _gridSizeZ);
	return mazeBoundaryWallObject;
};

export const createMazeWall = (_gridSizeX, _gridSizeY, _gridSizeZ) => {
	const mazeWall = new THREE.BoxGeometry(1, 1, 1);
	const wallTexture = textureLoader.load(blackBoxNeonTexture, (textureForWalls) => {
		textureForWalls.wrapS = THREE.RepeatWrapping;
		textureForWalls.wrapT = THREE.RepeatWrapping;
		textureForWalls.repeat.set(1, 1);
	});
	const mazeWallMaterial = new THREE.MeshBasicMaterial({ map: wallTexture, opacity: 0, transparent: false });
	const mazeWallObject = new THREE.Mesh(mazeWall, mazeWallMaterial);
	mazeWallObject.position.set(_gridSizeX, _gridSizeY, _gridSizeZ);
	return mazeWallObject;
};

export const placeMazeWall = (_gridSize) => {
	const selectedPosition = selectionHighlighter.position.clone();
	const arrayPosition = gridToArray(selectedPosition.x, selectedPosition.z, _gridSize);
	if (mazeArray[arrayPosition[0]][arrayPosition[1]] === 1) {
		mazeArray[arrayPosition[0]][arrayPosition[1]] = 0;
		const objectsToNuke = [];
		scene.traverse((child) => {
			if (child instanceof THREE.Mesh && child.position.x === selectedPosition.x && child.position.z === selectedPosition.z) {
				objectsToNuke.push(child);
			}
		});
		objectsToNuke.forEach((obj) => scene.remove(obj));
	} else {
		const newMazeWall = createMazeWall(selectedPosition.x, 0.5, selectedPosition.z);
		mazeArray[arrayPosition[0]][arrayPosition[1]] = 1;
		scene.add(newMazeWall);
	}
};

export const placeMazeBoundaryWalls = (_gridSize) => {
	const boundaryWalls = new THREE.Group();
	const halfGrid = Math.floor(_gridSize * 0.5) + 1;
	for (let X = -halfGrid; X <= halfGrid; X++) { boundaryWalls.add(createMazeBoundaryWall(X, 0, -halfGrid)); boundaryWalls.add(createMazeBoundaryWall(X, 0, halfGrid)); }
	for (let Y = -halfGrid; Y <= halfGrid; Y++) { boundaryWalls.add(createMazeBoundaryWall(-halfGrid, 0, Y)); boundaryWalls.add(createMazeBoundaryWall(halfGrid, 0, Y)); }
	return boundaryWalls;
};

export const createHelperPoint = (_gridSizeX, _gridSizeY, _gridSizeZ) => {
	const pointGeometry = new THREE.SphereGeometry(0.1, 8, 8);
	const pointMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
	const point = new THREE.Mesh(pointGeometry, pointMaterial);
	point.position.set(_gridSizeX, _gridSizeY, _gridSizeZ);
	return point;
};

export const createHelperArrow = (_spritePosX, _spritePosZ) => {
	const direction = new THREE.Vector3(0, 1, 0);
	const position = new THREE.Vector3(_spritePosX, -0.5, _spritePosZ);
	const length = 1;
	const color = 0xffff00;
	const arrowHelper = new THREE.ArrowHelper(direction, position, length, color);
	return arrowHelper;
};

export const createGridHelper = () => {
	const normalColour = new THREE.Color(0x00ffff);
	const gridHelper = new THREE.GridHelper(mazeGridSize, mazeGridSize, normalColour);
	gridHelper.material = new THREE.LineBasicMaterial({ color: normalColour, linewidth: 2 });
	return gridHelper;
};

export const createHelperGridLabels = (_string, _x, _z) => {
	const canvas = document.createElement('canvas');
	const context = canvas.getContext('2d');
	context.font = '24px Arial';
	context.fillStyle = 'white';
	context.textAlign = 'center';
	context.fillText(_string, canvas.width / 2, canvas.height / 2);
	const texture = new THREE.CanvasTexture(canvas);
	const labelMaterial = new THREE.SpriteMaterial({ map: texture });
	const label = new THREE.Sprite(labelMaterial);
	label.position.set(_x, 0.05, _z);
	label.scale.set(1, 1, 1);
	return label;
};

export const createMazeArrayLabels = (_gridSize) => {
	const gridArrayLabels = new THREE.Group();
	for (let x = -halfGrid; x <= halfGrid; x++) {
		for (let z = -halfGrid; z <= halfGrid; z++) {
			const arrayX = x + halfGrid;
			const arrayZ = z + halfGrid;
			const grid = arrayToGrid(arrayX, arrayZ, _gridSize);
			const coordsGrid = `(${grid[0]},${grid[1]}) / [${arrayX}][${arrayZ}]`;
			const textLabel = createHelperGridLabels(coordsGrid, x, z);
			gridArrayLabels.add(textLabel);
		}
	}
	return gridArrayLabels;
};

export const createSelectionHighlighter = () => {
	const geometry = new THREE.BoxGeometry(1, 0.01, 1);
	const material = new THREE.MeshBasicMaterial({ color: 0x668cff, opacity: 0.8, transparent: true });
	const marker = new THREE.Mesh(geometry, material);
	scene.add(marker);
	return marker;
};

export const updateSelectionHighlighter = (_gridSize) => {
	sceneRaycaster.setFromCamera(userController, sceneCamera);
	const intersects = sceneRaycaster.intersectObject(mazeGridFloor);
	if (intersects.length > 0) {
		const intersectPoint = intersects[0].point;
		let cellX = Math.round(intersectPoint.x) < halfGrid ? Math.round(intersectPoint.x) : halfGrid;
		let cellZ = Math.round(intersectPoint.z) < halfGrid ? Math.round(intersectPoint.z) : halfGrid;
		selectionHighlighter.position.set(cellX, 0.005, cellZ);
	}
};

export const createSprite = (_spritePosX, _spritePosZ) => {
	const spriteGeometry = new THREE.SphereGeometry(spriteDiameter * 0.5, 16, 16);
	const spriteTexture = textureLoader.load(blackBoxEyeTexture, (textureForSprite) => {
		textureForSprite.wrapS = THREE.RepeatWrapping;
		textureForSprite.wrapT = THREE.RepeatWrapping;
		textureForSprite.repeat.set(1, 1);
	});
	const spriteMaterial = new THREE.MeshBasicMaterial({ map: spriteTexture, opacity: 1, transparent: false });
	const sprite = new THREE.Mesh(spriteGeometry, spriteMaterial);
	sprite.position.set(_spritePosX, 0.5, _spritePosZ);
	const spriteLabel = createSpriteLabel("(0,0)", 0, 0.7, 0);
	spriteLabel.name = "gridPositon";
	sprite.add(spriteLabel);
	return sprite;
};

export const updateSpriteDirection = (_sprite, _spriteVelocity) => {
	const direction = Math.atan2(_spriteVelocity.z, _spriteVelocity.x);
	_sprite.rotation.y = -direction;
};

export const createSpriteLabel = (_initialText, _x, _y, _z) => {
	const canvas = document.createElement('canvas');
	const context = canvas.getContext('2d');
	context.font = '48px Arial';
	context.fillStyle = 'white';
	context.textAlign = 'center';
	const texture = new THREE.CanvasTexture(canvas);
	const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
	const sprite = new THREE.Sprite(spriteMaterial);
	sprite.position.set(_x, _y, _z);
	sprite.scale.set(1.5, 1.5, 1.5);
	sprite.updateText = (_initialText) => {
		context.clearRect(0, 0, canvas.width, canvas.height);
		context.fillText(_initialText, canvas.width / 2, canvas.height / 2);
		texture.needsUpdate = true;
	};
	sprite.updateText(_initialText);
	return sprite;
};

export const updateSpriteLabel = (_sprite, _gridSize) => {
	const spriteLabel = _sprite.getObjectByName("gridPositon");
	let arrayPosition = gridToArray(_sprite.position.x, _sprite.position.z, _gridSize);
	let gridPosition = arrayToGrid(arrayPosition[0], arrayPosition[1], _gridSize);
	if (spriteLabel) { spriteLabel.updateText(`(${arrayPosition[0]},${arrayPosition[1]})`); }
};

export const returnSpritePosition = (_sprite, _gridSize) => {
	const curGridX = _sprite.position.x > -1 && _sprite.position.x < 1 ? 0 : Math.round(_sprite.position.x);
	const curGridY = _sprite.position.z > -1 && _sprite.position.z < 1 ? 0 : Math.round(_sprite.position.z);
	const curGridPosition = [curGridX, curGridY];
	const curArrayPosition = gridToArray(curGridX, curGridY, _gridSize);
	return [curGridPosition, curArrayPosition];
};

export const returnSpriteDirection = (_spriteVelocity) => {
	let fromRads = Math.atan2(_spriteVelocity.z, _spriteVelocity.x) * (180 / Math.PI);
	let toDegrees = fromRads < 0 ? 360 + fromRads : fromRads;
	return toDegrees;
};

export const returnDirectionFromCoords = (_startCoord, _endCoord) => {
	const changeInX = _endCoord[0] - _startCoord[0];
	const changeInY = _endCoord[1] - _startCoord[1];
	const angleOfDirection = Math.atan2(changeInY, changeInX) * (180 / Math.PI);
	const within360 = angleOfDirection < 0 ? 360 + angleOfDirection : angleOfDirection;
	return within360;
};

export const calculateImpactsReflection = (_angleOfIncidence, _normalAngle) => {
	return (((_normalAngle + ((((((((_normalAngle - 180) % 360) + 360) % 360) - _angleOfIncidence) % 360) + 360) % 360)) % 360) + 360) % 360;
};

export const calculateSpritesNextPosition = (_sprite, _spriteVelocity, _gridSize, _curSpritePositionPrecise) => {

	let curSpritePositionArray = gridToArray(_curSpritePositionPrecise[0], _curSpritePositionPrecise[1], _gridSize);
	let curSpritePositionGrid = arrayToGrid(curSpritePositionArray[0], curSpritePositionArray[1], _gridSize);
	let spriteDirection = returnSpriteDirection(_spriteVelocity);

	// console.log(`\x1b[35m\x1b[1mcurSpritePositionArray ${JSON.stringify(curSpritePositionArray)}`);
	// console.log(`\x1b[35m\x1b[1mcurSpritePositionGrid ${JSON.stringify(curSpritePositionGrid)}`);
	// console.log(`\x1b[35m\x1b[1mspriteDirection ${spriteDirection}`);


	const spriteDirectionPrecise = [_sprite.position.x, _sprite.position.z];
	const currentGridX = Math.floor(spriteDirectionPrecise[0]);
	const currentGridY = Math.floor(spriteDirectionPrecise[1]);

	let nextGridX = currentGridX;
	let nextGridY = currentGridY;
	let dx = _spriteVelocity.x;
	let dz = _spriteVelocity.z;
	let spriteClone = _sprite.clone();
	let scaledVelocityClone = _spriteVelocity.clone();

	const currentGrid = curSpritePositionGrid;
	let predictedGrid = currentGrid;
	let predictedArray = [null, null];

	while (isArrayMatch(currentGrid, predictedGrid)) {

		if (spriteDirection > 0 && spriteDirection < 90) {
			dx += spriteSweeperIncrement;
			dz += spriteSweeperIncrement;

		} else if (spriteDirection > 90 && spriteDirection < 180) {
			dx -= spriteSweeperIncrement;
			dz += spriteSweeperIncrement;

		} else if (spriteDirection > 180 && spriteDirection <= 270) {
			dx -= spriteSweeperIncrement;
			dz -= spriteSweeperIncrement;

		} else if (spriteDirection > 270 && spriteDirection <= 360) {
			dx += spriteSweeperIncrement;
			dz -= spriteSweeperIncrement;
		}

		let nextRadians = Math.atan2(dz, dx);
		scaledVelocityClone.set(Math.cos(nextRadians) * scaledVelocityClone.length(), 0, Math.sin(nextRadians) * scaledVelocityClone.length());
		spriteClone.position.add(scaledVelocityClone);
		nextGridX = spriteClone.position.x;
		nextGridY = spriteClone.position.z;
		predictedArray = gridToArray(nextGridX, nextGridY, _gridSize);
		predictedGrid = arrayToGrid(predictedArray[0], predictedArray[1], _gridSize);
	}
	let impactLocation = [spriteClone.position.x, spriteClone.position.z];
	return { predictedGrid, predictedArray, impactLocation, spriteDirection };
};

export const checkSpritesNextPosition = (_mazeArray, _preciseGridPosition, _nextArrayPosition, _spriteVelocity) => {
	// True means blocked
	let ispathBlocked = null;
	let predictedNormal = null;
	let currentDirection = returnSpriteDirection(_spriteVelocity);
	currentDirection = Math.round(currentDirection);
	const mazeArrayX = _nextArrayPosition[0];
	const mazeArrayY = _nextArrayPosition[1];
	//console.log(`\x1b[35m\x1b[1mTarget Array Index is (${mazeArrayX},${mazeArrayY})`);
	if ((mazeArrayX >= 0 && mazeArrayX < mazeGridSize) && (mazeArrayY >= 0 && mazeArrayY < mazeGridSize)) {
		//console.log(`\x1b[35m\x1b[1mThe target cell is in the grid`);
		if (!_mazeArray[mazeArrayX][mazeArrayY]) {
			//console.log(`\x1b[35m\x1b[1mThe target Cell contains ${_mazeArray[mazeArrayX][mazeArrayY]}`);
			if (_mazeArray[mazeArrayX][mazeArrayY - 1] && _mazeArray[mazeArrayX - 1][mazeArrayY] && currentDirection === 45) {
				//console.log("\x1b[31m\x1b[1mTarget cell is clear but SE corner is blocked");
				ispathBlocked = true;
				predictedNormal = 225;
			} else if (_mazeArray[mazeArrayX][mazeArrayY - 1] && _mazeArray[mazeArrayX + 1][mazeArrayY] && currentDirection === 135) {
				//console.log("\x1b[31m\x1b[1mTarget cell is clear but SW corner is blocked");
				ispathBlocked = true;
				predictedNormal = 315;
			} else if (_mazeArray[mazeArrayX][mazeArrayY + 1] && _mazeArray[mazeArrayX + 1][mazeArrayY] && currentDirection === 225) {
				//console.log("\x1b[31m\x1b[1mTarget cell is clear but NW corner is blocked");
				ispathBlocked = true;
				predictedNormal = 45;
			} else if (_mazeArray[mazeArrayX][mazeArrayY + 1] && _mazeArray[mazeArrayX - 1][mazeArrayY] && currentDirection === 315) {
				//console.log("\x1b[31m\x1b[1mTarget cell is clear but NE corner is blocked");
				ispathBlocked = true;
				predictedNormal = 135;
			} else {
				//console.log(`\x1b[32m\x1b[1mTarget Cell (${mazeArrayX},${mazeArrayY}) is accessible`);
				ispathBlocked = false;
				predictedNormal = null;
			}
		} else {
			//console.log(`\x1b[31m\x1b[1mTarget Cell (${mazeArrayX},${mazeArrayY}) is blocked`);
			ispathBlocked = true;
			predictedNormal = null;
		}
	} else {
		//console.log(`\x1b[31m\x1b[1mTarget Cell (${mazeArrayX},${mazeArrayY}) is off grid`);
		ispathBlocked = true;
		predictedNormal = null;
	}
	return [ispathBlocked, predictedNormal];
};

export const calculateImpactsNormal = (_sprite, _spriteVelocity, _nextSpritePositionPrecise, _nextPositionCheck) => {

	let ispathBlocked = _nextPositionCheck[0];
	let isInvertedCorner = _nextPositionCheck[1];
	// console.log(`\x1b[31m\x1b[1mThe path ahead is blocked: ${ispathBlocked}`);
	// console.log(`\x1b[31m\x1b[1mInverted corner reflection: ${isInvertedCorner}`);
	// if (isInvertedCorner !== null) { return isInvertedCorner; }
	if (ispathBlocked === false) { alert("Path not blocked?"); }

	let normalWest = 0; let normalEast = 180; let normalSouth = 90; let normalNorth = 270;
	let normalNorthWest = 45; let normalNorthEast = 315; let normalSouthWest = 135; let normalSouthEast = 225;

	const exactPosition = [Number(Number(_sprite.position.x).toFixed(3)), Number(Number(_sprite.position.z).toFixed(3))];
	let exactCellArray = gridToArray(exactPosition[0], exactPosition[1], mazeGridSize);
	let exactCellGrid = arrayToGrid(exactCellArray[0], exactCellArray[1], mazeGridSize);

	const cellminX = exactCellGrid[0] - 0.5;
	const cellmaxX = exactCellGrid[0] + 0.5;
	const cellminY = exactCellGrid[1] - 0.5;
	const cellmaxY = exactCellGrid[1] + 0.5;

	console.log(`\x1b[32m\x1b[1mcellminX  (${cellminX})`);
	console.log(`\x1b[32m\x1b[1mcellmaxX  (${cellmaxX})`);
	console.log(`\x1b[32m\x1b[1mcellminY  (${cellminY})`);
	console.log(`\x1b[32m\x1b[1mcellmaxY  (${cellmaxY})`);

	const impactPosition = [Number(Number(_nextSpritePositionPrecise[0]).toFixed(3)), Number(Number(_nextSpritePositionPrecise[1]).toFixed(3))];
	console.log(`\x1b[32m\x1b[1mImpact Position  (${impactPosition[0]},${impactPosition[1]})`);

	let impactCorrectionX = impactPosition[0];
	let impactCorrectionY = impactPosition[1];

	if (impactPosition[0] < cellminX){
		impactCorrectionX = cellminX;
	} else if (impactPosition[0] > cellmaxX){
		impactCorrectionX = cellmaxX;
	}else{
		impactCorrectionX=impactPosition[0];
	}

	if (impactPosition[1] < cellminY){
		impactCorrectionY = cellminY;
	} else if (impactPosition[1] > cellmaxY){
		impactCorrectionY = cellmaxY;
	}else{
		impactCorrectionY=impactPosition[1];
	}


	scene.add(createHelperArrow(impactCorrectionX, impactCorrectionY));
	console.log(`\x1b[32m\x1b[1mimpactCorrectionX  (${impactCorrectionX})`);
	console.log(`\x1b[32m\x1b[1mimpactCorrectionY  (${impactCorrectionY})`);
	let impactLocation = [impactCorrectionX,impactCorrectionY]

	let blockedCellArray = gridToArray(_nextSpritePositionPrecise[0], _nextSpritePositionPrecise[1], mazeGridSize);
	let blockedCellGrid = arrayToGrid(blockedCellArray[0], blockedCellArray[1], mazeGridSize);
	console.log(`\x1b[31m\x1b[1mblockedCellArray (${blockedCellArray[0]},${blockedCellArray[1]})`);
	console.log(`\x1b[32m\x1b[1mblockedCellGrid (${blockedCellGrid[0]},${blockedCellGrid[1]})`);

	// A corner is not a corner when it has a block to the side
	const CC = mazeArray[blockedCellArray[0]][blockedCellArray[1]];
	const NN = mazeArray[blockedCellArray[0]][blockedCellArray[1] - 1];
	const WW = mazeArray[blockedCellArray[0] - 1][blockedCellArray[1]];
	const SS = mazeArray[blockedCellArray[0]][blockedCellArray[1] + 1];
	const EE = mazeArray[blockedCellArray[0] + 1][blockedCellArray[1]];

	console.log(`\x1b[31m\x1b[1mCC (${CC})`);
	console.log(`\x1b[31m\x1b[1mNN (${NN})`);
	console.log(`\x1b[31m\x1b[1mWW (${WW})`);
	console.log(`\x1b[31m\x1b[1mSS (${SS})`);
	console.log(`\x1b[31m\x1b[1mEE (${EE})`);

	const getDirection = returnSpriteDirection(_spriteVelocity);
	console.log(`\x1b[31m\x1b[1mDirection of travel (${getDirection})`);

	if (getDirection >= 0 && getDirection < 91) {

		console.log(`\x1b[92m\x1b[1mComing in from North West to impact`, impactLocation);
		const northFaceDist = cellmaxY - impactCorrectionY;
		const westFaceDist =  cellmaxX - impactCorrectionX;
		console.log(`\x1b[92m\x1b[1mDistance From North Face ${northFaceDist}`);
		console.log(`\x1b[92m\x1b[1mDistance From West Face ${westFaceDist}`);

		if (northFaceDist === westFaceDist) {
			console.log("NW");
			if (NN && WW && Math.round(getDirection) == 45) {
				return 45;
			} else if (NN && !WW) {
				return 0;
			} else if (!NN && WW) {
				return 90;
			} else {
				return 45;
			}
		} else if (northFaceDist < westFaceDist) {
			console.log("N");
			return 90;
		} else {
			console.log("W");
			return 0;
		}

		//

	} else if (getDirection >= 90 && getDirection < 181) {

		console.log(`\x1b[92m\x1b[1mComing in from North East to impact`, impactLocation);

		const northFaceDist = cellmaxY - impactCorrectionY;
		const eastFaceDist =  cellminX - impactCorrectionX;
		console.log(`\x1b[92m\x1b[1mnorthFaceDist ${cellmaxY} - ${impactCorrectionY} = ${northFaceDist}`);
		console.log(`\x1b[92m\x1b[1mDistance From North Face ${northFaceDist}`);

		console.log(`\x1b[92m\x1b[1meastFaceDist ${cellminX} - ${impactCorrectionX} = ${eastFaceDist}`);
		console.log(`\x1b[92m\x1b[1mDistance From East Face ${eastFaceDist}`);

		if (northFaceDist === eastFaceDist) {
			console.log("NE");
			if (NN && EE && Math.round(getDirection) == 135) {
				return 135;
			} else if (NN && !EE) {
				return 180;
			} else if (!NN && EE) {
				return 90;
			} else {
				return 135;
			}
		} else if (northFaceDist < eastFaceDist) {
			console.log("N");
			return 90;
		} else {
			console.log("E");
			return 180;
		}

	} else if (getDirection >= 180 && getDirection < 271) {
		console.log(`\x1b[92m\x1b[1mComing in from South East to impact`, impactLocation);
		const southFaceDist = cellmaxY - impactCorrectionY;
		const eastFaceDist =  cellmaxX - impactCorrectionX;
		console.log(`\x1b[92m\x1b[1mDistance From South Face ${southFaceDist}`);
		console.log(`\x1b[92m\x1b[1mDistance From East Face ${eastFaceDist}`);

		if (southFaceDist === eastFaceDist) {
			console.log("SE");
			if (SS && EE && Math.round(getDirection) == 225) {
				return 225;
			} else if (SS && !EE) {
				return 180;
			} else if (!SS && EE) {
				return 270;
			} else {
				return 225;
			}
		} else if (southFaceDist < eastFaceDist) {
			console.log("S");
			return 90;
		} else {
			console.log("E");
			return 0;
		}

	} else if (getDirection >= 270 && getDirection < 361) {
		console.log(`\x1b[92m\x1b[1mComing in from South West to impact`, impactLocation);
		const southFaceDist = cellmaxY - impactCorrectionY;
		const westFaceDist =  cellmaxX - impactCorrectionX;
		console.log(`\x1b[92m\x1b[1mDistance From South Face ${southFaceDist}`);
		console.log(`\x1b[92m\x1b[1mDistance From West Face ${westFaceDist}`);

		if (southFaceDist === westFaceDist) {
			console.log("SW");
			if (SS && WW && Math.round(getDirection) == 315) {
				return 315;
			} else if (SS && !WW) {
				return 0;
			} else if (!SS && WW) {
				return 270;
			} else {
				return 315;
			}
		} else if (southFaceDist < westFaceDist) {
			console.log("S");
			return 270;
		} else {
			console.log("E");
			return 0;
		}

	} else {
		alert("straight");
		return Math.abs((getDirection + 180) % 360);
	}

};

export const animateSpriteControl = (_sprite, _mazeArray, _gridSize, _spriteVelocity, _velocityMultiplier, _velocityDamper) => {
	let curSpritePositionPrecise = [null, null];
	let curSpritePositionArray = [null, null];
	let curSpritePositionGrid = [null, null];
	let lastSpritePositionArray = [null, null];
	let nextSpritePosition = undefined;
	const animateSprite = () => {
		if (!sysPause) {
			// Fetching the array indices and coords for the cell at the sprites precise location.
			curSpritePositionPrecise = [_sprite.position.x, _sprite.position.z];
			curSpritePositionArray = gridToArray(curSpritePositionPrecise[0], curSpritePositionPrecise[1], _gridSize);
			curSpritePositionGrid = arrayToGrid(curSpritePositionArray[0], curSpritePositionArray[1], _gridSize);
			// Calculating the sprites next cell and the impact location.
			nextSpritePosition = calculateSpritesNextPosition(_sprite, _spriteVelocity, _gridSize, curSpritePositionPrecise);
			// console.log("predictedGrid", nextSpritePosition.predictedGrid);
			// console.log("predictedArray", nextSpritePosition.predictedArray);
			// console.log("impactLocation", nextSpritePosition.impactLocation);
			// console.log("spriteDirection", nextSpritePosition.spriteDirection);
			let nextPositionCheck = checkSpritesNextPosition(_mazeArray, curSpritePositionPrecise, nextSpritePosition.predictedArray, _spriteVelocity);
			let ispathBlocked = nextPositionCheck[0];
			let isInvertedCorner = nextPositionCheck[1];
			// isStillInSameCell is to minimise spamming the same data in the same cell.
			// lastSpritePositionArray was initialised as [null, null] arrays will not match first pass.
			let isStillInSameCell = isArrayMatch(lastSpritePositionArray, curSpritePositionArray);
			// if not in the same cell as before and the path ahead is not blocked ...
			if (!isStillInSameCell && !ispathBlocked) {
				console.log("");
				console.log(`\x1b[34m\x1b[1mEntered Cell: ${curSpritePositionGrid} heading ${nextSpritePosition.predictedGrid}`);
				let currentDirectionRads = nextSpritePosition.spriteDirection * (Math.PI / 180);
				_spriteVelocity.set(Math.cos(currentDirectionRads) * _spriteVelocity.length(), 0, Math.sin(currentDirectionRads) * _spriteVelocity.length());
				lastSpritePositionArray = curSpritePositionArray;
			} else {
				if (!ispathBlocked && isStillInSameCell) {
					// The path ahead is clear the sprite can continue onward
					// If updateSpriteLabel is only returning integers this could be moved
					updateSpriteLabel(_sprite, _gridSize);
					_sprite.position.add(_spriteVelocity);
					_spriteVelocity.multiplyScalar(_velocityDamper);
				} else {
					if (ispathBlocked) {
						// Calculate the normal for the impact as well as the precise location.
						let angle = calculateImpactsNormal(_sprite, _spriteVelocity, nextSpritePosition.impactLocation, nextPositionCheck);
						// impactingPosition should be within the grid limits [-5.5,-5.5] [5.5,5.5]
						let targetPointX = nextSpritePosition.impactLocation[0] < gridMin ? -5.5 : nextSpritePosition.impactLocation[0] > gridMax ? 5.4 : nextSpritePosition.impactLocation[0];
						let targetPointY = nextSpritePosition.impactLocation[1] < gridMin ? -5.5 : nextSpritePosition.impactLocation[1] > gridMax ? 5.5 : nextSpritePosition.impactLocation[1];
						// distance to impact is being used to measure the distance between the current and impact points
						// the distanceToImpactOffset is a preset set constant for, later velocity angles and sprites diameter need scoped 
						let distanceToImpact = _sprite.position.distanceTo(new THREE.Vector3(targetPointX, _sprite.position.y, targetPointY));
						if (distanceToImpact >= distanceToImpactOffset) {
							// The sprite is still out of range for triggering a direction change
							console.log(`\x1b[94m\x1b[1mDistance to impact: ${distanceToImpact} >= Distance Compensation: ${distanceToImpactOffset}`);
							// UpdatingSpriteLabel was placed here to return precise coords evevry increment
							// the function was modified to only display the grid coords as integers
							// this could be moved to the initial condition
							updateSpriteLabel(_sprite, _gridSize);
							_sprite.position.add(_spriteVelocity);
							_spriteVelocity.multiplyScalar(_velocityDamper);
						} else {
							// the sprite is within impact range, using the normal and current direction to change direction
							// dropping in a random angular offsetto prevent boxed deflections
							let reflectedDirection = calculateImpactsReflection(nextSpritePosition.spriteDirection + Math.random() + -0.5, angle);
							const degreesToRads = reflectedDirection * (Math.PI / 180);
							_spriteVelocity.set(Math.cos(degreesToRads) * _spriteVelocity.length(), 0, Math.sin(degreesToRads) * _spriteVelocity.length());
							_sprite.position.add(_spriteVelocity);
							_spriteVelocity.multiplyScalar(_velocityDamper);
							ispathBlocked = false;
							lastSpritePositionArray = [null, null];
							console.log(`\x1b[92m\x1b[1mImpact occured incident:${nextSpritePosition.spriteDirection}, normal:${angle}, relfection:${reflectedDirection}`);
							//sysPause = true;
						}
					}
				}
			}
		}
		updateSpriteDirection(_sprite, _spriteVelocity);
		requestAnimationFrame(animateSprite);
	};
	animateSprite();
};

export const iniGridArrayScene = (mountRef) => {
	[mazeGridFloor, mazeArray] = createMazeGrid(mazeGridSize, 0.001, mazeGridSize);
	scene.add(new THREE.AxesHelper(10));
	scene.add(createGridHelper());
	scene.add(mazeGridFloor);
	scene.add(sceneLightingSetup());
	scene.add(createMazeArrayLabels(mazeGridSize));
	sceneCamera.position.set(20, 20, 20);
	sceneLoadListeners();
	selectionHighlighter = createSelectionHighlighter();
	const velocity = new THREE.Vector3(Math.cos(spriteInitialRadians), 0, Math.sin(spriteInitialRadians)).multiplyScalar(spriteVelocityMultiplier);
	const sprite = createSprite(0, 0);
	scene.add(sprite);
	animateSpriteControl(sprite, mazeArray, mazeGridSize, velocity, spriteVelocityMultiplier, spriteVelocityDamper);
	const renderer = sceneWebGLRenderer(mountRef);
	mountRef.current.appendChild(renderer.domElement);
	const controls = sceneOrbitalControls(sceneCamera, renderer);
	const animateScene = () => {
		requestAnimationFrame(animateScene);
		controls.update();
		renderer.render(scene, sceneCamera);
	};
	animateScene();
};