(function(global){
	var bind, isMobile, _self, CanvasClip;
	var cutRect = {
		x: 0,
		y: 0,
		width: 0,
		height: 0
	};
	var clipedDownPoint = {
		x: 0,
		y: 0,
		originalRectX: 0,
		originalRectY: 0
	};
	bind = (function(){
		if(window.addEventListener){
			return function(ele, type, handler){
				ele.addEventListener(type, handler, false);
			}
		}else{
			return function(ele, type, handler){
				ele.attachEvent('on' + type, handler);
			}
		}
	})();
	isMobile = (function() {
		var reg = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
		return reg.test(navigator.userAgent)
	})();
	CanvasClip = function(setting){
		this.previewContainer = setting.previewContainer;
		this.preview = setting.preview;
		this.canvasWidth = setting.canvasWidth || 400;
		this.canvasHeight = setting.canvasHeight || 400;
		this.source = setting.source;
		this.quality = setting.quality || 1;
		this.curRect = {};
		this.ret64 = '';
		this.retBinary = null;
		this.clipLineWidth = 4;
		this.canvas = this.previewContainer.querySelector('canvas') || document.createElement('canvas');
		this.context = this.canvas.getContext('2d');
		this.img = new Image;
		this.canvasPosition = {};

		this._isMouseDown = false;
		this._isMouseMoved = false;

		this._isCliped = false;
		this._isRectChanged = false;


		_self = this;
		this.init();

	}

	CanvasClip.prototype.init = function(){
		var reader = new FileReader();
		reader.onload = function(){
			_self.img.src = this.result;
			_self.img.onload = function(){
				if(_self.img.width > _self.img.height){
					_self.canvas.width = _self.canvasWidth;
					_self.canvas.height = _self.img.height * _self.canvas.width / _self.img.width;
				}else{
					_self.canvas.height = _self.canvasHeight;
					_self.canvas.width = _self.img.width * _self.canvas.height / _self.img.height;
				}
				drawMaskImage();
				makeClip();
				if(_self.previewContainer.childElementCount > 1){
					_self.previewContainer.removeChild(_self.canvas);
				}
				_self.previewContainer.appendChild(_self.canvas);
			}
		};
		reader.readAsDataURL(_self.source);
	};
	CanvasClip.prototype.clip = function(){
		if(_self._isCliped){
			var offCanvas = document.createElement('canvas'),
				offContext = offCanvas.getContext('2d'),
				w = _self.cutRect.width,
				h = _self.cutRect.height;
			offCanvas.width = w;
			offCanvas.height = h;
			offContext.drawImage(_self.canvas, _self.cutRect.x,_self.cutRect.y, w, h, 0, 0, w, h);
			_self.ret64 = offCanvas.toDataURL('image/jpeg', _self.quality);
			_self.preview.src = _self.ret64;
			dataURLtoBlob();
			// drawMaskImage();
			// _self._isCliped = false;
		}
	};
	function dataURLtoBlob(){
		var binaryString = atob(_self.ret64.split(',')[1]),
			arrayBuffer = new ArrayBuffer(binaryString.length),
			unitArray = new Uint8Array(arrayBuffer),
			mime = _self.ret64.split(',')[0].match(/:(.*?);/)[1];
			for(var i = 0, j = binaryString.length; i < j; i++){
				unitArray[i] = binaryString.charCodeAt(i);
			}
			_self.retBinary = new Blob(unitArray, {type: mime});
	}
	function redrawClipedCanvas(){
		drawMaskImage();
		drawClipBox();
	}

	function drawMaskImage(){
		var context = _self.context;
		var canvasWidth = _self.canvas.width;
		var canvasHeight = _self.canvas.height;
		context.clearRect(0, 0, canvasWidth, canvasHeight);

		context.save();
		context.fillStyle = '#fff';
		context.fillRect(0, 0, canvasWidth, canvasHeight);
		context.restore();

		context.drawImage(_self.img, 0 ,0, canvasWidth, canvasHeight);

		context.save();
		context.fillStyle = 'rgba(0, 0, 0, .4)';
		context.beginPath();
		context.fillRect(0, 0, canvasWidth, canvasHeight);
		context.restore();

		_self.canvasPosition = _self.canvas.getBoundingClientRect();
	}
	function drawClipBox(){
		var context = _self.context;
		context.save();
		context.strokeStyle = 'red';
		context.setLineDash([4, 4]);
		context.lineDashOffset = 10;
		context.lineWidth = _self.clipLineWidth;
		context.beginPath();
		context.rect(cutRect.x, cutRect.y, cutRect.width, cutRect.height);
		context.clip();
		context.drawImage(_self.img, 0, 0, _self.canvas.width, _self.canvas.height);
		context.stroke();
		context.restore()
	}

	function makeClip(){
		if(isMobile){
			bind(_self.canvas, 'touchstart', touchDownHandler);
			bind(document, 'touchmove', touchMoveHandler);
			bind(document, 'touchend', touchUpHandler);
		}else{
			bind(_self.canvas, 'mousedown', touchDownHandler);
			bind(document, 'mousemove', touchMoveHandler);
			bind(document, 'mouseup',touchUpHandler);
		}
		var getCoordinate = (function(){
			if(isMobile){
				return function(e){
					return {
						x: e.changedTouches[0].clientX - _self.canvasPosition.left,
						y: e.changedTouches[0].clientY - _self.canvasPosition.top
					}
				}
			}else{
				return function(e){
					return {
						x: e.offsetX,
						y: e.offsetY
					}
				}
			}
		})();
		function isInRect(x,y){
			var beginX = cutRect.x,
				endX = cutRect.x + cutRect.width,
				beginY = cutRect.y,
				endY = cutRect.y + cutRect.height;
			return (beginX < x) && (x < endX) && (beginY < y) && (y < endY);
		}
		function touchDownHandler(e){
			var p = getCoordinate(e),
				x = p.x,
				y = p.y;
			if(!_self._isCliped){
				cutRect.x = x;
				cutRect.y = y;
				_self._isMouseDown = true;
			}else{
				if(isInRect(x, y)){
					clipedDownPoint.x = x;
					clipedDownPoint.y = y;
					clipedDownPoint.originalRectX = cutRect.x;
					clipedDownPoint.originalRectY = cutRect.y;
					_self._isMouseDown = true;
				}else{
					drawMaskImage();
					_self._isCliped = false;
				}
			}
			e.preventDefault();
		}
		function touchMoveHandler(e){
			var target = isMobile ? document.elementFromPoint(e.touches[0].pageX, e.touches[0].pageY) : e.target;
			if(target === _self.canvas){
				if(_self._isMouseDown){
					_self._isMouseMoved = true;
					if(!_self._isCliped){
						_self._isRectChanged = true;
						var p = getCoordinate(e);
						(p.x < cutRect.x) && (p.x = cutRect.x);
						(p.y < cutRect.y) && (p.y = cutRect.y);
						cutRect.width = p.x - cutRect.x;
						// cutRect.height = p.y - cutRect.y;
						cutRect.height = p.x - cutRect.x;

						if((cutRect.width + cutRect.x) > _self.canvas.width){
							cutRect.height = cutRect.width = _self.canvas.width - cutRect.x;
						}
						if((cutRect.height + cutRect.y) > _self.canvas.height){
							cutRect.height = cutRect.width = _self.canvas.height - cutRect.y;
						}
						redrawClipedCanvas();
					}else{
						_self._isRectChanged = false;
						var p = getCoordinate(e);
						cutRect.x = clipedDownPoint.originalRectX + p.x - clipedDownPoint.x;
						cutRect.y = clipedDownPoint.originalRectY + p.y - clipedDownPoint.y;
						(cutRect.x < 0) && (cutRect.x = 0);
						(cutRect.y < 0) && (cutRect.y = 0);
						(cutRect.x > _self.canvas.width - cutRect.width) && (cutRect.x = _self.canvas.width - cutRect.width);
						(cutRect.y > _self.canvas.height - cutRect.height) && (cutRect.y = _self.canvas.height - cutRect.height);
						redrawClipedCanvas();
					}
				}
				addCursor(e);
			}
		}
		function addCursor(e){
			if(_self._isCliped){
				var p = getCoordinate(e),
					x = p.x,
					y = p.y;
				if(isInRect(x,y) && _self.canvas.style.cursor !== 'move'){
					_self.canvas.style.cursor = 'move';
				}
				if(!isInRect(x, y) && _self.canvas.style.cursor !== 'default'){
					_self.canvas.style.cursor = 'default';
				}
			}
		}
		function touchUpHandler(e){
			_self._isMouseDown = false;
			addCursor(e);
			if(_self._isMouseMoved && (cutRect.width > 0)){
				_self._isMouseMoved = false;
				_self._isCliped = true;
				cutRect = {
					x: cutRect.width < 0 ? (cutRect.x + _self.clipLineWidth / 2 + cutRect.width) : (cutRect.x + _self.clipLineWidth / 2),
					y: cutRect.height < 0 ? (cutRect.y + _self.clipLineWidth / 2 + cutRect.height) : (cutRect.y + _self.clipLineWidth / 2),
					width: Math.abs(cutRect.width) - _self.clipLineWidth,
					height: Math.abs(cutRect.height) - _self.clipLineWidth
				};
				_self.cutRect = cutRect;
				_self.clip();
			}else{
				_self.preview.src = '';
			}

		}
	}

	if (typeof define === 'function' && define.amd){
		define(function(){
			return CanvasClip;
		});
	}else if(typeof module !== 'undefined' && module.exports){
		module.exports = CanvasClip;
	}else{
		global.CanvasClip = CanvasClip;
	}
})(window);