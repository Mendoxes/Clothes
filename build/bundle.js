var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function get_store_value(store) {
        let value;
        subscribe(store, _ => value = _)();
        return value;
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_data(text, data) {
        data = '' + data;
        if (text.wholeText !== data)
            text.data = data;
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }
    class HtmlTag {
        constructor(anchor = null) {
            this.a = anchor;
            this.e = this.n = null;
        }
        m(html, target, anchor = null) {
            if (!this.e) {
                this.e = element(target.nodeName);
                this.t = target;
                this.h(html);
            }
            this.i(anchor);
        }
        h(html) {
            this.e.innerHTML = html;
            this.n = Array.from(this.e.childNodes);
        }
        i(anchor) {
            for (let i = 0; i < this.n.length; i += 1) {
                insert(this.t, this.n[i], anchor);
            }
        }
        p(html) {
            this.d();
            this.h(html);
            this.i(this.a);
        }
        d() {
            this.n.forEach(detach);
        }
    }

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = node.ownerDocument;
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = doc.head.appendChild(element('style')).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = program.b - t;
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program || pending_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function fade(node, { delay = 0, duration = 400, easing = identity } = {}) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }
    function slide(node, { delay = 0, duration = 400, easing = cubicOut } = {}) {
        const style = getComputedStyle(node);
        const opacity = +style.opacity;
        const height = parseFloat(style.height);
        const padding_top = parseFloat(style.paddingTop);
        const padding_bottom = parseFloat(style.paddingBottom);
        const margin_top = parseFloat(style.marginTop);
        const margin_bottom = parseFloat(style.marginBottom);
        const border_top_width = parseFloat(style.borderTopWidth);
        const border_bottom_width = parseFloat(style.borderBottomWidth);
        return {
            delay,
            duration,
            easing,
            css: t => 'overflow: hidden;' +
                `opacity: ${Math.min(t * 20, 1) * opacity};` +
                `height: ${t * height}px;` +
                `padding-top: ${t * padding_top}px;` +
                `padding-bottom: ${t * padding_bottom}px;` +
                `margin-top: ${t * margin_top}px;` +
                `margin-bottom: ${t * margin_bottom}px;` +
                `border-top-width: ${t * border_top_width}px;` +
                `border-bottom-width: ${t * border_bottom_width}px;`
        };
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    let count$1 = writable(1);
    derived(count$1, $count => $count * 2);

    let count = writable(1);
    let double = derived(count, $count => $count * 2);
    let user = readable({
    	name: 'Heropy',
    	age: 85,
    	email: 'thesecon@gmail.com'
    });

    /* src\single.svelte generated by Svelte v3.38.2 */

    function create_else_block_3(ctx) {
    	let carts;
    	let current;

    	carts = new Carts({
    			props: {
    				nostal: /*nostal*/ ctx[7],
    				much: /*much*/ ctx[1],
    				op2: /*op2*/ ctx[2],
    				ko: /*ko*/ ctx[0],
    				boxBelow: /*boxBelow*/ ctx[3],
    				op4: /*op4*/ ctx[8],
    				op5: /*op5*/ ctx[4],
    				cart1: /*cart1*/ ctx[5],
    				cart2: /*cart2*/ ctx[6]
    			}
    		});

    	return {
    		c() {
    			create_component(carts.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(carts, target, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const carts_changes = {};
    			if (dirty & /*nostal*/ 128) carts_changes.nostal = /*nostal*/ ctx[7];
    			if (dirty & /*much*/ 2) carts_changes.much = /*much*/ ctx[1];
    			if (dirty & /*op2*/ 4) carts_changes.op2 = /*op2*/ ctx[2];
    			if (dirty & /*ko*/ 1) carts_changes.ko = /*ko*/ ctx[0];
    			if (dirty & /*boxBelow*/ 8) carts_changes.boxBelow = /*boxBelow*/ ctx[3];
    			if (dirty & /*op4*/ 256) carts_changes.op4 = /*op4*/ ctx[8];
    			if (dirty & /*op5*/ 16) carts_changes.op5 = /*op5*/ ctx[4];
    			if (dirty & /*cart1*/ 32) carts_changes.cart1 = /*cart1*/ ctx[5];
    			if (dirty & /*cart2*/ 64) carts_changes.cart2 = /*cart2*/ ctx[6];
    			carts.$set(carts_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(carts.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(carts.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(carts, detaching);
    		}
    	};
    }

    // (59:0) {#if finale === true }
    function create_if_block$5(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let t;
    	let div;
    	let current;
    	const if_block_creators = [create_if_block_1$4, create_else_block_1$1];
    	const if_blocks = [];

    	function select_block_type_1(ctx, dirty) {
    		if (/*op2*/ ctx[2] === "Bodyconx" || /*op2*/ ctx[2] === "offtheshoulderx" || /*op2*/ ctx[2] === "maxidressx" || /*op2*/ ctx[2] === "fourx" || /*op2*/ ctx[2] === "fivex" || /*op2*/ ctx[2] === "sixx" || /*op2*/ ctx[2] === "sevenx" || /*op2*/ ctx[2] === "eightx" || /*op2*/ ctx[2] === "ninex" || /*op2*/ ctx[2] === "tenx" || /*op2*/ ctx[2] === "elevenx" || /*op2*/ ctx[2] === "tvelvex") return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_1(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	return {
    		c() {
    			if_block.c();
    			t = space();
    			div = element("div");
    			attr(div, "class", "div");
    		},
    		m(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert(target, t, anchor);
    			insert(target, div, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_1(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(t.parentNode, t);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach(t);
    			if (detaching) detach(div);
    		}
    	};
    }

    // (84:0) {:else}
    function create_else_block_1$1(ctx) {
    	let div3;
    	let img0;
    	let img0_src_value;
    	let img0_transition;
    	let t0;
    	let div1;
    	let html_tag;
    	let t1;
    	let div0;
    	let img1;
    	let img1_src_value;
    	let t2;
    	let img2;
    	let img2_src_value;
    	let img2_transition;
    	let t3;
    	let img3;
    	let img3_src_value;
    	let img3_transition;
    	let div0_transition;
    	let t4;
    	let button0;
    	let t6;
    	let button1;
    	let t8;
    	let input;
    	let t9;
    	let div1_transition;
    	let t10;
    	let div2;
    	let div3_transition;
    	let current;
    	let mounted;
    	let dispose;

    	function select_block_type_3(ctx, dirty) {
    		if (/*values*/ ctx[11][(/*a*/ ctx[9] - 6) / 2] === 1) return create_if_block_3$2;
    		return create_else_block_2;
    	}

    	let current_block_type = select_block_type_3(ctx);
    	let if_block = current_block_type(ctx);

    	return {
    		c() {
    			div3 = element("div");
    			img0 = element("img");
    			t0 = space();
    			div1 = element("div");
    			t1 = space();
    			div0 = element("div");
    			img1 = element("img");
    			t2 = space();
    			img2 = element("img");
    			t3 = space();
    			img3 = element("img");
    			t4 = space();
    			button0 = element("button");
    			button0.textContent = "click me to buy";
    			t6 = space();
    			button1 = element("button");
    			button1.textContent = "Go to cart";
    			t8 = space();
    			input = element("input");
    			t9 = space();
    			if_block.c();
    			t10 = space();
    			div2 = element("div");
    			attr(img0, "class", "checkin svelte-10fd4w1");
    			if (img0.src !== (img0_src_value = "" + (/*op2*/ ctx[2] + "/" + /*much*/ ctx[1] + ".png"))) attr(img0, "src", img0_src_value);
    			attr(img0, "alt", "");
    			html_tag = new HtmlTag(t1);
    			attr(img1, "class", "imgC svelte-10fd4w1");
    			if (img1.src !== (img1_src_value = "" + (/*op2*/ ctx[2] + "/" + /*reple*/ ctx[12]("B") + ".png"))) attr(img1, "src", img1_src_value);
    			attr(img1, "alt", "");
    			attr(img2, "class", "imgC svelte-10fd4w1");
    			if (img2.src !== (img2_src_value = "" + (/*op2*/ ctx[2] + "/" + /*reple*/ ctx[12]("E") + ".png"))) attr(img2, "src", img2_src_value);
    			attr(img2, "alt", "");
    			attr(img3, "class", "imgC svelte-10fd4w1");
    			if (img3.src !== (img3_src_value = "" + (/*op2*/ ctx[2] + "/" + /*reple*/ ctx[12]("F") + ".png"))) attr(img3, "src", img3_src_value);
    			attr(img3, "alt", "");
    			attr(div0, "class", "smallFlex svelte-10fd4w1");
    			attr(input, "type", "range");
    			attr(input, "min", "6");
    			attr(input, "max", "18");
    			attr(input, "step", "2");
    			attr(div1, "class", "contentPic svelte-10fd4w1");
    			attr(div3, "class", "start svelte-10fd4w1");
    		},
    		m(target, anchor) {
    			insert(target, div3, anchor);
    			append(div3, img0);
    			append(div3, t0);
    			append(div3, div1);
    			html_tag.m(/*boxBelow*/ ctx[3], div1);
    			append(div1, t1);
    			append(div1, div0);
    			append(div0, img1);
    			append(div0, t2);
    			append(div0, img2);
    			append(div0, t3);
    			append(div0, img3);
    			append(div1, t4);
    			append(div1, button0);
    			append(div1, t6);
    			append(div1, button1);
    			append(div1, t8);
    			append(div1, input);
    			set_input_value(input, /*a*/ ctx[9]);
    			append(div1, t9);
    			if_block.m(div1, null);
    			append(div3, t10);
    			append(div3, div2);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen(img1, "click", /*click_handler_3*/ ctx[18]),
    					listen(img2, "click", /*click_handler_4*/ ctx[19]),
    					listen(img3, "click", /*click_handler_5*/ ctx[20]),
    					listen(button0, "click", function () {
    						if (is_function((/*cart1*/ ctx[5].push(/*op2*/ ctx[2] + "/" + /*much*/ ctx[1]), /*nostal*/ ctx[7].push(/*ko*/ ctx[0]), /*cart2*/ ctx[6].push(/*boxBelow*/ ctx[3]), console.log(/*cart1*/ ctx[5], /*cart2*/ ctx[6])))) (/*cart1*/ ctx[5].push(/*op2*/ ctx[2] + "/" + /*much*/ ctx[1]), /*nostal*/ ctx[7].push(/*ko*/ ctx[0]), /*cart2*/ ctx[6].push(/*boxBelow*/ ctx[3]), console.log(/*cart1*/ ctx[5], /*cart2*/ ctx[6])).apply(this, arguments);
    					}),
    					listen(button1, "click", /*falsy*/ ctx[13]),
    					listen(input, "change", /*input_change_input_handler_1*/ ctx[21]),
    					listen(input, "input", /*input_change_input_handler_1*/ ctx[21])
    				];

    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (!current || dirty & /*op2, much*/ 6 && img0.src !== (img0_src_value = "" + (/*op2*/ ctx[2] + "/" + /*much*/ ctx[1] + ".png"))) {
    				attr(img0, "src", img0_src_value);
    			}

    			if (!current || dirty & /*boxBelow*/ 8) html_tag.p(/*boxBelow*/ ctx[3]);

    			if (!current || dirty & /*op2*/ 4 && img1.src !== (img1_src_value = "" + (/*op2*/ ctx[2] + "/" + /*reple*/ ctx[12]("B") + ".png"))) {
    				attr(img1, "src", img1_src_value);
    			}

    			if (!current || dirty & /*op2*/ 4 && img2.src !== (img2_src_value = "" + (/*op2*/ ctx[2] + "/" + /*reple*/ ctx[12]("E") + ".png"))) {
    				attr(img2, "src", img2_src_value);
    			}

    			if (!current || dirty & /*op2*/ 4 && img3.src !== (img3_src_value = "" + (/*op2*/ ctx[2] + "/" + /*reple*/ ctx[12]("F") + ".png"))) {
    				attr(img3, "src", img3_src_value);
    			}

    			if (dirty & /*a*/ 512) {
    				set_input_value(input, /*a*/ ctx[9]);
    			}

    			if (current_block_type === (current_block_type = select_block_type_3(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div1, null);
    				}
    			}
    		},
    		i(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!img0_transition) img0_transition = create_bidirectional_transition(img0, fade, {}, true);
    				img0_transition.run(1);
    			});

    			add_render_callback(() => {
    				if (!img2_transition) img2_transition = create_bidirectional_transition(img2, fade, {}, true);
    				img2_transition.run(1);
    			});

    			add_render_callback(() => {
    				if (!img3_transition) img3_transition = create_bidirectional_transition(img3, fade, {}, true);
    				img3_transition.run(1);
    			});

    			add_render_callback(() => {
    				if (!div0_transition) div0_transition = create_bidirectional_transition(div0, fade, {}, true);
    				div0_transition.run(1);
    			});

    			add_render_callback(() => {
    				if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, {}, true);
    				div1_transition.run(1);
    			});

    			add_render_callback(() => {
    				if (!div3_transition) div3_transition = create_bidirectional_transition(div3, fade, {}, true);
    				div3_transition.run(1);
    			});

    			current = true;
    		},
    		o(local) {
    			if (!img0_transition) img0_transition = create_bidirectional_transition(img0, fade, {}, false);
    			img0_transition.run(0);
    			if (!img2_transition) img2_transition = create_bidirectional_transition(img2, fade, {}, false);
    			img2_transition.run(0);
    			if (!img3_transition) img3_transition = create_bidirectional_transition(img3, fade, {}, false);
    			img3_transition.run(0);
    			if (!div0_transition) div0_transition = create_bidirectional_transition(div0, fade, {}, false);
    			div0_transition.run(0);
    			if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, {}, false);
    			div1_transition.run(0);
    			if (!div3_transition) div3_transition = create_bidirectional_transition(div3, fade, {}, false);
    			div3_transition.run(0);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div3);
    			if (detaching && img0_transition) img0_transition.end();
    			if (detaching && img2_transition) img2_transition.end();
    			if (detaching && img3_transition) img3_transition.end();
    			if (detaching && div0_transition) div0_transition.end();
    			if_block.d();
    			if (detaching && div1_transition) div1_transition.end();
    			if (detaching && div3_transition) div3_transition.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    // (60:0) {#if op2 ==="Bodyconx" || op2 === "offtheshoulderx" || op2==="maxidressx" ||op2==="fourx"||op2==="fivex"||op2==="sixx"|| op2==="sevenx"|| op2==="eightx"||op2==="ninex"||op2==="tenx"||op2==="elevenx"||op2==="tvelvex"}
    function create_if_block_1$4(ctx) {
    	let div3;
    	let img0;
    	let img0_src_value;
    	let img0_transition;
    	let t0;
    	let div1;
    	let html_tag;
    	let t1;
    	let div0;
    	let img1;
    	let img1_src_value;
    	let t2;
    	let img2;
    	let img2_src_value;
    	let img2_transition;
    	let t3;
    	let img3;
    	let img3_src_value;
    	let img3_transition;
    	let div0_transition;
    	let t4;
    	let button0;
    	let t6;
    	let button1;
    	let t8;
    	let input;
    	let t9;
    	let div1_transition;
    	let t10;
    	let div2;
    	let div3_transition;
    	let current;
    	let mounted;
    	let dispose;

    	function select_block_type_2(ctx, dirty) {
    		if (/*values*/ ctx[11][(/*a*/ ctx[9] - 6) / 2] === 1) return create_if_block_2$3;
    		return create_else_block$2;
    	}

    	let current_block_type = select_block_type_2(ctx);
    	let if_block = current_block_type(ctx);

    	return {
    		c() {
    			div3 = element("div");
    			img0 = element("img");
    			t0 = space();
    			div1 = element("div");
    			t1 = space();
    			div0 = element("div");
    			img1 = element("img");
    			t2 = space();
    			img2 = element("img");
    			t3 = space();
    			img3 = element("img");
    			t4 = space();
    			button0 = element("button");
    			button0.textContent = "click me to buy";
    			t6 = space();
    			button1 = element("button");
    			button1.textContent = "Go to cart";
    			t8 = space();
    			input = element("input");
    			t9 = space();
    			if_block.c();
    			t10 = space();
    			div2 = element("div");
    			attr(img0, "class", "checkin svelte-10fd4w1");
    			if (img0.src !== (img0_src_value = "" + (/*op5*/ ctx[4] + "/" + /*much*/ ctx[1] + ".png"))) attr(img0, "src", img0_src_value);
    			attr(img0, "alt", "");
    			html_tag = new HtmlTag(t1);
    			attr(img1, "class", "imgC svelte-10fd4w1");
    			if (img1.src !== (img1_src_value = "" + (/*op5*/ ctx[4] + "/" + /*reple*/ ctx[12]("B") + ".png"))) attr(img1, "src", img1_src_value);
    			attr(img1, "alt", "");
    			attr(img2, "class", "imgC svelte-10fd4w1");
    			if (img2.src !== (img2_src_value = "" + (/*op5*/ ctx[4] + "/" + /*reple*/ ctx[12]("E") + ".png"))) attr(img2, "src", img2_src_value);
    			attr(img2, "alt", "");
    			attr(img3, "class", "imgC svelte-10fd4w1");
    			if (img3.src !== (img3_src_value = "" + (/*op5*/ ctx[4] + "/" + /*reple*/ ctx[12]("F") + ".png"))) attr(img3, "src", img3_src_value);
    			attr(img3, "alt", "");
    			attr(div0, "class", "smallFlex svelte-10fd4w1");
    			attr(input, "type", "range");
    			attr(input, "min", "6");
    			attr(input, "max", "18");
    			attr(input, "step", "2");
    			attr(div1, "class", "contentPic svelte-10fd4w1");
    			attr(div3, "class", "start svelte-10fd4w1");
    		},
    		m(target, anchor) {
    			insert(target, div3, anchor);
    			append(div3, img0);
    			append(div3, t0);
    			append(div3, div1);
    			html_tag.m(/*boxBelow*/ ctx[3], div1);
    			append(div1, t1);
    			append(div1, div0);
    			append(div0, img1);
    			append(div0, t2);
    			append(div0, img2);
    			append(div0, t3);
    			append(div0, img3);
    			append(div1, t4);
    			append(div1, button0);
    			append(div1, t6);
    			append(div1, button1);
    			append(div1, t8);
    			append(div1, input);
    			set_input_value(input, /*a*/ ctx[9]);
    			append(div1, t9);
    			if_block.m(div1, null);
    			append(div3, t10);
    			append(div3, div2);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen(img1, "click", /*click_handler*/ ctx[14]),
    					listen(img2, "click", /*click_handler_1*/ ctx[15]),
    					listen(img3, "click", /*click_handler_2*/ ctx[16]),
    					listen(button0, "click", function () {
    						if (is_function((/*cart1*/ ctx[5].push(/*op5*/ ctx[4] + "/" + /*much*/ ctx[1]), /*nostal*/ ctx[7].push(/*ko*/ ctx[0]), /*cart2*/ ctx[6].push(/*boxBelow*/ ctx[3]), console.log(/*cart1*/ ctx[5], /*cart2*/ ctx[6])))) (/*cart1*/ ctx[5].push(/*op5*/ ctx[4] + "/" + /*much*/ ctx[1]), /*nostal*/ ctx[7].push(/*ko*/ ctx[0]), /*cart2*/ ctx[6].push(/*boxBelow*/ ctx[3]), console.log(/*cart1*/ ctx[5], /*cart2*/ ctx[6])).apply(this, arguments);
    					}),
    					listen(button1, "click", /*falsy*/ ctx[13]),
    					listen(input, "change", /*input_change_input_handler*/ ctx[17]),
    					listen(input, "input", /*input_change_input_handler*/ ctx[17])
    				];

    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (!current || dirty & /*op5, much*/ 18 && img0.src !== (img0_src_value = "" + (/*op5*/ ctx[4] + "/" + /*much*/ ctx[1] + ".png"))) {
    				attr(img0, "src", img0_src_value);
    			}

    			if (!current || dirty & /*boxBelow*/ 8) html_tag.p(/*boxBelow*/ ctx[3]);

    			if (!current || dirty & /*op5*/ 16 && img1.src !== (img1_src_value = "" + (/*op5*/ ctx[4] + "/" + /*reple*/ ctx[12]("B") + ".png"))) {
    				attr(img1, "src", img1_src_value);
    			}

    			if (!current || dirty & /*op5*/ 16 && img2.src !== (img2_src_value = "" + (/*op5*/ ctx[4] + "/" + /*reple*/ ctx[12]("E") + ".png"))) {
    				attr(img2, "src", img2_src_value);
    			}

    			if (!current || dirty & /*op5*/ 16 && img3.src !== (img3_src_value = "" + (/*op5*/ ctx[4] + "/" + /*reple*/ ctx[12]("F") + ".png"))) {
    				attr(img3, "src", img3_src_value);
    			}

    			if (dirty & /*a*/ 512) {
    				set_input_value(input, /*a*/ ctx[9]);
    			}

    			if (current_block_type === (current_block_type = select_block_type_2(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div1, null);
    				}
    			}
    		},
    		i(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!img0_transition) img0_transition = create_bidirectional_transition(img0, fade, {}, true);
    				img0_transition.run(1);
    			});

    			add_render_callback(() => {
    				if (!img2_transition) img2_transition = create_bidirectional_transition(img2, fade, {}, true);
    				img2_transition.run(1);
    			});

    			add_render_callback(() => {
    				if (!img3_transition) img3_transition = create_bidirectional_transition(img3, fade, {}, true);
    				img3_transition.run(1);
    			});

    			add_render_callback(() => {
    				if (!div0_transition) div0_transition = create_bidirectional_transition(div0, fade, {}, true);
    				div0_transition.run(1);
    			});

    			add_render_callback(() => {
    				if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, {}, true);
    				div1_transition.run(1);
    			});

    			add_render_callback(() => {
    				if (!div3_transition) div3_transition = create_bidirectional_transition(div3, fade, {}, true);
    				div3_transition.run(1);
    			});

    			current = true;
    		},
    		o(local) {
    			if (!img0_transition) img0_transition = create_bidirectional_transition(img0, fade, {}, false);
    			img0_transition.run(0);
    			if (!img2_transition) img2_transition = create_bidirectional_transition(img2, fade, {}, false);
    			img2_transition.run(0);
    			if (!img3_transition) img3_transition = create_bidirectional_transition(img3, fade, {}, false);
    			img3_transition.run(0);
    			if (!div0_transition) div0_transition = create_bidirectional_transition(div0, fade, {}, false);
    			div0_transition.run(0);
    			if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, {}, false);
    			div1_transition.run(0);
    			if (!div3_transition) div3_transition = create_bidirectional_transition(div3, fade, {}, false);
    			div3_transition.run(0);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div3);
    			if (detaching && img0_transition) img0_transition.end();
    			if (detaching && img2_transition) img2_transition.end();
    			if (detaching && img3_transition) img3_transition.end();
    			if (detaching && div0_transition) div0_transition.end();
    			if_block.d();
    			if (detaching && div1_transition) div1_transition.end();
    			if (detaching && div3_transition) div3_transition.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    // (97:8) {:else}
    function create_else_block_2(ctx) {
    	let p;
    	let t0;
    	let t1;
    	let t2;

    	return {
    		c() {
    			p = element("p");
    			t0 = text("UK Size:");
    			t1 = text(/*a*/ ctx[9]);
    			t2 = text(" (Out of stock)");
    			attr(p, "class", "red svelte-10fd4w1");
    		},
    		m(target, anchor) {
    			insert(target, p, anchor);
    			append(p, t0);
    			append(p, t1);
    			append(p, t2);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*a*/ 512) set_data(t1, /*a*/ ctx[9]);
    		},
    		d(detaching) {
    			if (detaching) detach(p);
    		}
    	};
    }

    // (95:8) {#if values[(a-6)/2] ===1}
    function create_if_block_3$2(ctx) {
    	let p;
    	let t0;
    	let t1;

    	return {
    		c() {
    			p = element("p");
    			t0 = text("UK Size:");
    			t1 = text(/*a*/ ctx[9]);
    			attr(p, "class", "green svelte-10fd4w1");
    		},
    		m(target, anchor) {
    			insert(target, p, anchor);
    			append(p, t0);
    			append(p, t1);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*a*/ 512) set_data(t1, /*a*/ ctx[9]);
    		},
    		d(detaching) {
    			if (detaching) detach(p);
    		}
    	};
    }

    // (72:8) {:else}
    function create_else_block$2(ctx) {
    	let p;
    	let t0;
    	let t1;
    	let t2;

    	return {
    		c() {
    			p = element("p");
    			t0 = text("UK Size:");
    			t1 = text(/*a*/ ctx[9]);
    			t2 = text(" (Out of stock)");
    			attr(p, "class", "red svelte-10fd4w1");
    		},
    		m(target, anchor) {
    			insert(target, p, anchor);
    			append(p, t0);
    			append(p, t1);
    			append(p, t2);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*a*/ 512) set_data(t1, /*a*/ ctx[9]);
    		},
    		d(detaching) {
    			if (detaching) detach(p);
    		}
    	};
    }

    // (70:8) {#if values[(a-6)/2] ===1}
    function create_if_block_2$3(ctx) {
    	let p;
    	let t0;
    	let t1;

    	return {
    		c() {
    			p = element("p");
    			t0 = text("UK Size:");
    			t1 = text(/*a*/ ctx[9]);
    			attr(p, "class", "green svelte-10fd4w1");
    		},
    		m(target, anchor) {
    			insert(target, p, anchor);
    			append(p, t0);
    			append(p, t1);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*a*/ 512) set_data(t1, /*a*/ ctx[9]);
    		},
    		d(detaching) {
    			if (detaching) detach(p);
    		}
    	};
    }

    function create_fragment$6(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$5, create_else_block_3];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*finale*/ ctx[10] === true) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	return {
    		c() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach(if_block_anchor);
    		}
    	};
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { much } = $$props;
    	let { op2 } = $$props;
    	let { boxBelow } = $$props;
    	let { op5 } = $$props;
    	let { ko } = $$props; ///PRICE FOR AN ITEM 
    	let { cart1 } = $$props;
    	let { cart2 } = $$props;
    	let { nostal } = $$props;
    	ko = Number(ko.substring(0, ko.length - 1));
    	console.log(get_store_value(count));
    	console.log(get_store_value(double));
    	console.log(get_store_value(user));
    	let op4;
    	op4 = much;
    	console.log(op2);
    	console.log(op4);

    	// let match = (s.match(r));
    	let a = 6;

    	const values = [1, 1, 1, 1, 1, 0, 0, 0, 0];
    	console.log(boxBelow);

    	function reple(e) {
    		return $$invalidate(8, op4 = much.replace(/.$/, e));
    	}

    	let finale = true;

    	function falsy() {
    		$$invalidate(10, finale = false);
    	}
    	console.log(boxBelow);

    	const click_handler = e => {
    		document.querySelector(".checkin").src = op5 + "/" + reple("B") + ".png";
    	};

    	const click_handler_1 = e => {
    		document.querySelector(".checkin").src = op5 + "/" + reple("E") + ".png";
    	};

    	const click_handler_2 = e => {
    		document.querySelector(".checkin").src = op5 + "/" + reple("F") + ".png";
    	};

    	function input_change_input_handler() {
    		a = to_number(this.value);
    		$$invalidate(9, a);
    	}

    	const click_handler_3 = e => {
    		document.querySelector(".checkin").src = op2 + "/" + reple("B") + ".png";
    	};

    	const click_handler_4 = e => {
    		document.querySelector(".checkin").src = op2 + "/" + reple("E") + ".png";
    	};

    	const click_handler_5 = e => {
    		document.querySelector(".checkin").src = op2 + "/" + reple("F") + ".png";
    	};

    	function input_change_input_handler_1() {
    		a = to_number(this.value);
    		$$invalidate(9, a);
    	}

    	$$self.$$set = $$props => {
    		if ("much" in $$props) $$invalidate(1, much = $$props.much);
    		if ("op2" in $$props) $$invalidate(2, op2 = $$props.op2);
    		if ("boxBelow" in $$props) $$invalidate(3, boxBelow = $$props.boxBelow);
    		if ("op5" in $$props) $$invalidate(4, op5 = $$props.op5);
    		if ("ko" in $$props) $$invalidate(0, ko = $$props.ko);
    		if ("cart1" in $$props) $$invalidate(5, cart1 = $$props.cart1);
    		if ("cart2" in $$props) $$invalidate(6, cart2 = $$props.cart2);
    		if ("nostal" in $$props) $$invalidate(7, nostal = $$props.nostal);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*ko*/ 1) {
    			console.log(ko);
    		}
    	};

    	return [
    		ko,
    		much,
    		op2,
    		boxBelow,
    		op5,
    		cart1,
    		cart2,
    		nostal,
    		op4,
    		a,
    		finale,
    		values,
    		reple,
    		falsy,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		input_change_input_handler,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5,
    		input_change_input_handler_1
    	];
    }

    class Single extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(this, options, instance$5, create_fragment$6, safe_not_equal, {
    			much: 1,
    			op2: 2,
    			boxBelow: 3,
    			op5: 4,
    			ko: 0,
    			cart1: 5,
    			cart2: 6,
    			nostal: 7
    		});
    	}
    }

    /* src\types.svelte generated by Svelte v3.38.2 */

    function create_fragment$5(ctx) {
    	let div;

    	return {
    		c() {
    			div = element("div");
    			div.textContent = "ok";
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div);
    		}
    	};
    }

    class Types extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, null, create_fragment$5, safe_not_equal, {});
    	}
    }

    /* src\firms.svelte generated by Svelte v3.38.2 */

    function get_each_context_25(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[174] = list[i];
    	return child_ctx;
    }

    function get_each_context_24(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[174] = list[i];
    	return child_ctx;
    }

    function get_each_context_23(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[174] = list[i];
    	return child_ctx;
    }

    function get_each_context_22(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[174] = list[i];
    	return child_ctx;
    }

    function get_each_context_21(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[174] = list[i];
    	return child_ctx;
    }

    function get_each_context_20(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[174] = list[i];
    	return child_ctx;
    }

    function get_each_context_19(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[174] = list[i];
    	return child_ctx;
    }

    function get_each_context_18(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[174] = list[i];
    	return child_ctx;
    }

    function get_each_context_17(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[174] = list[i];
    	return child_ctx;
    }

    function get_each_context_16(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[174] = list[i];
    	return child_ctx;
    }

    function get_each_context_15(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[174] = list[i];
    	return child_ctx;
    }

    function get_each_context_14(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[174] = list[i];
    	return child_ctx;
    }

    function get_each_context_13(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[174] = list[i];
    	return child_ctx;
    }

    function get_each_context_12(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[174] = list[i];
    	return child_ctx;
    }

    function get_each_context_11(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[174] = list[i];
    	return child_ctx;
    }

    function get_each_context_10(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[174] = list[i];
    	return child_ctx;
    }

    function get_each_context_9(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[174] = list[i];
    	return child_ctx;
    }

    function get_each_context_8(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[174] = list[i];
    	return child_ctx;
    }

    function get_each_context_7(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[174] = list[i];
    	return child_ctx;
    }

    function get_each_context_6(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[174] = list[i];
    	return child_ctx;
    }

    function get_each_context_5$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[174] = list[i];
    	return child_ctx;
    }

    function get_each_context_4$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[174] = list[i];
    	return child_ctx;
    }

    function get_each_context_3$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[174] = list[i];
    	return child_ctx;
    }

    function get_each_context_2$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[174] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[174] = list[i];
    	return child_ctx;
    }

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[174] = list[i];
    	return child_ctx;
    }

    // (1729:0) {:else}
    function create_else_block_1(ctx) {
    	let types;
    	let current;
    	types = new Types({});

    	return {
    		c() {
    			create_component(types.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(types, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i(local) {
    			if (current) return;
    			transition_in(types.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(types.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(types, detaching);
    		}
    	};
    }

    // (1339:0) {#if end === true}
    function create_if_block_1$3(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_2$2, create_else_block$1];
    	const if_blocks = [];

    	function select_block_type_1(ctx, dirty) {
    		if (/*finale*/ ctx[7] === true) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_1(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	return {
    		c() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_1(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach(if_block_anchor);
    		}
    	};
    }

    // (1726:0) {:else}
    function create_else_block$1(ctx) {
    	let single;
    	let current;

    	single = new Single({
    			props: {
    				nostal: /*nostal*/ ctx[11],
    				much: /*much*/ ctx[6],
    				op2: /*op2*/ ctx[1],
    				boxBelow: /*boxBelow*/ ctx[8],
    				op5: /*op5*/ ctx[4],
    				ko: /*ko*/ ctx[2],
    				cart1: /*cart1*/ ctx[9],
    				cart2: /*cart2*/ ctx[10]
    			}
    		});

    	return {
    		c() {
    			create_component(single.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(single, target, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const single_changes = {};
    			if (dirty[0] & /*much*/ 64) single_changes.much = /*much*/ ctx[6];
    			if (dirty[0] & /*op2*/ 2) single_changes.op2 = /*op2*/ ctx[1];
    			if (dirty[0] & /*boxBelow*/ 256) single_changes.boxBelow = /*boxBelow*/ ctx[8];
    			if (dirty[0] & /*op5*/ 16) single_changes.op5 = /*op5*/ ctx[4];
    			if (dirty[0] & /*ko*/ 4) single_changes.ko = /*ko*/ ctx[2];
    			single.$set(single_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(single.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(single.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(single, detaching);
    		}
    	};
    }

    // (1340:0) {#if finale === true }
    function create_if_block_2$2(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;

    	const if_block_creators = [
    		create_if_block_3$1,
    		create_if_block_4$1,
    		create_if_block_5,
    		create_if_block_6,
    		create_if_block_7,
    		create_if_block_8,
    		create_if_block_9,
    		create_if_block_10,
    		create_if_block_11,
    		create_if_block_12,
    		create_if_block_13,
    		create_if_block_14,
    		create_if_block_15,
    		create_if_block_16,
    		create_if_block_17,
    		create_if_block_18,
    		create_if_block_19,
    		create_if_block_20,
    		create_if_block_21,
    		create_if_block_22,
    		create_if_block_23,
    		create_if_block_24,
    		create_if_block_25,
    		create_if_block_26,
    		create_if_block_27,
    		create_if_block_28
    	];

    	const if_blocks = [];

    	function select_block_type_2(ctx, dirty) {
    		if (/*op2*/ ctx[1] === "Ted") return 0;
    		if (/*op2*/ ctx[1] === "Mark") return 1;
    		if (/*op2*/ ctx[1] === "Reformation") return 2;
    		if (/*op2*/ ctx[1] === "Maje") return 3;
    		if (/*op2*/ ctx[1] === "Lily") return 4;
    		if (/*op2*/ ctx[1] === "Hawes") return 5;
    		if (/*op2*/ ctx[1] === "Dai") return 6;
    		if (/*op2*/ ctx[1] === "Svarowski") return 7;
    		if (/*op2*/ ctx[1] === "Bvlgari") return 8;
    		if (/*op2*/ ctx[1] === "Tiffany") return 9;
    		if (/*op2*/ ctx[1] === "Missoma") return 10;
    		if (/*op2*/ ctx[1] === "Chanel") return 11;
    		if (/*op2*/ ctx[1] === "Rolex") return 12;
    		if (/*op2*/ ctx[1] === "Baume") return 13;
    		if (/*op2*/ ctx[1] === "Bodyconx") return 14;
    		if (/*op2*/ ctx[1] === "offtheshoulderx") return 15;
    		if (/*op2*/ ctx[1] === "maxidressx") return 16;
    		if (/*op2*/ ctx[1] === "fourx") return 17;
    		if (/*op2*/ ctx[1] === "fivex") return 18;
    		if (/*op2*/ ctx[1] === "sixx") return 19;
    		if (/*op2*/ ctx[1] === "sevenx") return 20;
    		if (/*op2*/ ctx[1] === "eightx") return 21;
    		if (/*op2*/ ctx[1] === "ninex") return 22;
    		if (/*op2*/ ctx[1] === "tenx") return 23;
    		if (/*op2*/ ctx[1] === "elevenx") return 24;
    		if (/*op2*/ ctx[1] === "tvelvex") return 25;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type_2(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	return {
    		c() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m(target, anchor) {
    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(target, anchor);
    			}

    			insert(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_2(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					} else {
    						if_block.p(ctx, dirty);
    					}

    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				} else {
    					if_block = null;
    				}
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d(detaching) {
    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d(detaching);
    			}

    			if (detaching) detach(if_block_anchor);
    		}
    	};
    }

    // (1698:27) 
    function create_if_block_28(ctx) {
    	let h1;
    	let t0;
    	let h1_transition;
    	let t1;
    	let div;
    	let current;
    	let each_value_25 = /*numbersSFA*/ ctx[113];
    	let each_blocks = [];

    	for (let i = 0; i < each_value_25.length; i += 1) {
    		each_blocks[i] = create_each_block_25(get_each_context_25(ctx, each_value_25, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	return {
    		c() {
    			h1 = element("h1");
    			t0 = text(/*op2*/ ctx[1]);
    			t1 = space();
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr(h1, "class", "mainDiv svelte-18kfgwi");
    			attr(div, "class", "containerFirm svelte-18kfgwi");
    		},
    		m(target, anchor) {
    			insert(target, h1, anchor);
    			append(h1, t0);
    			insert(target, t1, anchor);
    			insert(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p(ctx, dirty) {
    			if (!current || dirty[0] & /*op2*/ 2) set_data(t0, /*op2*/ ctx[1]);

    			if (dirty[0] & /*ko, boxBelow, much*/ 324 | dirty[3] & /*numbersSFA, priceSFA, opz, falsy, descSFA, typeSFA*/ 66060288) {
    				each_value_25 = /*numbersSFA*/ ctx[113];
    				let i;

    				for (i = 0; i < each_value_25.length; i += 1) {
    					const child_ctx = get_each_context_25(ctx, each_value_25, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_25(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value_25.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!h1_transition) h1_transition = create_bidirectional_transition(h1, slide, {}, true);
    				h1_transition.run(1);
    			});

    			for (let i = 0; i < each_value_25.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o(local) {
    			if (!h1_transition) h1_transition = create_bidirectional_transition(h1, slide, {}, false);
    			h1_transition.run(0);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(h1);
    			if (detaching && h1_transition) h1_transition.end();
    			if (detaching) detach(t1);
    			if (detaching) detach(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    // (1684:27) 
    function create_if_block_27(ctx) {
    	let h1;
    	let h1_transition;
    	let t1;
    	let div;
    	let current;
    	let each_value_24 = /*numbersSMO*/ ctx[109];
    	let each_blocks = [];

    	for (let i = 0; i < each_value_24.length; i += 1) {
    		each_blocks[i] = create_each_block_24(get_each_context_24(ctx, each_value_24, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	return {
    		c() {
    			h1 = element("h1");
    			h1.textContent = "Modern Watches";
    			t1 = space();
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr(h1, "class", "mainDiv svelte-18kfgwi");
    			attr(div, "class", "containerFirm svelte-18kfgwi");
    		},
    		m(target, anchor) {
    			insert(target, h1, anchor);
    			insert(target, t1, anchor);
    			insert(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*ko, boxBelow, much*/ 324 | dirty[3] & /*numbersSMO, priceSMO, opz, falsy, descSMO, typeSMO*/ 51314688) {
    				each_value_24 = /*numbersSMO*/ ctx[109];
    				let i;

    				for (i = 0; i < each_value_24.length; i += 1) {
    					const child_ctx = get_each_context_24(ctx, each_value_24, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_24(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value_24.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!h1_transition) h1_transition = create_bidirectional_transition(h1, slide, {}, true);
    				h1_transition.run(1);
    			});

    			for (let i = 0; i < each_value_24.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o(local) {
    			if (!h1_transition) h1_transition = create_bidirectional_transition(h1, slide, {}, false);
    			h1_transition.run(0);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(h1);
    			if (detaching && h1_transition) h1_transition.end();
    			if (detaching) detach(t1);
    			if (detaching) detach(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    // (1671:24) 
    function create_if_block_26(ctx) {
    	let h1;
    	let h1_transition;
    	let t1;
    	let div;
    	let current;
    	let each_value_23 = /*numbersSRE*/ ctx[105];
    	let each_blocks = [];

    	for (let i = 0; i < each_value_23.length; i += 1) {
    		each_blocks[i] = create_each_block_23(get_each_context_23(ctx, each_value_23, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	return {
    		c() {
    			h1 = element("h1");
    			h1.textContent = "Retro Watches";
    			t1 = space();
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr(h1, "class", "mainDiv svelte-18kfgwi");
    			attr(div, "class", "containerFirm svelte-18kfgwi");
    		},
    		m(target, anchor) {
    			insert(target, h1, anchor);
    			insert(target, t1, anchor);
    			insert(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*ko, boxBelow, much*/ 324 | dirty[3] & /*numbersSRE, priceSRE, opz, falsy, descSRE, typeSRE*/ 50393088) {
    				each_value_23 = /*numbersSRE*/ ctx[105];
    				let i;

    				for (i = 0; i < each_value_23.length; i += 1) {
    					const child_ctx = get_each_context_23(ctx, each_value_23, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_23(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value_23.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!h1_transition) h1_transition = create_bidirectional_transition(h1, slide, {}, true);
    				h1_transition.run(1);
    			});

    			for (let i = 0; i < each_value_23.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o(local) {
    			if (!h1_transition) h1_transition = create_bidirectional_transition(h1, slide, {}, false);
    			h1_transition.run(0);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(h1);
    			if (detaching && h1_transition) h1_transition.end();
    			if (detaching) detach(t1);
    			if (detaching) detach(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    // (1656:25) 
    function create_if_block_25(ctx) {
    	let h1;
    	let h1_transition;
    	let t1;
    	let div;
    	let current;
    	let each_value_22 = /*numbersSEA*/ ctx[101];
    	let each_blocks = [];

    	for (let i = 0; i < each_value_22.length; i += 1) {
    		each_blocks[i] = create_each_block_22(get_each_context_22(ctx, each_value_22, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	return {
    		c() {
    			h1 = element("h1");
    			h1.textContent = "Rings";
    			t1 = space();
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr(h1, "class", "mainDiv svelte-18kfgwi");
    			attr(div, "class", "containerFirm svelte-18kfgwi");
    		},
    		m(target, anchor) {
    			insert(target, h1, anchor);
    			insert(target, t1, anchor);
    			insert(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*ko, boxBelow, much*/ 324 | dirty[3] & /*numbersSEA, priceSEA, opz, falsy, descSEA, typeSEA*/ 50335488) {
    				each_value_22 = /*numbersSEA*/ ctx[101];
    				let i;

    				for (i = 0; i < each_value_22.length; i += 1) {
    					const child_ctx = get_each_context_22(ctx, each_value_22, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_22(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value_22.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!h1_transition) h1_transition = create_bidirectional_transition(h1, slide, {}, true);
    				h1_transition.run(1);
    			});

    			for (let i = 0; i < each_value_22.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o(local) {
    			if (!h1_transition) h1_transition = create_bidirectional_transition(h1, slide, {}, false);
    			h1_transition.run(0);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(h1);
    			if (detaching && h1_transition) h1_transition.end();
    			if (detaching) detach(t1);
    			if (detaching) detach(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    // (1641:26) 
    function create_if_block_24(ctx) {
    	let h1;
    	let h1_transition;
    	let t1;
    	let div;
    	let current;
    	let each_value_21 = /*numbersSNE*/ ctx[97];
    	let each_blocks = [];

    	for (let i = 0; i < each_value_21.length; i += 1) {
    		each_blocks[i] = create_each_block_21(get_each_context_21(ctx, each_value_21, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	return {
    		c() {
    			h1 = element("h1");
    			h1.textContent = "Rings";
    			t1 = space();
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr(h1, "class", "mainDiv svelte-18kfgwi");
    			attr(div, "class", "containerFirm svelte-18kfgwi");
    		},
    		m(target, anchor) {
    			insert(target, h1, anchor);
    			insert(target, t1, anchor);
    			insert(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*ko, boxBelow, much*/ 324 | dirty[3] & /*numbersSNE, priceSNE, opz, falsy, descSNE, typeSNE*/ 50331888) {
    				each_value_21 = /*numbersSNE*/ ctx[97];
    				let i;

    				for (i = 0; i < each_value_21.length; i += 1) {
    					const child_ctx = get_each_context_21(ctx, each_value_21, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_21(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value_21.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!h1_transition) h1_transition = create_bidirectional_transition(h1, slide, {}, true);
    				h1_transition.run(1);
    			});

    			for (let i = 0; i < each_value_21.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o(local) {
    			if (!h1_transition) h1_transition = create_bidirectional_transition(h1, slide, {}, false);
    			h1_transition.run(0);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(h1);
    			if (detaching && h1_transition) h1_transition.end();
    			if (detaching) detach(t1);
    			if (detaching) detach(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    // (1627:26) 
    function create_if_block_23(ctx) {
    	let h1;
    	let h1_transition;
    	let t1;
    	let div;
    	let current;
    	let each_value_20 = /*numbersSRI*/ ctx[93];
    	let each_blocks = [];

    	for (let i = 0; i < each_value_20.length; i += 1) {
    		each_blocks[i] = create_each_block_20(get_each_context_20(ctx, each_value_20, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	return {
    		c() {
    			h1 = element("h1");
    			h1.textContent = "Rings";
    			t1 = space();
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr(h1, "class", "mainDiv svelte-18kfgwi");
    			attr(div, "class", "containerFirm svelte-18kfgwi");
    		},
    		m(target, anchor) {
    			insert(target, h1, anchor);
    			insert(target, t1, anchor);
    			insert(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*ko, boxBelow, much*/ 324 | dirty[3] & /*numbersSRI, priceSRI, opz, falsy, descSRI, typeSRI*/ 50331663) {
    				each_value_20 = /*numbersSRI*/ ctx[93];
    				let i;

    				for (i = 0; i < each_value_20.length; i += 1) {
    					const child_ctx = get_each_context_20(ctx, each_value_20, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_20(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value_20.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!h1_transition) h1_transition = create_bidirectional_transition(h1, slide, {}, true);
    				h1_transition.run(1);
    			});

    			for (let i = 0; i < each_value_20.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o(local) {
    			if (!h1_transition) h1_transition = create_bidirectional_transition(h1, slide, {}, false);
    			h1_transition.run(0);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(h1);
    			if (detaching && h1_transition) h1_transition.end();
    			if (detaching) detach(t1);
    			if (detaching) detach(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    // (1614:24) 
    function create_if_block_22(ctx) {
    	let h1;
    	let h1_transition;
    	let t1;
    	let div;
    	let current;
    	let each_value_19 = /*numbersSOF*/ ctx[89];
    	let each_blocks = [];

    	for (let i = 0; i < each_value_19.length; i += 1) {
    		each_blocks[i] = create_each_block_19(get_each_context_19(ctx, each_value_19, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	return {
    		c() {
    			h1 = element("h1");
    			h1.textContent = "Oficcial Outfits";
    			t1 = space();
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr(h1, "class", "mainDiv svelte-18kfgwi");
    			attr(div, "class", "containerFirm svelte-18kfgwi");
    		},
    		m(target, anchor) {
    			insert(target, h1, anchor);
    			insert(target, t1, anchor);
    			insert(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*ko, boxBelow, much*/ 324 | dirty[2] & /*numbersSOF, priceSOF, descSOF, typeSOF*/ 2013265920 | dirty[3] & /*opz, falsy*/ 50331648) {
    				each_value_19 = /*numbersSOF*/ ctx[89];
    				let i;

    				for (i = 0; i < each_value_19.length; i += 1) {
    					const child_ctx = get_each_context_19(ctx, each_value_19, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_19(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value_19.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!h1_transition) h1_transition = create_bidirectional_transition(h1, slide, {}, true);
    				h1_transition.run(1);
    			});

    			for (let i = 0; i < each_value_19.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o(local) {
    			if (!h1_transition) h1_transition = create_bidirectional_transition(h1, slide, {}, false);
    			h1_transition.run(0);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(h1);
    			if (detaching && h1_transition) h1_transition.end();
    			if (detaching) detach(t1);
    			if (detaching) detach(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    // (1600:25) 
    function create_if_block_21(ctx) {
    	let h1;
    	let h1_transition;
    	let t1;
    	let div;
    	let current;
    	let each_value_18 = /*numbersSSU*/ ctx[85];
    	let each_blocks = [];

    	for (let i = 0; i < each_value_18.length; i += 1) {
    		each_blocks[i] = create_each_block_18(get_each_context_18(ctx, each_value_18, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	return {
    		c() {
    			h1 = element("h1");
    			h1.textContent = "Summer outfits";
    			t1 = space();
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr(h1, "class", "mainDiv svelte-18kfgwi");
    			attr(div, "class", "containerFirm svelte-18kfgwi");
    		},
    		m(target, anchor) {
    			insert(target, h1, anchor);
    			insert(target, t1, anchor);
    			insert(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*boxBelow, much*/ 320 | dirty[2] & /*numbersSSU, priceSSU, descSSU, typeSSU*/ 125829120 | dirty[3] & /*opz, falsy*/ 50331648) {
    				each_value_18 = /*numbersSSU*/ ctx[85];
    				let i;

    				for (i = 0; i < each_value_18.length; i += 1) {
    					const child_ctx = get_each_context_18(ctx, each_value_18, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_18(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value_18.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!h1_transition) h1_transition = create_bidirectional_transition(h1, slide, {}, true);
    				h1_transition.run(1);
    			});

    			for (let i = 0; i < each_value_18.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o(local) {
    			if (!h1_transition) h1_transition = create_bidirectional_transition(h1, slide, {}, false);
    			h1_transition.run(0);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(h1);
    			if (detaching && h1_transition) h1_transition.end();
    			if (detaching) detach(t1);
    			if (detaching) detach(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    // (1585:25) 
    function create_if_block_20(ctx) {
    	let h1;
    	let h1_transition;
    	let t1;
    	let div;
    	let current;
    	let each_value_17 = /*numbersSCA*/ ctx[81];
    	let each_blocks = [];

    	for (let i = 0; i < each_value_17.length; i += 1) {
    		each_blocks[i] = create_each_block_17(get_each_context_17(ctx, each_value_17, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	return {
    		c() {
    			h1 = element("h1");
    			h1.textContent = "Casual";
    			t1 = space();
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr(h1, "class", "mainDiv svelte-18kfgwi");
    			attr(div, "class", "containerFirm svelte-18kfgwi");
    		},
    		m(target, anchor) {
    			insert(target, h1, anchor);
    			insert(target, t1, anchor);
    			insert(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*ko, boxBelow, much*/ 324 | dirty[2] & /*numbersSCA, priceSCA, descSCA, typeSCA*/ 7864320 | dirty[3] & /*opz, falsy*/ 50331648) {
    				each_value_17 = /*numbersSCA*/ ctx[81];
    				let i;

    				for (i = 0; i < each_value_17.length; i += 1) {
    					const child_ctx = get_each_context_17(ctx, each_value_17, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_17(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value_17.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!h1_transition) h1_transition = create_bidirectional_transition(h1, slide, {}, true);
    				h1_transition.run(1);
    			});

    			for (let i = 0; i < each_value_17.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o(local) {
    			if (!h1_transition) h1_transition = create_bidirectional_transition(h1, slide, {}, false);
    			h1_transition.run(0);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(h1);
    			if (detaching && h1_transition) h1_transition.end();
    			if (detaching) detach(t1);
    			if (detaching) detach(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    // (1569:30) 
    function create_if_block_19(ctx) {
    	let h1;
    	let h1_transition;
    	let t1;
    	let div;
    	let current;
    	let each_value_16 = /*numbersSMD*/ ctx[77];
    	let each_blocks = [];

    	for (let i = 0; i < each_value_16.length; i += 1) {
    		each_blocks[i] = create_each_block_16(get_each_context_16(ctx, each_value_16, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	return {
    		c() {
    			h1 = element("h1");
    			h1.textContent = "Maxi Dress";
    			t1 = space();
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr(h1, "class", "mainDiv svelte-18kfgwi");
    			attr(div, "class", "containerFirm svelte-18kfgwi");
    		},
    		m(target, anchor) {
    			insert(target, h1, anchor);
    			insert(target, t1, anchor);
    			insert(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*ko, boxBelow, much*/ 324 | dirty[2] & /*numbersSMD, priceSMD, descSMD, typeSMD*/ 491520 | dirty[3] & /*opz, falsy*/ 50331648) {
    				each_value_16 = /*numbersSMD*/ ctx[77];
    				let i;

    				for (i = 0; i < each_value_16.length; i += 1) {
    					const child_ctx = get_each_context_16(ctx, each_value_16, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_16(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value_16.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!h1_transition) h1_transition = create_bidirectional_transition(h1, slide, {}, true);
    				h1_transition.run(1);
    			});

    			for (let i = 0; i < each_value_16.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o(local) {
    			if (!h1_transition) h1_transition = create_bidirectional_transition(h1, slide, {}, false);
    			h1_transition.run(0);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(h1);
    			if (detaching && h1_transition) h1_transition.end();
    			if (detaching) detach(t1);
    			if (detaching) detach(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    // (1556:35) 
    function create_if_block_18(ctx) {
    	let h1;
    	let h1_transition;
    	let t1;
    	let div;
    	let current;
    	let each_value_15 = /*numbersSOTS*/ ctx[73];
    	let each_blocks = [];

    	for (let i = 0; i < each_value_15.length; i += 1) {
    		each_blocks[i] = create_each_block_15(get_each_context_15(ctx, each_value_15, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	return {
    		c() {
    			h1 = element("h1");
    			h1.textContent = "Off The Shoulder";
    			t1 = space();
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr(h1, "class", "mainDiv svelte-18kfgwi");
    			attr(div, "class", "containerFirm svelte-18kfgwi");
    		},
    		m(target, anchor) {
    			insert(target, h1, anchor);
    			insert(target, t1, anchor);
    			insert(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*ko, boxBelow, much*/ 324 | dirty[2] & /*numbersSOTS, priceSOTS, descSOTS, typeSOTS*/ 30720 | dirty[3] & /*opz, falsy*/ 50331648) {
    				each_value_15 = /*numbersSOTS*/ ctx[73];
    				let i;

    				for (i = 0; i < each_value_15.length; i += 1) {
    					const child_ctx = get_each_context_15(ctx, each_value_15, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_15(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value_15.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!h1_transition) h1_transition = create_bidirectional_transition(h1, slide, {}, true);
    				h1_transition.run(1);
    			});

    			for (let i = 0; i < each_value_15.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o(local) {
    			if (!h1_transition) h1_transition = create_bidirectional_transition(h1, slide, {}, false);
    			h1_transition.run(0);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(h1);
    			if (detaching && h1_transition) h1_transition.end();
    			if (detaching) detach(t1);
    			if (detaching) detach(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    // (1543:28) 
    function create_if_block_17(ctx) {
    	let h1;
    	let h1_transition;
    	let t1;
    	let div;
    	let current;
    	let each_value_14 = /*numbersSBC*/ ctx[69];
    	let each_blocks = [];

    	for (let i = 0; i < each_value_14.length; i += 1) {
    		each_blocks[i] = create_each_block_14(get_each_context_14(ctx, each_value_14, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	return {
    		c() {
    			h1 = element("h1");
    			h1.textContent = "Bodycon Dresses";
    			t1 = space();
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr(h1, "class", "mainDiv svelte-18kfgwi");
    			attr(div, "class", "containerFirm svelte-18kfgwi");
    		},
    		m(target, anchor) {
    			insert(target, h1, anchor);
    			insert(target, t1, anchor);
    			insert(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*ko, boxBelow, much*/ 324 | dirty[2] & /*numbersSBC, priceSCA, numbersSCA, priceSBC, descSBC, typeSBC*/ 2623360 | dirty[3] & /*opz, falsy*/ 50331648) {
    				each_value_14 = /*numbersSBC*/ ctx[69];
    				let i;

    				for (i = 0; i < each_value_14.length; i += 1) {
    					const child_ctx = get_each_context_14(ctx, each_value_14, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_14(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value_14.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!h1_transition) h1_transition = create_bidirectional_transition(h1, slide, {}, true);
    				h1_transition.run(1);
    			});

    			for (let i = 0; i < each_value_14.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o(local) {
    			if (!h1_transition) h1_transition = create_bidirectional_transition(h1, slide, {}, false);
    			h1_transition.run(0);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(h1);
    			if (detaching && h1_transition) h1_transition.end();
    			if (detaching) detach(t1);
    			if (detaching) detach(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    // (1527:25) 
    function create_if_block_16(ctx) {
    	let h1;
    	let t0;
    	let h1_transition;
    	let t1;
    	let div;
    	let current;
    	let each_value_13 = /*numbersBA*/ ctx[65];
    	let each_blocks = [];

    	for (let i = 0; i < each_value_13.length; i += 1) {
    		each_blocks[i] = create_each_block_13(get_each_context_13(ctx, each_value_13, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	return {
    		c() {
    			h1 = element("h1");
    			t0 = text(/*op2*/ ctx[1]);
    			t1 = space();
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr(h1, "class", "mainDiv svelte-18kfgwi");
    			attr(div, "class", "containerFirm svelte-18kfgwi");
    		},
    		m(target, anchor) {
    			insert(target, h1, anchor);
    			append(h1, t0);
    			insert(target, t1, anchor);
    			insert(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p(ctx, dirty) {
    			if (!current || dirty[0] & /*op2*/ 2) set_data(t0, /*op2*/ ctx[1]);

    			if (dirty[0] & /*ko, boxBelow, op2, much*/ 326 | dirty[2] & /*numbersBA, priceBA, descBA, typeBA*/ 120 | dirty[3] & /*falsy*/ 16777216) {
    				each_value_13 = /*numbersBA*/ ctx[65];
    				let i;

    				for (i = 0; i < each_value_13.length; i += 1) {
    					const child_ctx = get_each_context_13(ctx, each_value_13, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_13(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value_13.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!h1_transition) h1_transition = create_bidirectional_transition(h1, slide, {}, true);
    				h1_transition.run(1);
    			});

    			for (let i = 0; i < each_value_13.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o(local) {
    			if (!h1_transition) h1_transition = create_bidirectional_transition(h1, slide, {}, false);
    			h1_transition.run(0);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(h1);
    			if (detaching && h1_transition) h1_transition.end();
    			if (detaching) detach(t1);
    			if (detaching) detach(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    // (1514:25) 
    function create_if_block_15(ctx) {
    	let h1;
    	let t0;
    	let h1_transition;
    	let t1;
    	let div;
    	let current;
    	let each_value_12 = /*numbersRO*/ ctx[61];
    	let each_blocks = [];

    	for (let i = 0; i < each_value_12.length; i += 1) {
    		each_blocks[i] = create_each_block_12(get_each_context_12(ctx, each_value_12, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	return {
    		c() {
    			h1 = element("h1");
    			t0 = text(/*op2*/ ctx[1]);
    			t1 = space();
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr(h1, "class", "mainDiv svelte-18kfgwi");
    			attr(div, "class", "containerFirm svelte-18kfgwi");
    		},
    		m(target, anchor) {
    			insert(target, h1, anchor);
    			append(h1, t0);
    			insert(target, t1, anchor);
    			insert(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p(ctx, dirty) {
    			if (!current || dirty[0] & /*op2*/ 2) set_data(t0, /*op2*/ ctx[1]);

    			if (dirty[0] & /*ko, boxBelow, op2, much*/ 326 | dirty[1] & /*numbersRO*/ 1073741824 | dirty[2] & /*priceRO, descRO, typeRO*/ 7 | dirty[3] & /*falsy*/ 16777216) {
    				each_value_12 = /*numbersRO*/ ctx[61];
    				let i;

    				for (i = 0; i < each_value_12.length; i += 1) {
    					const child_ctx = get_each_context_12(ctx, each_value_12, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_12(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value_12.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!h1_transition) h1_transition = create_bidirectional_transition(h1, slide, {}, true);
    				h1_transition.run(1);
    			});

    			for (let i = 0; i < each_value_12.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o(local) {
    			if (!h1_transition) h1_transition = create_bidirectional_transition(h1, slide, {}, false);
    			h1_transition.run(0);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(h1);
    			if (detaching && h1_transition) h1_transition.end();
    			if (detaching) detach(t1);
    			if (detaching) detach(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    // (1500:26) 
    function create_if_block_14(ctx) {
    	let h1;
    	let t0;
    	let h1_transition;
    	let t1;
    	let div;
    	let current;
    	let each_value_11 = /*numbersCA*/ ctx[57];
    	let each_blocks = [];

    	for (let i = 0; i < each_value_11.length; i += 1) {
    		each_blocks[i] = create_each_block_11(get_each_context_11(ctx, each_value_11, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	return {
    		c() {
    			h1 = element("h1");
    			t0 = text(/*op2*/ ctx[1]);
    			t1 = space();
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr(h1, "class", "mainDiv svelte-18kfgwi");
    			attr(div, "class", "containerFirm svelte-18kfgwi");
    		},
    		m(target, anchor) {
    			insert(target, h1, anchor);
    			append(h1, t0);
    			insert(target, t1, anchor);
    			insert(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p(ctx, dirty) {
    			if (!current || dirty[0] & /*op2*/ 2) set_data(t0, /*op2*/ ctx[1]);

    			if (dirty[0] & /*ko, boxBelow, op2, much*/ 326 | dirty[1] & /*numbersCA, priceCA, descCA, typeCA*/ 1006632960 | dirty[3] & /*falsy*/ 16777216) {
    				each_value_11 = /*numbersCA*/ ctx[57];
    				let i;

    				for (i = 0; i < each_value_11.length; i += 1) {
    					const child_ctx = get_each_context_11(ctx, each_value_11, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_11(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value_11.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!h1_transition) h1_transition = create_bidirectional_transition(h1, slide, {}, true);
    				h1_transition.run(1);
    			});

    			for (let i = 0; i < each_value_11.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o(local) {
    			if (!h1_transition) h1_transition = create_bidirectional_transition(h1, slide, {}, false);
    			h1_transition.run(0);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(h1);
    			if (detaching && h1_transition) h1_transition.end();
    			if (detaching) detach(t1);
    			if (detaching) detach(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    // (1486:27) 
    function create_if_block_13(ctx) {
    	let h1;
    	let t0;
    	let h1_transition;
    	let t1;
    	let div;
    	let current;
    	let each_value_10 = /*numbersSA*/ ctx[53];
    	let each_blocks = [];

    	for (let i = 0; i < each_value_10.length; i += 1) {
    		each_blocks[i] = create_each_block_10(get_each_context_10(ctx, each_value_10, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	return {
    		c() {
    			h1 = element("h1");
    			t0 = text(/*op2*/ ctx[1]);
    			t1 = space();
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr(h1, "class", "mainDiv svelte-18kfgwi");
    			attr(div, "class", "containerFirm svelte-18kfgwi");
    		},
    		m(target, anchor) {
    			insert(target, h1, anchor);
    			append(h1, t0);
    			insert(target, t1, anchor);
    			insert(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p(ctx, dirty) {
    			if (!current || dirty[0] & /*op2*/ 2) set_data(t0, /*op2*/ ctx[1]);

    			if (dirty[0] & /*ko, boxBelow, op2, much*/ 326 | dirty[1] & /*numbersSA, priceSA, descSA, typeSA*/ 62914560 | dirty[3] & /*falsy*/ 16777216) {
    				each_value_10 = /*numbersSA*/ ctx[53];
    				let i;

    				for (i = 0; i < each_value_10.length; i += 1) {
    					const child_ctx = get_each_context_10(ctx, each_value_10, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_10(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value_10.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!h1_transition) h1_transition = create_bidirectional_transition(h1, slide, {}, true);
    				h1_transition.run(1);
    			});

    			for (let i = 0; i < each_value_10.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o(local) {
    			if (!h1_transition) h1_transition = create_bidirectional_transition(h1, slide, {}, false);
    			h1_transition.run(0);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(h1);
    			if (detaching && h1_transition) h1_transition.end();
    			if (detaching) detach(t1);
    			if (detaching) detach(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    // (1471:27) 
    function create_if_block_12(ctx) {
    	let h1;
    	let t0;
    	let h1_transition;
    	let t1;
    	let div;
    	let current;
    	let each_value_9 = /*numbersT*/ ctx[49];
    	let each_blocks = [];

    	for (let i = 0; i < each_value_9.length; i += 1) {
    		each_blocks[i] = create_each_block_9(get_each_context_9(ctx, each_value_9, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	return {
    		c() {
    			h1 = element("h1");
    			t0 = text(/*op2*/ ctx[1]);
    			t1 = space();
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr(h1, "class", "mainDiv svelte-18kfgwi");
    			attr(div, "class", "containerFirm svelte-18kfgwi");
    		},
    		m(target, anchor) {
    			insert(target, h1, anchor);
    			append(h1, t0);
    			insert(target, t1, anchor);
    			insert(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p(ctx, dirty) {
    			if (!current || dirty[0] & /*op2*/ 2) set_data(t0, /*op2*/ ctx[1]);

    			if (dirty[0] & /*ko, boxBelow, op2, much*/ 326 | dirty[1] & /*numbersT, priceT, descT, typeT*/ 3932160 | dirty[3] & /*falsy*/ 16777216) {
    				each_value_9 = /*numbersT*/ ctx[49];
    				let i;

    				for (i = 0; i < each_value_9.length; i += 1) {
    					const child_ctx = get_each_context_9(ctx, each_value_9, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_9(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value_9.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!h1_transition) h1_transition = create_bidirectional_transition(h1, slide, {}, true);
    				h1_transition.run(1);
    			});

    			for (let i = 0; i < each_value_9.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o(local) {
    			if (!h1_transition) h1_transition = create_bidirectional_transition(h1, slide, {}, false);
    			h1_transition.run(0);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(h1);
    			if (detaching && h1_transition) h1_transition.end();
    			if (detaching) detach(t1);
    			if (detaching) detach(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    // (1457:27) 
    function create_if_block_11(ctx) {
    	let h1;
    	let t0;
    	let h1_transition;
    	let t1;
    	let div;
    	let current;
    	let each_value_8 = /*numbersB*/ ctx[45];
    	let each_blocks = [];

    	for (let i = 0; i < each_value_8.length; i += 1) {
    		each_blocks[i] = create_each_block_8(get_each_context_8(ctx, each_value_8, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	return {
    		c() {
    			h1 = element("h1");
    			t0 = text(/*op2*/ ctx[1]);
    			t1 = space();
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr(h1, "class", "mainDiv svelte-18kfgwi");
    			attr(div, "class", "containerFirm svelte-18kfgwi");
    		},
    		m(target, anchor) {
    			insert(target, h1, anchor);
    			append(h1, t0);
    			insert(target, t1, anchor);
    			insert(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p(ctx, dirty) {
    			if (!current || dirty[0] & /*op2*/ 2) set_data(t0, /*op2*/ ctx[1]);

    			if (dirty[0] & /*ko, op2, boxBelow, much*/ 326 | dirty[1] & /*numbersB, priceB, descB, typeB*/ 245760 | dirty[3] & /*falsy*/ 16777216) {
    				each_value_8 = /*numbersB*/ ctx[45];
    				let i;

    				for (i = 0; i < each_value_8.length; i += 1) {
    					const child_ctx = get_each_context_8(ctx, each_value_8, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_8(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value_8.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!h1_transition) h1_transition = create_bidirectional_transition(h1, slide, {}, true);
    				h1_transition.run(1);
    			});

    			for (let i = 0; i < each_value_8.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o(local) {
    			if (!h1_transition) h1_transition = create_bidirectional_transition(h1, slide, {}, false);
    			h1_transition.run(0);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(h1);
    			if (detaching && h1_transition) h1_transition.end();
    			if (detaching) detach(t1);
    			if (detaching) detach(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    // (1444:29) 
    function create_if_block_10(ctx) {
    	let h1;
    	let t0;
    	let h1_transition;
    	let t1;
    	let div;
    	let current;
    	let each_value_7 = /*numbersS*/ ctx[41];
    	let each_blocks = [];

    	for (let i = 0; i < each_value_7.length; i += 1) {
    		each_blocks[i] = create_each_block_7(get_each_context_7(ctx, each_value_7, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	return {
    		c() {
    			h1 = element("h1");
    			t0 = text(/*op2*/ ctx[1]);
    			t1 = space();
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr(h1, "class", "mainDiv svelte-18kfgwi");
    			attr(div, "class", "containerFirm svelte-18kfgwi");
    		},
    		m(target, anchor) {
    			insert(target, h1, anchor);
    			append(h1, t0);
    			insert(target, t1, anchor);
    			insert(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p(ctx, dirty) {
    			if (!current || dirty[0] & /*op2*/ 2) set_data(t0, /*op2*/ ctx[1]);

    			if (dirty[0] & /*ko, op2, boxBelow, much*/ 326 | dirty[1] & /*numbersS, priceS, descS, typeS*/ 15360 | dirty[3] & /*falsy*/ 16777216) {
    				each_value_7 = /*numbersS*/ ctx[41];
    				let i;

    				for (i = 0; i < each_value_7.length; i += 1) {
    					const child_ctx = get_each_context_7(ctx, each_value_7, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_7(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value_7.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!h1_transition) h1_transition = create_bidirectional_transition(h1, slide, {}, true);
    				h1_transition.run(1);
    			});

    			for (let i = 0; i < each_value_7.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o(local) {
    			if (!h1_transition) h1_transition = create_bidirectional_transition(h1, slide, {}, false);
    			h1_transition.run(0);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(h1);
    			if (detaching && h1_transition) h1_transition.end();
    			if (detaching) detach(t1);
    			if (detaching) detach(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    // (1431:23) 
    function create_if_block_9(ctx) {
    	let h1;
    	let t0;
    	let h1_transition;
    	let t1;
    	let div;
    	let current;
    	let each_value_6 = /*numbersD*/ ctx[37];
    	let each_blocks = [];

    	for (let i = 0; i < each_value_6.length; i += 1) {
    		each_blocks[i] = create_each_block_6(get_each_context_6(ctx, each_value_6, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	return {
    		c() {
    			h1 = element("h1");
    			t0 = text(/*op2*/ ctx[1]);
    			t1 = space();
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr(h1, "class", "mainDiv svelte-18kfgwi");
    			attr(div, "class", "containerFirm svelte-18kfgwi");
    		},
    		m(target, anchor) {
    			insert(target, h1, anchor);
    			append(h1, t0);
    			insert(target, t1, anchor);
    			insert(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p(ctx, dirty) {
    			if (!current || dirty[0] & /*op2*/ 2) set_data(t0, /*op2*/ ctx[1]);

    			if (dirty[0] & /*ko, op2, boxBelow, much*/ 326 | dirty[1] & /*numbersD, priceD, descD, typeD*/ 960 | dirty[3] & /*falsy*/ 16777216) {
    				each_value_6 = /*numbersD*/ ctx[37];
    				let i;

    				for (i = 0; i < each_value_6.length; i += 1) {
    					const child_ctx = get_each_context_6(ctx, each_value_6, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_6(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value_6.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!h1_transition) h1_transition = create_bidirectional_transition(h1, slide, {}, true);
    				h1_transition.run(1);
    			});

    			for (let i = 0; i < each_value_6.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o(local) {
    			if (!h1_transition) h1_transition = create_bidirectional_transition(h1, slide, {}, false);
    			h1_transition.run(0);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(h1);
    			if (detaching && h1_transition) h1_transition.end();
    			if (detaching) detach(t1);
    			if (detaching) detach(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    // (1417:25) 
    function create_if_block_8(ctx) {
    	let h1;
    	let t0;
    	let t1;
    	let h1_transition;
    	let t2;
    	let div;
    	let current;
    	let each_value_5 = /*numbersH*/ ctx[33];
    	let each_blocks = [];

    	for (let i = 0; i < each_value_5.length; i += 1) {
    		each_blocks[i] = create_each_block_5$1(get_each_context_5$1(ctx, each_value_5, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	return {
    		c() {
    			h1 = element("h1");
    			t0 = text(/*op2*/ ctx[1]);
    			t1 = text(" Silk");
    			t2 = space();
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr(h1, "class", "mainDiv svelte-18kfgwi");
    			attr(div, "class", "containerFirm svelte-18kfgwi");
    		},
    		m(target, anchor) {
    			insert(target, h1, anchor);
    			append(h1, t0);
    			append(h1, t1);
    			insert(target, t2, anchor);
    			insert(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p(ctx, dirty) {
    			if (!current || dirty[0] & /*op2*/ 2) set_data(t0, /*op2*/ ctx[1]);

    			if (dirty[0] & /*ko, boxBelow, op2, much*/ 326 | dirty[1] & /*numbersH, priceH, descH, typeH*/ 60 | dirty[3] & /*falsy*/ 16777216) {
    				each_value_5 = /*numbersH*/ ctx[33];
    				let i;

    				for (i = 0; i < each_value_5.length; i += 1) {
    					const child_ctx = get_each_context_5$1(ctx, each_value_5, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_5$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value_5.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!h1_transition) h1_transition = create_bidirectional_transition(h1, slide, {}, true);
    				h1_transition.run(1);
    			});

    			for (let i = 0; i < each_value_5.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o(local) {
    			if (!h1_transition) h1_transition = create_bidirectional_transition(h1, slide, {}, false);
    			h1_transition.run(0);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(h1);
    			if (detaching && h1_transition) h1_transition.end();
    			if (detaching) detach(t2);
    			if (detaching) detach(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    // (1403:24) 
    function create_if_block_7(ctx) {
    	let h1;
    	let t0;
    	let t1;
    	let h1_transition;
    	let t2;
    	let div;
    	let current;
    	let each_value_4 = /*numbersL*/ ctx[29];
    	let each_blocks = [];

    	for (let i = 0; i < each_value_4.length; i += 1) {
    		each_blocks[i] = create_each_block_4$1(get_each_context_4$1(ctx, each_value_4, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	return {
    		c() {
    			h1 = element("h1");
    			t0 = text(/*op2*/ ctx[1]);
    			t1 = text(" Silk");
    			t2 = space();
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr(h1, "class", "mainDiv svelte-18kfgwi");
    			attr(div, "class", "containerFirm svelte-18kfgwi");
    		},
    		m(target, anchor) {
    			insert(target, h1, anchor);
    			append(h1, t0);
    			append(h1, t1);
    			insert(target, t2, anchor);
    			insert(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p(ctx, dirty) {
    			if (!current || dirty[0] & /*op2*/ 2) set_data(t0, /*op2*/ ctx[1]);

    			if (dirty[0] & /*ko, numbersL, boxBelow, op2, much, typeL*/ 1610613062 | dirty[1] & /*priceL, descL*/ 3 | dirty[3] & /*falsy*/ 16777216) {
    				each_value_4 = /*numbersL*/ ctx[29];
    				let i;

    				for (i = 0; i < each_value_4.length; i += 1) {
    					const child_ctx = get_each_context_4$1(ctx, each_value_4, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_4$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value_4.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!h1_transition) h1_transition = create_bidirectional_transition(h1, slide, {}, true);
    				h1_transition.run(1);
    			});

    			for (let i = 0; i < each_value_4.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o(local) {
    			if (!h1_transition) h1_transition = create_bidirectional_transition(h1, slide, {}, false);
    			h1_transition.run(0);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(h1);
    			if (detaching && h1_transition) h1_transition.end();
    			if (detaching) detach(t2);
    			if (detaching) detach(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    // (1388:24) 
    function create_if_block_6(ctx) {
    	let h1;
    	let t0;
    	let t1;
    	let h1_transition;
    	let t2;
    	let div;
    	let current;
    	let each_value_3 = /*numbersK*/ ctx[25];
    	let each_blocks = [];

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		each_blocks[i] = create_each_block_3$1(get_each_context_3$1(ctx, each_value_3, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	return {
    		c() {
    			h1 = element("h1");
    			t0 = text(/*op2*/ ctx[1]);
    			t1 = text(" Paris");
    			t2 = space();
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr(h1, "class", "mainDiv svelte-18kfgwi");
    			attr(div, "class", "containerFirm svelte-18kfgwi");
    		},
    		m(target, anchor) {
    			insert(target, h1, anchor);
    			append(h1, t0);
    			append(h1, t1);
    			insert(target, t2, anchor);
    			insert(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p(ctx, dirty) {
    			if (!current || dirty[0] & /*op2*/ 2) set_data(t0, /*op2*/ ctx[1]);

    			if (dirty[0] & /*ko, numbersK, priceK, boxBelow, op2, much, descK, typeK*/ 503316806 | dirty[3] & /*falsy*/ 16777216) {
    				each_value_3 = /*numbersK*/ ctx[25];
    				let i;

    				for (i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3$1(ctx, each_value_3, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_3$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value_3.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!h1_transition) h1_transition = create_bidirectional_transition(h1, slide, {}, true);
    				h1_transition.run(1);
    			});

    			for (let i = 0; i < each_value_3.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o(local) {
    			if (!h1_transition) h1_transition = create_bidirectional_transition(h1, slide, {}, false);
    			h1_transition.run(0);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(h1);
    			if (detaching && h1_transition) h1_transition.end();
    			if (detaching) detach(t2);
    			if (detaching) detach(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    // (1374:31) 
    function create_if_block_5(ctx) {
    	let h1;
    	let t0;
    	let h1_transition;
    	let t1;
    	let div;
    	let current;
    	let each_value_2 = /*numbersR*/ ctx[21];
    	let each_blocks = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks[i] = create_each_block_2$1(get_each_context_2$1(ctx, each_value_2, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	return {
    		c() {
    			h1 = element("h1");
    			t0 = text(/*op2*/ ctx[1]);
    			t1 = space();
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr(h1, "class", "mainDiv svelte-18kfgwi");
    			attr(div, "class", "containerFirm svelte-18kfgwi");
    		},
    		m(target, anchor) {
    			insert(target, h1, anchor);
    			append(h1, t0);
    			insert(target, t1, anchor);
    			insert(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p(ctx, dirty) {
    			if (!current || dirty[0] & /*op2*/ 2) set_data(t0, /*op2*/ ctx[1]);

    			if (dirty[0] & /*ko, numbersR, priceR, boxBelow, op2, much, descR, typeR*/ 31457606 | dirty[3] & /*falsy*/ 16777216) {
    				each_value_2 = /*numbersR*/ ctx[21];
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2$1(ctx, each_value_2, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_2$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value_2.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!h1_transition) h1_transition = create_bidirectional_transition(h1, slide, {}, true);
    				h1_transition.run(1);
    			});

    			for (let i = 0; i < each_value_2.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o(local) {
    			if (!h1_transition) h1_transition = create_bidirectional_transition(h1, slide, {}, false);
    			h1_transition.run(0);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(h1);
    			if (detaching && h1_transition) h1_transition.end();
    			if (detaching) detach(t1);
    			if (detaching) detach(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    // (1360:24) 
    function create_if_block_4$1(ctx) {
    	let h1;
    	let t0;
    	let t1;
    	let h1_transition;
    	let t2;
    	let div;
    	let current;
    	let each_value_1 = /*numbersM*/ ctx[17];
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1$2(get_each_context_1$2(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	return {
    		c() {
    			h1 = element("h1");
    			t0 = text(/*op2*/ ctx[1]);
    			t1 = text(" & Spancer");
    			t2 = space();
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr(h1, "class", "mainDiv svelte-18kfgwi");
    			attr(div, "class", "containerFirm svelte-18kfgwi");
    		},
    		m(target, anchor) {
    			insert(target, h1, anchor);
    			append(h1, t0);
    			append(h1, t1);
    			insert(target, t2, anchor);
    			insert(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p(ctx, dirty) {
    			if (!current || dirty[0] & /*op2*/ 2) set_data(t0, /*op2*/ ctx[1]);

    			if (dirty[0] & /*ko, numbersM, priceM, boxBelow, op2, much, descM, typeM*/ 1966406 | dirty[3] & /*falsy*/ 16777216) {
    				each_value_1 = /*numbersM*/ ctx[17];
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$2(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_1$2(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value_1.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!h1_transition) h1_transition = create_bidirectional_transition(h1, slide, {}, true);
    				h1_transition.run(1);
    			});

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o(local) {
    			if (!h1_transition) h1_transition = create_bidirectional_transition(h1, slide, {}, false);
    			h1_transition.run(0);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(h1);
    			if (detaching && h1_transition) h1_transition.end();
    			if (detaching) detach(t2);
    			if (detaching) detach(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    // (1344:0) {#if op2==="Ted"}
    function create_if_block_3$1(ctx) {
    	let h1;
    	let t0;
    	let t1;
    	let h1_transition;
    	let t2;
    	let div;
    	let current;
    	let each_value = /*numbers*/ ctx[13];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	return {
    		c() {
    			h1 = element("h1");
    			t0 = text(/*op2*/ ctx[1]);
    			t1 = text(" Baker");
    			t2 = space();
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr(h1, "class", "mainDiv svelte-18kfgwi");
    			attr(div, "class", "containerFirm svelte-18kfgwi");
    		},
    		m(target, anchor) {
    			insert(target, h1, anchor);
    			append(h1, t0);
    			append(h1, t1);
    			insert(target, t2, anchor);
    			insert(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p(ctx, dirty) {
    			if (!current || dirty[0] & /*op2*/ 2) set_data(t0, /*op2*/ ctx[1]);

    			if (dirty[0] & /*ko, numbers, price, boxBelow, op2, much, goSingle, desc, type*/ 127302 | dirty[3] & /*falsy*/ 16777216) {
    				each_value = /*numbers*/ ctx[13];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!h1_transition) h1_transition = create_bidirectional_transition(h1, slide, {}, true);
    				h1_transition.run(1);
    			});

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o(local) {
    			if (!h1_transition) h1_transition = create_bidirectional_transition(h1, slide, {}, false);
    			h1_transition.run(0);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(h1);
    			if (detaching && h1_transition) h1_transition.end();
    			if (detaching) detach(t2);
    			if (detaching) detach(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    // (1703:0) {#each numbersSFA as item }
    function create_each_block_25(ctx) {
    	let div1;
    	let img;
    	let img_src_value;
    	let div0;
    	let p0;
    	let t0_value = mark(/*item*/ ctx[174], /*typeSFA*/ ctx[114], /*numbersSFA*/ ctx[113]) + "";
    	let t0;
    	let p1;
    	let t1_value = mark(/*item*/ ctx[174], /*descSFA*/ ctx[116], /*numbersSFA*/ ctx[113]) + "";
    	let t1;
    	let p2;
    	let t2_value = mark(/*item*/ ctx[174], /*priceSFA*/ ctx[115], /*numbersSFA*/ ctx[113]) + "";
    	let t2;
    	let div1_transition;
    	let current;
    	let mounted;
    	let dispose;

    	function click_handler_25(...args) {
    		return /*click_handler_25*/ ctx[144](/*item*/ ctx[174], ...args);
    	}

    	return {
    		c() {
    			div1 = element("div");
    			img = element("img");
    			div0 = element("div");
    			p0 = element("p");
    			t0 = text(t0_value);
    			p1 = element("p");
    			t1 = text(t1_value);
    			p2 = element("p");
    			t2 = text(t2_value);
    			attr(img, "class", "imgC " + opy(/*item*/ ctx[174]) + " svelte-18kfgwi");
    			if (img.src !== (img_src_value = "" + (/*item*/ ctx[174] + ".png"))) attr(img, "src", img_src_value);
    			attr(img, "alt", "");
    			attr(p0, "class", "mark1 svelte-18kfgwi");
    			attr(p1, "class", "mark2 svelte-18kfgwi");
    			attr(p2, "class", "mark3 svelte-18kfgwi");
    			attr(div0, "class", "contentPic " + /*opz*/ ctx[118](/*item*/ ctx[174]) + opy(/*item*/ ctx[174]) + " svelte-18kfgwi");
    			attr(div1, "class", "flex-col svelte-18kfgwi");
    		},
    		m(target, anchor) {
    			insert(target, div1, anchor);
    			append(div1, img);
    			append(div1, div0);
    			append(div0, p0);
    			append(p0, t0);
    			append(div0, p1);
    			append(p1, t1);
    			append(div0, p2);
    			append(p2, t2);
    			current = true;

    			if (!mounted) {
    				dispose = listen(div1, "click", click_handler_25);
    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		i(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, {}, true);
    				div1_transition.run(1);
    			});

    			current = true;
    		},
    		o(local) {
    			if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, {}, false);
    			div1_transition.run(0);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div1);
    			if (detaching && div1_transition) div1_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (1689:0) {#each numbersSMO as item }
    function create_each_block_24(ctx) {
    	let div1;
    	let img;
    	let img_src_value;
    	let div0;
    	let p0;
    	let t0_value = mark(/*item*/ ctx[174], /*typeSMO*/ ctx[110], /*numbersSMO*/ ctx[109]) + "";
    	let t0;
    	let p1;
    	let t1_value = mark(/*item*/ ctx[174], /*descSMO*/ ctx[112], /*numbersSMO*/ ctx[109]) + "";
    	let t1;
    	let p2;
    	let t2_value = mark(/*item*/ ctx[174], /*priceSMO*/ ctx[111], /*numbersSMO*/ ctx[109]) + "";
    	let t2;
    	let div1_transition;
    	let current;
    	let mounted;
    	let dispose;

    	function click_handler_24(...args) {
    		return /*click_handler_24*/ ctx[143](/*item*/ ctx[174], ...args);
    	}

    	return {
    		c() {
    			div1 = element("div");
    			img = element("img");
    			div0 = element("div");
    			p0 = element("p");
    			t0 = text(t0_value);
    			p1 = element("p");
    			t1 = text(t1_value);
    			p2 = element("p");
    			t2 = text(t2_value);
    			attr(img, "class", "imgC " + opy(/*item*/ ctx[174]) + " svelte-18kfgwi");
    			if (img.src !== (img_src_value = "" + (/*item*/ ctx[174] + ".png"))) attr(img, "src", img_src_value);
    			attr(img, "alt", "");
    			attr(p0, "class", "mark1 svelte-18kfgwi");
    			attr(p1, "class", "mark2 svelte-18kfgwi");
    			attr(p2, "class", "mark3 svelte-18kfgwi");
    			attr(div0, "class", "contentPic " + /*opz*/ ctx[118](/*item*/ ctx[174]) + opy(/*item*/ ctx[174]) + " svelte-18kfgwi");
    			attr(div1, "class", "flex-col svelte-18kfgwi");
    		},
    		m(target, anchor) {
    			insert(target, div1, anchor);
    			append(div1, img);
    			append(div1, div0);
    			append(div0, p0);
    			append(p0, t0);
    			append(div0, p1);
    			append(p1, t1);
    			append(div0, p2);
    			append(p2, t2);
    			current = true;

    			if (!mounted) {
    				dispose = listen(div1, "click", click_handler_24);
    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		i(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, {}, true);
    				div1_transition.run(1);
    			});

    			current = true;
    		},
    		o(local) {
    			if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, {}, false);
    			div1_transition.run(0);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div1);
    			if (detaching && div1_transition) div1_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (1676:0) {#each numbersSRE as item }
    function create_each_block_23(ctx) {
    	let div1;
    	let img;
    	let img_src_value;
    	let div0;
    	let p0;
    	let t0_value = mark(/*item*/ ctx[174], /*typeSRE*/ ctx[106], /*numbersSRE*/ ctx[105]) + "";
    	let t0;
    	let p1;
    	let t1_value = mark(/*item*/ ctx[174], /*descSRE*/ ctx[108], /*numbersSRE*/ ctx[105]) + "";
    	let t1;
    	let p2;
    	let t2_value = mark(/*item*/ ctx[174], /*priceSRE*/ ctx[107], /*numbersSRE*/ ctx[105]) + "";
    	let t2;
    	let div1_transition;
    	let current;
    	let mounted;
    	let dispose;

    	function click_handler_23(...args) {
    		return /*click_handler_23*/ ctx[142](/*item*/ ctx[174], ...args);
    	}

    	return {
    		c() {
    			div1 = element("div");
    			img = element("img");
    			div0 = element("div");
    			p0 = element("p");
    			t0 = text(t0_value);
    			p1 = element("p");
    			t1 = text(t1_value);
    			p2 = element("p");
    			t2 = text(t2_value);
    			attr(img, "class", "imgC " + opy(/*item*/ ctx[174]) + " svelte-18kfgwi");
    			if (img.src !== (img_src_value = "" + (/*item*/ ctx[174] + ".png"))) attr(img, "src", img_src_value);
    			attr(img, "alt", "");
    			attr(p0, "class", "mark1 svelte-18kfgwi");
    			attr(p1, "class", "mark2 svelte-18kfgwi");
    			attr(p2, "class", "mark3 svelte-18kfgwi");
    			attr(div0, "class", "contentPic " + /*opz*/ ctx[118](/*item*/ ctx[174]) + opy(/*item*/ ctx[174]) + " svelte-18kfgwi");
    			attr(div1, "class", "flex-col svelte-18kfgwi");
    		},
    		m(target, anchor) {
    			insert(target, div1, anchor);
    			append(div1, img);
    			append(div1, div0);
    			append(div0, p0);
    			append(p0, t0);
    			append(div0, p1);
    			append(p1, t1);
    			append(div0, p2);
    			append(p2, t2);
    			current = true;

    			if (!mounted) {
    				dispose = listen(div1, "click", click_handler_23);
    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		i(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, {}, true);
    				div1_transition.run(1);
    			});

    			current = true;
    		},
    		o(local) {
    			if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, {}, false);
    			div1_transition.run(0);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div1);
    			if (detaching && div1_transition) div1_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (1661:0) {#each numbersSEA as item }
    function create_each_block_22(ctx) {
    	let div1;
    	let img;
    	let img_src_value;
    	let div0;
    	let p0;
    	let t0_value = mark(/*item*/ ctx[174], /*typeSEA*/ ctx[102], /*numbersSEA*/ ctx[101]) + "";
    	let t0;
    	let p1;
    	let t1_value = mark(/*item*/ ctx[174], /*descSEA*/ ctx[104], /*numbersSEA*/ ctx[101]) + "";
    	let t1;
    	let p2;
    	let t2_value = mark(/*item*/ ctx[174], /*priceSEA*/ ctx[103], /*numbersSEA*/ ctx[101]) + "";
    	let t2;
    	let div1_transition;
    	let current;
    	let mounted;
    	let dispose;

    	function click_handler_22(...args) {
    		return /*click_handler_22*/ ctx[141](/*item*/ ctx[174], ...args);
    	}

    	return {
    		c() {
    			div1 = element("div");
    			img = element("img");
    			div0 = element("div");
    			p0 = element("p");
    			t0 = text(t0_value);
    			p1 = element("p");
    			t1 = text(t1_value);
    			p2 = element("p");
    			t2 = text(t2_value);
    			attr(img, "class", "imgC " + opy(/*item*/ ctx[174]) + " svelte-18kfgwi");
    			if (img.src !== (img_src_value = "" + (/*item*/ ctx[174] + ".png"))) attr(img, "src", img_src_value);
    			attr(img, "alt", "");
    			attr(p0, "class", "mark1 svelte-18kfgwi");
    			attr(p1, "class", "mark2 svelte-18kfgwi");
    			attr(p2, "class", "mark3 svelte-18kfgwi");
    			attr(div0, "class", "contentPic " + /*opz*/ ctx[118](/*item*/ ctx[174]) + opy(/*item*/ ctx[174]) + " svelte-18kfgwi");
    			attr(div1, "class", "flex-col svelte-18kfgwi");
    		},
    		m(target, anchor) {
    			insert(target, div1, anchor);
    			append(div1, img);
    			append(div1, div0);
    			append(div0, p0);
    			append(p0, t0);
    			append(div0, p1);
    			append(p1, t1);
    			append(div0, p2);
    			append(p2, t2);
    			current = true;

    			if (!mounted) {
    				dispose = listen(div1, "click", click_handler_22);
    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		i(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, {}, true);
    				div1_transition.run(1);
    			});

    			current = true;
    		},
    		o(local) {
    			if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, {}, false);
    			div1_transition.run(0);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div1);
    			if (detaching && div1_transition) div1_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (1646:0) {#each numbersSNE as item }
    function create_each_block_21(ctx) {
    	let div1;
    	let img;
    	let img_src_value;
    	let div0;
    	let p0;
    	let t0_value = mark(/*item*/ ctx[174], /*typeSNE*/ ctx[98], /*numbersSNE*/ ctx[97]) + "";
    	let t0;
    	let p1;
    	let t1_value = mark(/*item*/ ctx[174], /*descSNE*/ ctx[100], /*numbersSNE*/ ctx[97]) + "";
    	let t1;
    	let p2;
    	let t2_value = mark(/*item*/ ctx[174], /*priceSNE*/ ctx[99], /*numbersSNE*/ ctx[97]) + "";
    	let t2;
    	let div1_transition;
    	let current;
    	let mounted;
    	let dispose;

    	function click_handler_21(...args) {
    		return /*click_handler_21*/ ctx[140](/*item*/ ctx[174], ...args);
    	}

    	return {
    		c() {
    			div1 = element("div");
    			img = element("img");
    			div0 = element("div");
    			p0 = element("p");
    			t0 = text(t0_value);
    			p1 = element("p");
    			t1 = text(t1_value);
    			p2 = element("p");
    			t2 = text(t2_value);
    			attr(img, "class", "imgC " + opy(/*item*/ ctx[174]) + " svelte-18kfgwi");
    			if (img.src !== (img_src_value = "" + (/*item*/ ctx[174] + ".png"))) attr(img, "src", img_src_value);
    			attr(img, "alt", "");
    			attr(p0, "class", "mark1 svelte-18kfgwi");
    			attr(p1, "class", "mark2 svelte-18kfgwi");
    			attr(p2, "class", "mark3 svelte-18kfgwi");
    			attr(div0, "class", "contentPic " + /*opz*/ ctx[118](/*item*/ ctx[174]) + opy(/*item*/ ctx[174]) + " svelte-18kfgwi");
    			attr(div1, "class", "flex-col svelte-18kfgwi");
    		},
    		m(target, anchor) {
    			insert(target, div1, anchor);
    			append(div1, img);
    			append(div1, div0);
    			append(div0, p0);
    			append(p0, t0);
    			append(div0, p1);
    			append(p1, t1);
    			append(div0, p2);
    			append(p2, t2);
    			current = true;

    			if (!mounted) {
    				dispose = listen(div1, "click", click_handler_21);
    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		i(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, {}, true);
    				div1_transition.run(1);
    			});

    			current = true;
    		},
    		o(local) {
    			if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, {}, false);
    			div1_transition.run(0);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div1);
    			if (detaching && div1_transition) div1_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (1632:0) {#each numbersSRI as item }
    function create_each_block_20(ctx) {
    	let div1;
    	let img;
    	let img_src_value;
    	let div0;
    	let p0;
    	let t0_value = mark(/*item*/ ctx[174], /*typeSRI*/ ctx[94], /*numbersSRI*/ ctx[93]) + "";
    	let t0;
    	let p1;
    	let t1_value = mark(/*item*/ ctx[174], /*descSRI*/ ctx[96], /*numbersSRI*/ ctx[93]) + "";
    	let t1;
    	let p2;
    	let t2_value = mark(/*item*/ ctx[174], /*priceSRI*/ ctx[95], /*numbersSRI*/ ctx[93]) + "";
    	let t2;
    	let div1_transition;
    	let current;
    	let mounted;
    	let dispose;

    	function click_handler_20(...args) {
    		return /*click_handler_20*/ ctx[139](/*item*/ ctx[174], ...args);
    	}

    	return {
    		c() {
    			div1 = element("div");
    			img = element("img");
    			div0 = element("div");
    			p0 = element("p");
    			t0 = text(t0_value);
    			p1 = element("p");
    			t1 = text(t1_value);
    			p2 = element("p");
    			t2 = text(t2_value);
    			attr(img, "class", "imgC " + opy(/*item*/ ctx[174]) + " svelte-18kfgwi");
    			if (img.src !== (img_src_value = "" + (/*item*/ ctx[174] + ".png"))) attr(img, "src", img_src_value);
    			attr(img, "alt", "");
    			attr(p0, "class", "mark1 svelte-18kfgwi");
    			attr(p1, "class", "mark2 svelte-18kfgwi");
    			attr(p2, "class", "mark3 svelte-18kfgwi");
    			attr(div0, "class", "contentPic " + /*opz*/ ctx[118](/*item*/ ctx[174]) + opy(/*item*/ ctx[174]) + " svelte-18kfgwi");
    			attr(div1, "class", "flex-col svelte-18kfgwi");
    		},
    		m(target, anchor) {
    			insert(target, div1, anchor);
    			append(div1, img);
    			append(div1, div0);
    			append(div0, p0);
    			append(p0, t0);
    			append(div0, p1);
    			append(p1, t1);
    			append(div0, p2);
    			append(p2, t2);
    			current = true;

    			if (!mounted) {
    				dispose = listen(div1, "click", click_handler_20);
    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		i(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, {}, true);
    				div1_transition.run(1);
    			});

    			current = true;
    		},
    		o(local) {
    			if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, {}, false);
    			div1_transition.run(0);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div1);
    			if (detaching && div1_transition) div1_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (1619:0) {#each numbersSOF as item }
    function create_each_block_19(ctx) {
    	let div1;
    	let img;
    	let img_src_value;
    	let div0;
    	let p0;
    	let t0_value = mark(/*item*/ ctx[174], /*typeSOF*/ ctx[90], /*numbersSOF*/ ctx[89]) + "";
    	let t0;
    	let p1;
    	let t1_value = mark(/*item*/ ctx[174], /*descSOF*/ ctx[92], /*numbersSOF*/ ctx[89]) + "";
    	let t1;
    	let p2;
    	let t2_value = mark(/*item*/ ctx[174], /*priceSOF*/ ctx[91], /*numbersSOF*/ ctx[89]) + "";
    	let t2;
    	let div1_transition;
    	let current;
    	let mounted;
    	let dispose;

    	function click_handler_19(...args) {
    		return /*click_handler_19*/ ctx[138](/*item*/ ctx[174], ...args);
    	}

    	return {
    		c() {
    			div1 = element("div");
    			img = element("img");
    			div0 = element("div");
    			p0 = element("p");
    			t0 = text(t0_value);
    			p1 = element("p");
    			t1 = text(t1_value);
    			p2 = element("p");
    			t2 = text(t2_value);
    			attr(img, "class", "imgC " + opy(/*item*/ ctx[174]) + " svelte-18kfgwi");
    			if (img.src !== (img_src_value = "" + (/*item*/ ctx[174] + ".png"))) attr(img, "src", img_src_value);
    			attr(img, "alt", "");
    			attr(p0, "class", "mark1 svelte-18kfgwi");
    			attr(p1, "class", "mark2 svelte-18kfgwi");
    			attr(p2, "class", "mark3 svelte-18kfgwi");
    			attr(div0, "class", "contentPic " + /*opz*/ ctx[118](/*item*/ ctx[174]) + opy(/*item*/ ctx[174]) + " svelte-18kfgwi");
    			attr(div1, "class", "flex-col svelte-18kfgwi");
    		},
    		m(target, anchor) {
    			insert(target, div1, anchor);
    			append(div1, img);
    			append(div1, div0);
    			append(div0, p0);
    			append(p0, t0);
    			append(div0, p1);
    			append(p1, t1);
    			append(div0, p2);
    			append(p2, t2);
    			current = true;

    			if (!mounted) {
    				dispose = listen(div1, "click", click_handler_19);
    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		i(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, {}, true);
    				div1_transition.run(1);
    			});

    			current = true;
    		},
    		o(local) {
    			if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, {}, false);
    			div1_transition.run(0);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div1);
    			if (detaching && div1_transition) div1_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (1605:0) {#each numbersSSU as item }
    function create_each_block_18(ctx) {
    	let div1;
    	let img;
    	let img_src_value;
    	let div0;
    	let p0;
    	let t0_value = mark(/*item*/ ctx[174], /*typeSSU*/ ctx[86], /*numbersSSU*/ ctx[85]) + "";
    	let t0;
    	let p1;
    	let t1_value = mark(/*item*/ ctx[174], /*descSSU*/ ctx[88], /*numbersSSU*/ ctx[85]) + "";
    	let t1;
    	let p2;
    	let t2_value = mark(/*item*/ ctx[174], /*priceSSU*/ ctx[87], /*numbersSSU*/ ctx[85]) + "";
    	let t2;
    	let div1_transition;
    	let current;
    	let mounted;
    	let dispose;

    	function click_handler_18(...args) {
    		return /*click_handler_18*/ ctx[137](/*item*/ ctx[174], ...args);
    	}

    	return {
    		c() {
    			div1 = element("div");
    			img = element("img");
    			div0 = element("div");
    			p0 = element("p");
    			t0 = text(t0_value);
    			p1 = element("p");
    			t1 = text(t1_value);
    			p2 = element("p");
    			t2 = text(t2_value);
    			attr(img, "class", "imgC " + opy(/*item*/ ctx[174]) + " svelte-18kfgwi");
    			if (img.src !== (img_src_value = "" + (/*item*/ ctx[174] + ".png"))) attr(img, "src", img_src_value);
    			attr(img, "alt", "");
    			attr(p0, "class", "mark1 svelte-18kfgwi");
    			attr(p1, "class", "mark2 svelte-18kfgwi");
    			attr(p2, "class", "mark3 svelte-18kfgwi");
    			attr(div0, "class", "contentPic " + /*opz*/ ctx[118](/*item*/ ctx[174]) + opy(/*item*/ ctx[174]) + " svelte-18kfgwi");
    			attr(div1, "class", "flex-col svelte-18kfgwi");
    		},
    		m(target, anchor) {
    			insert(target, div1, anchor);
    			append(div1, img);
    			append(div1, div0);
    			append(div0, p0);
    			append(p0, t0);
    			append(div0, p1);
    			append(p1, t1);
    			append(div0, p2);
    			append(p2, t2);
    			current = true;

    			if (!mounted) {
    				dispose = listen(div1, "click", click_handler_18);
    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		i(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, {}, true);
    				div1_transition.run(1);
    			});

    			current = true;
    		},
    		o(local) {
    			if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, {}, false);
    			div1_transition.run(0);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div1);
    			if (detaching && div1_transition) div1_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (1590:0) {#each numbersSCA as item }
    function create_each_block_17(ctx) {
    	let div1;
    	let img;
    	let img_src_value;
    	let div0;
    	let p0;
    	let t0_value = mark(/*item*/ ctx[174], /*typeSCA*/ ctx[82], /*numbersSCA*/ ctx[81]) + "";
    	let t0;
    	let p1;
    	let t1_value = mark(/*item*/ ctx[174], /*descSCA*/ ctx[84], /*numbersSCA*/ ctx[81]) + "";
    	let t1;
    	let p2;
    	let t2_value = mark(/*item*/ ctx[174], /*priceSCA*/ ctx[83], /*numbersSCA*/ ctx[81]) + "";
    	let t2;
    	let div1_transition;
    	let current;
    	let mounted;
    	let dispose;

    	function click_handler_17(...args) {
    		return /*click_handler_17*/ ctx[136](/*item*/ ctx[174], ...args);
    	}

    	return {
    		c() {
    			div1 = element("div");
    			img = element("img");
    			div0 = element("div");
    			p0 = element("p");
    			t0 = text(t0_value);
    			p1 = element("p");
    			t1 = text(t1_value);
    			p2 = element("p");
    			t2 = text(t2_value);
    			attr(img, "class", "imgC " + opy(/*item*/ ctx[174]) + " svelte-18kfgwi");
    			if (img.src !== (img_src_value = "" + (/*item*/ ctx[174] + ".png"))) attr(img, "src", img_src_value);
    			attr(img, "alt", "");
    			attr(p0, "class", "mark1 svelte-18kfgwi");
    			attr(p1, "class", "mark2 svelte-18kfgwi");
    			attr(p2, "class", "mark3 svelte-18kfgwi");
    			attr(div0, "class", "contentPic " + /*opz*/ ctx[118](/*item*/ ctx[174]) + opy(/*item*/ ctx[174]) + " svelte-18kfgwi");
    			attr(div1, "class", "flex-col svelte-18kfgwi");
    		},
    		m(target, anchor) {
    			insert(target, div1, anchor);
    			append(div1, img);
    			append(div1, div0);
    			append(div0, p0);
    			append(p0, t0);
    			append(div0, p1);
    			append(p1, t1);
    			append(div0, p2);
    			append(p2, t2);
    			current = true;

    			if (!mounted) {
    				dispose = listen(div1, "click", click_handler_17);
    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		i(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, {}, true);
    				div1_transition.run(1);
    			});

    			current = true;
    		},
    		o(local) {
    			if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, {}, false);
    			div1_transition.run(0);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div1);
    			if (detaching && div1_transition) div1_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (1574:0) {#each numbersSMD as item }
    function create_each_block_16(ctx) {
    	let div1;
    	let img;
    	let img_src_value;
    	let div0;
    	let p0;
    	let t0_value = mark(/*item*/ ctx[174], /*typeSMD*/ ctx[78], /*numbersSMD*/ ctx[77]) + "";
    	let t0;
    	let p1;
    	let t1_value = mark(/*item*/ ctx[174], /*descSMD*/ ctx[80], /*numbersSMD*/ ctx[77]) + "";
    	let t1;
    	let p2;
    	let t2_value = mark(/*item*/ ctx[174], /*priceSMD*/ ctx[79], /*numbersSMD*/ ctx[77]) + "";
    	let t2;
    	let div1_transition;
    	let current;
    	let mounted;
    	let dispose;

    	function click_handler_16(...args) {
    		return /*click_handler_16*/ ctx[135](/*item*/ ctx[174], ...args);
    	}

    	return {
    		c() {
    			div1 = element("div");
    			img = element("img");
    			div0 = element("div");
    			p0 = element("p");
    			t0 = text(t0_value);
    			p1 = element("p");
    			t1 = text(t1_value);
    			p2 = element("p");
    			t2 = text(t2_value);
    			attr(img, "class", "imgC " + opy(/*item*/ ctx[174]) + " svelte-18kfgwi");
    			if (img.src !== (img_src_value = "" + (/*item*/ ctx[174] + ".png"))) attr(img, "src", img_src_value);
    			attr(img, "alt", "");
    			attr(p0, "class", "mark1 svelte-18kfgwi");
    			attr(p1, "class", "mark2 svelte-18kfgwi");
    			attr(p2, "class", "mark3 svelte-18kfgwi");
    			attr(div0, "class", "contentPic " + /*opz*/ ctx[118](/*item*/ ctx[174]) + opy(/*item*/ ctx[174]) + " svelte-18kfgwi");
    			attr(div1, "class", "flex-col svelte-18kfgwi");
    		},
    		m(target, anchor) {
    			insert(target, div1, anchor);
    			append(div1, img);
    			append(div1, div0);
    			append(div0, p0);
    			append(p0, t0);
    			append(div0, p1);
    			append(p1, t1);
    			append(div0, p2);
    			append(p2, t2);
    			current = true;

    			if (!mounted) {
    				dispose = listen(div1, "click", click_handler_16);
    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		i(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, {}, true);
    				div1_transition.run(1);
    			});

    			current = true;
    		},
    		o(local) {
    			if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, {}, false);
    			div1_transition.run(0);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div1);
    			if (detaching && div1_transition) div1_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (1561:0) {#each numbersSOTS as item }
    function create_each_block_15(ctx) {
    	let div1;
    	let img;
    	let img_src_value;
    	let div0;
    	let p0;
    	let t0_value = mark(/*item*/ ctx[174], /*typeSOTS*/ ctx[74], /*numbersSOTS*/ ctx[73]) + "";
    	let t0;
    	let p1;
    	let t1_value = mark(/*item*/ ctx[174], /*descSOTS*/ ctx[76], /*numbersSOTS*/ ctx[73]) + "";
    	let t1;
    	let p2;
    	let t2_value = mark(/*item*/ ctx[174], /*priceSOTS*/ ctx[75], /*numbersSOTS*/ ctx[73]) + "";
    	let t2;
    	let div1_transition;
    	let current;
    	let mounted;
    	let dispose;

    	function click_handler_15(...args) {
    		return /*click_handler_15*/ ctx[134](/*item*/ ctx[174], ...args);
    	}

    	return {
    		c() {
    			div1 = element("div");
    			img = element("img");
    			div0 = element("div");
    			p0 = element("p");
    			t0 = text(t0_value);
    			p1 = element("p");
    			t1 = text(t1_value);
    			p2 = element("p");
    			t2 = text(t2_value);
    			attr(img, "class", "imgC " + opy(/*item*/ ctx[174]) + " svelte-18kfgwi");
    			if (img.src !== (img_src_value = "" + (/*item*/ ctx[174] + ".png"))) attr(img, "src", img_src_value);
    			attr(img, "alt", "");
    			attr(p0, "class", "mark1 svelte-18kfgwi");
    			attr(p1, "class", "mark2 svelte-18kfgwi");
    			attr(p2, "class", "mark3 svelte-18kfgwi");
    			attr(div0, "class", "contentPic " + /*opz*/ ctx[118](/*item*/ ctx[174]) + opy(/*item*/ ctx[174]) + " svelte-18kfgwi");
    			attr(div1, "class", "flex-col svelte-18kfgwi");
    		},
    		m(target, anchor) {
    			insert(target, div1, anchor);
    			append(div1, img);
    			append(div1, div0);
    			append(div0, p0);
    			append(p0, t0);
    			append(div0, p1);
    			append(p1, t1);
    			append(div0, p2);
    			append(p2, t2);
    			current = true;

    			if (!mounted) {
    				dispose = listen(div1, "click", click_handler_15);
    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		i(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, {}, true);
    				div1_transition.run(1);
    			});

    			current = true;
    		},
    		o(local) {
    			if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, {}, false);
    			div1_transition.run(0);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div1);
    			if (detaching && div1_transition) div1_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (1548:0) {#each numbersSBC as item }
    function create_each_block_14(ctx) {
    	let div1;
    	let img;
    	let img_src_value;
    	let div0;
    	let p0;
    	let t0_value = mark(/*item*/ ctx[174], /*typeSBC*/ ctx[70], /*numbersSBC*/ ctx[69]) + "";
    	let t0;
    	let p1;
    	let t1_value = mark(/*item*/ ctx[174], /*descSBC*/ ctx[72], /*numbersSBC*/ ctx[69]) + "";
    	let t1;
    	let p2;
    	let t2_value = mark(/*item*/ ctx[174], /*priceSBC*/ ctx[71], /*numbersSBC*/ ctx[69]) + "";
    	let t2;
    	let div1_transition;
    	let current;
    	let mounted;
    	let dispose;

    	function click_handler_14(...args) {
    		return /*click_handler_14*/ ctx[133](/*item*/ ctx[174], ...args);
    	}

    	return {
    		c() {
    			div1 = element("div");
    			img = element("img");
    			div0 = element("div");
    			p0 = element("p");
    			t0 = text(t0_value);
    			p1 = element("p");
    			t1 = text(t1_value);
    			p2 = element("p");
    			t2 = text(t2_value);
    			attr(img, "class", "imgC " + opy(/*item*/ ctx[174]) + " svelte-18kfgwi");
    			if (img.src !== (img_src_value = "" + (/*item*/ ctx[174] + ".png"))) attr(img, "src", img_src_value);
    			attr(img, "alt", "");
    			attr(p0, "class", "mark1 svelte-18kfgwi");
    			attr(p1, "class", "mark2 svelte-18kfgwi");
    			attr(p2, "class", "mark3 svelte-18kfgwi");
    			attr(div0, "class", "contentPic " + /*opz*/ ctx[118](/*item*/ ctx[174]) + opy(/*item*/ ctx[174]) + " svelte-18kfgwi");
    			attr(div1, "class", "flex-col svelte-18kfgwi");
    		},
    		m(target, anchor) {
    			insert(target, div1, anchor);
    			append(div1, img);
    			append(div1, div0);
    			append(div0, p0);
    			append(p0, t0);
    			append(div0, p1);
    			append(p1, t1);
    			append(div0, p2);
    			append(p2, t2);
    			current = true;

    			if (!mounted) {
    				dispose = listen(div1, "click", click_handler_14);
    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		i(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, {}, true);
    				div1_transition.run(1);
    			});

    			current = true;
    		},
    		o(local) {
    			if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, {}, false);
    			div1_transition.run(0);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div1);
    			if (detaching && div1_transition) div1_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (1532:0) {#each numbersBA as item }
    function create_each_block_13(ctx) {
    	let div1;
    	let img;
    	let img_src_value;
    	let div0;
    	let p0;
    	let t0_value = mark(/*item*/ ctx[174], /*typeBA*/ ctx[66], /*numbersBA*/ ctx[65]) + "";
    	let t0;
    	let p1;
    	let t1_value = mark(/*item*/ ctx[174], /*descBA*/ ctx[68], /*numbersBA*/ ctx[65]) + "";
    	let t1;
    	let p2;
    	let t2_value = mark(/*item*/ ctx[174], /*priceBA*/ ctx[67], /*numbersBA*/ ctx[65]) + "";
    	let t2;
    	let div0_class_value;
    	let div1_transition;
    	let current;
    	let mounted;
    	let dispose;

    	function click_handler_13(...args) {
    		return /*click_handler_13*/ ctx[132](/*item*/ ctx[174], ...args);
    	}

    	return {
    		c() {
    			div1 = element("div");
    			img = element("img");
    			div0 = element("div");
    			p0 = element("p");
    			t0 = text(t0_value);
    			p1 = element("p");
    			t1 = text(t1_value);
    			p2 = element("p");
    			t2 = text(t2_value);
    			attr(img, "class", "imgC " + /*item*/ ctx[174] + " svelte-18kfgwi");
    			if (img.src !== (img_src_value = "" + (/*op2*/ ctx[1] + "/" + /*item*/ ctx[174] + ".png"))) attr(img, "src", img_src_value);
    			attr(img, "alt", "");
    			attr(p0, "class", "mark1 svelte-18kfgwi");
    			attr(p1, "class", "mark2 svelte-18kfgwi");
    			attr(p2, "class", "mark3 svelte-18kfgwi");
    			attr(div0, "class", div0_class_value = "contentPic " + /*op2*/ ctx[1] + /*item*/ ctx[174] + " svelte-18kfgwi");
    			attr(div1, "class", "flex-col svelte-18kfgwi");
    		},
    		m(target, anchor) {
    			insert(target, div1, anchor);
    			append(div1, img);
    			append(div1, div0);
    			append(div0, p0);
    			append(p0, t0);
    			append(div0, p1);
    			append(p1, t1);
    			append(div0, p2);
    			append(p2, t2);
    			current = true;

    			if (!mounted) {
    				dispose = listen(div1, "click", click_handler_13);
    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (!current || dirty[0] & /*op2*/ 2 && img.src !== (img_src_value = "" + (/*op2*/ ctx[1] + "/" + /*item*/ ctx[174] + ".png"))) {
    				attr(img, "src", img_src_value);
    			}

    			if (!current || dirty[0] & /*op2*/ 2 && div0_class_value !== (div0_class_value = "contentPic " + /*op2*/ ctx[1] + /*item*/ ctx[174] + " svelte-18kfgwi")) {
    				attr(div0, "class", div0_class_value);
    			}
    		},
    		i(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, {}, true);
    				div1_transition.run(1);
    			});

    			current = true;
    		},
    		o(local) {
    			if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, {}, false);
    			div1_transition.run(0);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div1);
    			if (detaching && div1_transition) div1_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (1519:0) {#each numbersRO as item }
    function create_each_block_12(ctx) {
    	let div1;
    	let img;
    	let img_src_value;
    	let div0;
    	let p0;
    	let t0_value = mark(/*item*/ ctx[174], /*typeRO*/ ctx[62], /*numbersRO*/ ctx[61]) + "";
    	let t0;
    	let p1;
    	let t1_value = mark(/*item*/ ctx[174], /*descRO*/ ctx[64], /*numbersRO*/ ctx[61]) + "";
    	let t1;
    	let p2;
    	let t2_value = mark(/*item*/ ctx[174], /*priceRO*/ ctx[63], /*numbersRO*/ ctx[61]) + "";
    	let t2;
    	let div0_class_value;
    	let div1_transition;
    	let current;
    	let mounted;
    	let dispose;

    	function click_handler_12(...args) {
    		return /*click_handler_12*/ ctx[131](/*item*/ ctx[174], ...args);
    	}

    	return {
    		c() {
    			div1 = element("div");
    			img = element("img");
    			div0 = element("div");
    			p0 = element("p");
    			t0 = text(t0_value);
    			p1 = element("p");
    			t1 = text(t1_value);
    			p2 = element("p");
    			t2 = text(t2_value);
    			attr(img, "class", "imgC " + /*item*/ ctx[174] + " svelte-18kfgwi");
    			if (img.src !== (img_src_value = "" + (/*op2*/ ctx[1] + "/" + /*item*/ ctx[174] + ".png"))) attr(img, "src", img_src_value);
    			attr(img, "alt", "");
    			attr(p0, "class", "mark1 svelte-18kfgwi");
    			attr(p1, "class", "mark2 svelte-18kfgwi");
    			attr(p2, "class", "mark3 svelte-18kfgwi");
    			attr(div0, "class", div0_class_value = "contentPic " + /*op2*/ ctx[1] + /*item*/ ctx[174] + " svelte-18kfgwi");
    			attr(div1, "class", "flex-col svelte-18kfgwi");
    		},
    		m(target, anchor) {
    			insert(target, div1, anchor);
    			append(div1, img);
    			append(div1, div0);
    			append(div0, p0);
    			append(p0, t0);
    			append(div0, p1);
    			append(p1, t1);
    			append(div0, p2);
    			append(p2, t2);
    			current = true;

    			if (!mounted) {
    				dispose = listen(div1, "click", click_handler_12);
    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (!current || dirty[0] & /*op2*/ 2 && img.src !== (img_src_value = "" + (/*op2*/ ctx[1] + "/" + /*item*/ ctx[174] + ".png"))) {
    				attr(img, "src", img_src_value);
    			}

    			if (!current || dirty[0] & /*op2*/ 2 && div0_class_value !== (div0_class_value = "contentPic " + /*op2*/ ctx[1] + /*item*/ ctx[174] + " svelte-18kfgwi")) {
    				attr(div0, "class", div0_class_value);
    			}
    		},
    		i(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, {}, true);
    				div1_transition.run(1);
    			});

    			current = true;
    		},
    		o(local) {
    			if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, {}, false);
    			div1_transition.run(0);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div1);
    			if (detaching && div1_transition) div1_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (1505:0) {#each numbersCA as item }
    function create_each_block_11(ctx) {
    	let div1;
    	let img;
    	let img_src_value;
    	let div0;
    	let p0;
    	let t0_value = mark(/*item*/ ctx[174], /*typeCA*/ ctx[58], /*numbersCA*/ ctx[57]) + "";
    	let t0;
    	let p1;
    	let t1_value = mark(/*item*/ ctx[174], /*descCA*/ ctx[60], /*numbersCA*/ ctx[57]) + "";
    	let t1;
    	let p2;
    	let t2_value = mark(/*item*/ ctx[174], /*priceCA*/ ctx[59], /*numbersCA*/ ctx[57]) + "";
    	let t2;
    	let div0_class_value;
    	let div1_transition;
    	let current;
    	let mounted;
    	let dispose;

    	function click_handler_11(...args) {
    		return /*click_handler_11*/ ctx[130](/*item*/ ctx[174], ...args);
    	}

    	return {
    		c() {
    			div1 = element("div");
    			img = element("img");
    			div0 = element("div");
    			p0 = element("p");
    			t0 = text(t0_value);
    			p1 = element("p");
    			t1 = text(t1_value);
    			p2 = element("p");
    			t2 = text(t2_value);
    			attr(img, "class", "imgC " + /*item*/ ctx[174] + " svelte-18kfgwi");
    			if (img.src !== (img_src_value = "" + (/*op2*/ ctx[1] + "/" + /*item*/ ctx[174] + ".png"))) attr(img, "src", img_src_value);
    			attr(img, "alt", "");
    			attr(p0, "class", "mark1 svelte-18kfgwi");
    			attr(p1, "class", "mark2 svelte-18kfgwi");
    			attr(p2, "class", "mark3 svelte-18kfgwi");
    			attr(div0, "class", div0_class_value = "contentPic " + /*op2*/ ctx[1] + /*item*/ ctx[174] + " svelte-18kfgwi");
    			attr(div1, "class", "flex-col svelte-18kfgwi");
    		},
    		m(target, anchor) {
    			insert(target, div1, anchor);
    			append(div1, img);
    			append(div1, div0);
    			append(div0, p0);
    			append(p0, t0);
    			append(div0, p1);
    			append(p1, t1);
    			append(div0, p2);
    			append(p2, t2);
    			current = true;

    			if (!mounted) {
    				dispose = listen(div1, "click", click_handler_11);
    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (!current || dirty[0] & /*op2*/ 2 && img.src !== (img_src_value = "" + (/*op2*/ ctx[1] + "/" + /*item*/ ctx[174] + ".png"))) {
    				attr(img, "src", img_src_value);
    			}

    			if (!current || dirty[0] & /*op2*/ 2 && div0_class_value !== (div0_class_value = "contentPic " + /*op2*/ ctx[1] + /*item*/ ctx[174] + " svelte-18kfgwi")) {
    				attr(div0, "class", div0_class_value);
    			}
    		},
    		i(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, {}, true);
    				div1_transition.run(1);
    			});

    			current = true;
    		},
    		o(local) {
    			if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, {}, false);
    			div1_transition.run(0);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div1);
    			if (detaching && div1_transition) div1_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (1491:0) {#each numbersSA as item }
    function create_each_block_10(ctx) {
    	let div1;
    	let img;
    	let img_src_value;
    	let div0;
    	let p0;
    	let t0_value = mark(/*item*/ ctx[174], /*typeSA*/ ctx[54], /*numbersSA*/ ctx[53]) + "";
    	let t0;
    	let p1;
    	let t1_value = mark(/*item*/ ctx[174], /*descSA*/ ctx[56], /*numbersSA*/ ctx[53]) + "";
    	let t1;
    	let p2;
    	let t2_value = mark(/*item*/ ctx[174], /*priceSA*/ ctx[55], /*numbersSA*/ ctx[53]) + "";
    	let t2;
    	let div0_class_value;
    	let div1_transition;
    	let current;
    	let mounted;
    	let dispose;

    	function click_handler_10(...args) {
    		return /*click_handler_10*/ ctx[129](/*item*/ ctx[174], ...args);
    	}

    	return {
    		c() {
    			div1 = element("div");
    			img = element("img");
    			div0 = element("div");
    			p0 = element("p");
    			t0 = text(t0_value);
    			p1 = element("p");
    			t1 = text(t1_value);
    			p2 = element("p");
    			t2 = text(t2_value);
    			attr(img, "class", "imgC " + /*item*/ ctx[174] + " svelte-18kfgwi");
    			if (img.src !== (img_src_value = "" + (/*op2*/ ctx[1] + "/" + /*item*/ ctx[174] + ".png"))) attr(img, "src", img_src_value);
    			attr(img, "alt", "");
    			attr(p0, "class", "mark1 svelte-18kfgwi");
    			attr(p1, "class", "mark2 svelte-18kfgwi");
    			attr(p2, "class", "mark3 svelte-18kfgwi");
    			attr(div0, "class", div0_class_value = "contentPic " + /*op2*/ ctx[1] + /*item*/ ctx[174] + " svelte-18kfgwi");
    			attr(div1, "class", "flex-col svelte-18kfgwi");
    		},
    		m(target, anchor) {
    			insert(target, div1, anchor);
    			append(div1, img);
    			append(div1, div0);
    			append(div0, p0);
    			append(p0, t0);
    			append(div0, p1);
    			append(p1, t1);
    			append(div0, p2);
    			append(p2, t2);
    			current = true;

    			if (!mounted) {
    				dispose = listen(div1, "click", click_handler_10);
    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (!current || dirty[0] & /*op2*/ 2 && img.src !== (img_src_value = "" + (/*op2*/ ctx[1] + "/" + /*item*/ ctx[174] + ".png"))) {
    				attr(img, "src", img_src_value);
    			}

    			if (!current || dirty[0] & /*op2*/ 2 && div0_class_value !== (div0_class_value = "contentPic " + /*op2*/ ctx[1] + /*item*/ ctx[174] + " svelte-18kfgwi")) {
    				attr(div0, "class", div0_class_value);
    			}
    		},
    		i(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, {}, true);
    				div1_transition.run(1);
    			});

    			current = true;
    		},
    		o(local) {
    			if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, {}, false);
    			div1_transition.run(0);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div1);
    			if (detaching && div1_transition) div1_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (1476:0) {#each numbersT as item }
    function create_each_block_9(ctx) {
    	let div1;
    	let img;
    	let img_src_value;
    	let div0;
    	let p0;
    	let t0_value = mark(/*item*/ ctx[174], /*typeT*/ ctx[50], /*numbersT*/ ctx[49]) + "";
    	let t0;
    	let p1;
    	let t1_value = mark(/*item*/ ctx[174], /*descT*/ ctx[52], /*numbersT*/ ctx[49]) + "";
    	let t1;
    	let p2;
    	let t2_value = mark(/*item*/ ctx[174], /*priceT*/ ctx[51], /*numbersT*/ ctx[49]) + "";
    	let t2;
    	let div0_class_value;
    	let div1_transition;
    	let current;
    	let mounted;
    	let dispose;

    	function click_handler_9(...args) {
    		return /*click_handler_9*/ ctx[128](/*item*/ ctx[174], ...args);
    	}

    	return {
    		c() {
    			div1 = element("div");
    			img = element("img");
    			div0 = element("div");
    			p0 = element("p");
    			t0 = text(t0_value);
    			p1 = element("p");
    			t1 = text(t1_value);
    			p2 = element("p");
    			t2 = text(t2_value);
    			attr(img, "class", "imgC " + /*item*/ ctx[174] + " svelte-18kfgwi");
    			if (img.src !== (img_src_value = "" + (/*op2*/ ctx[1] + "/" + /*item*/ ctx[174] + ".png"))) attr(img, "src", img_src_value);
    			attr(img, "alt", "");
    			attr(p0, "class", "mark1 svelte-18kfgwi");
    			attr(p1, "class", "mark2 svelte-18kfgwi");
    			attr(p2, "class", "mark3 svelte-18kfgwi");
    			attr(div0, "class", div0_class_value = "contentPic " + /*op2*/ ctx[1] + /*item*/ ctx[174] + " svelte-18kfgwi");
    			attr(div1, "class", "flex-col svelte-18kfgwi");
    		},
    		m(target, anchor) {
    			insert(target, div1, anchor);
    			append(div1, img);
    			append(div1, div0);
    			append(div0, p0);
    			append(p0, t0);
    			append(div0, p1);
    			append(p1, t1);
    			append(div0, p2);
    			append(p2, t2);
    			current = true;

    			if (!mounted) {
    				dispose = listen(div1, "click", click_handler_9);
    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (!current || dirty[0] & /*op2*/ 2 && img.src !== (img_src_value = "" + (/*op2*/ ctx[1] + "/" + /*item*/ ctx[174] + ".png"))) {
    				attr(img, "src", img_src_value);
    			}

    			if (!current || dirty[0] & /*op2*/ 2 && div0_class_value !== (div0_class_value = "contentPic " + /*op2*/ ctx[1] + /*item*/ ctx[174] + " svelte-18kfgwi")) {
    				attr(div0, "class", div0_class_value);
    			}
    		},
    		i(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, {}, true);
    				div1_transition.run(1);
    			});

    			current = true;
    		},
    		o(local) {
    			if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, {}, false);
    			div1_transition.run(0);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div1);
    			if (detaching && div1_transition) div1_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (1462:0) {#each numbersB as item }
    function create_each_block_8(ctx) {
    	let div1;
    	let img;
    	let img_src_value;
    	let div0;
    	let p0;
    	let t0_value = mark(/*item*/ ctx[174], /*typeB*/ ctx[46], /*numbersB*/ ctx[45]) + "";
    	let t0;
    	let p1;
    	let t1_value = mark(/*item*/ ctx[174], /*descB*/ ctx[48], /*numbersB*/ ctx[45]) + "";
    	let t1;
    	let p2;
    	let t2_value = mark(/*item*/ ctx[174], /*priceB*/ ctx[47], /*numbersB*/ ctx[45]) + "";
    	let t2;
    	let div0_class_value;
    	let div1_transition;
    	let current;
    	let mounted;
    	let dispose;

    	function click_handler_8(...args) {
    		return /*click_handler_8*/ ctx[127](/*item*/ ctx[174], ...args);
    	}

    	return {
    		c() {
    			div1 = element("div");
    			img = element("img");
    			div0 = element("div");
    			p0 = element("p");
    			t0 = text(t0_value);
    			p1 = element("p");
    			t1 = text(t1_value);
    			p2 = element("p");
    			t2 = text(t2_value);
    			attr(img, "class", "imgC " + /*item*/ ctx[174] + " svelte-18kfgwi");
    			if (img.src !== (img_src_value = "" + (/*op2*/ ctx[1] + "/" + /*item*/ ctx[174] + ".png"))) attr(img, "src", img_src_value);
    			attr(img, "alt", "");
    			attr(p0, "class", "mark1 svelte-18kfgwi");
    			attr(p1, "class", "mark2 svelte-18kfgwi");
    			attr(p2, "class", "mark3 svelte-18kfgwi");
    			attr(div0, "class", div0_class_value = "contentPic " + /*op2*/ ctx[1] + /*item*/ ctx[174] + " svelte-18kfgwi");
    			attr(div1, "class", "flex-col svelte-18kfgwi");
    		},
    		m(target, anchor) {
    			insert(target, div1, anchor);
    			append(div1, img);
    			append(div1, div0);
    			append(div0, p0);
    			append(p0, t0);
    			append(div0, p1);
    			append(p1, t1);
    			append(div0, p2);
    			append(p2, t2);
    			current = true;

    			if (!mounted) {
    				dispose = listen(div1, "click", click_handler_8);
    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (!current || dirty[0] & /*op2*/ 2 && img.src !== (img_src_value = "" + (/*op2*/ ctx[1] + "/" + /*item*/ ctx[174] + ".png"))) {
    				attr(img, "src", img_src_value);
    			}

    			if (!current || dirty[0] & /*op2*/ 2 && div0_class_value !== (div0_class_value = "contentPic " + /*op2*/ ctx[1] + /*item*/ ctx[174] + " svelte-18kfgwi")) {
    				attr(div0, "class", div0_class_value);
    			}
    		},
    		i(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, {}, true);
    				div1_transition.run(1);
    			});

    			current = true;
    		},
    		o(local) {
    			if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, {}, false);
    			div1_transition.run(0);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div1);
    			if (detaching && div1_transition) div1_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (1449:0) {#each numbersS as item }
    function create_each_block_7(ctx) {
    	let div1;
    	let img;
    	let img_src_value;
    	let div0;
    	let p0;
    	let t0_value = mark(/*item*/ ctx[174], /*typeS*/ ctx[42], /*numbersS*/ ctx[41]) + "";
    	let t0;
    	let p1;
    	let t1_value = mark(/*item*/ ctx[174], /*descS*/ ctx[44], /*numbersS*/ ctx[41]) + "";
    	let t1;
    	let p2;
    	let t2_value = mark(/*item*/ ctx[174], /*priceS*/ ctx[43], /*numbersS*/ ctx[41]) + "";
    	let t2;
    	let div0_class_value;
    	let div1_transition;
    	let current;
    	let mounted;
    	let dispose;

    	function click_handler_7(...args) {
    		return /*click_handler_7*/ ctx[126](/*item*/ ctx[174], ...args);
    	}

    	return {
    		c() {
    			div1 = element("div");
    			img = element("img");
    			div0 = element("div");
    			p0 = element("p");
    			t0 = text(t0_value);
    			p1 = element("p");
    			t1 = text(t1_value);
    			p2 = element("p");
    			t2 = text(t2_value);
    			attr(img, "class", "imgC " + /*item*/ ctx[174] + " svelte-18kfgwi");
    			if (img.src !== (img_src_value = "" + (/*op2*/ ctx[1] + "/" + /*item*/ ctx[174] + ".png"))) attr(img, "src", img_src_value);
    			attr(img, "alt", "");
    			attr(p0, "class", "mark1 svelte-18kfgwi");
    			attr(p1, "class", "mark2 svelte-18kfgwi");
    			attr(p2, "class", "mark3 svelte-18kfgwi");
    			attr(div0, "class", div0_class_value = "contentPic " + /*op2*/ ctx[1] + /*item*/ ctx[174] + " svelte-18kfgwi");
    			attr(div1, "class", "flex-col svelte-18kfgwi");
    		},
    		m(target, anchor) {
    			insert(target, div1, anchor);
    			append(div1, img);
    			append(div1, div0);
    			append(div0, p0);
    			append(p0, t0);
    			append(div0, p1);
    			append(p1, t1);
    			append(div0, p2);
    			append(p2, t2);
    			current = true;

    			if (!mounted) {
    				dispose = listen(div1, "click", click_handler_7);
    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (!current || dirty[0] & /*op2*/ 2 && img.src !== (img_src_value = "" + (/*op2*/ ctx[1] + "/" + /*item*/ ctx[174] + ".png"))) {
    				attr(img, "src", img_src_value);
    			}

    			if (!current || dirty[0] & /*op2*/ 2 && div0_class_value !== (div0_class_value = "contentPic " + /*op2*/ ctx[1] + /*item*/ ctx[174] + " svelte-18kfgwi")) {
    				attr(div0, "class", div0_class_value);
    			}
    		},
    		i(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, {}, true);
    				div1_transition.run(1);
    			});

    			current = true;
    		},
    		o(local) {
    			if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, {}, false);
    			div1_transition.run(0);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div1);
    			if (detaching && div1_transition) div1_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (1436:0) {#each numbersD as item }
    function create_each_block_6(ctx) {
    	let div1;
    	let img;
    	let img_src_value;
    	let div0;
    	let p0;
    	let t0_value = mark(/*item*/ ctx[174], /*typeD*/ ctx[38], /*numbersD*/ ctx[37]) + "";
    	let t0;
    	let p1;
    	let t1_value = mark(/*item*/ ctx[174], /*descD*/ ctx[40], /*numbersD*/ ctx[37]) + "";
    	let t1;
    	let p2;
    	let t2_value = mark(/*item*/ ctx[174], /*priceD*/ ctx[39], /*numbersD*/ ctx[37]) + "";
    	let t2;
    	let div0_class_value;
    	let div1_transition;
    	let current;
    	let mounted;
    	let dispose;

    	function click_handler_6(...args) {
    		return /*click_handler_6*/ ctx[125](/*item*/ ctx[174], ...args);
    	}

    	return {
    		c() {
    			div1 = element("div");
    			img = element("img");
    			div0 = element("div");
    			p0 = element("p");
    			t0 = text(t0_value);
    			p1 = element("p");
    			t1 = text(t1_value);
    			p2 = element("p");
    			t2 = text(t2_value);
    			attr(img, "class", "imgC " + /*item*/ ctx[174] + " svelte-18kfgwi");
    			if (img.src !== (img_src_value = "" + (/*op2*/ ctx[1] + "/" + /*item*/ ctx[174] + ".png"))) attr(img, "src", img_src_value);
    			attr(img, "alt", "");
    			attr(p0, "class", "mark1 svelte-18kfgwi");
    			attr(p1, "class", "mark2 svelte-18kfgwi");
    			attr(p2, "class", "mark3 svelte-18kfgwi");
    			attr(div0, "class", div0_class_value = "contentPic " + /*op2*/ ctx[1] + /*item*/ ctx[174] + " svelte-18kfgwi");
    			attr(div1, "class", "flex-col svelte-18kfgwi");
    		},
    		m(target, anchor) {
    			insert(target, div1, anchor);
    			append(div1, img);
    			append(div1, div0);
    			append(div0, p0);
    			append(p0, t0);
    			append(div0, p1);
    			append(p1, t1);
    			append(div0, p2);
    			append(p2, t2);
    			current = true;

    			if (!mounted) {
    				dispose = listen(div1, "click", click_handler_6);
    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (!current || dirty[0] & /*op2*/ 2 && img.src !== (img_src_value = "" + (/*op2*/ ctx[1] + "/" + /*item*/ ctx[174] + ".png"))) {
    				attr(img, "src", img_src_value);
    			}

    			if (!current || dirty[0] & /*op2*/ 2 && div0_class_value !== (div0_class_value = "contentPic " + /*op2*/ ctx[1] + /*item*/ ctx[174] + " svelte-18kfgwi")) {
    				attr(div0, "class", div0_class_value);
    			}
    		},
    		i(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, {}, true);
    				div1_transition.run(1);
    			});

    			current = true;
    		},
    		o(local) {
    			if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, {}, false);
    			div1_transition.run(0);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div1);
    			if (detaching && div1_transition) div1_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (1422:0) {#each numbersH as item }
    function create_each_block_5$1(ctx) {
    	let div1;
    	let img;
    	let img_src_value;
    	let div0;
    	let p0;
    	let t0_value = mark(/*item*/ ctx[174], /*typeH*/ ctx[34], /*numbersH*/ ctx[33]) + "";
    	let t0;
    	let p1;
    	let t1_value = mark(/*item*/ ctx[174], /*descH*/ ctx[36], /*numbersH*/ ctx[33]) + "";
    	let t1;
    	let p2;
    	let t2_value = mark(/*item*/ ctx[174], /*priceH*/ ctx[35], /*numbersH*/ ctx[33]) + "";
    	let t2;
    	let div0_class_value;
    	let div1_transition;
    	let current;
    	let mounted;
    	let dispose;

    	function click_handler_5(...args) {
    		return /*click_handler_5*/ ctx[124](/*item*/ ctx[174], ...args);
    	}

    	return {
    		c() {
    			div1 = element("div");
    			img = element("img");
    			div0 = element("div");
    			p0 = element("p");
    			t0 = text(t0_value);
    			p1 = element("p");
    			t1 = text(t1_value);
    			p2 = element("p");
    			t2 = text(t2_value);
    			attr(img, "class", "imgC " + /*item*/ ctx[174] + " svelte-18kfgwi");
    			if (img.src !== (img_src_value = "" + (/*op2*/ ctx[1] + "/" + /*item*/ ctx[174] + ".png"))) attr(img, "src", img_src_value);
    			attr(img, "alt", "");
    			attr(p0, "class", "mark1 svelte-18kfgwi");
    			attr(p1, "class", "mark2 svelte-18kfgwi");
    			attr(p2, "class", "mark3 svelte-18kfgwi");
    			attr(div0, "class", div0_class_value = "contentPic " + /*op2*/ ctx[1] + /*item*/ ctx[174] + " svelte-18kfgwi");
    			attr(div1, "class", "flex-col svelte-18kfgwi");
    		},
    		m(target, anchor) {
    			insert(target, div1, anchor);
    			append(div1, img);
    			append(div1, div0);
    			append(div0, p0);
    			append(p0, t0);
    			append(div0, p1);
    			append(p1, t1);
    			append(div0, p2);
    			append(p2, t2);
    			current = true;

    			if (!mounted) {
    				dispose = listen(div1, "click", click_handler_5);
    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (!current || dirty[0] & /*op2*/ 2 && img.src !== (img_src_value = "" + (/*op2*/ ctx[1] + "/" + /*item*/ ctx[174] + ".png"))) {
    				attr(img, "src", img_src_value);
    			}

    			if (!current || dirty[0] & /*op2*/ 2 && div0_class_value !== (div0_class_value = "contentPic " + /*op2*/ ctx[1] + /*item*/ ctx[174] + " svelte-18kfgwi")) {
    				attr(div0, "class", div0_class_value);
    			}
    		},
    		i(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, {}, true);
    				div1_transition.run(1);
    			});

    			current = true;
    		},
    		o(local) {
    			if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, {}, false);
    			div1_transition.run(0);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div1);
    			if (detaching && div1_transition) div1_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (1408:0) {#each numbersL as item }
    function create_each_block_4$1(ctx) {
    	let div1;
    	let img;
    	let img_src_value;
    	let div0;
    	let p0;
    	let t0_value = mark(/*item*/ ctx[174], /*typeL*/ ctx[30], /*numbersL*/ ctx[29]) + "";
    	let t0;
    	let p1;
    	let t1_value = mark(/*item*/ ctx[174], /*descL*/ ctx[32], /*numbersL*/ ctx[29]) + "";
    	let t1;
    	let p2;
    	let t2_value = mark(/*item*/ ctx[174], /*priceL*/ ctx[31], /*numbersL*/ ctx[29]) + "";
    	let t2;
    	let div0_class_value;
    	let div1_transition;
    	let current;
    	let mounted;
    	let dispose;

    	function click_handler_4(...args) {
    		return /*click_handler_4*/ ctx[123](/*item*/ ctx[174], ...args);
    	}

    	return {
    		c() {
    			div1 = element("div");
    			img = element("img");
    			div0 = element("div");
    			p0 = element("p");
    			t0 = text(t0_value);
    			p1 = element("p");
    			t1 = text(t1_value);
    			p2 = element("p");
    			t2 = text(t2_value);
    			attr(img, "class", "imgC " + /*item*/ ctx[174] + " svelte-18kfgwi");
    			if (img.src !== (img_src_value = "" + (/*op2*/ ctx[1] + "/" + /*item*/ ctx[174] + ".png"))) attr(img, "src", img_src_value);
    			attr(img, "alt", "");
    			attr(p0, "class", "mark1 svelte-18kfgwi");
    			attr(p1, "class", "mark2 svelte-18kfgwi");
    			attr(p2, "class", "mark3 svelte-18kfgwi");
    			attr(div0, "class", div0_class_value = "contentPic " + /*op2*/ ctx[1] + /*item*/ ctx[174] + " svelte-18kfgwi");
    			attr(div1, "class", "flex-col svelte-18kfgwi");
    		},
    		m(target, anchor) {
    			insert(target, div1, anchor);
    			append(div1, img);
    			append(div1, div0);
    			append(div0, p0);
    			append(p0, t0);
    			append(div0, p1);
    			append(p1, t1);
    			append(div0, p2);
    			append(p2, t2);
    			current = true;

    			if (!mounted) {
    				dispose = listen(div1, "click", click_handler_4);
    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (!current || dirty[0] & /*op2*/ 2 && img.src !== (img_src_value = "" + (/*op2*/ ctx[1] + "/" + /*item*/ ctx[174] + ".png"))) {
    				attr(img, "src", img_src_value);
    			}

    			if (!current || dirty[0] & /*op2*/ 2 && div0_class_value !== (div0_class_value = "contentPic " + /*op2*/ ctx[1] + /*item*/ ctx[174] + " svelte-18kfgwi")) {
    				attr(div0, "class", div0_class_value);
    			}
    		},
    		i(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, {}, true);
    				div1_transition.run(1);
    			});

    			current = true;
    		},
    		o(local) {
    			if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, {}, false);
    			div1_transition.run(0);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div1);
    			if (detaching && div1_transition) div1_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (1393:0) {#each numbersK as item }
    function create_each_block_3$1(ctx) {
    	let div1;
    	let img;
    	let img_src_value;
    	let div0;
    	let p0;
    	let t0_value = mark(/*item*/ ctx[174], /*typeK*/ ctx[26], /*numbersK*/ ctx[25]) + "";
    	let t0;
    	let p1;
    	let t1_value = mark(/*item*/ ctx[174], /*descK*/ ctx[28], /*numbersK*/ ctx[25]) + "";
    	let t1;
    	let p2;
    	let t2_value = mark(/*item*/ ctx[174], /*priceK*/ ctx[27], /*numbersK*/ ctx[25]) + "";
    	let t2;
    	let div0_class_value;
    	let div1_transition;
    	let current;
    	let mounted;
    	let dispose;

    	function click_handler_3(...args) {
    		return /*click_handler_3*/ ctx[122](/*item*/ ctx[174], ...args);
    	}

    	return {
    		c() {
    			div1 = element("div");
    			img = element("img");
    			div0 = element("div");
    			p0 = element("p");
    			t0 = text(t0_value);
    			p1 = element("p");
    			t1 = text(t1_value);
    			p2 = element("p");
    			t2 = text(t2_value);
    			attr(img, "class", "imgC " + /*item*/ ctx[174] + " svelte-18kfgwi");
    			if (img.src !== (img_src_value = "" + (/*op2*/ ctx[1] + "/" + /*item*/ ctx[174] + ".png"))) attr(img, "src", img_src_value);
    			attr(img, "alt", "");
    			attr(p0, "class", "mark1 svelte-18kfgwi");
    			attr(p1, "class", "mark2 svelte-18kfgwi");
    			attr(p2, "class", "mark3 svelte-18kfgwi");
    			attr(div0, "class", div0_class_value = "contentPic " + /*op2*/ ctx[1] + /*item*/ ctx[174] + " svelte-18kfgwi");
    			attr(div1, "class", "flex-col svelte-18kfgwi");
    		},
    		m(target, anchor) {
    			insert(target, div1, anchor);
    			append(div1, img);
    			append(div1, div0);
    			append(div0, p0);
    			append(p0, t0);
    			append(div0, p1);
    			append(p1, t1);
    			append(div0, p2);
    			append(p2, t2);
    			current = true;

    			if (!mounted) {
    				dispose = listen(div1, "click", click_handler_3);
    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (!current || dirty[0] & /*op2*/ 2 && img.src !== (img_src_value = "" + (/*op2*/ ctx[1] + "/" + /*item*/ ctx[174] + ".png"))) {
    				attr(img, "src", img_src_value);
    			}

    			if (!current || dirty[0] & /*op2*/ 2 && div0_class_value !== (div0_class_value = "contentPic " + /*op2*/ ctx[1] + /*item*/ ctx[174] + " svelte-18kfgwi")) {
    				attr(div0, "class", div0_class_value);
    			}
    		},
    		i(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, {}, true);
    				div1_transition.run(1);
    			});

    			current = true;
    		},
    		o(local) {
    			if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, {}, false);
    			div1_transition.run(0);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div1);
    			if (detaching && div1_transition) div1_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (1379:0) {#each numbersR as item }
    function create_each_block_2$1(ctx) {
    	let div1;
    	let img;
    	let img_src_value;
    	let div0;
    	let p0;
    	let t0_value = mark(/*item*/ ctx[174], /*typeR*/ ctx[22], /*numbersR*/ ctx[21]) + "";
    	let t0;
    	let p1;
    	let t1_value = mark(/*item*/ ctx[174], /*descR*/ ctx[24], /*numbersR*/ ctx[21]) + "";
    	let t1;
    	let p2;
    	let t2_value = mark(/*item*/ ctx[174], /*priceR*/ ctx[23], /*numbersR*/ ctx[21]) + "";
    	let t2;
    	let div0_class_value;
    	let div1_transition;
    	let current;
    	let mounted;
    	let dispose;

    	function click_handler_2(...args) {
    		return /*click_handler_2*/ ctx[121](/*item*/ ctx[174], ...args);
    	}

    	return {
    		c() {
    			div1 = element("div");
    			img = element("img");
    			div0 = element("div");
    			p0 = element("p");
    			t0 = text(t0_value);
    			p1 = element("p");
    			t1 = text(t1_value);
    			p2 = element("p");
    			t2 = text(t2_value);
    			attr(img, "class", "imgC " + /*item*/ ctx[174] + " svelte-18kfgwi");
    			if (img.src !== (img_src_value = "" + (/*op2*/ ctx[1] + "/" + /*item*/ ctx[174] + ".png"))) attr(img, "src", img_src_value);
    			attr(img, "alt", "");
    			attr(p0, "class", "mark1 svelte-18kfgwi");
    			attr(p1, "class", "mark2 svelte-18kfgwi");
    			attr(p2, "class", "mark3 svelte-18kfgwi");
    			attr(div0, "class", div0_class_value = "contentPic " + /*op2*/ ctx[1] + /*item*/ ctx[174] + " svelte-18kfgwi");
    			attr(div1, "class", "flex-col svelte-18kfgwi");
    		},
    		m(target, anchor) {
    			insert(target, div1, anchor);
    			append(div1, img);
    			append(div1, div0);
    			append(div0, p0);
    			append(p0, t0);
    			append(div0, p1);
    			append(p1, t1);
    			append(div0, p2);
    			append(p2, t2);
    			current = true;

    			if (!mounted) {
    				dispose = listen(div1, "click", click_handler_2);
    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (!current || dirty[0] & /*op2*/ 2 && img.src !== (img_src_value = "" + (/*op2*/ ctx[1] + "/" + /*item*/ ctx[174] + ".png"))) {
    				attr(img, "src", img_src_value);
    			}

    			if (!current || dirty[0] & /*op2*/ 2 && div0_class_value !== (div0_class_value = "contentPic " + /*op2*/ ctx[1] + /*item*/ ctx[174] + " svelte-18kfgwi")) {
    				attr(div0, "class", div0_class_value);
    			}
    		},
    		i(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, {}, true);
    				div1_transition.run(1);
    			});

    			current = true;
    		},
    		o(local) {
    			if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, {}, false);
    			div1_transition.run(0);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div1);
    			if (detaching && div1_transition) div1_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (1365:0) {#each numbersM as item }
    function create_each_block_1$2(ctx) {
    	let div1;
    	let img;
    	let img_src_value;
    	let div0;
    	let p0;
    	let t0_value = mark(/*item*/ ctx[174], /*typeM*/ ctx[18], /*numbersM*/ ctx[17]) + "";
    	let t0;
    	let p1;
    	let t1_value = mark(/*item*/ ctx[174], /*descM*/ ctx[20], /*numbersM*/ ctx[17]) + "";
    	let t1;
    	let p2;
    	let t2_value = mark(/*item*/ ctx[174], /*priceM*/ ctx[19], /*numbersM*/ ctx[17]) + "";
    	let t2;
    	let div0_class_value;
    	let div1_transition;
    	let current;
    	let mounted;
    	let dispose;

    	function click_handler_1(...args) {
    		return /*click_handler_1*/ ctx[120](/*item*/ ctx[174], ...args);
    	}

    	return {
    		c() {
    			div1 = element("div");
    			img = element("img");
    			div0 = element("div");
    			p0 = element("p");
    			t0 = text(t0_value);
    			p1 = element("p");
    			t1 = text(t1_value);
    			p2 = element("p");
    			t2 = text(t2_value);
    			attr(img, "class", "imgC " + /*item*/ ctx[174] + " svelte-18kfgwi");
    			if (img.src !== (img_src_value = "" + (/*op2*/ ctx[1] + "/" + /*item*/ ctx[174] + ".png"))) attr(img, "src", img_src_value);
    			attr(img, "alt", "");
    			attr(p0, "class", "mark1 svelte-18kfgwi");
    			attr(p1, "class", "mark2 svelte-18kfgwi");
    			attr(p2, "class", "mark3 svelte-18kfgwi");
    			attr(div0, "class", div0_class_value = "contentPic " + /*op2*/ ctx[1] + /*item*/ ctx[174] + " svelte-18kfgwi");
    			attr(div1, "class", "flex-col svelte-18kfgwi");
    		},
    		m(target, anchor) {
    			insert(target, div1, anchor);
    			append(div1, img);
    			append(div1, div0);
    			append(div0, p0);
    			append(p0, t0);
    			append(div0, p1);
    			append(p1, t1);
    			append(div0, p2);
    			append(p2, t2);
    			current = true;

    			if (!mounted) {
    				dispose = listen(div1, "click", click_handler_1);
    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (!current || dirty[0] & /*op2*/ 2 && img.src !== (img_src_value = "" + (/*op2*/ ctx[1] + "/" + /*item*/ ctx[174] + ".png"))) {
    				attr(img, "src", img_src_value);
    			}

    			if (!current || dirty[0] & /*op2*/ 2 && div0_class_value !== (div0_class_value = "contentPic " + /*op2*/ ctx[1] + /*item*/ ctx[174] + " svelte-18kfgwi")) {
    				attr(div0, "class", div0_class_value);
    			}
    		},
    		i(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, {}, true);
    				div1_transition.run(1);
    			});

    			current = true;
    		},
    		o(local) {
    			if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, {}, false);
    			div1_transition.run(0);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div1);
    			if (detaching && div1_transition) div1_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (1352:0) {#each numbers as item }
    function create_each_block$2(ctx) {
    	let div1;
    	let img;
    	let img_src_value;
    	let div0;
    	let p0;
    	let t0_value = mark(/*item*/ ctx[174], /*type*/ ctx[14], /*numbers*/ ctx[13]) + "";
    	let t0;
    	let p1;
    	let t1_value = mark(/*item*/ ctx[174], /*desc*/ ctx[16], /*numbers*/ ctx[13]) + "";
    	let t1;
    	let p2;
    	let t2_value = mark(/*item*/ ctx[174], /*price*/ ctx[15], /*numbers*/ ctx[13]) + "";
    	let t2;
    	let div0_class_value;
    	let div1_transition;
    	let current;
    	let mounted;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[119](/*item*/ ctx[174], ...args);
    	}

    	return {
    		c() {
    			div1 = element("div");
    			img = element("img");
    			div0 = element("div");
    			p0 = element("p");
    			t0 = text(t0_value);
    			p1 = element("p");
    			t1 = text(t1_value);
    			p2 = element("p");
    			t2 = text(t2_value);
    			attr(img, "class", "imgC " + /*item*/ ctx[174] + " svelte-18kfgwi");
    			if (img.src !== (img_src_value = "" + (/*op2*/ ctx[1] + "/" + /*item*/ ctx[174] + ".png"))) attr(img, "src", img_src_value);
    			attr(img, "alt", "");
    			attr(p0, "class", "mark1 svelte-18kfgwi");
    			attr(p1, "class", "mark2 svelte-18kfgwi");
    			attr(p2, "class", "mark3 svelte-18kfgwi");
    			attr(div0, "class", div0_class_value = "contentPic " + /*op2*/ ctx[1] + /*item*/ ctx[174] + " svelte-18kfgwi");
    			attr(div1, "class", "flex-col svelte-18kfgwi");
    		},
    		m(target, anchor) {
    			insert(target, div1, anchor);
    			append(div1, img);
    			append(div1, div0);
    			append(div0, p0);
    			append(p0, t0);
    			append(div0, p1);
    			append(p1, t1);
    			append(div0, p2);
    			append(p2, t2);
    			current = true;

    			if (!mounted) {
    				dispose = listen(div1, "click", click_handler);
    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (!current || dirty[0] & /*op2*/ 2 && img.src !== (img_src_value = "" + (/*op2*/ ctx[1] + "/" + /*item*/ ctx[174] + ".png"))) {
    				attr(img, "src", img_src_value);
    			}

    			if (!current || dirty[0] & /*op2*/ 2 && div0_class_value !== (div0_class_value = "contentPic " + /*op2*/ ctx[1] + /*item*/ ctx[174] + " svelte-18kfgwi")) {
    				attr(div0, "class", div0_class_value);
    			}
    		},
    		i(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, {}, true);
    				div1_transition.run(1);
    			});

    			current = true;
    		},
    		o(local) {
    			if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, {}, false);
    			div1_transition.run(0);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div1);
    			if (detaching && div1_transition) div1_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (1733:0) {#if kis === false }
    function create_if_block$4(ctx) {
    	let carts;
    	let current;

    	carts = new Carts({
    			props: {
    				much: /*much*/ ctx[6],
    				op2: /*op2*/ ctx[1],
    				ko: /*ko*/ ctx[2],
    				boxBelow: /*boxBelow*/ ctx[8],
    				op4: /*op4*/ ctx[0],
    				op5: /*op5*/ ctx[4],
    				cart1: /*cart1*/ ctx[9],
    				cart2: /*cart2*/ ctx[10]
    			}
    		});

    	return {
    		c() {
    			create_component(carts.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(carts, target, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const carts_changes = {};
    			if (dirty[0] & /*much*/ 64) carts_changes.much = /*much*/ ctx[6];
    			if (dirty[0] & /*op2*/ 2) carts_changes.op2 = /*op2*/ ctx[1];
    			if (dirty[0] & /*ko*/ 4) carts_changes.ko = /*ko*/ ctx[2];
    			if (dirty[0] & /*boxBelow*/ 256) carts_changes.boxBelow = /*boxBelow*/ ctx[8];
    			if (dirty[0] & /*op4*/ 1) carts_changes.op4 = /*op4*/ ctx[0];
    			if (dirty[0] & /*op5*/ 16) carts_changes.op5 = /*op5*/ ctx[4];
    			carts.$set(carts_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(carts.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(carts.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(carts, detaching);
    		}
    	};
    }

    function create_fragment$4(ctx) {
    	let current_block_type_index;
    	let if_block0;
    	let t;
    	let if_block1_anchor;
    	let current;
    	const if_block_creators = [create_if_block_1$3, create_else_block_1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*end*/ ctx[3] === true) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	let if_block1 = /*kis*/ ctx[5] === false && create_if_block$4(ctx);

    	return {
    		c() {
    			if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    		},
    		m(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert(target, t, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert(target, if_block1_anchor, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block0 = if_blocks[current_block_type_index];

    				if (!if_block0) {
    					if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block0.c();
    				} else {
    					if_block0.p(ctx, dirty);
    				}

    				transition_in(if_block0, 1);
    				if_block0.m(t.parentNode, t);
    			}

    			if (/*kis*/ ctx[5] === false) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty[0] & /*kis*/ 32) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block$4(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			current = false;
    		},
    		d(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach(t);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach(if_block1_anchor);
    		}
    	};
    }

    function mark(element, value, arr) {
    	return value[arr.indexOf(element)];
    }

    function opy(e) {
    	console.log(e.substr(e.indexOf("/") + 1, e.length));
    	return e.substr(e.indexOf("/") + 1, e.length);
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { op4 } = $$props;
    	let ko;
    	let end = true;
    	let cart1 = [];
    	let cart2 = [];
    	let nostal = [];
    	const dispatch = createEventDispatcher();

    	function goSingle() {
    		dispatch("nav", { option: "single", checkId: 2 });
    	}

    	let op2 = "empty2";
    	let op5 = "empty4";

    	// ted baker
    	const numbers = [];

    	const type = [];
    	const price = [];
    	const desc = [];

    	// mark and spancer
    	const numbersM = [];

    	const typeM = [];
    	const priceM = [];
    	const descM = [];

    	// reformation
    	const numbersR = [];

    	const typeR = [];
    	const priceR = [];
    	const descR = [];

    	//maje
    	const numbersK = [];

    	const typeK = [];
    	const priceK = [];
    	const descK = [];

    	//Lily
    	const numbersL = [];

    	const typeL = [];
    	const priceL = [];
    	const descL = [];

    	//Hawes
    	const numbersH = [];

    	const typeH = [];
    	const priceH = [];
    	const descH = [];

    	//Dai
    	const numbersD = [];

    	const typeD = [];
    	const priceD = [];
    	const descD = [];

    	//Svarowski
    	const numbersS = [];

    	const typeS = [];
    	const priceS = [];
    	const descS = [];

    	//Bvlgari
    	const numbersB = [];

    	const typeB = [];
    	const priceB = [];
    	const descB = [];

    	//Tiffany
    	const numbersT = [];

    	const typeT = [];
    	const priceT = [];
    	const descT = [];

    	//Missoma
    	const numbersSA = [];

    	const typeSA = [];
    	const priceSA = [];
    	const descSA = [];

    	//Missoma
    	const numbersCA = [];

    	const typeCA = [];
    	const priceCA = [];
    	const descCA = [];

    	//Rollex
    	const numbersRO = [];

    	const typeRO = [];
    	const priceRO = [];
    	const descRO = [];

    	//Baume and Mercier
    	const numbersBA = [];

    	const typeBA = [];
    	const priceBA = [];
    	const descBA = [];
    	const cartBA = [];

    	//Bodycon
    	const numbersSBC = [];

    	const typeSBC = [];
    	const priceSBC = [];
    	const descSBC = [];

    	//off the s
    	const numbersSOTS = [];

    	const typeSOTS = [];
    	const priceSOTS = [];
    	const descSOTS = [];
    	const numbersSMD = [];
    	const typeSMD = [];
    	const priceSMD = [];
    	const descSMD = [];
    	const numbersSCA = [];
    	const typeSCA = [];
    	const priceSCA = [];
    	const descSCA = [];
    	const numbersSSU = [];
    	const typeSSU = [];
    	const priceSSU = [];
    	const descSSU = [];
    	const numbersSOF = [];
    	const typeSOF = [];
    	const priceSOF = [];
    	const descSOF = [];
    	const numbersSRI = [];
    	const typeSRI = [];
    	const priceSRI = [];
    	const descSRI = [];
    	const numbersSNE = [];
    	const typeSNE = [];
    	const priceSNE = [];
    	const descSNE = [];
    	const numbersSEA = [];
    	const typeSEA = [];
    	const priceSEA = [];
    	const descSEA = [];
    	const numbersSRE = [];
    	const typeSRE = [];
    	const priceSRE = [];
    	const descSRE = [];
    	const numbersSMO = [];
    	const typeSMO = [];
    	const priceSMO = [];
    	const descSMO = [];
    	const numbersSFA = [];
    	const typeSFA = [];
    	const priceSFA = [];
    	const descSFA = [];

    	document.querySelector(".superDiv").onclick = function (e) {
    		$$invalidate(7, finale = true);
    		$$invalidate(3, end = true);
    		console.log(e.srcElement.className.split(" ")[3]);
    		return $$invalidate(1, op2 = e.srcElement.className.split(" ")[3]);
    	};

    	let kis = true;

    	let base = [
    		{
    			"img": "BC1F",
    			"type": "Kloeey",
    			"Price": "120£",
    			"desc": "Samba strappy bodycon dress",
    			"new": "Ted"
    		},
    		{
    			"img": "BC2F",
    			"type": "SHARLEY",
    			"Price": "130£",
    			"desc": "Jamboree bodycon dress",
    			"new": "Ted"
    		},
    		{
    			"img": "BC3F",
    			"type": "TRIXIIY",
    			"Price": "90£",
    			"desc": "Pergola Bardot bodycon dress",
    			"new": "Ted"
    		},
    		{
    			"img": "BC4F",
    			"type": "TORIIY",
    			"Price": "220£",
    			"desc": "Wilderness bodycon dress",
    			"new": "Ted"
    		},
    		{
    			"img": "BC5F",
    			"type": "TILLIEY",
    			"Price": "330£",
    			"desc": "Cowl neck faux bodycon dress",
    			"new": "Ted"
    		},
    		{
    			"img": "BC6F",
    			"type": "PIANA",
    			"Price": "270£",
    			"desc": "Urban halterneck bodycon dress",
    			"new": "Ted"
    		},
    		{
    			"img": "BC7F",
    			"type": "SAIDIE",
    			"Price": "70£",
    			"desc": "Vanilla bodycon dress",
    			"new": "Ted"
    		},
    		{
    			"img": "BC8F",
    			"type": "Bodycon Dress",
    			"Price": "130£",
    			"desc": "Samba strappy bodycon dress",
    			"new": "Ted"
    		}
    	];

    	let markS = [
    		{
    			"img": "MD1F",
    			"type": "Per una",
    			"Price": "20£",
    			"desc": "Pure Cotton Floral Maxi Tiered Dress",
    			"new": "Mark"
    		},
    		{
    			"img": "MD2F",
    			"type": "Phasse Eight",
    			"Price": "30£",
    			"desc": "Floral V-Neck Belted Maxi Dress",
    			"new": "Mark"
    		},
    		{
    			"img": "MD3F",
    			"type": "TRIANGLE",
    			"Price": "50£",
    			"desc": "Floral Round Neck Maxi T-Shirt Dress",
    			"new": "Mark"
    		},
    		{
    			"img": "MD4F",
    			"type": "Embroidered",
    			"Price": "60£",
    			"desc": "Bardot Maxi Waisted Beach Dress",
    			"new": "Mark"
    		},
    		{
    			"img": "MD5F",
    			"type": "LEAFY",
    			"Price": "45£",
    			"desc": "Print Maxi Shirred Beach Dress",
    			"new": "Mark"
    		},
    		{
    			"img": "MD6F",
    			"type": "Rosalia",
    			"Price": "170£",
    			"desc": "Summer fever Maxi dress",
    			"new": "Mark"
    		},
    		{
    			"img": "MD7F",
    			"type": "SAIDIE",
    			"Price": "70£",
    			"desc": "Vanilla bodycon dress",
    			"new": "Mark"
    		},
    		{
    			"img": "MD8F",
    			"type": "Phase Eight",
    			"Price": "130£",
    			"desc": "Floral V-Neck Tie Front Midaxi Wrap Dress",
    			"new": "Mark"
    		}
    	];

    	// Reformation off the shoulder 
    	let markR = [
    		{
    			"img": "OTS1F",
    			"type": "Juliette Dres",
    			"Price": "60£",
    			"desc": "Blue cordoba",
    			"new": "Reformation"
    		},
    		{
    			"img": "OTS2F",
    			"type": "Summer freedom",
    			"Price": "130£",
    			"desc": "Elegant but casual",
    			"new": "Reformation"
    		},
    		{
    			"img": "OTS3F",
    			"type": "Fulton dress",
    			"Price": "90£",
    			"desc": "Off the shoulder dress",
    			"new": "Reformation"
    		},
    		{
    			"img": "OTS4F",
    			"type": "Hosby dress",
    			"Price": "60£",
    			"desc": "For more official matters",
    			"new": "Reformation"
    		}
    	]; //karen millen 

    	let markK = [
    		{
    			"img": "MD1F",
    			"type": "COTTON VOILE",
    			"Price": "320£",
    			"desc": "The main fabric is made from organic cotton",
    			"new": "Maje"
    		},
    		{
    			"img": "MD2F",
    			"type": "Muslin",
    			"Price": "430£",
    			"desc": "ASYMMETRIC DRESS IN PRINTED MUSLIN",
    			"new": "Maje"
    		},
    		{
    			"img": "MD3F",
    			"type": "RUFFLES",
    			"Price": "500£",
    			"desc": "SATIN DRESS WITH SMOCKING",
    			"new": "Maje"
    		},
    		{
    			"img": "MD4F",
    			"type": "Broidered",
    			"Price": "600£",
    			"desc": "Black Passion",
    			"new": "Maje"
    		},
    		{
    			"img": "OTS1F",
    			"type": "Picko",
    			"Price": "245£",
    			"desc": "OPENWORK DEMI DRESS",
    			"new": "Maje"
    		},
    		{
    			"img": "OTS2F",
    			"type": "GUIPURE",
    			"Price": "1070£",
    			"desc": "GUIPURE AND ORGANZA DRESS",
    			"new": "Maje"
    		},
    		{
    			"img": "OTS3F",
    			"type": "SATIN DRESS",
    			"Price": "700£",
    			"desc": "SATIN DRESS WITH BRAIDED STRAPS",
    			"new": "Maje"
    		},
    		{
    			"img": "OTS4F",
    			"type": "TROMPE L’ŒIL",
    			"Price": "1300£",
    			"desc": "PRINTED SATIN DRESS",
    			"new": "Maje"
    		},
    		{
    			"img": "BC1F",
    			"type": "STRETCH KNIT ",
    			"Price": "300£",
    			"desc": "FIGURE-HUGGING DRESS",
    			"new": "Maje"
    		},
    		{
    			"img": "BC2F",
    			"type": "Saturn",
    			"Price": "2300£",
    			"desc": "PRINTED SATIN DRESS",
    			"new": "Maje"
    		},
    		{
    			"img": "BC3F",
    			"type": "Knit Dress",
    			"Price": "300£",
    			"desc": "CONTRAST KNIT DRESS",
    			"new": "Maje"
    		},
    		{
    			"img": "BC4F",
    			"type": "PLEATED GOLD",
    			"Price": "9150£",
    			"desc": "Lurex Dress",
    			"new": "Maje"
    		}
    	];

    	///svarowski
    	let svarowski = [
    		{
    			"img": "RI1F",
    			"type": "Surreal Dream Ring",
    			"Price": "320£",
    			"desc": "Eye, Blue, Gold-tone plated",
    			"new": "Svarowski"
    		},
    		{
    			"img": "RI2F",
    			"type": "Wonder Woman Armour Ring",
    			"Price": "230£",
    			"desc": "White, Gold-tone plated",
    			"new": "Svarowski"
    		},
    		{
    			"img": "RI3F",
    			"type": "Beautiful Earth ",
    			"Price": "250£",
    			"desc": "Green, Gold-tone plated",
    			"new": "Svarowski"
    		},
    		{
    			"img": "EA1F",
    			"type": "Surreal Dream Pierced Earrings",
    			"Price": "200£",
    			"desc": "Eye, Blue, Gold-tone plated",
    			"new": "Svarowski"
    		},
    		{
    			"img": "EA2F",
    			"type": "Wonder Woman Pierced Earrings",
    			"Price": "345£",
    			"desc": "Gold tone, Gold-tone plated",
    			"new": "Svarowski"
    		},
    		{
    			"img": "EA3F",
    			"type": "Beautiful Earth Drop",
    			"Price": "1070£",
    			"desc": "Multicolored, Gold-tone plated",
    			"new": "Svarowski"
    		},
    		{
    			"img": "NE1F",
    			"type": "Mesmera necklace",
    			"Price": "630£",
    			"desc": "Oversized crystals",
    			"new": "Svarowski"
    		},
    		{
    			"img": "NE2F",
    			"type": "Millenia necklace",
    			"Price": "500£",
    			"desc": "Octagon cut crystals",
    			"new": "Svarowski"
    		},
    		{
    			"img": "NE3F",
    			"type": "Sparkling Dance",
    			"Price": "300£",
    			"desc": "Large, White, Rhodium plated",
    			"new": "Svarowski"
    		}
    	];

    	///Bvlgari
    	let bvlgari = [
    		{
    			"img": "RI1F",
    			"type": "SERPENTI RING",
    			"Price": "37020£",
    			"desc": "18k silver ring with diamonds",
    			"new": "Bvlgari"
    		},
    		{
    			"img": "RI2F",
    			"type": "BVLGARI RING",
    			"Price": "3230£",
    			"desc": "BVLGARI BVLGARI 18 kt white gold ring set with pavé diamonds",
    			"new": "Bvlgari"
    		},
    		{
    			"img": "RI3F",
    			"type": "B.ZERO1 RING",
    			"Price": "5050£",
    			"desc": "B.zero1 one-band ring in 18 kt white gold, set with pavé diamonds on the spiral",
    			"new": "Bvlgari"
    		},
    		{
    			"img": "EA1F",
    			"type": "BVLGARI EARRINGS",
    			"Price": "4200£",
    			"desc": "Openwork 18 kt white gold earrings set with full pavé diamonds",
    			"new": "Bvlgari"
    		},
    		{
    			"img": "EA2F",
    			"type": "SERPENTI EARRINGS",
    			"Price": "19800£",
    			"desc": "Serpenti 18 kt white gold earrings, set with a blue sapphire on the head, emerald eyes and pavé",
    			"new": "Bvlgari"
    		},
    		{
    			"img": "EA3F",
    			"type": "SERPENTI EARRINGS",
    			"Price": "24500£",
    			"desc": "Serpenti earrings in 18 kt white gold, set with emerald eyes and full pavé diamonds.",
    			"new": "Bvlgari"
    		},
    		{
    			"img": "NE1F",
    			"type": "SERPENTI VIPER NECKLACE",
    			"Price": "5900£",
    			"desc": "Serpenti Viper pendant necklace in 18 kt white gold set with pavé diamonds",
    			"new": "Bvlgari"
    		},
    		{
    			"img": "NE2F",
    			"type": "BVLGARI NECKLACE",
    			"Price": "3470£",
    			"desc": "BVLGARI  Openwork 18 kt white gold necklace set with full pavé diamonds on the pendant",
    			"new": "Bvlgari"
    		},
    		{
    			"img": "NE3F",
    			"type": "DIVAS’ DREAM NECKLACE",
    			"Price": "21300£",
    			"desc": "DIVAS' DREAM 18 kt white gold openwork necklace set with a pear-shaped emerald, round brilliant-cut emeralds, a round brilliant-cut diamond and pavé diamonds.",
    			"new": "Bvlgari"
    		},
    		{
    			"img": "NE4F",
    			"type": "SERPENTI NECKLACE",
    			"Price": "20900£",
    			"desc": "Serpenti necklace in 18 kt white gold set with blue sapphire eyes and pavé diamonds.",
    			"new": "Bvlgari"
    		},
    		{
    			"img": "NE5F",
    			"type": "SERPENTI NECKLACE",
    			"Price": "15400£",
    			"desc": "Serpenti 18 kt rose gold necklace set with blue sapphire eyes.",
    			"new": "Bvlgari"
    		},
    		{
    			"img": "NE6F",
    			"type": "DIVAS’ DREAM NECKLACE",
    			"Price": "3400",
    			"desc": "DIVAS' DREAM 18 kt rose gold necklace set with carnelian elements.",
    			"new": "Bvlgari"
    		}
    	];

    	//lilly silk
    	let markL = [
    		{
    			"img": "CA1F",
    			"type": "Momme Loose",
    			"Price": "220£",
    			"desc": "Collarless Silk Dressing Gown",
    			"new": "Lily"
    		},
    		{
    			"img": "CA2F",
    			"type": "Momme Chic",
    			"Price": "330£",
    			"desc": "Trimmed Silk Pyjamas Set",
    			"new": "Lily"
    		},
    		{
    			"img": "OF1F",
    			"type": "Elegant",
    			"Price": "290£",
    			"desc": "V Neck Silk Dress With Pearl",
    			"new": "Lily"
    		},
    		{
    			"img": "OF2F",
    			"type": "Charmeuse",
    			"Price": "220£",
    			"desc": "Partition Staple Charmeuse Silk Shirt",
    			"new": "Lily"
    		},
    		{
    			"img": "CA3F",
    			"type": "Momme Lace",
    			"Price": "90£",
    			"desc": "Momme Lace Silk Camisole Set",
    			"new": "Lily"
    		},
    		{
    			"img": "OF3F",
    			"type": "Bowie",
    			"Price": "170£",
    			"desc": "Concise Silk Bow Tie Blouse",
    			"new": "Lily"
    		}
    	];

    	//Hawes
    	let markH = [
    		{
    			"img": "OF1F",
    			"type": "Boutique White",
    			"Price": "59£",
    			"desc": " Semi Fitted Button Loop Shirt",
    			"new": "Hawes"
    		},
    		{
    			"img": "OF2F",
    			"type": "Single Cuff",
    			"Price": "39£",
    			"desc": "White Fitted Shirt with High Two Button Collar",
    			"new": "Hawes"
    		},
    		{
    			"img": "OF3F",
    			"type": "Ice Blue ",
    			"Price": "59£",
    			"desc": "Fitted Shirt with High Long Collar ",
    			"new": "Hawes"
    		},
    		{
    			"img": "OF4F",
    			"type": "Pussy Bow",
    			"Price": "45£",
    			"desc": "Women's Black Fitted Satin Blouse",
    			"new": "Hawes"
    		},
    		{
    			"img": "OF5F",
    			"type": "3 Quarter Sleeve",
    			"Price": "30£",
    			"desc": "White Fitted Cotton Shirt",
    			"new": "Hawes"
    		},
    		{
    			"img": "OF6F",
    			"type": "Black Fitted Shirt",
    			"Price": "70£",
    			"desc": "Fitted Stretch Shirt - Single Cuff",
    			"new": "Hawes"
    		}
    	];

    	//dai
    	let markD = [
    		{
    			"img": "OF1F",
    			"type": "Fundamental Dress Black",
    			"Price": "259£",
    			"desc": " The everyday staple dress",
    			"new": "Dai"
    		},
    		{
    			"img": "OF2F",
    			"type": "Trail Blazer™",
    			"Price": "325£",
    			"desc": "The ultimate power jacket",
    			"new": "Dai"
    		},
    		{
    			"img": "OF3F",
    			"type": "Eco Layer On Top Ivory",
    			"Price": "110£",
    			"desc": "Feels good and mirrors nature's circle of life ",
    			"new": "Dai"
    		},
    		{
    			"img": "OF4F",
    			"type": "Thinking Cap Dress",
    			"Price": "275£",
    			"desc": "Cap sleeve dress with ruffle-effect side panels",
    			"new": "Dai"
    		},
    		{
    			"img": "OF5F",
    			"type": "Victory Dress Black",
    			"Price": "245£",
    			"desc": "V is for Victory dress",
    			"new": "Dai"
    		},
    		{
    			"img": "OF6F",
    			"type": "Eco Layer On Top Black",
    			"Price": "110£",
    			"desc": "Feels good and mirrors nature's circle of life",
    			"new": "Dai"
    		}
    	];

    	let tiffany = [
    		{
    			"img": "RI1F",
    			"type": "JENNY PACKHAM",
    			"Price": "400£",
    			"desc": " 9CT WHITE GOLD 0.10CTTW DIAMOND RING",
    			"new": "Tiffany"
    		},
    		{
    			"img": "RI2F",
    			"type": "Fine Jewelry Rose™",
    			"Price": "999£",
    			"desc": "Gold Diamond Belle Ring",
    			"new": "Tiffany"
    		},
    		{
    			"img": "RI3F",
    			"type": "Diamond Solitaire Twist Ring",
    			"Price": "499£",
    			"desc": "9ct White Gold 0.33ct Total",
    			"new": "Tiffany"
    		}
    	];

    	let missoma = [
    		{
    			"img": "RI1F",
    			"type": "Lucy williams",
    			"Price": "69£",
    			"desc": " malachite square gold signet ring",
    			"new": "Missoma"
    		},
    		{
    			"img": "RI2F",
    			"type": "bombé raffia ring™",
    			"Price": "299£",
    			"desc": "Gold Belle Ring",
    			"new": "Missoma"
    		},
    		{
    			"img": "RI3F",
    			"type": "Signet ring",
    			"Price": "149£",
    			"desc": "fused silver black onyx round",
    			"new": "Missoma"
    		},
    		{
    			"img": "NE1F",
    			"type": "Heart",
    			"Price": "149£",
    			"desc": "ridge heart necklace",
    			"new": "Missoma"
    		},
    		{
    			"img": "NE2F",
    			"type": "Lucy williams",
    			"Price": "149£",
    			"desc": "gold roman arc coin necklace",
    			"new": "Missoma"
    		},
    		{
    			"img": "NE3F",
    			"type": "Lucy williams",
    			"Price": "249£",
    			"desc": "square malachite necklace",
    			"new": "Missoma"
    		},
    		{
    			"img": "EA1F",
    			"type": "Lucy williams",
    			"Price": "39£",
    			"desc": "baya hoop earrings",
    			"new": "Missoma"
    		},
    		{
    			"img": "EA2F",
    			"type": "Helical hoop",
    			"Price": "59£",
    			"desc": "gold mini helical hoop earrings",
    			"new": "Missoma"
    		},
    		{
    			"img": "EA3F",
    			"type": "Lucy williams",
    			"Price": "165£",
    			"desc": "snake chain drop earrings",
    			"new": "Missoma"
    		}
    	];

    	let chanel = [
    		{
    			"img": "MO1F",
    			"type": "CHANEL J12",
    			"Price": "6900£",
    			"desc": " AUTOMATIC LADIES WATCH",
    			"new": "Chanel"
    		},
    		{
    			"img": "FA1F",
    			"type": "CHANEL CODE COCO ",
    			"Price": "7299£",
    			"desc": " STEEL AND DIAMOND H5145 38X21.5MM",
    			"new": "Chanel"
    		},
    		{
    			"img": "FA2F",
    			"type": "CHANEL PREMIERE",
    			"Price": "6500£",
    			"desc": "STEEL AND ONYX WATCH",
    			"new": "Chanel"
    		},
    		{
    			"img": "RE1F",
    			"type": "CHANEL BOY-FRIEND",
    			"Price": "11000",
    			"desc": "BEIGE GOLD H4313 27X35MM",
    			"new": "Chanel"
    		},
    		{
    			"img": "MO2F",
    			"type": "CHANEL BOY-FRIEND",
    			"Price": "6100£",
    			"desc": "DIAMOND H4883 28X21.5MM",
    			"new": "Chanel"
    		}
    	];

    	let rolex = [
    		{
    			"img": "FA1F",
    			"type": "PEARLMASTER 39",
    			"Price": "16900£",
    			"desc": " Oyster, 39 mm, white gold and diamonds",
    			"new": "Rolex"
    		},
    		{
    			"img": "FA2F",
    			"type": "LADY-DATEJUST",
    			"Price": "15000£",
    			"desc": "Oyster, 28 mm, Oystersteel",
    			"new": "Rolex"
    		},
    		{
    			"img": "FA3F",
    			"type": "LADY-DATEJUST",
    			"Price": "16900£",
    			"desc": " Oyster, 28 mm, Everose gold and diamonds",
    			"new": "Rolex"
    		},
    		{
    			"img": "FA4F",
    			"type": "LADY-DATEJUST",
    			"Price": "9200£",
    			"desc": " Oyster, 28 mm, Oystersteel and yellow gold",
    			"new": "Rolex"
    		},
    		{
    			"img": "FA5F",
    			"type": "DATEJUST 31",
    			"Price": "37900£",
    			"desc": " Oyster, 31 mm, white gold and diamonds",
    			"new": "Rolex"
    		},
    		{
    			"img": "FA6F",
    			"type": "DATEJUST 31",
    			"Price": "6500£",
    			"desc": " Oyster, 31 mm, Oystersteel and white gold",
    			"new": "Rolex"
    		},
    		{
    			"img": "MO1F",
    			"type": "DAY-DATE 36",
    			"Price": "48150£",
    			"desc": " Oyster, 36 mm, Everose gold and diamonds",
    			"new": "Rolex"
    		}
    	];

    	let baume = [
    		{
    			"img": "RE1F",
    			"type": "Classima ",
    			"Price": "2400£",
    			"desc": "27mm Ladies Watch ",
    			"new": "Baume",
    			"cart": 0
    		},
    		{
    			"img": "RE2F",
    			"type": "Classima",
    			"Price": "15000£",
    			"desc": "31mm Ladies Watch ",
    			"new": "Baume",
    			"cart": 0
    		},
    		{
    			"img": "RE3F",
    			"type": "Classima ",
    			"Price": "940£",
    			"desc": " 36.5mm Ladies Watch",
    			"new": "Baume",
    			"cart": 0
    		}
    	];

    	// let cus = ["base","markS","markR","markK"]
    	// let cus2 = ["","M","R","K"]
    	//   $: console.log(base.img);
    	// for (let j = 0 ; j <= cus.length-1 ; j++){
    	//   for (let i = 0; i<=6; i++){
    	//       (numbers+cus2[j]).push(cus[j].img)
    	//       type+cus2[j].push(cus[j].type)
    	//       price+cus2[j].push(cus[j].Price)
    	//       desc+cus2[j].push(cus[j].desc)
    	//       console.log(numbers)
    	//       }
    	// }
    	for (let i = 0; i <= 6; i++) {
    		numbers.push(base[i].img);
    		type.push(base[i].type);
    		price.push(base[i].Price);
    		desc.push(base[i].desc);
    	}

    	for (let i = 0; i <= 6; i++) {
    		numbersM.push(markS[i].img);
    		typeM.push(markS[i].type);
    		priceM.push(markS[i].Price);
    		descM.push(markS[i].desc);
    	}

    	for (let i = 0; i <= 3; i++) {
    		numbersR.push(markR[i].img);
    		typeR.push(markR[i].type);
    		priceR.push(markR[i].Price);
    		descR.push(markR[i].desc);
    	}

    	for (let i = 0; i <= 11; i++) {
    		numbersK.push(markK[i].img);
    		typeK.push(markK[i].type);
    		priceK.push(markK[i].Price);
    		descK.push(markK[i].desc);
    	}

    	for (let i = 0; i <= 5; i++) {
    		numbersL.push(markL[i].img);
    		typeL.push(markL[i].type);
    		priceL.push(markL[i].Price);
    		descL.push(markL[i].desc);
    	}

    	for (let i = 0; i <= 5; i++) {
    		numbersH.push(markH[i].img);
    		typeH.push(markH[i].type);
    		priceH.push(markH[i].Price);
    		descH.push(markH[i].desc);
    	}

    	for (let i = 0; i <= 5; i++) {
    		numbersD.push(markD[i].img);
    		typeD.push(markD[i].type);
    		priceD.push(markD[i].Price);
    		descD.push(markD[i].desc);
    	}

    	for (let i = 0; i <= 8; i++) {
    		numbersS.push(svarowski[i].img);
    		typeS.push(svarowski[i].type);
    		priceS.push(svarowski[i].Price);
    		descS.push(svarowski[i].desc);
    	}

    	for (let i = 0; i <= 11; i++) {
    		numbersB.push(bvlgari[i].img);
    		typeB.push(bvlgari[i].type);
    		priceB.push(bvlgari[i].Price);
    		descB.push(bvlgari[i].desc);
    	}

    	for (let i = 0; i <= 2; i++) {
    		numbersT.push(tiffany[i].img);
    		typeT.push(tiffany[i].type);
    		priceT.push(tiffany[i].Price);
    		descT.push(tiffany[i].desc);
    	}

    	for (let i = 0; i <= 8; i++) {
    		numbersSA.push(missoma[i].img);
    		typeSA.push(missoma[i].type);
    		priceSA.push(missoma[i].Price);
    		descSA.push(missoma[i].desc);
    	}

    	for (let i = 0; i <= 4; i++) {
    		numbersCA.push(chanel[i].img);
    		typeCA.push(chanel[i].type);
    		priceCA.push(chanel[i].Price);
    		descCA.push(chanel[i].desc);
    	}

    	for (let i = 0; i <= 6; i++) {
    		numbersRO.push(rolex[i].img);
    		typeRO.push(rolex[i].type);
    		priceRO.push(rolex[i].Price);
    		descRO.push(rolex[i].desc);
    	}

    	for (let i = 0; i <= 2; i++) {
    		numbersBA.push(baume[i].img);
    		typeBA.push(baume[i].type);
    		priceBA.push(baume[i].Price);
    		descBA.push(baume[i].desc);
    		cartBA.push(baume[i].cart);
    	}

    	let much;
    	let finale = true;

    	function falsy() {
    		$$invalidate(7, finale = false);
    	}
    	let boxBelow;

    	let itemsS = ["BC", "OTS", "MD", "CA", "SU", "OF", "RI", "NE", "EA", "RE", "MO", "FA"];

    	let supers = [
    		markD,
    		markH,
    		markL,
    		markK,
    		markR,
    		markS,
    		base,
    		svarowski,
    		bvlgari,
    		tiffany,
    		missoma,
    		chanel,
    		rolex,
    		baume
    	];

    	console.log(markD);

    	function doom(e, eve) {
    		for (let i = 0; i < supers.length; i++) {
    			supers[i].map(car => {
    				if (car.img.includes(e)) {
    					return eval("numbersS" + e).push(car.new + "/" + car.img);
    				}
    			});
    		}
    	}

    	function doom2(e, eve) {
    		for (let i = 0; i < supers.length; i++) {
    			supers[i].map(car => {
    				if (car.img.includes(e)) {
    					return eval("priceS" + e).push(car.Price);
    				}
    			});
    		}
    	}

    	function doom3(e, eve) {
    		for (let i = 0; i < supers.length; i++) {
    			supers[i].map(car => {
    				if (car.img.includes(e)) {
    					return eval("descS" + e).push(car.desc);
    				}
    			});
    		}
    	}

    	function doom4(e, eve) {
    		for (let i = 0; i < supers.length; i++) {
    			supers[i].map(car => {
    				if (car.img.includes(e)) {
    					return eval("typeS" + e).push(car.type);
    				}
    			});
    		}
    	}

    	for (let i = 0; i <= 11; i++) {
    		doom(itemsS[i]);
    		doom2(itemsS[i]);
    		doom3(itemsS[i]);
    		doom4(itemsS[i]);
    	}

    	// if (document.querySelector(".Bodyconx") !== null){
    	// console.log(document.querySelector(".Bodyconx").innerHTML);}
    	//  if (document.querySelector("."+items[0]+"x") !== null){
    	// document.querySelector(".Bodyconx").addEventListener("click",function(){
    	// })}
    	function opz(e) {
    		return $$invalidate(4, op5 = e.substr(0, e.indexOf("/")));
    	}

    	const click_handler = (item, e) => {
    		$$invalidate(2, ko = mark(item, price, numbers));
    		($$invalidate(8, boxBelow = document.querySelector("." + op2 + item).innerHTML), $$invalidate(6, much = e.srcElement.className.split(" ")[1]), falsy(), goSingle());
    	};

    	const click_handler_1 = (item, e) => {
    		$$invalidate(2, ko = mark(item, priceM, numbersM));
    		($$invalidate(8, boxBelow = document.querySelector("." + op2 + item).innerHTML), $$invalidate(6, much = e.srcElement.className.split(" ")[1]), falsy());
    	};

    	const click_handler_2 = (item, e) => {
    		$$invalidate(2, ko = mark(item, priceR, numbersR));
    		($$invalidate(8, boxBelow = document.querySelector("." + op2 + item).innerHTML), $$invalidate(6, much = e.srcElement.className.split(" ")[1]), falsy());
    	};

    	const click_handler_3 = (item, e) => {
    		$$invalidate(2, ko = mark(item, priceK, numbersK));
    		($$invalidate(8, boxBelow = document.querySelector("." + op2 + item).innerHTML), $$invalidate(6, much = e.srcElement.className.split(" ")[1]), falsy());
    	};

    	const click_handler_4 = (item, e) => {
    		$$invalidate(2, ko = mark(item, priceL, numbersL));
    		($$invalidate(8, boxBelow = document.querySelector("." + op2 + item).innerHTML), $$invalidate(6, much = e.srcElement.className.split(" ")[1]), falsy());
    	};

    	const click_handler_5 = (item, e) => {
    		$$invalidate(2, ko = mark(item, priceH, numbersH));
    		($$invalidate(8, boxBelow = document.querySelector("." + op2 + item).innerHTML), $$invalidate(6, much = e.srcElement.className.split(" ")[1]), falsy());
    	};

    	const click_handler_6 = (item, e) => {
    		$$invalidate(2, ko = mark(item, priceD, numbersD));
    		console.log(op2 + item);
    		($$invalidate(8, boxBelow = document.querySelector("." + op2 + item).innerHTML), $$invalidate(6, much = e.srcElement.className.split(" ")[1]), falsy());
    	};

    	const click_handler_7 = (item, e) => {
    		$$invalidate(2, ko = mark(item, priceS, numbersS));
    		console.log(op2 + item);
    		($$invalidate(8, boxBelow = document.querySelector("." + op2 + item).innerHTML), $$invalidate(6, much = e.srcElement.className.split(" ")[1]), falsy());
    	};

    	const click_handler_8 = (item, e) => {
    		$$invalidate(2, ko = mark(item, priceB, numbersB));
    		console.log(op2 + item);
    		($$invalidate(8, boxBelow = document.querySelector("." + op2 + item).innerHTML), $$invalidate(6, much = e.srcElement.className.split(" ")[1]), falsy());
    	};

    	const click_handler_9 = (item, e) => {
    		$$invalidate(2, ko = mark(item, priceT, numbersT));
    		($$invalidate(8, boxBelow = document.querySelector("." + op2 + item).innerHTML), $$invalidate(6, much = e.srcElement.className.split(" ")[1]), falsy());
    	};

    	const click_handler_10 = (item, e) => {
    		$$invalidate(2, ko = mark(item, priceSA, numbersSA));
    		($$invalidate(8, boxBelow = document.querySelector("." + op2 + item).innerHTML), $$invalidate(6, much = e.srcElement.className.split(" ")[1]), falsy());
    	};

    	const click_handler_11 = (item, e) => {
    		$$invalidate(2, ko = mark(item, priceCA, numbersCA));
    		($$invalidate(8, boxBelow = document.querySelector("." + op2 + item).innerHTML), $$invalidate(6, much = e.srcElement.className.split(" ")[1]), falsy());
    	};

    	const click_handler_12 = (item, e) => {
    		$$invalidate(2, ko = mark(item, priceRO, numbersRO));
    		($$invalidate(8, boxBelow = document.querySelector("." + op2 + item).innerHTML), $$invalidate(6, much = e.srcElement.className.split(" ")[1]), falsy());
    	};

    	const click_handler_13 = (item, e) => {
    		$$invalidate(2, ko = mark(item, priceBA, numbersBA));
    		($$invalidate(8, boxBelow = document.querySelector("." + op2 + item).innerHTML), $$invalidate(6, much = e.srcElement.className.split(" ")[1]), falsy());
    	};

    	const click_handler_14 = (item, e) => {
    		$$invalidate(2, ko = mark(item, priceSCA, numbersSCA));
    		($$invalidate(8, boxBelow = document.querySelector("." + opz(item) + opy(item)).innerHTML), $$invalidate(6, much = e.srcElement.className.split(" ")[1]), falsy());
    	};

    	const click_handler_15 = (item, e) => {
    		$$invalidate(2, ko = mark(item, priceSOTS, numbersSOTS));
    		($$invalidate(8, boxBelow = document.querySelector("." + opz(item) + opy(item)).innerHTML), $$invalidate(6, much = e.srcElement.className.split(" ")[1]), falsy());
    	};

    	const click_handler_16 = (item, e) => {
    		$$invalidate(2, ko = mark(item, priceSMD, numbersSMD));
    		($$invalidate(8, boxBelow = document.querySelector("." + opz(item) + opy(item)).innerHTML), $$invalidate(6, much = e.srcElement.className.split(" ")[1]), falsy());
    	};

    	const click_handler_17 = (item, e) => {
    		$$invalidate(2, ko = mark(item, priceSCA, numbersSCA));
    		($$invalidate(8, boxBelow = document.querySelector("." + opz(item) + opy(item)).innerHTML), $$invalidate(6, much = e.srcElement.className.split(" ")[1]), falsy());
    	};

    	const click_handler_18 = (item, e) => {
    		($$invalidate(8, boxBelow = document.querySelector("." + opz(item) + opy(item)).innerHTML), $$invalidate(6, much = e.srcElement.className.split(" ")[1]), falsy());
    	};

    	const click_handler_19 = (item, e) => {
    		$$invalidate(2, ko = mark(item, priceSOF, numbersSOF));
    		($$invalidate(8, boxBelow = document.querySelector("." + opz(item) + opy(item)).innerHTML), $$invalidate(6, much = e.srcElement.className.split(" ")[1]), falsy());
    	};

    	const click_handler_20 = (item, e) => {
    		$$invalidate(2, ko = mark(item, priceSRI, numbersSRI));
    		($$invalidate(8, boxBelow = document.querySelector("." + opz(item) + opy(item)).innerHTML), $$invalidate(6, much = e.srcElement.className.split(" ")[1]), falsy());
    	};

    	const click_handler_21 = (item, e) => {
    		$$invalidate(2, ko = mark(item, priceSNE, numbersSNE));
    		($$invalidate(8, boxBelow = document.querySelector("." + opz(item) + opy(item)).innerHTML), $$invalidate(6, much = e.srcElement.className.split(" ")[1]), falsy());
    	};

    	const click_handler_22 = (item, e) => {
    		$$invalidate(2, ko = mark(item, priceSEA, numbersSEA));
    		($$invalidate(8, boxBelow = document.querySelector("." + opz(item) + opy(item)).innerHTML), $$invalidate(6, much = e.srcElement.className.split(" ")[1]), falsy());
    	};

    	const click_handler_23 = (item, e) => {
    		$$invalidate(2, ko = mark(item, priceSRE, numbersSRE));
    		($$invalidate(8, boxBelow = document.querySelector("." + opz(item) + opy(item)).innerHTML), $$invalidate(6, much = e.srcElement.className.split(" ")[1]), falsy());
    	};

    	const click_handler_24 = (item, e) => {
    		$$invalidate(2, ko = mark(item, priceSMO, numbersSMO));
    		($$invalidate(8, boxBelow = document.querySelector("." + opz(item) + opy(item)).innerHTML), $$invalidate(6, much = e.srcElement.className.split(" ")[1]), falsy());
    	};

    	const click_handler_25 = (item, e) => {
    		$$invalidate(2, ko = mark(item, priceSFA, numbersSFA));
    		($$invalidate(8, boxBelow = document.querySelector("." + opz(item) + opy(item)).innerHTML), $$invalidate(6, much = e.srcElement.className.split(" ")[1]), falsy());
    	};

    	$$self.$$set = $$props => {
    		if ("op4" in $$props) $$invalidate(0, op4 = $$props.op4);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*op2*/ 2) {
    			$$invalidate(0, op4 = op2);
    		}
    	};

    	return [
    		op4,
    		op2,
    		ko,
    		end,
    		op5,
    		kis,
    		much,
    		finale,
    		boxBelow,
    		cart1,
    		cart2,
    		nostal,
    		goSingle,
    		numbers,
    		type,
    		price,
    		desc,
    		numbersM,
    		typeM,
    		priceM,
    		descM,
    		numbersR,
    		typeR,
    		priceR,
    		descR,
    		numbersK,
    		typeK,
    		priceK,
    		descK,
    		numbersL,
    		typeL,
    		priceL,
    		descL,
    		numbersH,
    		typeH,
    		priceH,
    		descH,
    		numbersD,
    		typeD,
    		priceD,
    		descD,
    		numbersS,
    		typeS,
    		priceS,
    		descS,
    		numbersB,
    		typeB,
    		priceB,
    		descB,
    		numbersT,
    		typeT,
    		priceT,
    		descT,
    		numbersSA,
    		typeSA,
    		priceSA,
    		descSA,
    		numbersCA,
    		typeCA,
    		priceCA,
    		descCA,
    		numbersRO,
    		typeRO,
    		priceRO,
    		descRO,
    		numbersBA,
    		typeBA,
    		priceBA,
    		descBA,
    		numbersSBC,
    		typeSBC,
    		priceSBC,
    		descSBC,
    		numbersSOTS,
    		typeSOTS,
    		priceSOTS,
    		descSOTS,
    		numbersSMD,
    		typeSMD,
    		priceSMD,
    		descSMD,
    		numbersSCA,
    		typeSCA,
    		priceSCA,
    		descSCA,
    		numbersSSU,
    		typeSSU,
    		priceSSU,
    		descSSU,
    		numbersSOF,
    		typeSOF,
    		priceSOF,
    		descSOF,
    		numbersSRI,
    		typeSRI,
    		priceSRI,
    		descSRI,
    		numbersSNE,
    		typeSNE,
    		priceSNE,
    		descSNE,
    		numbersSEA,
    		typeSEA,
    		priceSEA,
    		descSEA,
    		numbersSRE,
    		typeSRE,
    		priceSRE,
    		descSRE,
    		numbersSMO,
    		typeSMO,
    		priceSMO,
    		descSMO,
    		numbersSFA,
    		typeSFA,
    		priceSFA,
    		descSFA,
    		falsy,
    		opz,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5,
    		click_handler_6,
    		click_handler_7,
    		click_handler_8,
    		click_handler_9,
    		click_handler_10,
    		click_handler_11,
    		click_handler_12,
    		click_handler_13,
    		click_handler_14,
    		click_handler_15,
    		click_handler_16,
    		click_handler_17,
    		click_handler_18,
    		click_handler_19,
    		click_handler_20,
    		click_handler_21,
    		click_handler_22,
    		click_handler_23,
    		click_handler_24,
    		click_handler_25
    	];
    }

    class Firms extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { op4: 0 }, [-1, -1, -1, -1, -1, -1, -1, -1]);
    	}
    }

    /* src\Outer.svelte generated by Svelte v3.38.2 */

    class Outer extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, null, null, safe_not_equal, {});
    	}
    }

    /* src\page.svelte generated by Svelte v3.38.2 */

    function create_if_block_2$1(ctx) {
    	let div;
    	let div_transition;
    	let current;

    	return {
    		c() {
    			div = element("div");
    			div.innerHTML = `<b>50% of Summer dresses colection</b>`;
    			attr(div, "class", "content nameShop opacity1 svelte-ie5zrp");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			current = true;
    		},
    		i(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, fade, {}, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o(local) {
    			if (!div_transition) div_transition = create_bidirectional_transition(div, fade, {}, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			if (detaching && div_transition) div_transition.end();
    		}
    	};
    }

    // (33:0) {#if y >350}
    function create_if_block_1$2(ctx) {
    	let div;
    	let div_transition;
    	let current;

    	return {
    		c() {
    			div = element("div");
    			div.innerHTML = `<p class="hov svelte-ie5zrp"><b>Shop now</b></p>`;
    			attr(div, "class", "contentsm point  opacity1 svelte-ie5zrp");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			current = true;
    		},
    		i(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, fade, {}, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o(local) {
    			if (!div_transition) div_transition = create_bidirectional_transition(div, fade, {}, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			if (detaching && div_transition) div_transition.end();
    		}
    	};
    }

    // (48:0) {#if y>900}
    function create_if_block$3(ctx) {
    	let div0;
    	let div0_transition;
    	let t3;
    	let div1;
    	let div1_transition;
    	let t6;
    	let div2;
    	let div2_transition;
    	let current;

    	return {
    		c() {
    			div0 = element("div");

    			div0.innerHTML = `<h2>30% Off</h2> 
    <p>Summer footware and exclusive bags</p>`;

    			t3 = space();
    			div1 = element("div");
    			div1.innerHTML = `<span class="oldP svelte-ie5zrp">220£ </span><b>120£</b>`;
    			t6 = space();
    			div2 = element("div");
    			div2.innerHTML = `<span class="oldP svelte-ie5zrp">350£ </span><b>240£</b>`;
    			attr(div0, "class", "text-block svelte-ie5zrp");
    			attr(div1, "class", "text-block newposleft svelte-ie5zrp");
    			attr(div2, "class", "text-block newposright svelte-ie5zrp");
    		},
    		m(target, anchor) {
    			insert(target, div0, anchor);
    			insert(target, t3, anchor);
    			insert(target, div1, anchor);
    			insert(target, t6, anchor);
    			insert(target, div2, anchor);
    			current = true;
    		},
    		i(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div0_transition) div0_transition = create_bidirectional_transition(div0, fade, {}, true);
    				div0_transition.run(1);
    			});

    			add_render_callback(() => {
    				if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, {}, true);
    				div1_transition.run(1);
    			});

    			add_render_callback(() => {
    				if (!div2_transition) div2_transition = create_bidirectional_transition(div2, fade, {}, true);
    				div2_transition.run(1);
    			});

    			current = true;
    		},
    		o(local) {
    			if (!div0_transition) div0_transition = create_bidirectional_transition(div0, fade, {}, false);
    			div0_transition.run(0);
    			if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, {}, false);
    			div1_transition.run(0);
    			if (!div2_transition) div2_transition = create_bidirectional_transition(div2, fade, {}, false);
    			div2_transition.run(0);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div0);
    			if (detaching && div0_transition) div0_transition.end();
    			if (detaching) detach(t3);
    			if (detaching) detach(div1);
    			if (detaching && div1_transition) div1_transition.end();
    			if (detaching) detach(t6);
    			if (detaching) detach(div2);
    			if (detaching && div2_transition) div2_transition.end();
    		}
    	};
    }

    function create_fragment$3(ctx) {
    	let scrolling = false;

    	let clear_scrolling = () => {
    		scrolling = false;
    	};

    	let scrolling_timeout;
    	let h1;
    	let t1;
    	let div0;
    	let img0;
    	let img0_src_value;
    	let t2;
    	let t3;
    	let t4;
    	let div2;
    	let img1;
    	let img1_src_value;
    	let t5;
    	let t6;
    	let div1;
    	let t7;
    	let img2;
    	let img2_src_value;
    	let current;
    	let mounted;
    	let dispose;
    	add_render_callback(/*onwindowscroll*/ ctx[1]);
    	let if_block0 = /*y*/ ctx[0] > 100 && create_if_block_2$1();
    	let if_block1 = /*y*/ ctx[0] > 350 && create_if_block_1$2();
    	let if_block2 = /*y*/ ctx[0] > 900 && create_if_block$3();

    	return {
    		c() {
    			h1 = element("h1");
    			h1.textContent = "Our Shop";
    			t1 = space();
    			div0 = element("div");
    			img0 = element("img");
    			t2 = space();
    			if (if_block0) if_block0.c();
    			t3 = space();
    			if (if_block1) if_block1.c();
    			t4 = space();
    			div2 = element("div");
    			img1 = element("img");
    			t5 = space();
    			if (if_block2) if_block2.c();
    			t6 = space();
    			div1 = element("div");
    			t7 = space();
    			img2 = element("img");
    			attr(h1, "class", "nameShop svelte-ie5zrp");
    			attr(img0, "class", "testy  svelte-ie5zrp");
    			attr(img0, "width", "1500");
    			if (img0.src !== (img0_src_value = "main2.png")) attr(img0, "src", img0_src_value);
    			attr(img0, "alt", "");
    			attr(div0, "class", "main container svelte-ie5zrp");
    			attr(img1, "class", "imgS2 svelte-ie5zrp");
    			if (img1.src !== (img1_src_value = "sandal.png")) attr(img1, "src", img1_src_value);
    			attr(img1, "alt", "");
    			attr(div1, "class", "middleG svelte-ie5zrp");
    			attr(img2, "class", "imgS svelte-ie5zrp");
    			if (img2.src !== (img2_src_value = "bag.png")) attr(img2, "src", img2_src_value);
    			attr(img2, "alt", "");
    			attr(div2, "class", "row svelte-ie5zrp");
    		},
    		m(target, anchor) {
    			insert(target, h1, anchor);
    			insert(target, t1, anchor);
    			insert(target, div0, anchor);
    			append(div0, img0);
    			append(div0, t2);
    			if (if_block0) if_block0.m(div0, null);
    			append(div0, t3);
    			if (if_block1) if_block1.m(div0, null);
    			insert(target, t4, anchor);
    			insert(target, div2, anchor);
    			append(div2, img1);
    			append(div2, t5);
    			if (if_block2) if_block2.m(div2, null);
    			append(div2, t6);
    			append(div2, div1);
    			append(div2, t7);
    			append(div2, img2);
    			current = true;

    			if (!mounted) {
    				dispose = listen(window, "scroll", () => {
    					scrolling = true;
    					clearTimeout(scrolling_timeout);
    					scrolling_timeout = setTimeout(clear_scrolling, 100);
    					/*onwindowscroll*/ ctx[1]();
    				});

    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*y*/ 1 && !scrolling) {
    				scrolling = true;
    				clearTimeout(scrolling_timeout);
    				scrollTo(window.pageXOffset, /*y*/ ctx[0]);
    				scrolling_timeout = setTimeout(clear_scrolling, 100);
    			}

    			if (/*y*/ ctx[0] > 100) {
    				if (if_block0) {
    					if (dirty & /*y*/ 1) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_2$1();
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div0, t3);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*y*/ ctx[0] > 350) {
    				if (if_block1) {
    					if (dirty & /*y*/ 1) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_1$2();
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div0, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (/*y*/ ctx[0] > 900) {
    				if (if_block2) {
    					if (dirty & /*y*/ 1) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block$3();
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(div2, t6);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			transition_in(if_block2);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(if_block2);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(h1);
    			if (detaching) detach(t1);
    			if (detaching) detach(div0);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (detaching) detach(t4);
    			if (detaching) detach(div2);
    			if (if_block2) if_block2.d();
    			mounted = false;
    			dispose();
    		}
    	};
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let y;

    	function onwindowscroll() {
    		$$invalidate(0, y = window.pageYOffset);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*y*/ 1) ;

    		if ($$self.$$.dirty & /*y*/ 1) ;

    		if ($$self.$$.dirty & /*y*/ 1) {
    			console.log(y);
    		}
    	};

    	$$invalidate(0, y = 100);
    	return [y, onwindowscroll];
    }

    class Page extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});
    	}
    }

    /* src\Carts.svelte generated by Svelte v3.38.2 */

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[21] = list[i];
    	return child_ctx;
    }

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[21] = list[i];
    	return child_ctx;
    }

    // (113:0) {:else}
    function create_else_block(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value_1 = [.../*s*/ ctx[7]];
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	return {
    		c() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			if (dirty & /*n, doz, s, mush, choz, oz, cho, cart2, cart1*/ 510) {
    				each_value_1 = [.../*s*/ ctx[7]];
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_1$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value_1.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach(each_1_anchor);
    		}
    	};
    }

    // (95:0) {#if op5 !== "empty4"}
    function create_if_block$2(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = [.../*s*/ ctx[7]];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	return {
    		c() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			if (dirty & /*n, doz, s, mush, choz, oz, cho, cart2, cart1*/ 510) {
    				each_value = [.../*s*/ ctx[7]];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach(each_1_anchor);
    		}
    	};
    }

    // (114:0) {#each [...s] as item}
    function create_each_block_1$1(ctx) {
    	let div2;
    	let img;
    	let img_src_value;
    	let img_transition;
    	let t0;
    	let div1;
    	let html_tag;
    	let raw_value = /*cart2*/ ctx[2][/*cart1*/ ctx[1].indexOf(/*item*/ ctx[21])] + "";
    	let t1;
    	let div0;
    	let button0;
    	let t3;
    	let t4_value = (/*mush*/ ctx[4][/*doz*/ ctx[3][0].indexOf(/*item*/ ctx[21])]) + "";
    	let t4;
    	let button1;
    	let t6;
    	let t7_value = [.../*n*/ ctx[8]][/*doz*/ ctx[3][0].indexOf(/*item*/ ctx[21])] * /*mush*/ ctx[4][/*doz*/ ctx[3][0].indexOf(/*item*/ ctx[21])] + "";
    	let t7;
    	let div1_transition;
    	let t8;
    	let div2_transition;
    	let current;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			div2 = element("div");
    			img = element("img");
    			t0 = space();
    			div1 = element("div");
    			t1 = space();
    			div0 = element("div");
    			button0 = element("button");
    			button0.textContent = "+";
    			t3 = space();
    			t4 = text(t4_value);
    			button1 = element("button");
    			button1.textContent = "-";
    			t6 = space();
    			t7 = text(t7_value);
    			t8 = space();
    			attr(img, "class", "checkin svelte-6n9i85");
    			if (img.src !== (img_src_value = "" + (/*item*/ ctx[21] + ".png"))) attr(img, "src", img_src_value);
    			attr(img, "alt", "");
    			html_tag = new HtmlTag(t1);
    			attr(button0, "class", "add svelte-6n9i85");
    			attr(button1, "class", "remove svelte-6n9i85");
    			attr(div0, "class", "numbers svelte-6n9i85");
    			attr(div1, "class", "contentPic svelte-6n9i85");
    			attr(div2, "class", "start svelte-6n9i85");
    		},
    		m(target, anchor) {
    			insert(target, div2, anchor);
    			append(div2, img);
    			append(div2, t0);
    			append(div2, div1);
    			html_tag.m(raw_value, div1);
    			append(div1, t1);
    			append(div1, div0);
    			append(div0, button0);
    			append(div0, t3);
    			append(div0, t4);
    			append(div0, button1);
    			append(div0, t6);
    			append(div0, t7);
    			append(div2, t8);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen(button0, "click", function () {
    						if (is_function(/*cho*/ ctx[5](/*doz*/ ctx[3][0].indexOf(/*item*/ ctx[21])))) /*cho*/ ctx[5](/*doz*/ ctx[3][0].indexOf(/*item*/ ctx[21])).apply(this, arguments);
    					}),
    					listen(button1, "click", function () {
    						if (is_function(/*choz*/ ctx[6](/*doz*/ ctx[3][0].indexOf(/*item*/ ctx[21])))) /*choz*/ ctx[6](/*doz*/ ctx[3][0].indexOf(/*item*/ ctx[21])).apply(this, arguments);
    					})
    				];

    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;
    			if ((!current || dirty & /*cart2, cart1*/ 6) && raw_value !== (raw_value = /*cart2*/ ctx[2][/*cart1*/ ctx[1].indexOf(/*item*/ ctx[21])] + "")) html_tag.p(raw_value);
    			if ((!current || dirty & /*mush, doz*/ 24) && t4_value !== (t4_value = (/*mush*/ ctx[4][/*doz*/ ctx[3][0].indexOf(/*item*/ ctx[21])]) + "")) set_data(t4, t4_value);
    			if ((!current || dirty & /*doz, mush*/ 24) && t7_value !== (t7_value = [.../*n*/ ctx[8]][/*doz*/ ctx[3][0].indexOf(/*item*/ ctx[21])] * /*mush*/ ctx[4][/*doz*/ ctx[3][0].indexOf(/*item*/ ctx[21])] + "")) set_data(t7, t7_value);
    		},
    		i(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!img_transition) img_transition = create_bidirectional_transition(img, fade, {}, true);
    				img_transition.run(1);
    			});

    			add_render_callback(() => {
    				if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, {}, true);
    				div1_transition.run(1);
    			});

    			add_render_callback(() => {
    				if (!div2_transition) div2_transition = create_bidirectional_transition(div2, fade, {}, true);
    				div2_transition.run(1);
    			});

    			current = true;
    		},
    		o(local) {
    			if (!img_transition) img_transition = create_bidirectional_transition(img, fade, {}, false);
    			img_transition.run(0);
    			if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, {}, false);
    			div1_transition.run(0);
    			if (!div2_transition) div2_transition = create_bidirectional_transition(div2, fade, {}, false);
    			div2_transition.run(0);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div2);
    			if (detaching && img_transition) img_transition.end();
    			if (detaching && div1_transition) div1_transition.end();
    			if (detaching && div2_transition) div2_transition.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    // (96:0) {#each [...s] as item}
    function create_each_block$1(ctx) {
    	let div2;
    	let img;
    	let img_src_value;
    	let img_transition;
    	let t0;
    	let div1;
    	let html_tag;
    	let raw_value = /*cart2*/ ctx[2][/*cart1*/ ctx[1].indexOf(/*item*/ ctx[21])] + "";
    	let t1;
    	let div0;
    	let button0;
    	let t3;
    	let t4_value = (/*mush*/ ctx[4][/*doz*/ ctx[3][0].indexOf(/*item*/ ctx[21])]) + "";
    	let t4;
    	let t5;
    	let button1;
    	let t7;
    	let t8_value = [.../*n*/ ctx[8]][/*doz*/ ctx[3][0].indexOf(/*item*/ ctx[21])] * /*mush*/ ctx[4][/*doz*/ ctx[3][0].indexOf(/*item*/ ctx[21])] + "";
    	let t8;
    	let div1_transition;
    	let t9;
    	let div2_transition;
    	let current;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			div2 = element("div");
    			img = element("img");
    			t0 = space();
    			div1 = element("div");
    			t1 = space();
    			div0 = element("div");
    			button0 = element("button");
    			button0.textContent = "+";
    			t3 = space();
    			t4 = text(t4_value);
    			t5 = space();
    			button1 = element("button");
    			button1.textContent = "-";
    			t7 = space();
    			t8 = text(t8_value);
    			t9 = space();
    			attr(img, "class", "checkin svelte-6n9i85");
    			if (img.src !== (img_src_value = "" + (/*item*/ ctx[21] + ".png"))) attr(img, "src", img_src_value);
    			attr(img, "alt", "");
    			html_tag = new HtmlTag(t1);
    			attr(button0, "class", "add svelte-6n9i85");
    			attr(button1, "class", "remove svelte-6n9i85");
    			attr(div0, "class", "numbers svelte-6n9i85");
    			attr(div1, "class", "contentPic svelte-6n9i85");
    			attr(div2, "class", "start svelte-6n9i85");
    		},
    		m(target, anchor) {
    			insert(target, div2, anchor);
    			append(div2, img);
    			append(div2, t0);
    			append(div2, div1);
    			html_tag.m(raw_value, div1);
    			append(div1, t1);
    			append(div1, div0);
    			append(div0, button0);
    			append(div0, t3);
    			append(div0, t4);
    			append(div0, t5);
    			append(div0, button1);
    			append(div0, t7);
    			append(div0, t8);
    			append(div2, t9);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen(button0, "click", function () {
    						if (is_function(/*cho*/ ctx[5](/*doz*/ ctx[3][0].indexOf(/*item*/ ctx[21])))) /*cho*/ ctx[5](/*doz*/ ctx[3][0].indexOf(/*item*/ ctx[21])).apply(this, arguments);
    					}),
    					listen(button1, "click", function () {
    						if (is_function(/*choz*/ ctx[6](/*doz*/ ctx[3][0].indexOf(/*item*/ ctx[21])))) /*choz*/ ctx[6](/*doz*/ ctx[3][0].indexOf(/*item*/ ctx[21])).apply(this, arguments);
    					})
    				];

    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;
    			if ((!current || dirty & /*cart2, cart1*/ 6) && raw_value !== (raw_value = /*cart2*/ ctx[2][/*cart1*/ ctx[1].indexOf(/*item*/ ctx[21])] + "")) html_tag.p(raw_value);
    			if ((!current || dirty & /*mush, doz*/ 24) && t4_value !== (t4_value = (/*mush*/ ctx[4][/*doz*/ ctx[3][0].indexOf(/*item*/ ctx[21])]) + "")) set_data(t4, t4_value);
    			if ((!current || dirty & /*doz, mush*/ 24) && t8_value !== (t8_value = [.../*n*/ ctx[8]][/*doz*/ ctx[3][0].indexOf(/*item*/ ctx[21])] * /*mush*/ ctx[4][/*doz*/ ctx[3][0].indexOf(/*item*/ ctx[21])] + "")) set_data(t8, t8_value);
    		},
    		i(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!img_transition) img_transition = create_bidirectional_transition(img, fade, {}, true);
    				img_transition.run(1);
    			});

    			add_render_callback(() => {
    				if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, {}, true);
    				div1_transition.run(1);
    			});

    			add_render_callback(() => {
    				if (!div2_transition) div2_transition = create_bidirectional_transition(div2, fade, {}, true);
    				div2_transition.run(1);
    			});

    			current = true;
    		},
    		o(local) {
    			if (!img_transition) img_transition = create_bidirectional_transition(img, fade, {}, false);
    			img_transition.run(0);
    			if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, {}, false);
    			div1_transition.run(0);
    			if (!div2_transition) div2_transition = create_bidirectional_transition(div2, fade, {}, false);
    			div2_transition.run(0);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div2);
    			if (detaching && img_transition) img_transition.end();
    			if (detaching && div1_transition) div1_transition.end();
    			if (detaching && div2_transition) div2_transition.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    function create_fragment$2(ctx) {
    	let div0;
    	let current_block_type_index;
    	let if_block;
    	let t0;
    	let div1;
    	let current;
    	const if_block_creators = [create_if_block$2, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*op5*/ ctx[0] !== "empty4") return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	return {
    		c() {
    			div0 = element("div");
    			if_block.c();
    			t0 = space();
    			div1 = element("div");
    			div1.innerHTML = `<button class="finalBuy svelte-6n9i85">Buy products</button>`;
    			attr(div0, "class", "flex svelte-6n9i85");
    			attr(div1, "class", "checkOut svelte-6n9i85");
    		},
    		m(target, anchor) {
    			insert(target, div0, anchor);
    			if_blocks[current_block_type_index].m(div0, null);
    			insert(target, t0, anchor);
    			insert(target, div1, anchor);
    			current = true;
    		},
    		p(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(div0, null);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div0);
    			if_blocks[current_block_type_index].d();
    			if (detaching) detach(t0);
    			if (detaching) detach(div1);
    		}
    	};
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let mush;
    	let { much } = $$props;
    	let { op2 } = $$props;
    	let { boxBelow } = $$props;
    	let { op5 } = $$props;
    	let { ko } = $$props; ///PRICE FOR AN ITEM 
    	let { op4 } = $$props;
    	let { cart1 } = $$props;
    	let { cart2 } = $$props;
    	let { nostal } = $$props;

    	console.log(op2 + "op2");
    	console.log(ko);
    	console.log(op4 + "op4");
    	console.log(op5 + "op5");
    	console.log(much + "much");

    	function cho(item) {
    		console.log(item);
    		console.log(mush[item]);
    		return $$invalidate(4, mush[item] = mush[item] + 1, mush);
    	}

    	function choz(item) {
    		console.log(item);

    		if (mush[item] > 0) {
    			console.log(mush[item]);
    			return $$invalidate(4, mush[item] = mush[item] - 1, mush);
    		}
    	}

    	const s = new Set(cart1);
    	const n = new Set(nostal);
    	console.log(s);
    	let count = {};

    	cart1.forEach(function (i) {
    		$$invalidate(15, count[i] = (count[i] || 0) + 1, count);
    	});

    	console.log(Object.values(count));
    	let doz = [];
    	doz.push([...s]);
    	console.log(doz);
    	let qq = nostal;

    	$$self.$$set = $$props => {
    		if ("much" in $$props) $$invalidate(10, much = $$props.much);
    		if ("op2" in $$props) $$invalidate(11, op2 = $$props.op2);
    		if ("boxBelow" in $$props) $$invalidate(12, boxBelow = $$props.boxBelow);
    		if ("op5" in $$props) $$invalidate(0, op5 = $$props.op5);
    		if ("ko" in $$props) $$invalidate(13, ko = $$props.ko);
    		if ("op4" in $$props) $$invalidate(9, op4 = $$props.op4);
    		if ("cart1" in $$props) $$invalidate(1, cart1 = $$props.cart1);
    		if ("cart2" in $$props) $$invalidate(2, cart2 = $$props.cart2);
    		if ("nostal" in $$props) $$invalidate(14, nostal = $$props.nostal);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*count*/ 32768) {
    			$$invalidate(4, mush = Object.values(count));
    		}

    		if ($$self.$$.dirty & /*doz*/ 8) {
    			$$invalidate(3, doz);
    		}

    		if ($$self.$$.dirty & /*ko, mush*/ 8208) {
    			ko * mush[0];
    		}

    		if ($$self.$$.dirty & /*nostal*/ 16384) {
    			console.log(nostal);
    		}
    	};

    	console.log([...n]);
    	console.log(qq);

    	return [
    		op5,
    		cart1,
    		cart2,
    		doz,
    		mush,
    		cho,
    		choz,
    		s,
    		n,
    		op4,
    		much,
    		op2,
    		boxBelow,
    		ko,
    		nostal,
    		count
    	];
    }

    class Carts extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
    			much: 10,
    			op2: 11,
    			boxBelow: 12,
    			op5: 0,
    			ko: 13,
    			op4: 9,
    			cart1: 1,
    			cart2: 2,
    			nostal: 14
    		});
    	}
    }

    /* src\Nav.svelte generated by Svelte v3.38.2 */

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[25] = list[i];
    	return child_ctx;
    }

    function get_each_context_4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[25] = list[i];
    	return child_ctx;
    }

    function get_each_context_3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[25] = list[i];
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[25] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[25] = list[i];
    	return child_ctx;
    }

    function get_each_context_5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[25] = list[i];
    	return child_ctx;
    }

    // (155:6) {#each navItems as item}
    function create_each_block_5(ctx) {
    	let li;
    	let a;
    	let t0_value = /*item*/ ctx[25].label + "";
    	let t0;
    	let t1;
    	let mounted;
    	let dispose;

    	function mouseover_handler() {
    		return /*mouseover_handler*/ ctx[14](/*item*/ ctx[25]);
    	}

    	return {
    		c() {
    			li = element("li");
    			a = element("a");
    			t0 = text(t0_value);
    			t1 = space();
    			attr(a, "href", /*item*/ ctx[25].href);
    			attr(a, "class", "svelte-fckjwj");
    		},
    		m(target, anchor) {
    			insert(target, li, anchor);
    			append(li, a);
    			append(a, t0);
    			append(li, t1);

    			if (!mounted) {
    				dispose = listen(a, "mouseover", mouseover_handler);
    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d(detaching) {
    			if (detaching) detach(li);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (172:0) {#if showItems}
    function create_if_block$1(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*cur*/ ctx[1] == /*navItems*/ ctx[5][0].label) return create_if_block_1$1;
    		if (/*cur*/ ctx[1] == /*navItems*/ ctx[5][1].label) return create_if_block_2;
    		if (/*cur*/ ctx[1] == /*navItems*/ ctx[5][2].label) return create_if_block_3;
    		if (/*cur*/ ctx[1] == /*navItems*/ ctx[5][3].label) return create_if_block_4;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type && current_block_type(ctx);

    	return {
    		c() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    		},
    		p(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if (if_block) if_block.d(1);
    				if_block = current_block_type && current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d(detaching) {
    			if (if_block) {
    				if_block.d(detaching);
    			}

    			if (detaching) detach(if_block_anchor);
    		}
    	};
    }

    // (205:41) 
    function create_if_block_4(ctx) {
    	let div1;
    	let div0;
    	let t1;
    	let each_value_4 = /*firmsW*/ ctx[9].slice(0, /*firmsW*/ ctx[9].length);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_4.length; i += 1) {
    		each_blocks[i] = create_each_block_4(get_each_context_4(ctx, each_value_4, i));
    	}

    	return {
    		c() {
    			div1 = element("div");
    			div0 = element("div");
    			div0.innerHTML = `<strong>Always on top</strong>`;
    			t1 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr(div1, "class", "firms svelte-fckjwj");
    		},
    		m(target, anchor) {
    			insert(target, div1, anchor);
    			append(div1, div0);
    			append(div1, t1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*firmsW, goToFirms*/ 528) {
    				each_value_4 = /*firmsW*/ ctx[9].slice(0, /*firmsW*/ ctx[9].length);
    				let i;

    				for (i = 0; i < each_value_4.length; i += 1) {
    					const child_ctx = get_each_context_4(ctx, each_value_4, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_4(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_4.length;
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(div1);
    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    // (195:39) 
    function create_if_block_3(ctx) {
    	let div1;
    	let div0;
    	let t1;
    	let each_value_3 = /*firmsJ*/ ctx[8].slice(0, /*firmsJ*/ ctx[8].length);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		each_blocks[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
    	}

    	return {
    		c() {
    			div1 = element("div");
    			div0 = element("div");
    			div0.innerHTML = `<strong>New collections</strong>`;
    			t1 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr(div1, "class", "firms svelte-fckjwj");
    		},
    		m(target, anchor) {
    			insert(target, div1, anchor);
    			append(div1, div0);
    			append(div1, t1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*firmsJ, goToFirms*/ 272) {
    				each_value_3 = /*firmsJ*/ ctx[8].slice(0, /*firmsJ*/ ctx[8].length);
    				let i;

    				for (i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3(ctx, each_value_3, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_3.length;
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(div1);
    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    // (185:37) 
    function create_if_block_2(ctx) {
    	let div1;
    	let div0;
    	let t1;
    	let each_value_2 = /*firmsC*/ ctx[7].slice(0, /*firmsC*/ ctx[7].length);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	return {
    		c() {
    			div1 = element("div");
    			div0 = element("div");
    			div0.innerHTML = `<strong>Discounted</strong>`;
    			t1 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr(div1, "class", "firms svelte-fckjwj");
    		},
    		m(target, anchor) {
    			insert(target, div1, anchor);
    			append(div1, div0);
    			append(div1, t1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*firmsC, goToFirms*/ 144) {
    				each_value_2 = /*firmsC*/ ctx[7].slice(0, /*firmsC*/ ctx[7].length);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_2.length;
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(div1);
    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    // (174:0) {#if cur == navItems[0].label}
    function create_if_block_1$1(ctx) {
    	let div1;
    	let div0;
    	let t1;
    	let each_value_1 = /*firms*/ ctx[6].slice(0, /*firms*/ ctx[6].length);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	return {
    		c() {
    			div1 = element("div");
    			div0 = element("div");
    			div0.innerHTML = `<strong>New collections</strong>`;
    			t1 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr(div1, "class", "firms svelte-fckjwj");
    		},
    		m(target, anchor) {
    			insert(target, div1, anchor);
    			append(div1, div0);
    			append(div1, t1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*firms, goToFirms*/ 80) {
    				each_value_1 = /*firms*/ ctx[6].slice(0, /*firms*/ ctx[6].length);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(div1);
    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    // (208:6) {#each firmsW.slice(0, firmsW.length) as item}
    function create_each_block_4(ctx) {
    	let div;
    	let t0_value = /*item*/ ctx[25] + "";
    	let t0;
    	let t1;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			attr(div, "class", "transition:slide point ok " + /*item*/ ctx[25] + " svelte-fckjwj");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			append(div, t0);
    			append(div, t1);

    			if (!mounted) {
    				dispose = listen(div, "click", /*goToFirms*/ ctx[4]);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d(detaching) {
    			if (detaching) detach(div);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (198:8) {#each firmsJ.slice(0, firmsJ.length) as item}
    function create_each_block_3(ctx) {
    	let div;
    	let t0_value = /*item*/ ctx[25] + "";
    	let t0;
    	let t1;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			attr(div, "class", "transition:slide point ok " + /*item*/ ctx[25] + " svelte-fckjwj");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			append(div, t0);
    			append(div, t1);

    			if (!mounted) {
    				dispose = listen(div, "click", /*goToFirms*/ ctx[4]);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d(detaching) {
    			if (detaching) detach(div);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (188:6) {#each firmsC.slice(0, firmsC.length) as item}
    function create_each_block_2(ctx) {
    	let div;
    	let t0_value = /*item*/ ctx[25] + "";
    	let t0;
    	let t1;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			attr(div, "class", "transition:slide point ok " + /*item*/ ctx[25] + " svelte-fckjwj");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			append(div, t0);
    			append(div, t1);

    			if (!mounted) {
    				dispose = listen(div, "click", /*goToFirms*/ ctx[4]);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d(detaching) {
    			if (detaching) detach(div);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (177:4) {#each firms.slice(0, firms.length) as item}
    function create_each_block_1(ctx) {
    	let div;
    	let t0_value = /*item*/ ctx[25] + "";
    	let t0;
    	let t1;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			attr(div, "class", "transition:slide point ok " + /*item*/ ctx[25] + " svelte-fckjwj");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			append(div, t0);
    			append(div, t1);

    			if (!mounted) {
    				dispose = listen(div, "click", /*goToFirms*/ ctx[4]);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d(detaching) {
    			if (detaching) detach(div);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (230:4) {#each quinq.slice(0, quinq.length) as item}
    function create_each_block(ctx) {
    	let div;
    	let img;
    	let img_class_value;
    	let img_src_value;
    	let t0;
    	let button;
    	let t1_value = /*mark*/ ctx[13](/*item*/ ctx[25]) + "";
    	let t1;
    	let button_class_value;
    	let t2;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			div = element("div");
    			img = element("img");
    			t0 = space();
    			button = element("button");
    			t1 = text(t1_value);
    			t2 = space();
    			attr(img, "class", img_class_value = "imgWige jeden dwa " + /*item*/ ctx[25] + " svelte-fckjwj");
    			if (img.src !== (img_src_value = "" + (/*item*/ ctx[25] + ".png"))) attr(img, "src", img_src_value);
    			attr(img, "alt", "");
    			attr(button, "class", button_class_value = "trzy jeden dwa " + /*item*/ ctx[25] + "x" + " svelte-fckjwj");
    			attr(div, "class", "transition:slide  miniDiv svelte-fckjwj");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			append(div, img);
    			append(div, t0);
    			append(div, button);
    			append(button, t1);
    			append(div, t2);

    			if (!mounted) {
    				dispose = [
    					listen(img, "mouseenter", function () {
    						if (is_function(changeI({ item: /*item*/ ctx[25] }))) changeI({ item: /*item*/ ctx[25] }).apply(this, arguments);
    					}),
    					listen(button, "click", /*goToFirms*/ ctx[4])
    				];

    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*quinq*/ 8 && img_class_value !== (img_class_value = "imgWige jeden dwa " + /*item*/ ctx[25] + " svelte-fckjwj")) {
    				attr(img, "class", img_class_value);
    			}

    			if (dirty[0] & /*quinq*/ 8 && img.src !== (img_src_value = "" + (/*item*/ ctx[25] + ".png"))) {
    				attr(img, "src", img_src_value);
    			}

    			if (dirty[0] & /*quinq*/ 8 && t1_value !== (t1_value = /*mark*/ ctx[13](/*item*/ ctx[25]) + "")) set_data(t1, t1_value);

    			if (dirty[0] & /*quinq*/ 8 && button_class_value !== (button_class_value = "trzy jeden dwa " + /*item*/ ctx[25] + "x" + " svelte-fckjwj")) {
    				attr(button, "class", button_class_value);
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    function create_fragment$1(ctx) {
    	let nav;
    	let div2;
    	let div1;
    	let div0;
    	let div1_class_value;
    	let t0;
    	let ul;
    	let ul_class_value;
    	let t1;
    	let div3;
    	let t2;
    	let mounted;
    	let dispose;
    	let each_value_5 = /*navItems*/ ctx[5];
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_5.length; i += 1) {
    		each_blocks_1[i] = create_each_block_5(get_each_context_5(ctx, each_value_5, i));
    	}

    	let if_block = /*showItems*/ ctx[2] && create_if_block$1(ctx);
    	let each_value = /*quinq*/ ctx[3].slice(0, /*quinq*/ ctx[3].length);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	return {
    		c() {
    			nav = element("nav");
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			t0 = space();
    			ul = element("ul");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t1 = space();
    			div3 = element("div");
    			if (if_block) if_block.c();
    			t2 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr(div0, "class", "middle-line");
    			attr(div1, "class", div1_class_value = "" + (null_to_empty(`mobile-icon${/*mobileMenu*/ ctx[0] ? " active" : ""}`) + " svelte-fckjwj"));
    			attr(ul, "class", ul_class_value = "" + (null_to_empty(`navbar-list${/*mobileMenu*/ ctx[0] ? " mobile" : ""}`) + " svelte-fckjwj"));
    			attr(div2, "class", "inner svelte-fckjwj");
    			attr(div3, "class", "transition:slide superDiv svelte-fckjwj");
    			attr(nav, "class", "svelte-fckjwj");
    		},
    		m(target, anchor) {
    			insert(target, nav, anchor);
    			append(nav, div2);
    			append(div2, div1);
    			append(div1, div0);
    			append(div2, t0);
    			append(div2, ul);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(ul, null);
    			}

    			append(nav, t1);
    			append(nav, div3);
    			if (if_block) if_block.m(div3, null);
    			append(div3, t2);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div3, null);
    			}

    			if (!mounted) {
    				dispose = [
    					listen(div1, "click", /*handleMobileIconClick*/ ctx[10]),
    					listen(div3, "mouseleave", /*mouseleave_handler*/ ctx[15])
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*mobileMenu*/ 1 && div1_class_value !== (div1_class_value = "" + (null_to_empty(`mobile-icon${/*mobileMenu*/ ctx[0] ? " active" : ""}`) + " svelte-fckjwj"))) {
    				attr(div1, "class", div1_class_value);
    			}

    			if (dirty[0] & /*navItems, cur, reduceMe, reduceThem, showItems*/ 6182) {
    				each_value_5 = /*navItems*/ ctx[5];
    				let i;

    				for (i = 0; i < each_value_5.length; i += 1) {
    					const child_ctx = get_each_context_5(ctx, each_value_5, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_5(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_5.length;
    			}

    			if (dirty[0] & /*mobileMenu*/ 1 && ul_class_value !== (ul_class_value = "" + (null_to_empty(`navbar-list${/*mobileMenu*/ ctx[0] ? " mobile" : ""}`) + " svelte-fckjwj"))) {
    				attr(ul, "class", ul_class_value);
    			}

    			if (/*showItems*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(div3, t2);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty[0] & /*quinq, goToFirms, mark*/ 8216) {
    				each_value = /*quinq*/ ctx[3].slice(0, /*quinq*/ ctx[3].length);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div3, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(nav);
    			destroy_each(each_blocks_1, detaching);
    			if (if_block) if_block.d();
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    function changeI(item) {
    	console.log({ item });
    	document.querySelector("." + item.item).src = item.item + "1.png";
    } // document.querySelector("."+item.item +1).classList.toggle("hidden");
    // document.querySelector("."+item.item +1).classList.toggle("display")

    function instance$1($$self, $$props, $$invalidate) {

    	// export const op = "empty";
    	window.click = function (e) {
    		console.log(e.srcElement.className);
    		console.log(e.srcElement.className.split(" ")[3]);
    		return e.srcElement.className.split(" ")[3];
    	};

    	const dispatch = createEventDispatcher();
    	let mobileMenu = false;
    	let cur;

    	// function goToCarts() {
    	//   dispatch("nav", {
    	//     option: "carts",
    	//   });}
    	function goToFirms() {
    		dispatch("nav", { option: "firms", checkId: 1 });
    		document.querySelector(".superDiv").style.opacity = 0;
    		document.querySelector(".superDiv").style.display = "none";
    	}

    	const navItems = [
    		{ label: "Dress", href: "#", id: 1 },
    		{ label: "Clothing", href: "#", id: 2 },
    		{ label: "Jewelery", href: "#", id: 3 },
    		{ label: "Watches", href: "#", id: 4 },
    		// { label: "Bags", href: "#", id:5 },
    		{ label: "Home", href: "#" }
    	];

    	const firms = ["Ted Baker", "Mark & Spancer", "Reformation", "Maje", "Zara"];
    	const firmsC = ["Lily Silk", "Hawes & Curtis", "Dai"];
    	const firmsJ = ["Svarowski", "Bvlgari", "Tiffany", "Missoma"];
    	const firmsW = ["Chanel", "Rolex", "Baume & Mercier"];
    	const handleMobileIconClick = () => $$invalidate(0, mobileMenu = !mobileMenu);

    	const mediaQueryHandler = e => {
    		if (!e.matches) {
    			$$invalidate(0, mobileMenu = false);
    		}
    	};

    	// document.querySelector("."+item.item).classList.toggle("display");
    	onMount(() => {
    		const mediaListener = window.matchMedia("(max-width: 767px)");
    		mediaListener.addListener(mediaQueryHandler);
    	});

    	let showItems = false;

    	let items = [
    		"Bodycon",
    		"offtheshoulder",
    		"maxidress",
    		"four",
    		"five",
    		"six",
    		"seven",
    		"eight",
    		"nine",
    		"ten",
    		"eleven",
    		"tvelve",
    		"13",
    		"14",
    		"15",
    		16,
    		17,
    		18,
    		19
    	];

    	let itemsF = [
    		"Bodycon",
    		"Off The Shoulder",
    		"Maxi Dress",
    		"Casual",
    		"Summer",
    		"Official",
    		"Rings",
    		"Necklace",
    		"Earings",
    		"Retro",
    		"Modern",
    		"Fantasy",
    		13,
    		14,
    		15,
    		16,
    		17,
    		18,
    		19
    	];

    	let quinq = [];

    	function reduceMe(elem) {
    		return $$invalidate(3, quinq = items.slice(elem * 3 - 3, elem * 3));
    	}

    	function reduceThem(e) {
    		return itemsF.slice(e * 3 - 3, e * 3);
    	}

    	function mark(element) {
    		return itemsF[items.indexOf(element)];
    	}

    	const mouseover_handler = item => {
    		document.querySelector(".superDiv").style.opacity = 1;
    		document.querySelector(".superDiv").style.display = "flex";
    		$$invalidate(1, cur = item.label);
    		console.log(reduceMe(item.id));
    		reduceThem(item.id);
    		$$invalidate(2, showItems = true);
    	};

    	const mouseleave_handler = () => {
    		document.querySelector(".superDiv").style.opacity = 0;
    	};

    	return [
    		mobileMenu,
    		cur,
    		showItems,
    		quinq,
    		goToFirms,
    		navItems,
    		firms,
    		firmsC,
    		firmsJ,
    		firmsW,
    		handleMobileIconClick,
    		reduceMe,
    		reduceThem,
    		mark,
    		mouseover_handler,
    		mouseleave_handler
    	];
    }

    class Nav extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {}, [-1, -1]);
    	}
    }

    /* src\App.svelte generated by Svelte v3.38.2 */

    function create_if_block_1(ctx) {
    	let firms;
    	let current;
    	firms = new Firms({});

    	return {
    		c() {
    			create_component(firms.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(firms, target, anchor);
    			current = true;
    		},
    		i(local) {
    			if (current) return;
    			transition_in(firms.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(firms.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(firms, detaching);
    		}
    	};
    }

    // (38:0) {#if nav === 'home'}
    function create_if_block(ctx) {
    	let page;
    	let current;
    	page = new Page({});

    	return {
    		c() {
    			create_component(page.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(page, target, anchor);
    			current = true;
    		},
    		i(local) {
    			if (current) return;
    			transition_in(page.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(page.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(page, detaching);
    		}
    	};
    }

    function create_fragment(ctx) {
    	let nav_1;
    	let t0;
    	let current_block_type_index;
    	let if_block;
    	let t1;
    	let outer;
    	let current;
    	nav_1 = new Nav({});
    	nav_1.$on("nav", /*navHandler*/ ctx[1]);
    	const if_block_creators = [create_if_block, create_if_block_1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*nav*/ ctx[0] === "home") return 0;
    		if (/*nav*/ ctx[0] === "firms") return 1;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	outer = new Outer({});
    	outer.$on("message", handleMessage);

    	return {
    		c() {
    			create_component(nav_1.$$.fragment);
    			t0 = space();
    			if (if_block) if_block.c();
    			t1 = space();
    			create_component(outer.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(nav_1, target, anchor);
    			insert(target, t0, anchor);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(target, anchor);
    			}

    			insert(target, t1, anchor);
    			mount_component(outer, target, anchor);
    			current = true;
    		},
    		p(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index !== previous_block_index) {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					}

    					transition_in(if_block, 1);
    					if_block.m(t1.parentNode, t1);
    				} else {
    					if_block = null;
    				}
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(nav_1.$$.fragment, local);
    			transition_in(if_block);
    			transition_in(outer.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(nav_1.$$.fragment, local);
    			transition_out(if_block);
    			transition_out(outer.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(nav_1, detaching);
    			if (detaching) detach(t0);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d(detaching);
    			}

    			if (detaching) detach(t1);
    			destroy_component(outer, detaching);
    		}
    	};
    }

    function handleMessage(event) {
    	alert(event.detail.text);
    }

    function instance($$self, $$props, $$invalidate) {
    	let nav = "home";

    	function navHandler(event) {
    		$$invalidate(0, nav = event.detail.option);
    	}

    	return [nav, navHandler];
    }

    class App extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance, create_fragment, safe_not_equal, {});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
