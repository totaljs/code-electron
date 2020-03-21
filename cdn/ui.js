COMPONENT('exec', function(self, config) {
	self.readonly();
	self.blind();
	self.make = function() {
		self.event('click', config.selector || '.exec', function(e) {
			var el = $(this);

			var attr = el.attrd('exec');
			var path = el.attrd('path');
			var href = el.attrd('href');
			var def = el.attrd('def');
			var reset = el.attrd('reset');

			if (el.attrd('prevent') === 'true') {
				e.preventDefault();
				e.stopPropagation();
			}

			attr && EXEC(attr, el, e);
			href && NAV.redirect(href);
			def && DEFAULT(def);
			reset && RESET(reset);

			if (path) {
				var val = el.attrd('value');
				if (val) {
					var v = GET(path);
					SET(path, new Function('value', 'return ' + val)(v), true);
				}
			}
		});
	};
});

COMPONENT('validation', 'delay:100;flags:visible', function(self, config) {

	var path, elements = null;
	var def = 'button[name="submit"]';
	var flags = null;

	self.readonly();

	self.make = function() {
		elements = self.find(config.selector || def);
		path = self.path.replace(/\.\*$/, '');
		setTimeout(function() {
			self.watch(self.path, self.state, true);
		}, 50);
	};

	self.configure = function(key, value, init) {
		switch (key) {
			case 'selector':
				if (!init)
					elements = self.find(value || def);
				break;
			case 'flags':
				if (value) {
					flags = value.split(',');
					for (var i = 0; i < flags.length; i++)
						flags[i] = '@' + flags[i];
				} else
					flags = null;
				break;
		}
	};

	self.state = function() {
		setTimeout2(self.id, function() {
			var disabled = DISABLED(path, flags);
			if (!disabled && config.if)
				disabled = !EVALUATE(self.path, config.if);
			elements.prop('disabled', disabled);
		}, config.delay);
	};
});

COMPONENT('form', 'zindex:12;scrollbar:1', function(self, config, cls) {

	var cls2 = '.' + cls;
	var container;
	var csspos = {};

	if (!W.$$form) {

		W.$$form_level = W.$$form_level || 1;
		W.$$form = true;

		$(document).on('click', cls2 + '-button-close', function() {
			SET($(this).attrd('path'), '');
		});

		var resize = function() {
			setTimeout2('form', function() {
				for (var i = 0; i < M.components.length; i++) {
					var com = M.components[i];
					if (com.name === 'form' && !HIDDEN(com.dom) && com.$ready && !com.$removed)
						com.resize();
				}
			}, 200);
		};

		if (W.OP)
			W.OP.on('resize', resize);
		else
			$(W).on('resize', resize);

		$(document).on('click', cls2 + '-container', function(e) {
			var el = $(e.target);
			if (!(el.hclass(cls + '-container-padding') || el.hclass(cls + '-container')))
				return;
			var form = $(this).find(cls2);
			var c = cls + '-animate-click';
			form.aclass(c);
			setTimeout(function() {
				form.rclass(c);
			}, 300);
		});
	}

	self.readonly();
	self.submit = function() {
		if (config.submit)
			EXEC(config.submit, self.hide, self.element);
		else
			self.hide();
	};

	self.cancel = function() {
		config.cancel && EXEC(config.cancel, self.hide);
		self.hide();
	};

	self.hide = function() {
		self.set('');
	};

	self.icon = function(value) {
		var el = this.rclass2('fa');
		value.icon && el.aclass(value.icon.indexOf(' ') === -1 ? ('fa fa-' + value.icon) : value.icon);
	};

	self.resize = function() {

		if (self.scrollbar) {
			container.css('height', WH);
			self.scrollbar.resize();
		}

		if (!config.center || self.hclass('hidden'))
			return;

		var ui = self.find(cls2);
		var fh = ui.innerHeight();
		var wh = WH;
		var r = (wh / 2) - (fh / 2);
		csspos.marginTop = (r > 30 ? (r - 15) : 20) + 'px';
		ui.css(csspos);
	};

	self.make = function() {

		$(document.body).append('<div id="{0}" class="hidden {4}-container invisible"><div class="{4}-scrollbar"><div class="{4}-container-padding"><div class="{4}" style="max-width:{1}px"><div data-bind="@config__html span:value.title__change .{4}-icon:@icon" class="{4}-title"><button name="cancel" class="{4}-button-close{3}" data-path="{2}"><i class="fa fa-times"></i></button><i class="{4}-icon"></i><span></span></div></div></div></div>'.format(self.ID, config.width || 800, self.path, config.closebutton == false ? ' hidden' : '', cls));

		var scr = self.find('> script');
		self.template = scr.length ? scr.html().trim() : '';
		if (scr.length)
			scr.remove();

		var el = $('#' + self.ID);
		var body = el.find(cls2)[0];
		container = el.find(cls2 + '-scrollbar');

		if (config.scrollbar) {
			el.css('overflow', 'hidden');
			self.scrollbar = SCROLLBAR(el.find(cls2 + '-scrollbar'), { visibleY: 1, orientation: 'y' });
		}

		while (self.dom.children.length)
			body.appendChild(self.dom.children[0]);

		self.rclass('hidden invisible');
		self.replace(el, true);

		self.event('scroll', function() {
			EMIT('scroll', self.name);
			EMIT('reflow', self.name);
		});

		self.event('click', 'button[name]', function() {
			var t = this;
			switch (t.name) {
				case 'submit':
					self.submit(self.hide);
					break;
				case 'cancel':
					!t.disabled && self[t.name](self.hide);
					break;
			}
		});

		config.enter && self.event('keydown', 'input', function(e) {
			e.which === 13 && !self.find('button[name="submit"]')[0].disabled && setTimeout(self.submit, 800);
		});
	};

	self.configure = function(key, value, init, prev) {
		if (init)
			return;
		switch (key) {
			case 'width':
				value !== prev && self.find(cls2).css('max-width', value + 'px');
				break;
			case 'closebutton':
				self.find(cls2 + '-button-close').tclass('hidden', value !== true);
				break;
		}
	};

	self.setter = function(value) {

		setTimeout2(cls + '-noscroll', function() {
			$('html').tclass(cls + '-noscroll', !!$(cls2 + '-container').not('.hidden').length);
		}, 50);

		var isHidden = value !== config.if;

		if (self.hclass('hidden') === isHidden) {
			if (!isHidden) {
				config.reload && EXEC(config.reload, self);
				config.default && DEFAULT(config.default, true);
			}
			return;
		}

		setTimeout2(cls, function() {
			EMIT('reflow', self.name);
		}, 10);

		if (isHidden) {
			self.aclass('hidden');
			self.release(true);
			self.find(cls2).rclass(cls + '-animate');
			W.$$form_level--;
			return;
		}

		if (self.template) {
			var is = self.template.COMPILABLE();
			self.find(cls2).append(self.template);
			self.template = null;
			is && COMPILE();
		}

		if (W.$$form_level < 1)
			W.$$form_level = 1;

		W.$$form_level++;

		self.css('z-index', W.$$form_level * config.zindex);
		self.element.scrollTop(0);
		self.rclass('hidden');

		self.resize();
		self.release(false);

		config.reload && EXEC(config.reload, self);
		config.default && DEFAULT(config.default, true);

		if (!isMOBILE && config.autofocus) {
			setTimeout(function() {
				self.find(typeof(config.autofocus) === 'string' ? config.autofocus : 'input[type="text"],select,textarea').eq(0).focus();
			}, 1000);
		}

		setTimeout(function() {
			self.rclass('invisible');
			self.element.scrollTop(0);
			self.find(cls2).aclass(cls + '-animate');
		}, 300);

		// Fixes a problem with freezing of scrolling in Chrome
		setTimeout2(self.ID, function() {
			self.css('z-index', (W.$$form_level * config.zindex) + 1);
		}, 500);
	};
});

COMPONENT('togglebutton', function(self, config) {

	var cls = 'ui-togglebutton';
	var icon;

	self.nocompile();

	self.validate = function(value) {
		return (config.disabled || !config.required) ? true : value === true;
	};

	self.configure = function(key, value, init) {
		switch (key) {
			case 'disabled':
				!init && self.tclass('ui-disabled', value);
				break;
			case 'icontrue':
			case 'iconfalse':
				if (value.indexOf(' ') === -1)
					config[key] = 'fa fa-' + value;
				break;
		}
	};

	self.make = function() {
		self.aclass(cls);
		self.append('<button><i></i></button>');
		icon = self.find('i');
		self.event('click', function() {
			if (!config.disabled) {
				self.dirty(false);
				self.getter(!self.get());
			}
		});
	};

	self.setter = function(value) {
		self.tclass(cls + '-selected', value === true);
		icon.rclass();
		if (value === true) {
			if (config.icontrue)
				icon.aclass(config.icontrue);
		} else {
			if (config.iconfalse)
				icon.aclass(config.iconfalse);
		}
	};

	self.state = function(type) {
		if (!type)
			return;
		var invalid = config.required ? self.isInvalid() : false;
		if (invalid === self.$oldstate)
			return;
		self.$oldstate = invalid;
		self.tclass(cls + '-invalid', invalid);
	};
});

COMPONENT('movable', function(self, config) {

	var events = {};
	var draggable;

	self.readonly();
	self.blind();

	self.make = function() {
		$(document).on('dragenter dragover dragexit drop dragleave dragstart', config.selector, events.ondrag).on('mousedown', config.selector, events.ondown);
	};

	events.ondrag = function(e) {

		if (!draggable)
			return;

		if (e.type !== 'dragstart') {
			e.stopPropagation();
			e.preventDefault();
		}

		switch (e.type) {
			case 'drop':

				var parent = draggable.parentNode;
				var a = draggable;
				var b = e.target;
				var ai = -1;
				var bi = -1;
				var is = false;

				while (true) {
					if (b.parentNode === parent) {
						is = true;
						break;
					}
					b = b.parentNode;
					if (b == null || b.tagName === 'HTML')
						break;
				}

				if (a === b || !is)
					return;

				for (var i = 0; i < parent.children.length; i++) {
					var child = parent.children[i];
					if (a === child)
						ai = i;
					else if (b === child)
						bi = i;
					if (bi !== -1 && ai !== -1)
						break;
				}

				if (ai > bi)
					parent.insertBefore(a, b);
				else
					parent.insertBefore(a, b.nextSibling);

				config.exec && EXEC(config.exec, self.find(config.selector), a, b);
				break;

			case 'dragstart':
				var eo = e.originalEvent;
				if (eo.dataTransfer)
					eo.dataTransfer.setData('text', '1');
				break;
			case 'dragenter':
			case 'dragover':
			case 'dragexit':
			case 'dragleave':
				break;
		}
	};

	events.ondown = function() {
		draggable = this;
	};

	self.destroy = function() {
		$(document).off('dragenter dragover dragexit drop dragleave dragstart', config.selector, events.ondrag).off('mousedown', config.selector, events.ondown);
	};
});

COMPONENT('textarea', 'scrollbar:true', function(self, config) {

	var input, content = null;

	self.nocompile && self.nocompile();

	self.validate = function(value) {
		if (config.disabled || !config.required || config.readonly)
			return true;
		if (value == null)
			value = '';
		else
			value = value.toString();
		return value.length > 0;
	};

	self.configure = function(key, value, init) {
		if (init)
			return;

		var redraw = false;

		switch (key) {
			case 'readonly':
				self.find('textarea').prop('readonly', value);
				break;
			case 'disabled':
				self.tclass('ui-disabled', value);
				self.find('textarea').prop('disabled', value);
				self.reset();
				break;
			case 'required':
				self.noValid(!value);
				!value && self.state(1, 1);
				self.tclass('ui-textarea-required', value);
				break;
			case 'placeholder':
				input.prop('placeholder', value || '');
				break;
			case 'maxlength':
				input.prop('maxlength', value || 1000);
				break;
			case 'label':
				redraw = true;
				break;
			case 'autofocus':
				input.focus();
				break;
			case 'monospace':
				self.tclass('ui-textarea-monospace', value);
				break;
			case 'icon':
				redraw = true;
				break;
			case 'format':
				self.format = value;
				self.refresh();
				break;
			case 'height':
				self.find('textarea').css('height', (value > 0 ? value + 'px' : value));
				break;
		}

		redraw && setTimeout2('redraw' + self.id, function() {
			self.redraw();
			self.refresh();
		}, 100);
	};

	self.redraw = function() {

		var attrs = [];
		var builder = [];

		self.tclass('ui-disabled', !!config.disabled);
		self.tclass('ui-textarea-monospace', !!config.monospace);
		self.tclass('ui-textarea-required', !!config.required);

		config.placeholder && attrs.attr('placeholder', config.placeholder);
		config.maxlength && attrs.attr('maxlength', config.maxlength);
		config.error && attrs.attr('error');
		attrs.attr('data-jc-bind', '');
		config.height && attrs.attr('style', 'height:{0}px'.format(config.height));
		config.autofocus === 'true' && attrs.attr('autofocus');
		config.disabled && attrs.attr('disabled');
		config.readonly && attrs.attr('readonly');
		builder.push('<textarea {0}></textarea>'.format(attrs.join(' ')));

		var label = config.label || content;

		if (!label.length) {
			config.error && builder.push('<div class="ui-textarea-helper"><i class="fa fa-warning" aria-hidden="true"></i> {0}</div>'.format(config.error));
			self.aclass('ui-textarea ui-textarea-container');
			self.html(builder.join(''));
			input = self.find('textarea');
			return;
		}

		var html = builder.join('');

		builder = [];
		builder.push('<div class="ui-textarea-label">');
		config.icon && builder.push('<i class="fa fa-{0}"></i>'.format(config.icon));
		builder.push(label);
		builder.push(':</div><div class="ui-textarea">{0}</div>'.format(html));
		config.error && builder.push('<div class="ui-textarea-helper"><i class="fa fa-warning" aria-hidden="true"></i> {0}</div>'.format(config.error));

		self.html(builder.join(''));
		self.rclass('ui-textarea');
		self.aclass('ui-textarea-container');
		input = self.find('textarea');

		if (!config.scrollbar) {
			input.noscrollbar();
			input.css('padding-right', (SCROLLBARWIDTH() + 5) + 'px');
		}
	};

	self.make = function() {
		content = self.html();
		self.type = config.type;
		self.format = config.format;
		self.redraw();
	};

	self.state = function(type) {
		if (!type)
			return;
		var invalid = config.required ? self.isInvalid() : false;
		if (invalid === self.$oldstate)
			return;
		self.$oldstate = invalid;
		self.tclass('ui-textarea-invalid', invalid);
		config.error && self.find('.ui-textarea-helper').tclass('ui-textarea-helper-show', invalid);
	};
});

COMPONENT('viewbox', 'margin:0;scroll:true;delay:100;scrollbar:0;visibleY:1;height:100', function(self, config) {

	var eld, elb;
	var scrollbar;
	var cls = 'ui-viewbox';
	var cls2 = '.' + cls;
	var init = false;

	self.readonly();

	self.init = function() {
		var obj;
		if (W.OP)
			obj = W.OP;
		else
			obj = $(W);

		var resize = function() {
			for (var i = 0; i < M.components.length; i++) {
				var com = M.components[i];
				if (com.name === 'viewbox' && com.dom.offsetParent && com.$ready && !com.$removed)
					com.resize();
			}
		};

		obj.on('resize', function() {
			setTimeout2('viewboxresize', resize, 200);
		});
	};

	self.configure = function(key, value, init) {
		switch (key) {
			case 'disabled':
				eld.tclass('hidden', !value);
				break;
			case 'minheight':
			case 'margin':
			case 'marginxs':
			case 'marginsm':
			case 'marginmd':
			case 'marginlg':
				!init && self.resize();
				break;
			case 'selector': // backward compatibility
				config.parent = value;
				self.resize();
				break;
		}
	};

	self.scrollbottom = function(val) {
		if (val == null)
			return elb[0].scrollTop;
		elb[0].scrollTop = (elb[0].scrollHeight - self.dom.clientHeight) - (val || 0);
		return elb[0].scrollTop;
	};

	self.scrolltop = function(val) {
		if (val == null)
			return elb[0].scrollTop;
		elb[0].scrollTop = (val || 0);
		return elb[0].scrollTop;
	};

	self.make = function() {
		self.aclass('invisible');
		config.scroll && MAIN.version > 17 && self.element.wrapInner('<div class="ui-viewbox-body"></div>');
		self.element.prepend('<div class="ui-viewbox-disabled hidden"></div>');
		eld = self.find('> .{0}-disabled'.format(cls)).eq(0);
		elb = self.find('> .{0}-body'.format(cls)).eq(0);
		self.aclass('{0} {0}-hidden'.format(cls));
		if (config.scroll) {
			if (config.scrollbar) {
				if (MAIN.version > 17) {
					scrollbar = W.SCROLLBAR(self.find(cls2 + '-body'), { visibleY: config.visibleY, visibleX: config.visibleX, orientation: config.visibleX ? null : 'y', parent: self.element });
					self.scrolltop = scrollbar.scrollTop;
					self.scrollbottom = scrollbar.scrollBottom;
				} else
					self.aclass(cls + '-scroll');
			} else {
				self.aclass(cls + '-scroll');
				self.find(cls2 + '-body').aclass('noscrollbar');
			}
		}
		self.resize();
	};

	self.released = function(is) {
		!is && self.resize();
	};

	var css = {};

	self.resize = function(scrolltop) {

		if (self.release())
			return;

		var el = self.parent(config.parent);
		var h = el.height();
		var w = el.width();
		var width = WIDTH();
		var margin = config.margin;
		var responsivemargin = config['margin' + width];

		if (responsivemargin != null)
			margin = responsivemargin;

		if (h === 0 || w === 0) {
			self.$waiting && clearTimeout(self.$waiting);
			self.$waiting = setTimeout(self.resize, 234);
			return;
		}

		h = ((h / 100) * config.height) - margin;

		if (config.minheight && h < config.minheight)
			h = config.minheight;

		css.height = h;
		css.width = self.element.width();
		eld.css(css);

		css.width = null;
		self.css(css);
		elb.length && elb.css(css);
		self.element.SETTER('*', 'resize');
		var c = cls + '-hidden';
		self.hclass(c) && self.rclass(c, 100);
		scrollbar && scrollbar.resize();
		scrolltop && self.scrolltop(0);

		if (!init) {
			self.rclass('invisible', 250);
			init = true;
		}
	};

	self.resizescrollbar = function() {
		scrollbar && scrollbar.resize();
	};

	self.setter = function() {
		setTimeout(self.resize, config.delay, config.scrolltop);
	};
});

COMPONENT('input', 'maxlength:200;dirkey:name;dirvalue:id;increment:1;autovalue:name;direxclude:false;forcevalidation:1;searchalign:1;after:\\:', function(self, config) {

	var cls = 'ui-input';
	var cls2 = '.' + cls;
	var input, placeholder, dirsource, binded, customvalidator, mask, isdirvisible = false, nobindcamouflage = false, focused = false;

	self.nocompile();
	self.bindvisible(20);

	self.init = function() {
		Thelpers.ui_input_icon = function(val) {
			return val.charAt(0) === '!' ? ('<span class="ui-input-icon-custom">' + val.substring(1) + '</span>') : ('<i class="fa fa-' + val + '"></i>');
		};
		W.ui_input_template = Tangular.compile(('{{ if label }}<div class="{0}-label">{{ if icon }}<i class="fa fa-{{ icon }}"></i>{{ fi }}{{ label | raw }}{{ after | raw }}</div>{{ fi }}<div class="{0}-control{{ if licon }} {0}-licon{{ fi }}{{ if ricon || (type === \'number\' && increment) }} {0}-ricon{{ fi }}">{{ if ricon || (type === \'number\' && increment) }}<div class="{0}-icon-right{{ if type === \'number\' && increment }} {0}-increment{{ else if riconclick || type === \'date\' || type === \'time\' || (type === \'search\' && searchalign === 1) || type === \'password\' }} {0}-click{{ fi }}">{{ if type === \'number\' }}<i class="fa fa-caret-up"></i><i class="fa fa-caret-down"></i>{{ else }}{{ ricon | ui_input_icon }}{{ fi }}</div>{{ fi }}{{ if licon }}<div class="{0}-icon-left{{ if liconclick || (type === \'search\' && searchalign !== 1) }} {0}-click{{ fi }}">{{ licon | ui_input_icon }}</div>{{ fi }}<div class="{0}-input{{ if align === 1 || align === \'center\' }} center{{ else if align === 2 || align === \'right\' }} right{{ fi }}">{{ if placeholder && !innerlabel }}<div class="{0}-placeholder">{{ placeholder }}</div>{{ fi }}<input type="{{ if !dirsource && type === \'password\' }}password{{ else }}text{{ fi }}"{{ if autofill }} autocomplete="on" name="{{ PATH }}"{{ else }} name="input' + Date.now() + '" autocomplete="new-password"{{ fi }}{{ if dirsource }} readonly{{ else }} data-jc-bind=""{{ fi }}{{ if maxlength > 0}} maxlength="{{ maxlength }}"{{ fi }}{{ if autofocus }} autofocus{{ fi }} /></div></div>{{ if error }}<div class="{0}-error hidden"><i class="fa fa-warning"></i> {{ error }}</div>{{ fi }}').format(cls));
	};

	self.make = function() {

		if (!config.label)
			config.label = self.html();

		if (isMOBILE && config.autofocus)
			config.autofocus = false;

		config.PATH = self.path.replace(/\./g, '_');

		self.aclass(cls + ' invisible');
		self.rclass('invisible', 100);
		self.redraw();

		self.event('input change', function() {
			if (nobindcamouflage)
				nobindcamouflage = false;
			else
				self.check();
		});

		self.event('focus', 'input', function() {

			if (config.disabled)
				return $(this).blur();

			focused = true;
			self.camouflage(false);
			self.aclass(cls + '-focused');
			config.autocomplete && EXEC(self.makepath(config.autocomplete), self, input.parent());
			if (config.autosource) {
				var opt = {};
				opt.element = self.element;
				opt.search = GET(self.makepath(config.autosource));
				opt.callback = function(value) {
					var val = typeof(value) === 'string' ? value : value[config.autovalue];
					if (config.autoexec) {
						EXEC(self.makepath(config.autoexec), value, function(val) {
							self.set(val, 2);
							self.change();
							self.bindvalue();
						});
					} else {
						self.set(val, 2);
						self.change();
						self.bindvalue();
					}
				};
				SETTER('autocomplete', 'show', opt);
			} else if (config.mask) {
				setTimeout(function(input) {
					input.selectionStart = input.selectionEnd = 0;
				}, 50, this);
			} else if (config.dirsource && (config.autofocus != false && config.autofocus != 0)) {
				if (!isdirvisible)
					self.find(cls2 + '-control').trigger('click');
			}
		});

		self.event('paste', 'input', function(e) {
			if (config.mask) {
				var val = (e.originalEvent.clipboardData || window.clipboardData).getData('text');
				self.set(val.replace(/\s|\t/g, ''));
				e.preventDefault();
			}
		});

		self.event('keydown', 'input', function(e) {

			var t = this;
			var code = e.which;

			if (t.readOnly || config.disabled) {
				// TAB
				if (e.keyCode !== 9) {
					if (config.dirsource) {
						self.find(cls2 + '-control').trigger('click');
						return;
					}
					e.preventDefault();
					e.stopPropagation();
				}
				return;
			}

			if (!config.disabled && config.dirsource && (code === 13 || code > 30)) {
				self.find(cls2 + '-control').trigger('click');
				return;
			}

			if (config.mask) {

				if (e.metaKey) {
					if (code === 8 || code === 127) {
						e.preventDefault();
						e.stopPropagation();
					}
					return;
				}

				if (code === 32) {
					e.preventDefault();
					e.stopPropagation();
					return;
				}

				var beg = e.target.selectionStart;
				var end = e.target.selectionEnd;
				var val = t.value;
				var c;

				if (code === 8 || code === 127) {

					if (beg === end) {
						c = config.mask.substring(beg - 1, beg);
						t.value = val.substring(0, beg - 1) + c + val.substring(beg);
						self.curpos(beg - 1);
					} else {
						for (var i = beg; i <= end; i++) {
							c = config.mask.substring(i - 1, i);
							val = val.substring(0, i - 1) + c + val.substring(i);
						}
						t.value = val;
						self.curpos(beg);
					}

					e.preventDefault();
					return;
				}

				if (code > 40) {

					var cur = String.fromCharCode(code);

					if (mask && mask[beg]) {
						if (!mask[beg].test(cur)) {
							e.preventDefault();
							return;
						}
					}

					c = config.mask.charCodeAt(beg);
					if (c !== 95) {
						beg++;
						while (true) {
							c = config.mask.charCodeAt(beg);
							if (c === 95 || isNaN(c))
								break;
							else
								beg++;
						}
					}

					if (c === 95) {

						val = val.substring(0, beg) + cur + val.substring(beg + 1);
						t.value = val;
						beg++;

						while (beg < config.mask.length) {
							c = config.mask.charCodeAt(beg);
							if (c === 95)
								break;
							else
								beg++;
						}

						self.curpos(beg);
					} else
						self.curpos(beg + 1);

					e.preventDefault();
					e.stopPropagation();
				}
			}

		});

		self.event('blur', 'input', function() {
			focused = false;
			self.camouflage(true);
			self.rclass(cls + '-focused');
		});

		self.event('click', cls2 + '-control', function() {

			if (!config.dirsource || config.disabled || isdirvisible)
				return;

			isdirvisible = true;
			setTimeout(function() {
				isdirvisible = false;
			}, 500);

			var opt = {};
			opt.element = self.find(cls2 + '-control');
			opt.items = dirsource || GET(self.makepath(config.dirsource));
			opt.offsetY = -1 + (config.diroffsety || 0);
			opt.offsetX = 0 + (config.diroffsetx || 0);
			opt.placeholder = config.dirplaceholder;
			opt.render = config.dirrender ? GET(self.makepath(config.dirrender)) : null;
			opt.custom = !!config.dircustom;
			opt.offsetWidth = 2;
			opt.minwidth = config.dirminwidth || 200;
			opt.maxwidth = config.dirmaxwidth;
			opt.key = config.dirkey || config.key;
			opt.empty = config.dirempty;

			if (config.dirsearch === false)
				opt.search = false;

			var val = self.get();
			opt.selected = val;

			if (dirsource && config.direxclude == false) {
				for (var i = 0; i < dirsource.length; i++) {
					var item = dirsource[i];
					if (item)
						item.selected = typeof(item) === 'object' && item[config.dirvalue] === val;
				}
			} else if (config.direxclude) {
				opt.exclude = function(item) {
					return item ? item[config.dirvalue] === val : false;
				};
			}

			opt.callback = function(item, el, custom) {

				// empty
				if (item == null) {
					input.val('');
					self.set(null, 2);
					self.change();
					self.check();
					return;
				}

				var val = custom || typeof(item) === 'string' ? item : item[config.dirvalue || config.value];
				if (custom && typeof(config.dircustom) === 'string') {
					var fn = GET(config.dircustom);
					fn(val, function(val) {
						self.set(val, 2);
						self.change();
						self.bindvalue();
					});
				} else if (custom) {
					if (val) {
						self.set(val, 2);
						self.change();
						if (dirsource)
							self.bindvalue();
						else
							input.val(val);
					}
				} else {
					self.set(val, 2);
					self.change();
					if (dirsource)
						self.bindvalue();
					else
						input.val(val);
				}
			};

			SETTER('directory', 'show', opt);
		});

		self.event('click', cls2 + '-placeholder,' + cls2 + '-label', function(e) {
			if (!config.disabled) {
				if (config.dirsource) {
					e.preventDefault();
					e.stopPropagation();
					self.find(cls2 + '-control').trigger('click');
				} else if (!config.camouflage || $(e.target).hclass(cls + '-placeholder'))
					input.focus();
			}
		});

		self.event('click', cls2 + '-icon-left,' + cls2 + '-icon-right', function(e) {

			if (config.disabled)
				return;

			var el = $(this);
			var left = el.hclass(cls + '-icon-left');
			var opt;

			if (config.dirsource && left && config.liconclick) {
				e.preventDefault();
				e.stopPropagation();
			}

			if (!left && !config.riconclick) {
				if (config.type === 'date') {
					opt = {};
					opt.element = self.element;
					opt.value = self.get();
					opt.callback = function(date) {
						self.change(true);
						self.set(date);
					};
					SETTER('datepicker', 'show', opt);
				} else if (config.type === 'time') {
					opt = {};
					opt.element = self.element;
					opt.value = self.get();
					opt.callback = function(date) {
						self.change(true);
						self.set(date);
					};
					SETTER('timepicker', 'show', opt);
				} else if (config.type === 'search')
					self.set('');
				else if (config.type === 'password')
					self.password();
				else if (config.type === 'number') {
					var n = $(e.target).hclass('fa-caret-up') ? 1 : -1;
					self.change(true);
					self.inc(config.increment * n);
				}
				return;
			}

			if (left && config.liconclick)
				EXEC(self.makepath(config.liconclick), self, el);
			else if (config.riconclick)
				EXEC(self.makepath(config.riconclick), self, el);
			else if (left && config.type === 'search')
				self.set('');

		});
	};

	self.camouflage = function(is) {
		if (config.camouflage) {
			if (is) {
				var t = input[0];
				var arr = t.value.split('');
				for (var i = 0; i < arr.length; i++)
					arr[i] = typeof(config.camouflage) === 'string' ? config.camouflage : '*';
				nobindcamouflage = true;
				t.value = arr.join('');
			} else {
				nobindcamouflage = true;
				var val = self.get();
				input[0].value = val == null ? '' : val;
			}
			self.tclass(cls + '-camouflaged', is);
		}
	};

	self.curpos = function(pos) {
		var el = input[0];
		if (el.createTextRange) {
			var range = el.createTextRange();
			range.move('character', pos);
			range.select();
		} else if (el.selectionStart) {
			el.focus();
			el.setSelectionRange(pos, pos);
		}
	};

	self.validate = function(value) {

		if ((!config.required || config.disabled) && !self.forcedvalidation())
			return true;

		if (config.dirsource)
			return !!value;

		if (customvalidator)
			return customvalidator(value);

		if (self.type === 'date')
			return value instanceof Date && !isNaN(value.getTime());

		if (value == null)
			value = '';
		else
			value = value.toString();

		if (config.mask && typeof(value) === 'string' && value.indexOf('_') !== -1)
			return false;

		if (config.minlength && value.length < config.minlength)
			return false;

		switch (self.type) {
			case 'email':
				return value.isEmail();
			case 'phone':
				return value.isPhone();
			case 'url':
				return value.isURL();
			case 'currency':
			case 'number':
				value = value.parseFloat();
				if ((config.minvalue != null && value < config.minvalue) || (config.maxvalue != null && value > config.maxvalue))
					return false;
				return config.minvalue == null ? value > 0 : true;
		}

		return value.length > 0;
	};

	self.offset = function() {
		var offset = self.element.offset();
		var control = self.find(cls2 + '-control');
		var width = control.width() + 2;
		return { left: offset.left, top: control.offset().top + control.height(), width: width };
	};

	self.password = function(show) {
		var visible = show == null ? input.attr('type') === 'text' : show;
		input.attr('type', visible ? 'password' : 'text');
		self.find(cls2 + '-icon-right').find('i').tclass(config.ricon, visible).tclass('fa-eye-slash', !visible);
	};

	self.getterin = self.getter;
	self.getter = function(value, realtime, nobind) {

		if (nobindcamouflage)
			return;

		if (config.mask && config.masktidy) {
			var val = [];
			for (var i = 0; i < value.length; i++) {
				if (config.mask.charAt(i) === '_')
					val.push(value.charAt(i));
			}
			value = val.join('');
		}

		self.getterin(value, realtime, nobind);
	};

	self.setterin = self.setter;

	self.setter = function(value, path, type) {

		if (config.mask) {
			if (value) {
				if (config.masktidy) {
					var index = 0;
					var val = [];
					for (var i = 0; i < config.mask.length; i++) {
						var c = config.mask.charAt(i);
						val.push(c === '_' ? (value.charAt(index++) || '_') : c);
					}
					value = val.join('');
				}

				// check values
				if (mask) {
					var arr = [];
					for (var i = 0; i < mask.length; i++) {
						var c = value.charAt(i);
						if (mask[i] && mask[i].test(c))
							arr.push(c);
						else
							arr.push(config.mask.charAt(i));
					}
					value = arr.join('');
				}
			} else
				value = config.mask;
		}

		self.setterin(value, path, type);
		self.bindvalue();

		config.camouflage && !focused && setTimeout(self.camouflage, type === 1 ? 1000 : 1, true);

		if (config.type === 'password')
			self.password(true);
	};

	self.check = function() {

		var is = !!input[0].value;

		if (binded === is)
			return;

		binded = is;
		placeholder && placeholder.tclass('hidden', is);
		self.tclass(cls + '-binded', is);

		if (config.type === 'search')
			self.find(cls2 + '-icon-' + (config.searchalign === 1 ? 'right' : 'left')).find('i').tclass(config.searchalign === 1 ? config.ricon : config.licon, !is).tclass('fa-times', is);
	};

	self.bindvalue = function() {

		if (dirsource) {

			var value = self.get();
			var item;

			for (var i = 0; i < dirsource.length; i++) {
				item = dirsource[i];
				if (typeof(item) === 'string') {
					if (item === value)
						break;
					item = null;
				} else if (item[config.dirvalue || config.value] === value) {
					item = item[config.dirkey || config.key];
					break;
				} else
					item = null;
			}

			if (value && item == null && config.dircustom)
				item = value;

			input.val(item || '');

		} else if (config.dirsource)
			input.val(self.get() || '');

		self.check();
	};

	self.redraw = function() {

		if (!config.ricon) {
			if (config.dirsource)
				config.ricon = 'angle-down';
			else if (config.type === 'date') {
				config.ricon = 'calendar';
				if (!config.align && !config.innerlabel)
					config.align = 1;
			} else if (config.type === 'time') {
				config.ricon = 'clock-o';
				if (!config.align && !config.innerlabel)
					config.align = 1;
			} else if (config.type === 'search')
				if (config.searchalign === 1)
					config.ricon = 'search';
				else
					config.licon = 'search';
			else if (config.type === 'password')
				config.ricon = 'eye';
			else if (config.type === 'number') {
				if (!config.align && !config.innerlabel)
					config.align = 1;
			}
		}

		self.tclass(cls + '-masked', !!config.mask);
		self.html(W.ui_input_template(config));
		input = self.find('input');
		placeholder = self.find(cls2 + '-placeholder');
	};

	self.configure = function(key, value) {
		switch (key) {
			case 'dirsource':
				if (config.dirajax || value.indexOf('/') !== -1) {
					dirsource = null;
					self.bindvalue();
				} else {
					self.datasource(value, function(path, value) {
						dirsource = value;
						self.bindvalue();
					});
				}
				self.tclass(cls + '-dropdown', !!value);
				break;
			case 'disabled':
				self.tclass('ui-disabled', value == true);
				input.prop('readonly', value === true);
				self.reset();
				break;
			case 'required':
				self.tclass(cls + '-required', value == true);
				self.reset();
				break;
			case 'type':
				self.type = value;
				break;
			case 'validate':
				customvalidator = value ? (/\(|=|>|<|\+|-|\)/).test(value) ? FN('value=>' + value) : (function(path) { return function(value) { return GET(path)(value); }; })(value) : null;
				break;
			case 'innerlabel':
				self.tclass(cls + '-inner', value);
				break;
			case 'maskregexp':
				if (value) {
					mask = value.toLowerCase().split(',');
					for (var i = 0; i < mask.length; i++) {
						var m = mask[i];
						if (!m || m === 'null')
							mask[i] = '';
						else
							mask[i] = new RegExp(m);
					}
				} else
					mask = null;
				break;
			case 'mask':
				config.mask = value.replace(/#/g, '_');
				break;
		}
	};

	self.formatter(function(path, value) {
		if (value) {
			switch (config.type) {
				case 'lower':
					return value.toString().toLowerCase();
				case 'upper':
					return value.toString().toUpperCase();
				case 'date':
					return value.format(config.format || 'yyyy-MM-dd');
				case 'time':
					return value.format(config.format || 'HH:mm');
				case 'number':
					return config.format ? value.format(config.format) : value;
			}
		}

		return value;
	});

	self.parser(function(path, value) {
		if (value) {
			var tmp;
			switch (config.type) {
				case 'date':
					tmp = self.get();
					if (tmp)
						tmp = tmp.format('HH:mm');
					else
						tmp = '';
					return value + (tmp ? (' ' + tmp) : '');
				case 'lower':
					value = value.toLowerCase();
					break;
				case 'upper':
					value = value.toUpperCase();
					break;
				case 'time':
					tmp = value.split(':');
					var dt = self.get();
					if (dt == null)
						dt = new Date();
					dt.setHours(+(tmp[0] || '0'));
					dt.setMinutes(+(tmp[1] || '0'));
					dt.setSeconds(+(tmp[2] || '0'));
					value = dt;
					break;
			}
		}
		return value ? config.spaces === false ? value.replace(/\s/g, '') : value : value;
	});

	self.state = function(type) {
		if (!type)
			return;
		var invalid = config.required ? self.isInvalid() : self.forcedvalidation() ? self.isInvalid() : false;
		if (invalid === self.$oldstate)
			return;
		self.$oldstate = invalid;
		self.tclass(cls + '-invalid', invalid);
		config.error && self.find(cls2 + '-error').tclass('hidden', !invalid);
	};

	self.forcedvalidation = function() {

		if (!config.forcevalidation)
			return false;

		if (self.type === 'number')
			return false;

		var val = self.get();
		return (self.type === 'phone' || self.type === 'email') && (val != null && (typeof(val) === 'string' && val.length !== 0));
	};

});

COMPONENT('directory', 'minwidth:200', function(self, config) {

	var cls = 'ui-directory';
	var cls2 = '.' + cls;
	var container, timeout, icon, plus, skipreset = false, skipclear = false, ready = false, input = null, issearch = false;
	var is = false, selectedindex = 0, resultscount = 0;
	var templateE = '{{ name | encode | ui_directory_helper }}';
	var templateR = '{{ name | raw }}';
	var template = '<li data-index="{{ $.index }}" data-search="{{ name }}" {{ if selected }} class="current selected{{ if classname }} {{ classname }}{{ fi }}"{{ else if classname }} class="{{ classname }}"{{ fi }}>{0}</li>';
	var templateraw = template.format(templateR);

	template = template.format(templateE);

	Thelpers.ui_directory_helper = function(val) {
		var t = this;
		return t.template ? (typeof(t.template) === 'string' ? t.template.indexOf('{{') === -1 ? t.template : Tangular.render(t.template, this) : t.render(this, val)) : self.opt.render ? self.opt.render(this, val) : val;
	};

	self.template = Tangular.compile(template);
	self.templateraw = Tangular.compile(templateraw);

	self.readonly();
	self.singleton();
	self.nocompile && self.nocompile();

	self.configure = function(key, value, init) {
		if (init)
			return;
		switch (key) {
			case 'placeholder':
				self.find('input').prop('placeholder', value);
				break;
		}
	};

	self.make = function() {

		self.aclass(cls + ' hidden');
		self.append('<div class="{1}-search"><span class="{1}-add hidden"><i class="fa fa-plus"></i></span><span class="{1}-button"><i class="fa fa-search"></i></span><div><input type="text" placeholder="{0}" class="{1}-search-input" name="dir{2}" autocomplete="dir{2}" /></div></div><div class="{1}-container"><ul></ul></div>'.format(config.placeholder, cls, Date.now()));
		container = self.find('ul');
		input = self.find('input');
		icon = self.find(cls2 + '-button').find('.fa');
		plus = self.find(cls2 + '-add');

		self.event('mouseenter mouseleave', 'li', function() {
			if (ready && !issearch) {
				container.find('li.current').rclass('current');
				$(this).aclass('current');
				var arr = container.find('li:visible');
				for (var i = 0; i < arr.length; i++) {
					if ($(arr[i]).hclass('current')) {
						selectedindex = i;
						break;
					}
				}
			}
		});

		self.event('focus', 'input', function() {
			if (self.opt.search === false)
				$(this).blur();
		});

		self.event('click', cls2 + '-button', function(e) {
			skipclear = false;
			input.val('');
			self.search();
			e.stopPropagation();
			e.preventDefault();
		});

		self.event('click', cls2 + '-add', function() {
			if (self.opt.callback) {
				self.opt.scope && M.scope(self.opt.scope);
				self.opt.callback(input.val(), self.opt.element, true);
				self.hide();
			}
		});

		self.event('click', 'li', function(e) {
			if (self.opt.callback) {
				self.opt.scope && M.scope(self.opt.scope);
				self.opt.callback(self.opt.items[+this.getAttribute('data-index')], self.opt.element);
			}
			is = true;
			self.hide(0);
			e.preventDefault();
			e.stopPropagation();
		});

		var e_click = function(e) {
			var node = e.target;
			var count = 0;

			if (is) {
				while (true) {
					var c = node.getAttribute('class') || '';
					if (c.indexOf(cls + '-search-input') !== -1)
						return;
					node = node.parentNode;
					if (!node || !node.tagName || node.tagName === 'BODY' || count > 3)
						break;
					count++;
				}
			} else {
				is = true;
				while (true) {
					var c = node.getAttribute('class') || '';
					if (c.indexOf(cls) !== -1) {
						is = false;
						break;
					}
					node = node.parentNode;
					if (!node || !node.tagName || node.tagName === 'BODY' || count > 4)
						break;
					count++;
				}
			}

			is && self.hide(0);
		};

		var e_resize = function() {
			is && self.hide(0);
		};

		self.bindedevents = false;

		self.bindevents = function() {
			if (!self.bindedevents) {
				$(document).on('click', e_click);
				$(W).on('resize', e_resize);
				self.bindedevents = true;
			}
		};

		self.unbindevents = function() {
			if (self.bindedevents) {
				self.bindedevents = false;
				$(document).off('click', e_click);
				$(W).off('resize', e_resize);
			}
		};

		self.event('keydown', 'input', function(e) {
			var o = false;
			switch (e.which) {
				case 8:
					skipclear = false;
					break;
				case 27:
					o = true;
					self.hide();
					break;
				case 13:
					o = true;
					var sel = self.find('li.current');
					if (self.opt.callback) {
						self.opt.scope && M.scope(self.opt.scope);
						if (sel.length)
							self.opt.callback(self.opt.items[+sel.attrd('index')], self.opt.element);
						else
							self.opt.callback(this.value, self.opt.element, true);
					}
					self.hide();
					break;
				case 38: // up
					o = true;
					selectedindex--;
					if (selectedindex < 0)
						selectedindex = 0;
					self.move();
					break;
				case 40: // down
					o = true;
					selectedindex++;
					if (selectedindex >= resultscount)
						selectedindex = resultscount;
					self.move();
					break;
			}

			if (o) {
				e.preventDefault();
				e.stopPropagation();
			}

		});

		self.event('input', 'input', function() {
			issearch = true;
			setTimeout2(self.ID, self.search, 100, null, this.value);
		});

		var fn = function() {
			is && self.hide(1);
		};

		self.on('reflow', fn);
		self.on('scroll', fn);
		self.on('resize', fn);
		$(W).on('scroll', fn);
	};

	self.move = function() {

		var counter = 0;
		var scroller = container.parent();
		var h = scroller.height();
		var li = container.find('li');
		var hli = li.eq(0).innerHeight() || 30;
		var was = false;
		var last = -1;
		var lastselected = 0;

		li.each(function(index) {
			var el = $(this);

			if (el.hclass('hidden')) {
				el.rclass('current');
				return;
			}

			var is = selectedindex === counter;
			el.tclass('current', is);

			if (is) {
				was = true;
				var t = (hli * (counter || 1));
				var f = Math.ceil((h / hli) / 2);
				if (counter > f)
					scroller[0].scrollTop = (t + f) - (h / 2.8 >> 0);
				else
					scroller[0].scrollTop = 0;
			}

			counter++;
			last = index;
			lastselected++;
		});

		if (!was && last >= 0) {
			selectedindex = lastselected;
			li.eq(last).aclass('current');
		}
	};

	var nosearch = function() {
		issearch = false;
	};

	self.nosearch = function() {
		setTimeout2(self.ID + 'nosearch', nosearch, 500);
	};

	self.search = function(value) {

		if (!self.opt)
			return;

		icon.tclass('fa-times', !!value).tclass('fa-search', !value);
		self.opt.custom && plus.tclass('hidden', !value);

		if (!value && !self.opt.ajax) {
			if (!skipclear)
				container.find('li').rclass('hidden');
			if (!skipreset)
				selectedindex = 0;
			resultscount = self.opt.items ? self.opt.items.length : 0;
			self.move();
			self.nosearch();
			return;
		}

		resultscount = 0;
		selectedindex = 0;

		if (self.opt.ajax) {
			var val = value || '';
			if (self.ajaxold !== val) {
				self.ajaxold = val;
				setTimeout2(self.ID, function(val) {
					self.opt && self.opt.ajax(val, function(items) {
						var builder = [];
						var indexer = {};
						for (var i = 0; i < items.length; i++) {
							var item = items[i];
							if (self.opt.exclude && self.opt.exclude(item))
								continue;
							indexer.index = i;
							resultscount++;
							builder.push(self.opt.raw ? self.templateraw(item, indexer) : self.template(item, indexer));
						}
						skipclear = true;
						self.opt.items = items;
						container.html(builder);
						self.move();
						self.nosearch();
					});
				}, 300, null, val);
			}
		} else if (value) {
			value = value.toSearch();
			container.find('li').each(function() {
				var el = $(this);
				var val = el.attrd('search').toSearch();
				var is = val.indexOf(value) === -1;
				el.tclass('hidden', is);
				if (!is)
					resultscount++;
			});
			skipclear = true;
			self.move();
			self.nosearch();
		}
	};

	self.show = function(opt) {

		// opt.element
		// opt.items
		// opt.callback(value, el)
		// opt.offsetX     --> offsetX
		// opt.offsetY     --> offsetY
		// opt.offsetWidth --> plusWidth
		// opt.placeholder
		// opt.render
		// opt.custom
		// opt.minwidth
		// opt.maxwidth
		// opt.key
		// opt.exclude    --> function(item) must return Boolean
		// opt.search
		// opt.selected   --> only for String Array "opt.items"

		var el = opt.element instanceof jQuery ? opt.element[0] : opt.element;

		if (opt.items == null)
			opt.items = EMPTYARRAY;

		self.tclass(cls + '-default', !opt.render);

		if (!opt.minwidth)
			opt.minwidth = 200;

		if (is) {
			clearTimeout(timeout);
			if (self.target === el) {
				self.hide(1);
				return;
			}
		}

		self.initializing = true;
		self.target = el;
		opt.ajax = null;
		self.ajaxold = null;

		var element = $(opt.element);
		var callback = opt.callback;
		var items = opt.items;
		var type = typeof(items);
		var item;

		if (type === 'string') {
			items = GET(items);
			type = typeof(items);
		}

		if (type === 'function' && callback) {
			type = '';
			opt.ajax = items;
			items = null;
		}

		if (!items && !opt.ajax) {
			self.hide(0);
			return;
		}

		setTimeout(self.bindevents, 500);
		self.tclass(cls + '-search-hidden', opt.search === false);

		self.opt = opt;
		opt.class && self.aclass(opt.class);

		input.val('');

		var builder = [];
		var ta = opt.key ? Tangular.compile((opt.raw ? templateraw : template).replace(/\{\{\sname/g, '{{ ' + opt.key)) : opt.raw ? self.templateraw : self.template;
		var selected = null;

		if (!opt.ajax) {
			var indexer = {};
			for (var i = 0; i < items.length; i++) {
				item = items[i];

				if (typeof(item) === 'string')
					item = { name: item, id: item, selected: item === opt.selected };

				if (opt.exclude && opt.exclude(item))
					continue;

				if (item.selected) {
					selected = i;
					skipreset = true;
				}

				indexer.index = i;
				builder.push(ta(item, indexer));
			}

			if (opt.empty) {
				item = {};
				item[opt.key || 'name'] = opt.empty;
				item.template = '<b>{0}</b>'.format(opt.empty);
				indexer.index = -1;
				builder.unshift(ta(item, indexer));
			}
		}

		self.target = element[0];

		var w = element.width();
		var offset = element.offset();
		var width = w + (opt.offsetWidth || 0);

		if (opt.minwidth && width < opt.minwidth)
			width = opt.minwidth;
		else if (opt.maxwidth && width > opt.maxwidth)
			width = opt.maxwidth;

		ready = false;

		opt.ajaxold = null;
		plus.aclass('hidden');
		self.find('input').prop('placeholder', opt.placeholder || config.placeholder);
		var scroller = self.find(cls2 + '-container').css('width', width + 30);
		container.html(builder);

		var options = { left: 0, top: 0, width: width };

		switch (opt.align) {
			case 'center':
				options.left = Math.ceil((offset.left - width / 2) + (width / 2));
				break;
			case 'right':
				options.left = (offset.left - width) + w;
				break;
			default:
				options.left = offset.left;
				break;
		}

		options.top = opt.position === 'bottom' ? ((offset.top - self.height()) + element.height()) : offset.top;
		options.scope = M.scope ? M.scope() : '';

		if (opt.offsetX)
			options.left += opt.offsetX;

		if (opt.offsetY)
			options.top += opt.offsetY;

		self.css(options);

		!isMOBILE && setTimeout(function() {
			ready = true;
			if (opt.search !== false)
				input.focus();
		}, 200);

		setTimeout(function() {
			self.initializing = false;
			is = true;
			if (selected == null)
				scroller[0].scrollTop = 0;
			else {
				var h = container.find('li:first-child').height();
				var y = (container.find('li.selected').index() * h) - (h * 2);
				scroller[0].scrollTop = y < 0 ? 0 : y;
			}
		}, 100);

		if (is) {
			self.search();
			return;
		}

		selectedindex = selected || 0;
		resultscount = items ? items.length : 0;
		skipclear = true;

		self.search();
		self.rclass('hidden');

		setTimeout(function() {
			if (self.opt && self.target && self.target.offsetParent)
				self.aclass(cls + '-visible');
			else
				self.hide(1);
		}, 100);

		skipreset = false;
	};

	self.hide = function(sleep) {
		if (!is || self.initializing)
			return;
		clearTimeout(timeout);
		timeout = setTimeout(function() {
			self.unbindevents();
			self.rclass(cls + '-visible').aclass('hidden');
			if (self.opt) {
				self.opt.close && self.opt.close();
				self.opt.class && self.rclass(self.opt.class);
				self.opt = null;
			}
			is = false;
		}, sleep ? sleep : 100);
	};
});

COMPONENT('message', function(self, config) {

	var cls = 'ui-message';
	var cls2 = '.' + cls;
	var is, visible = false;

	self.readonly();
	self.singleton();
	self.nocompile && self.nocompile();

	self.make = function() {
		self.aclass(cls + ' hidden');

		self.event('click', 'button', function() {
			self.hide();
		});

		$(window).on('keyup', function(e) {
			visible && e.which === 27 && self.hide();
		});
	};

	self.warning = function(message, icon, fn) {
		if (typeof(icon) === 'function') {
			fn = icon;
			icon = undefined;
		}
		self.callback = fn;
		self.content(cls + '-warning', message, icon || 'warning');
	};

	self.info = function(message, icon, fn) {
		if (typeof(icon) === 'function') {
			fn = icon;
			icon = undefined;
		}
		self.callback = fn;
		self.content(cls + '-info', message, icon || 'info-circle');
	};

	self.success = function(message, icon, fn) {

		if (typeof(icon) === 'function') {
			fn = icon;
			icon = undefined;
		}

		self.callback = fn;
		self.content(cls + '-success', message, icon || 'check-circle');
	};

	self.response = function(message, callback, response) {

		var fn;

		if (typeof(message) === 'function') {
			response = callback;
			fn = message;
			message = null;
		} else if (typeof(callback) === 'function')
			fn = callback;
		else {
			response = callback;
			fn = null;
		}

		if (response instanceof Array) {
			var builder = [];
			for (var i = 0; i < response.length; i++) {
				var err = response[i].error;
				err && builder.push(err);
			}
			self.warning(builder.join('<br />'));
			SETTER('!loading/hide');
		} else if (typeof(response) === 'string') {
			self.warning(response);
			SETTER('!loading/hide');
		} else {
			message && self.success(message);
			fn && fn(response);
		}
	};

	FUNC.messageresponse = function(success, callback) {
		return function(response, err) {
			if (err || response instanceof Array) {

				var msg = [];
				var template = '<div class="' + cls + '-error"><i class="fa fa-warning"></i>{0}</div>';

				if (response instanceof Array) {
					for (var i = 0; i < response.length; i++)
						msg.push(template.format(response[i].error));
					msg = msg.join('');
				} else
					msg = template.format(err.toString());

				self.warning(msg);
			} else {
				self.success(success);
				callback && callback(response);
			}
		};
	};

	self.hide = function() {
		self.callback && self.callback();
		self.aclass('hidden');
		visible = false;
	};

	self.content = function(classname, text, icon) {
		!is && self.html('<div><div class="ui-message-icon"><i class="fa fa-' + icon + '"></i></div><div class="ui-message-body"><div class="text"></div><hr /><button>' + (config.button || 'OK') + '</button></div></div>');
		visible = true;
		self.rclass2(cls + '-').aclass(classname);
		self.find(cls2 + '-body').rclass().aclass(cls + '-body');

		if (is)
			self.find(cls2 + '-icon').find('.fa').rclass2('fa-').aclass('fa-' + icon);

		self.find('.text').html(text);
		self.rclass('hidden');
		is = true;
		setTimeout(function() {
			self.aclass(cls + '-visible');
			setTimeout(function() {
				self.find(cls2 + '-icon').aclass(cls + '-icon-animate');
			}, 300);
		}, 100);
	};
});