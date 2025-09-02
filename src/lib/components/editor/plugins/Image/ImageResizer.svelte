<script>
	import { calculateZoomLevel } from '@lexical/utils';

	/**
	 * @typedef {Object} Props
	 * @property {number} minWidth
	 * @property {number} minHeight
	 * @property {() => void} onResizeStart
	 * @property {(width: 'inherit' | number, height: 'inherit' | number, startWidth: number, startHeight: number) => void} onResizeEnd
	 * @property {HTMLElement | null} imageRef
	 * @property {import('lexical').LexicalEditor} editor
	 */

	/** @type {Props} */
	let { minWidth, minHeight, onResizeStart, onResizeEnd, imageRef, editor } = $props();

	/** @type {HTMLDivElement | null} */
	let controlWrapperRef = $state(null);

	/**
	 * @param {number} value
	 * @param {number} min
	 * @param {number} max
	 */
	const clamp = (value, min, max) => {
		return Math.min(Math.max(value, min), max);
	};

	const Direction = {
		east: 1 << 0,
		north: 1 << 3,
		south: 1 << 1,
		west: 1 << 2,
	};

	const userSelect = {
		priority: '',
		value: 'default',
	};

	/**
	 * @type {{
			currentHeight: 'inherit' | number;
			currentWidth: 'inherit' | number;
			direction: number;
			isResizing: boolean;
			ratio: number;
			startHeight: number;
			startWidth: number;
			startX: number;
			startY: number;
		}}
	 */
	const positioningRef = {
		currentHeight: 0,
		currentWidth: 0,
		direction: 0,
		isResizing: false,
		ratio: 0,
		startHeight: 0,
		startWidth: 0,
		startX: 0,
		startY: 0,
	};

	const editorRootElement = editor.getRootElement();
	// Find max width, accounting for editor padding.
	const maxWidthContainer =
		editorRootElement !== null ? editorRootElement.getBoundingClientRect().width - 20 : minWidth;
	const maxHeightContainer =
		editorRootElement !== null ? editorRootElement.getBoundingClientRect().height - 20 : minHeight;

	/** @param {number} direction */
	const setStartCursor = (direction) => {
		const ew = direction === Direction.east || direction === Direction.west;
		const ns = direction === Direction.north || direction === Direction.south;
		const nwse =
			(direction & Direction.north && direction & Direction.west) ||
			(direction & Direction.south && direction & Direction.east);

		const cursorDir = ew ? 'ew' : ns ? 'ns' : nwse ? 'nwse' : 'nesw';

		if (editorRootElement !== null) {
			editorRootElement.style.setProperty('cursor', `${cursorDir}-resize`, 'important');
		}
		if (document.body !== null) {
			document.body.style.setProperty('cursor', `${cursorDir}-resize`, 'important');
			userSelect.value = document.body.style.getPropertyValue('-webkit-user-select');
			userSelect.priority = document.body.style.getPropertyPriority('-webkit-user-select');
			document.body.style.setProperty('-webkit-user-select', `none`, 'important');
		}
	};

	const setEndCursor = () => {
		if (editorRootElement !== null) {
			editorRootElement.style.removeProperty('cursor');
		}
		if (document.body !== null) {
			document.body.style.removeProperty('cursor');
			document.body.style.removeProperty('-webkit-user-select');
		}
	};

	/**
	 * @param {PointerEvent} event
	 * @param {number} direction
	 */
	const handlePointerDown = (event, direction) => {
		if (!editor.isEditable()) {
			return;
		}

		const image = imageRef;
		const controlWrapper = controlWrapperRef;

		if (image !== null && controlWrapper !== null) {
			event.preventDefault();
			const { width, height } = image.getBoundingClientRect();
			const zoom = calculateZoomLevel(image);
			const positioning = positioningRef;
			positioning.startWidth = width;
			positioning.startHeight = height;
			positioning.ratio = width / height;
			positioning.currentWidth = width;
			positioning.currentHeight = height;
			positioning.startX = event.clientX / zoom;
			positioning.startY = event.clientY / zoom;
			positioning.isResizing = true;
			positioning.direction = direction;

			setStartCursor(direction);
			onResizeStart();

			controlWrapper.classList.add('image-control-wrapper--resizing');

			document.addEventListener('pointermove', handlePointerMove);
			document.addEventListener('pointerup', handlePointerUp);
		}
	};

	/** @param {PointerEvent} event */
	const handlePointerMove = (event) => {
		const image = imageRef;
		const positioning = positioningRef;

		const isHorizontal = positioning.direction & (Direction.east | Direction.west);
		const isVertical = positioning.direction & (Direction.south | Direction.north);

		if (image !== null && positioning.isResizing) {
			const zoom = calculateZoomLevel(image);
			// Corner cursor
			if (isHorizontal && isVertical) {
				let diff = Math.floor(positioning.startX - event.clientX / zoom);
				diff = positioning.direction & Direction.east ? -diff : diff;

				const width = clamp(positioning.startWidth + diff, minWidth, maxWidthContainer);

				const height = width / positioning.ratio;
				image.style.width = `${width}px`;
				image.style.height = `${height}px`;
				positioning.currentHeight = height;
				positioning.currentWidth = width;
			} else if (isVertical) {
				let diff = Math.floor(positioning.startY - event.clientY / zoom);
				diff = positioning.direction & Direction.south ? -diff : diff;

				const height = clamp(positioning.startHeight + diff, minHeight, maxHeightContainer);

				image.style.height = `${height}px`;
				positioning.currentHeight = height;
			} else {
				let diff = Math.floor(positioning.startX - event.clientX / zoom);
				diff = positioning.direction & Direction.east ? -diff : diff;

				const width = clamp(positioning.startWidth + diff, minWidth, maxWidthContainer);

				image.style.width = `${width}px`;
				positioning.currentWidth = width;
			}
		}
	};

	const handlePointerUp = () => {
		const image = imageRef;
		const positioning = positioningRef;
		const controlWrapper = controlWrapperRef;
		if (image !== null && controlWrapper !== null && positioning.isResizing) {
			const width = positioning.currentWidth;
			const height = positioning.currentHeight;

			const startWidth = positioning.startWidth;
			const startHeight = positioning.startHeight;

			positioning.startWidth = 0;
			positioning.startHeight = 0;
			positioning.ratio = 0;
			positioning.startX = 0;
			positioning.startY = 0;
			positioning.currentWidth = 0;
			positioning.currentHeight = 0;
			positioning.isResizing = false;

			controlWrapper.classList.remove('image-control-wrapper--resizing');

			setEndCursor();
			onResizeEnd(width, height, startWidth, startHeight);

			image.style.removeProperty('height');
			image.style.removeProperty('width');

			document.removeEventListener('pointermove', handlePointerMove);
			document.removeEventListener('pointerup', handlePointerUp);
		}
	};
</script>

<div bind:this={controlWrapperRef}>
	<div
		class="image-resizer image-resizer-n"
		onpointerdown={(event) => {
			handlePointerDown(event, Direction.north);
		}}
	></div>
	<div
		class="image-resizer image-resizer-ne"
		onpointerdown={(event) => {
			handlePointerDown(event, Direction.north | Direction.east);
		}}
	></div>
	<div
		class="image-resizer image-resizer-e"
		onpointerdown={(event) => {
			handlePointerDown(event, Direction.east);
		}}
	></div>
	<div
		class="image-resizer image-resizer-se"
		onpointerdown={(event) => {
			handlePointerDown(event, Direction.south | Direction.east);
		}}
	></div>
	<div
		class="image-resizer image-resizer-s"
		onpointerdown={(event) => {
			handlePointerDown(event, Direction.south);
		}}
	></div>
	<div
		class="image-resizer image-resizer-sw"
		onpointerdown={(event) => {
			handlePointerDown(event, Direction.south | Direction.west);
		}}
	></div>
	<div
		class="image-resizer image-resizer-w"
		onpointerdown={(event) => {
			handlePointerDown(event, Direction.west);
		}}
	></div>
	<div
		class="image-resizer image-resizer-nw"
		onpointerdown={(event) => {
			handlePointerDown(event, Direction.north | Direction.west);
		}}
	></div>
</div>
