import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import blackBoxNeonTexture from '../../images/blackBoxNeon.png';
import blackBoxEyeTexture from '../../images/blackBoxEye.png';

export const scene = new THREE.Scene();
export const sceneRaycaster = new THREE.Raycaster();
export const userController = new THREE.Vector2();
export const textureLoader = new THREE.TextureLoader();
export const sceneCamera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);

export const mazeGridSize = 11;
export const halfGrid = Math.floor(mazeGridSize * 0.5);

export const spriteVelocityMultiplier = 0.1;
export const spriteVelocityDamper = 1;
export const spriteInitialAngle = 130;
export const spriteInitialRadians = spriteInitialAngle * (Math.PI / 180);
export const spriteSweeperIncrement = spriteVelocityMultiplier * 0.001;

export let mazeGridFloor = undefined;
export let mazeArray = undefined;
export let selectionHighlighter = undefined;
export let sysPause = true;

export const scenePause = (_pausedState) => { sysPause = _pausedState; };

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
    const renderer = new THREE.WebGLRenderer({antialias: true,alpha: true});
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
}

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
    const mazeWallMaterial = new THREE.MeshBasicMaterial({map: wallTexture,opacity: 0,transparent: false});
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
	for (let X = -halfGrid; X <= halfGrid; X++) {boundaryWalls.add(createMazeBoundaryWall(X, 0, -halfGrid));boundaryWalls.add(createMazeBoundaryWall(X, 0, halfGrid));}
	for (let Y = -halfGrid; Y <= halfGrid; Y++) {boundaryWalls.add(createMazeBoundaryWall(-halfGrid, 0, Y));boundaryWalls.add(createMazeBoundaryWall(halfGrid, 0, Y));}
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
	const position = new THREE.Vector3(_spritePosX, 0, _spritePosZ);
	const length = 1;
	const color = 0xffff00;
	const arrowHelper = new THREE.ArrowHelper(direction, position, length, color);
	return arrowHelper;
};

export const createGridHelper = () =>{
	const normalColour = new THREE.Color(0x00ffff);
	const gridHelper = new THREE.GridHelper(mazeGridSize, mazeGridSize, normalColour);
	gridHelper.material = new THREE.LineBasicMaterial({ color: normalColour, linewidth: 2});
	return gridHelper;
}

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
    const spriteGeometry = new THREE.SphereGeometry(0.2, 16, 16);
    const spriteTexture = textureLoader.load(blackBoxEyeTexture, (textureForSprite) => {
        textureForSprite.wrapS = THREE.RepeatWrapping;
        textureForSprite.wrapT = THREE.RepeatWrapping;
        textureForSprite.repeat.set(1, 1);
    });
    const spriteMaterial = new THREE.MeshBasicMaterial({map: spriteTexture,opacity: 1,transparent: false});
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

export const updateSpriteLabel = (_sprite,_gridSize) => {
    const spriteLabel = _sprite.getObjectByName("gridPositon");
	let arrayPosition = gridToArray(_sprite.position.x, _sprite.position.z, _gridSize);
	let gridPosition = arrayToGrid(arrayPosition[0], arrayPosition[1], _gridSize);
    if (spriteLabel) {spriteLabel.updateText(`(${gridPosition[0]},${gridPosition[1]})`);}
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
	return Math.round(toDegrees);
};

export const returnDirectionFromCoords = (_startCoord, _endCoord) => {
    const changeInX = _endCoord[0] - _startCoord[0];
    const changeInY = _endCoord[1] - _startCoord[1];
    const angleOfDirection = Math.atan2(changeInY, changeInX) * (180 / Math.PI);
	const within360 = angleOfDirection < 0 ? 360 + angleOfDirection : angleOfDirection;
    return within360;
};

export const calculateImpactsNormal = (_sprite, _spriteVelocity, _nextSpritePositionPrecise) => {
	let normalAngle = null;
	let normalWest = 0;
	let normalEast = 180;
	let normalSouth = 90;
	let normalNorth = 270;
	let normalNorthWest = 45;
	let normalNorthEast = 315;
	let normalSouthWest = 135;
	let normalSouthEast = 225;
	const boundaryLimitMin = -halfGrid; 
	const boundaryLimitMax = halfGrid;
	const exactPosition = [_sprite.position.x, _sprite.position.z];
	const impactPosition = [_nextSpritePositionPrecise[0], _nextSpritePositionPrecise[1]];
	let XPosDecimalExact = Number(Number(exactPosition[0]).toFixed(3));
	let YPosDecimalExact = Number(Number(exactPosition[1]).toFixed(3));
	let XPosDecimalImpact = Number(Number(impactPosition[0]).toFixed(3));
	let YPosDecimalImpact = Number(Number(impactPosition[1]).toFixed(3));
	if (XPosDecimalImpact >= boundaryLimitMax) { normalAngle = normalWest; }
	if (XPosDecimalImpact <= boundaryLimitMin) { normalAngle = normalEast; }
	if (YPosDecimalImpact >= boundaryLimitMax) { normalAngle = normalNorth; }
	if (YPosDecimalImpact <= boundaryLimitMin) { normalAngle = normalSouth; }
	if (XPosDecimalImpact >= boundaryLimitMax && YPosDecimalImpact >= boundaryLimitMax) { normalAngle = normalNorthWest; } // SE
	if (XPosDecimalImpact <= boundaryLimitMin && YPosDecimalImpact <= boundaryLimitMin) { normalAngle = normalSouthEast; }// NW
	if (XPosDecimalImpact >= boundaryLimitMax && YPosDecimalImpact <= boundaryLimitMin) { normalAngle = normalNorthEast; } // NE
	if (XPosDecimalImpact <= boundaryLimitMin && YPosDecimalImpact >= boundaryLimitMax) { normalAngle = normalSouthWest; } // SW
	let blockedCellArray = gridToArray(XPosDecimalImpact, YPosDecimalImpact, mazeGridSize);
	let blockedCellGrid = arrayToGrid(blockedCellArray[0], blockedCellArray[1], mazeGridSize);
	let posDecimalImpact = [XPosDecimalImpact, YPosDecimalImpact];
	let posDecimalExact = [XPosDecimalExact, YPosDecimalExact];
	let adjustedCellImpactPos=undefined;
	if (normalAngle === null){
		const getDirection = returnDirectionFromCoords(posDecimalExact,posDecimalImpact);
		let cellImpactPosX = (posDecimalImpact[0] - blockedCellGrid[0]).toString();
		let cellImpactPosY = (posDecimalImpact[1] - blockedCellGrid[1]).toString();
		cellImpactPosX=cellImpactPosX> 0 ? cellImpactPosX.slice(0,4):cellImpactPosX.slice(0,5);
		cellImpactPosY=cellImpactPosY> 0 ? cellImpactPosY.slice(0,4):cellImpactPosY.slice(0,5);
		cellImpactPosX=Number(cellImpactPosX);
		cellImpactPosY=Number(cellImpactPosY);
		adjustedCellImpactPos = [cellImpactPosX,cellImpactPosY];
		console.log("");
		if (getDirection >= 0 && getDirection < 91){
			const northFaceDist = 0.5 + cellImpactPosY;
			const westFaceDist = 0.5 + cellImpactPosX;
			if (northFaceDist === westFaceDist){
				const checkOneCellNorth = checkSpritesNextPosition(mazeArray,[blockedCellArray[0],blockedCellArray[1]-1],mazeGridSize);
				const checkOneCellWest = checkSpritesNextPosition(mazeArray,[blockedCellArray[0]-1,blockedCellArray[1]],mazeGridSize);
				if (!checkOneCellNorth && checkOneCellWest){
					normalAngle=normalWest;
				}else if (checkOneCellNorth && !checkOneCellWest){
					normalAngle=normalNorth;
				}else{
					normalAngle=normalNorthWest;
				}
			}else if (northFaceDist < westFaceDist){
				normalAngle=normalNorth;
			}else{
				normalAngle=normalWest;
			}
		} else if (getDirection >= 90 && getDirection < 181){
			const northFaceDist = 0.5 + cellImpactPosY;
			const eastFaceDist = 0.5 - cellImpactPosX;
			if (northFaceDist === eastFaceDist){
				const checkOneCellNorth = checkSpritesNextPosition(mazeArray,[blockedCellArray[0],blockedCellArray[1]-1],mazeGridSize);
				const checkOneCellEast = checkSpritesNextPosition(mazeArray,[blockedCellArray[0]+1,blockedCellArray[1]],mazeGridSize);
				if (!checkOneCellNorth && checkOneCellEast){
					normalAngle=normalEast;
				}else if (checkOneCellNorth && !checkOneCellEast){
					normalAngle=normalNorth;
				}else{
					normalAngle=normalNorthEast;
				}
			}else if (northFaceDist < eastFaceDist){
				normalAngle=normalNorth;
			}else{
				normalAngle=normalEast;
			}
		}else if (getDirection >= normalWest && getDirection < 271){
			const southFaceDist = 0.5 - cellImpactPosY;
			const eastFaceDist = 0.5 - cellImpactPosX;
			if (southFaceDist === eastFaceDist){
				const checkOneCellSouth = checkSpritesNextPosition(mazeArray,[blockedCellArray[0],blockedCellArray[1]+1],mazeGridSize);
				const checkOneCellEast = checkSpritesNextPosition(mazeArray,[blockedCellArray[0]+1,blockedCellArray[1]],mazeGridSize);
				if (!checkOneCellSouth && checkOneCellEast){
					normalAngle=normalEast;
				}else if (checkOneCellSouth && !checkOneCellEast){
					normalAngle=normalSouth;
				}else{
					normalAngle=normalSouthEast;
				}
			}else if (southFaceDist < eastFaceDist){
				normalAngle=normalSouth;
			}else{
				normalAngle=normalEast;
			}
		}else if (getDirection >= 270 && getDirection < 361){
			const southFaceDist = 0.5 - cellImpactPosY;
			const westFaceDist = 0.5 + cellImpactPosX;
			if (southFaceDist === westFaceDist){
				const checkOneCellSouth = checkSpritesNextPosition(mazeArray,[blockedCellArray[0],blockedCellArray[1]+1],mazeGridSize);
				const checkOneCellWest = checkSpritesNextPosition(mazeArray,[blockedCellArray[0]-1,blockedCellArray[1]],mazeGridSize);
				if (!checkOneCellSouth && checkOneCellWest){
					normalAngle=normalWest;
				}else if (checkOneCellSouth && !checkOneCellWest){
					normalAngle=normalSouth;
				}else{
					normalAngle=normalSouthWest;
				}
			}else if (southFaceDist < westFaceDist){
				normalAngle=normalSouth;
			}else{
				normalAngle=normalWest;
			}
		}
	}
	return [normalAngle, posDecimalExact, posDecimalImpact, adjustedCellImpactPos];
};

export const calculateImpactsReflection = (_angleOfIncidence, _normalAngle) => {
	return (((_normalAngle + ((((((((_normalAngle - 180) % 360) + 360) % 360) - _angleOfIncidence) % 360) + 360) % 360)) % 360) + 360) % 360;
};

export const calculateSpritesNextPosition = (_sprite, _spriteVelocity, _gridSize, _curSpritePositionPrecise) => {
	let curSpritePositionArray = gridToArray(_curSpritePositionPrecise[0], _curSpritePositionPrecise[1], _gridSize);
	let curSpritePositionGrid = arrayToGrid(curSpritePositionArray[0], curSpritePositionArray[1], _gridSize);
	const currentDirection = Math.atan2(_spriteVelocity.z, _spriteVelocity.x) * (180 / Math.PI);
	const curSpritePositionPrecise = [_sprite.position.x, _sprite.position.z];
	const currentGridX = Math.floor(curSpritePositionPrecise[0]);
	const currentGridY = Math.floor(curSpritePositionPrecise[1]);
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
		dx += spriteSweeperIncrement;
		dz += spriteSweeperIncrement;
		let nextRadians = Math.atan2(dz, dx);
		scaledVelocityClone.set(Math.cos(nextRadians) * scaledVelocityClone.length(), 0, Math.sin(nextRadians) * scaledVelocityClone.length());
		spriteClone.position.add(scaledVelocityClone);
		nextGridX = spriteClone.position.x;
		nextGridY = spriteClone.position.z;
		predictedArray = gridToArray(nextGridX, nextGridY, _gridSize);
		predictedGrid = arrayToGrid(predictedArray[0], predictedArray[1], _gridSize);
	}
	let nextPrecise = [spriteClone.position.x, spriteClone.position.z];
	return [predictedGrid, predictedArray, nextPrecise, currentDirection];
};

export const checkSpritesNextPosition = (_mazeArray, _arrayPosition, _spriteVelocity) => {
	let currentDirection = returnSpriteDirection(_spriteVelocity);
	const mazeArrayX = _arrayPosition[0];
	const mazeArrayY = _arrayPosition[1];
	if ((mazeArrayX >= 0 && mazeArrayX < mazeGridSize) && (mazeArrayY >= 0 && mazeArrayY < mazeGridSize)) {
		if (_mazeArray[mazeArrayX][mazeArrayY]) {console.log("Occupied"); return false;}else{
		if ((mazeArrayX > 0 && mazeArrayX < mazeGridSize-1) && (mazeArrayY >= 0 && mazeArrayY < mazeGridSize-1)) {
			if (_mazeArray[mazeArrayX][mazeArrayY-1] && _mazeArray[mazeArrayX-1][mazeArrayY] && currentDirection === 45) {return false;}
			if (_mazeArray[mazeArrayX][mazeArrayY-1] && _mazeArray[mazeArrayX+1][mazeArrayY] && currentDirection === 135) {return false;}
			if (_mazeArray[mazeArrayX][mazeArrayY+1] && _mazeArray[mazeArrayX+1][mazeArrayY] && currentDirection === 225) {return false;}
			if (_mazeArray[mazeArrayX][mazeArrayY+1] && _mazeArray[mazeArrayX-1][mazeArrayY] && currentDirection === 315) {return false;}
		}}
		return true;
	} else {console.log("Off Grid");return false;}
};

export const animateSpriteControl = (_sprite, _mazeArray, _gridSize, _spriteVelocity, _velocityMultiplier, _velocityDamper) => {
	let curSpritePositionPrecise = [null, null];
	let curSpritePositionArray = [null, null];
	let nextSpritePosition = undefined;
	let nextSpritePositionPrecise = [null, null];
	let nextSpritePositionArray = [null, null];
	let nextSpritePositionStatus = true;
	let lastSpritePositionArray = [null, null];
	const animateSprite = () => {
		if (!sysPause) {
			curSpritePositionPrecise = [_sprite.position.x, _sprite.position.z];
			curSpritePositionArray = gridToArray(curSpritePositionPrecise[0], curSpritePositionPrecise[1], _gridSize);
			nextSpritePosition = calculateSpritesNextPosition(_sprite, _spriteVelocity, _gridSize, curSpritePositionPrecise);
			nextSpritePositionPrecise = nextSpritePosition[2];
			nextSpritePositionArray = nextSpritePosition[1];
			nextSpritePositionStatus = checkSpritesNextPosition(_mazeArray, nextSpritePositionArray, _spriteVelocity);
			let isLastSpritePosCurSpritePos = isArrayMatch(lastSpritePositionArray, curSpritePositionArray);
			if (!isLastSpritePosCurSpritePos && nextSpritePositionStatus) {
				lastSpritePositionArray = curSpritePositionArray;
				let nextRadians = Math.atan2(_spriteVelocity.z, _spriteVelocity.x);
				_spriteVelocity.set(Math.cos(nextRadians) * _spriteVelocity.length(), 0, Math.sin(nextRadians) * _spriteVelocity.length());
			} else {
				if (!nextSpritePositionStatus) {
					let curSpriteDirection = returnSpriteDirection(_spriteVelocity);
					let calculateNormals = calculateImpactsNormal(_sprite, _spriteVelocity, nextSpritePositionPrecise);
					let impactingNormal = calculateNormals[0];
					let impactingPosition = calculateNormals[2];
					const gridMin = -5.5; const gridMax = 5.5;
					let targetPointX = impactingPosition[0] < gridMin ? -5.499 : impactingPosition[0] > gridMax ? 5.499 : impactingPosition[0];
					let targetPointY = impactingPosition[1] < gridMin ? -5.499 : impactingPosition[1] > gridMax ? 5.499 : impactingPosition[1];
					let distanceToImpact = _sprite.position.distanceTo(new THREE.Vector3(targetPointX, _sprite.position.y, targetPointY));
					if (distanceToImpact >= _velocityMultiplier) {
						updateSpriteLabel(_sprite,_gridSize);
						_sprite.position.add(_spriteVelocity);
						_spriteVelocity.multiplyScalar(_velocityDamper);
					} else {
						_sprite.position.set(impactingPosition[0],_sprite.position.y,impactingPosition[1]);
						let reflectedDirection = calculateImpactsReflection(curSpriteDirection, impactingNormal);
						const degreesToRads = reflectedDirection * (Math.PI / 180);
						_spriteVelocity.set(Math.cos(degreesToRads) * _spriteVelocity.length(), 0, Math.sin(degreesToRads) * _spriteVelocity.length());
						nextSpritePositionStatus = true;
					}
				} else {
					updateSpriteLabel(_sprite,_gridSize);
					_sprite.position.add(_spriteVelocity);
					_spriteVelocity.multiplyScalar(_velocityDamper);
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