/*
* Overlay v1.2.1 Copyright (c) 2015 AJ Savino
* https://github.com/koga73/Overlay
* 
* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:
* 
* The above copyright notice and this permission notice shall be included in
* all copies or substantial portions of the Software.
* 
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
* THE SOFTWARE.
*/
var Overlay = (function(){
	var _instance;
	
	var _events = {
		EVENT_BEFORE_SHOW:"beforeshow",
		EVENT_AFTER_SHOW:"aftershow",
		EVENT_BEFORE_HIDE:"beforehide",
		EVENT_AFTER_HIDE:"afterhide"
	};
	
	var _consts = {
		ID_CONTAINER:"overlayContainer",
		ID_BACKGROUND:"overlayBackground",
		ID_FRAME:"overlayFrame",
		ID_CLOSE:"overlayClose",
		CLASS_FRAME_VISIBLE:"visible",
		CLASS_BODY_OVERLAY_VISIBLE:"overlay-visible"
	};
	
	var _vars = {
		container:document.body,
		
		_container:null,
		_background:null,
		_content:null,
		_frame:null,
		_close:null,
		
		_showCallback:null,
		_hideCallback:null,
	};
	
	var _methods = {
		initialize:function(){
			var container = document.createElement("div");
			container.setAttribute("id", _consts.ID_CONTAINER);
			_vars._container = container;
			
			var background = document.createElement("div");
			background.setAttribute("id", _consts.ID_BACKGROUND);
			_vars._background = background;
			
			var frame = document.createElement("div");
			frame.setAttribute("id", _consts.ID_FRAME);
			_vars._frame = frame;
			
			var close = document.createElement("button");
			close.setAttribute("id", _consts.ID_CLOSE);
			close.setAttribute("type", "button");
			_vars._close = close;
			
			frame.appendChild(close);
			container.appendChild(background);
			container.appendChild(frame);
		},
		
		destroy:function(){
			ClassHelper.removeClass(document.body, _consts.CLASS_BODY_OVERLAY_VISIBLE);
			
			var close = _vars._close;
			if (close){
				OOP.removeEventListener(close, "click", _methods._handler_close_clicked);
			}
			_vars._close = null;
			
			_vars._frame = null;
			
			var content = _vars._content;
			if (content){
				content.parentNode.removeChild(content);
				if (typeof content._overlayData.width !== typeof undefined){
					content.style.width = ""; //content._overlayData.width;
				}
				if (typeof content._overlayData.height !== typeof undefined){
					content.style.height = ""; //content._overlayData.height;
				}
				if (typeof content._overlayData.parent !== typeof undefined){
					content._overlayData.parent.appendChild(content);
				}
				content._overlayData = null;
			}
			_vars._content = null;
			
			var background = _vars._background;
			if (background){
				OOP.removeEventListener(background, "click", _methods._handler_background_click);
			}
			_vars._background = null;
			
			var container = _vars._container;
			if (container && container.parentNode){
				container.setAttribute("class", "");
				container.parentNode.removeChild(container);
			}
			_vars._container = null;
			
			_vars._showCallback = null;
			_vars._hideCallback = null;
		},
		
		show:function(contentID, options, callback){
			_vars._showCallback = callback;
			ClassHelper.addClass(document.body, _consts.CLASS_BODY_OVERLAY_VISIBLE);
			OOP.dispatchEvent(_instance, new OOP.Event(_instance.EVENT_BEFORE_SHOW));
			
			//Hide current
			if (_vars._content != null){
				_instance.hide(function(){ //Callback chaining
					_instance.show(contentID, options, callback);
				});
				return;
			}
			
			//Parse parameters
			var width, height, offsetX, offsetY;
			var containerClass = "";
			if (typeof options !== typeof undefined){
				if (typeof options.width !== typeof undefined){
					width = options.width;
				}
				if (typeof options.height !== typeof undefined){
					height = options.height;
				}
				if (typeof options.offsetX !== typeof undefined){
					offsetX = options.offsetX;
				}
				if (typeof options.offsetY !== typeof undefined){
					offsetY = options.offsetY;
				}
				if (typeof options.containerClass !== typeof undefined){
					containerClass = options.containerClass;
				}
			}
			
			//Cache
			var container = _vars._container;
			var background = _vars._background;
			var frame = _vars._frame;
			var close = _vars._close;
			
			//Set frame dimensions to content dimensions and apply parameter overrides
			var content = document.getElementById(contentID);
			content._overlayData = content._overlayData || {};
			if (typeof width === typeof undefined){
				if (typeof document.documentElement.currentStyle !== typeof undefined){ //IE
					width = content.currentStyle.width;
				} else {
					width = window.getComputedStyle(content).width;
				}
			}
			if (parseInt(width)){
				frame.style.width = width;
				content._overlayData.width = width;
				content.style.width = "100%";
			} else {
				frame.style.width = "";
			}
			if (typeof height === typeof undefined){
				if (typeof document.documentElement.currentStyle !== typeof undefined){ //IE
					height = content.currentStyle.height;
				} else {
					height = window.getComputedStyle(content).height;
				}
			}
			if (parseInt(height)){
				frame.style.height = height;
				content._overlayData.height = height;
				content.style.height = "100%";
			} else {
				frame.style.height = "";
			}
			if (typeof offsetX !== typeof undefined){
				frame.style.left = offsetX;
			} else {
				frame.style.left = "";
			}
			if (typeof offsetY !== typeof undefined){
				frame.style.top = offsetY;
			} else {
				frame.style.top = "";
			}
			_vars._content = content;
			
			//Wire events
			OOP.addEventListener(background, "click", _methods._handler_background_click);
			OOP.addEventListener(close, "click", _methods._handler_close_clicked);
			
			//Append content
			content._overlayData.parent = content.parentNode;
			content.parentNode.removeChild(content);
			frame.appendChild(content);
			
			//Append container
			var appendContainer = _instance.container;
			if (_instance.container.length){
				appendContainer = _instance.container[0];
			}
			appendContainer.appendChild(container);
			
			//Add containerClass
			ClassHelper.addClass(container, containerClass);
			var timeout = setTimeout(function(){ //Delay needed for transition to render
				clearTimeout(timeout);
				ClassHelper.addClass(container, _consts.CLASS_FRAME_VISIBLE);
			}, 50);
			
			//Wait for transition before completing show
			if (TransitionHelper.hasTransition(background) || TransitionHelper.hasTransition(frame)){
				TransitionHelper.offTransitionComplete(container);
				TransitionHelper.onTransitionComplete(container, _methods._handler_show_complete);
			} else {
				_methods._handler_show_complete();
			}
		},
		
		hide:function(callback){
			_vars._hideCallback = callback;
			OOP.dispatchEvent(_instance, new OOP.Event(_instance.EVENT_BEFORE_HIDE));
			
			//Unwire events
			var close = _vars._close;
			if (close){
				OOP.removeEventListener(close, "click", _methods._handler_close_clicked);
			}
			var background = _vars._background;
			if (background){
				OOP.removeEventListener(background, "click", _methods._handler_background_click);
			}
			
			//Wait for transition before completing hide
			var frame = _vars._frame;
			var container = _vars._container;
			if (container){
				if (TransitionHelper.hasTransition(background) || TransitionHelper.hasTransition(frame)){
					TransitionHelper.offTransitionComplete(container);
					TransitionHelper.onTransitionComplete(container, _methods._handler_hide_complete);
				} else {
					_methods._handler_hide_complete();
				}
				ClassHelper.removeClass(container, _consts.CLASS_FRAME_VISIBLE);
			}
		},
		
		_handler_show_complete:function(){
			TransitionHelper.offTransitionComplete(_vars._container);
			
			OOP.dispatchEvent(_instance, new OOP.Event(_instance.EVENT_AFTER_SHOW));
			var showCallback = _vars._showCallback;
			if (typeof showCallback !== typeof undefined){
				showCallback();
				_vars._showCallback = null;
			}
		},
		
		_handler_hide_complete:function(){
			var container = _vars._container;
			TransitionHelper.offTransitionComplete(container);
			
			//Reset content
			var content = _vars._content;
			if (content){
				content.parentNode.removeChild(content);
				if (typeof content._overlayData.width !== typeof undefined){
					content.style.width = ""; //content._overlayData.width;
				}
				if (typeof content._overlayData.height !== typeof undefined){
					content.style.height = ""; //content._overlayData.height;
				}
				if (typeof content._overlayData.parent !== typeof undefined){
					content._overlayData.parent.appendChild(content);
				}
				content._overlayData = null;
			}
			_vars._content = null;
			
			//Remove container
			container.setAttribute("class", "");
			container.parentNode.removeChild(container);
			
			ClassHelper.removeClass(document.body, _consts.CLASS_BODY_OVERLAY_VISIBLE);
			OOP.dispatchEvent(_instance, new OOP.Event(_instance.EVENT_AFTER_HIDE));
			var hideCallback = _vars._hideCallback;
			if (typeof hideCallback !== typeof undefined){
				hideCallback();
				_vars._hideCallback = null;
			}
		},
		
		_handler_close_clicked:function(evt){
			_instance.hide();
			return false;
		},
		
		_handler_background_click:function(evt){
			_instance.hide();
			return false;
		}
	};
	
	var TransitionHelper = (function(){
		var transitionEvent = null;
		var transitionPrefix = null;
		
		var transitionEvents = [["webkitTransition","webkitTransitionEnd","-webkit-"], ["transition","transitionend",""]];
		var transitionEventsLen = transitionEvents.length;
		for (var i = 0; i < transitionEventsLen; i++){
			if (typeof document.documentElement.style[transitionEvents[i][0]] !== typeof undefined){
				break;
			}
		}
		if (i != transitionEventsLen){
			transitionEvent = transitionEvents[i][1];
			transitionPrefix = transitionEvents[i][2];
		} //else not supported
		
		return {
			hasTransition:function(element){
				if (typeof document.documentElement.currentStyle !== typeof undefined){ //IE
					return parseFloat(element.currentStyle[transitionPrefix + "transition-duration"]) > 0;
				} else {
					return parseFloat(window.getComputedStyle(element)[transitionPrefix + "transition-duration"]) > 0;
				}
			},
			onTransitionComplete:function(element, callback){
				if (transitionEvent){
					OOP.addEventListener(element, transitionEvent, callback);
				} else {
					callback();
				}
			},
			offTransitionComplete:function(element, callback){
				if (transitionEvent){
					if (typeof callback !== typeof undefined){
						OOP.removeEventListener(element, transitionEvent, callback);
					} else {
						OOP.removeEventListener(element, transitionEvent);
					}
				}
			}
		};
	})();
	
	var ClassHelper = (function(){
		//Trim shim
		if (typeof String.prototype.trim !== 'function'){
			String.prototype.trim = function(){
				return this.replace(/^\s+|\s+$/g, ''); 
			}
		}
		
		return {
			addClass:function(element, classes){
				var elementClasses = (element.getAttribute("class") || "").split(" ");
				classes = classes.split(" ");
				for (var className in classes){
					elementClasses.push(classes[className].trim());
				}
				element.setAttribute("class", elementClasses.join(" ").trim());
			},
			
			removeClass:function(element, classes){
				var elementClasses = (element.getAttribute("class") || "").split(" ");
				classes = classes.split(" ");
				for (var className in classes){
					var elementClassesLen = elementClasses.length;
					for (var i = 0; i < elementClassesLen; i++){
						if (elementClasses[i] == classes[className].trim()){
							elementClasses.splice(i, 1);
							elementClassesLen--;
							i--;
						}
					}
				}
				element.setAttribute("class", elementClasses.join(" ").trim());
			},
			
			hasClass:function(element, classes){
				var elementClasses = (element.getAttribute("class") || "").split(" ");
				classes = classes.split(" ");
				var hasCount = 0;
				for (var className in classes){
					var elementClassesLen = elementClasses.length;
					for (var i = 0; i < elementClassesLen; i++){
						if (elementClasses[i] == classes[className].trim()){
							hasCount++;
							break;
						}
					}
				}
				if (hasCount == classes.length){
					return true;
				} else {
					return false
				}
			}
		};
	})();
	
	_instance = {
		EVENT_BEFORE_SHOW:_events.EVENT_BEFORE_SHOW,
		EVENT_AFTER_SHOW:_events.EVENT_AFTER_SHOW,
		EVENT_BEFORE_HIDE:_events.EVENT_BEFORE_HIDE,
		EVENT_AFTER_HIDE:_events.EVENT_AFTER_HIDE,
		
		container:_vars.container,
		
		initialize:_methods.initialize,
		destroy:_methods.destroy,
		hide:_methods.hide,
		show:_methods.show
	};
	return _instance;
})();

//OOP dependency for events
if (!OOP){
	var OOP = (function(){
		var _methods = {
			//Safe cross-browser event (use 'new OOP.Event()')
			event:function(type, data){
				var event = null;
				try { //IE catch
					event = new CustomEvent(type); //Non-IE
				} catch (ex){
					if (document.createEventObject){ //IE
						event = document.createEventObject("Event");
						if (event.initCustomEvent){
							event.initCustomEvent(type, true, true);
						}
					} else { //Custom
						event = {};
					}
				}
				event._type = type;
				event._data = data;
				return event;
			},

			//Safe cross-browser way to listen for one or more events
			//Pass obj, comma delimeted event types, and a handler
			addEventListener:function(obj, types, handler){
				if (!obj._eventHandlers){
					obj._eventHandlers = {};
				}
				types = types.split(",");
				var typesLen = types.length;
				for (var i = 0; i < typesLen; i++){
					var type = types[i];
					if (obj.addEventListener){ //Standard
						handler = _methods._addEventHandler(obj, type, handler);
						obj.addEventListener(type, handler);
					} else if (obj.attachEvent){ //IE
						var attachHandler = function(){
							handler(window.event);
						}
						attachHandler.handler = handler; //Store reference to original handler
						attachHandler = _methods._addEventHandler(obj, type, attachHandler);
						obj.attachEvent("on" + type, attachHandler);
					} else if (typeof jQuery !== typeof undefined){ //jQuery
						handler = _methods._addEventHandler(obj, type, handler);
						jQuery.on(type, handler);
					} else { //Custom
						obj.addEventListener = _methods._addEventListener;
						obj.addEventListener(type, handler);
					}
				}
			},

			//This is the custom method that gets added to objects
			_addEventListener:function(type, handler){
				handler._isCustom = true;
				_methods._addEventHandler(this, type, handler);
			},

			//Stores and returns handler reference
			_addEventHandler:function(obj, type, eventHandler){
				if (!obj._eventHandlers[type]){
					obj._eventHandlers[type] = [];
				}
				var eventHandlers = obj._eventHandlers[type];
				var eventHandlersLen = eventHandlers.length;
				for (var i = 0; i < eventHandlersLen; i++){
					if (eventHandlers[i] === eventHandler){
						return eventHandler;
					} else if (eventHandlers[i].handler && eventHandlers[i].handler === eventHandler){
						return eventHandlers[i];
					}
				}
				eventHandlers.push(eventHandler);
				return eventHandler;
			},

			//Safe cross-browser way to listen for one or more events
			//Pass obj, comma delimeted event types, and optionally handler
			//If no handler is passed all handlers for each event type will be removed
			removeEventListener:function(obj, types, handler){
				if (!obj._eventHandlers){
					obj._eventHandlers = {};
				}
				types = types.split(",");
				var typesLen = types.length;
				for (var i = 0; i < typesLen; i++){
					var type = types[i];
					var handlers;
					if (typeof handler === typeof undefined){
						handlers = obj._eventHandlers[type] || [];
					} else {
						handlers = [handler];
					}
					var handlersLen = handlers.length;
					for (var j = 0; j < handlersLen; j++){
						var handler = handlers[j];
						if (obj.removeEventListener){ //Standard
							handler = _methods._removeEventHandler(obj, type, handler);
							obj.removeEventListener(type, handler);
						} else if (obj.detachEvent){ //IE
							handler = _methods._removeEventHandler(obj, type, handler);
							obj.detachEvent("on" + type, handler);
						} else if (typeof jQuery !== typeof undefined){ //jQuery
							handler = _methods._removeEventHandler(obj, type, handler);
							jQuery.off(type, handler);
						} else { //Custom
							obj.removeEventListener = _methods._removeEventListener;
							obj.removeEventListener(type, handler);
						}
					}
				}
			},

			//This is the custom method that gets added to objects
			//Pass comma delimeted event types, and optionally handler
			//If no handler is passed all handlers for each event type will be removed
			_removeEventListener:function(types, handler){
				types = types.split(",");
				var typesLen = types.length;
				for (var i = 0; i < typesLen; i++){
					var type = types[i];
					var handlers;
					if (typeof handler === typeof undefined){
						handlers = this._eventHandlers[type] || [];
					} else {
						handlers = [handler];
					}
					var handlersLen = handlers.length;
					for (var j = 0; j < handlersLen; j++){
						var handler = handlers[j];
						handler._isCustom = false;
						_methods._removeEventHandler(this, type, handler);
					}
				}
			},

			//Removes and returns handler reference
			_removeEventHandler:function(obj, type, eventHandler){
				if (!obj._eventHandlers[type]){
					obj._eventHandlers[type] = [];
				}
				var eventHandlers = obj._eventHandlers[type];
				var eventHandlersLen = eventHandlers.length;
				for (var i = 0; i < eventHandlersLen; i++){
					if (eventHandlers[i] === eventHandler){
						return eventHandlers.splice(i, 1)[0];
					} else if (eventHandlers[i].handler && eventHandlers[i].handler === eventHandler){
						return eventHandlers.splice(i, 1)[0];
					}
				}
			},

			//Safe cross-browser way to dispatch an event
			dispatchEvent:function(obj, event){
				if (!obj._eventHandlers){
					obj._eventHandlers = {};
				}
				if (obj.dispatchEvent){ //Standard
					obj.dispatchEvent(event);
				} else if (obj.fireEvent){ //IE
					obj.fireEvent("on" + type, event);
				} else if (typeof jQuery !== typeof undefined){
					jQuery(obj).trigger(jQuery.Event(event._type, {
						_type:event._type,
						_data:event._data
					}));
				} else { //Custom
					obj.dispatchEvent = _methods._dispatchEvent;
					obj.dispatchEvent(event);
				}
			},

			//This is the custom method that gets added to objects
			_dispatchEvent:function(event){
				_methods._dispatchEventHandlers(this, event);
			},

			//Dispatches an event to handler references
			_dispatchEventHandlers: function(obj, event){
				var eventHandlers = obj._eventHandlers[event._type];
				if (!eventHandlers){
					return;
				}
				var eventHandlersLen = eventHandlers.length;
				for (var i = 0; i < eventHandlersLen; i++){
					eventHandlers[i](event);
				}
			}
		};
		
		return {
			Event:_methods.event,
			
			addEventListener:_methods.addEventListener,
			removeEventListener:_methods.removeEventListener,
			dispatchEvent:_methods.dispatchEvent,
		};
	})();
}

Overlay.initialize();