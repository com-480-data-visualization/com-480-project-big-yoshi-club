/**
 * Represents the timeline controls at the bottom of the left column.
 * 
 * Contains a time window somewhere in a given year range.
 * 
 * The time window is movable, and extendable. I.e. its length can be changed.
 */
class TimelineControl {
	/**
	 * @param {string} svgId The id of the svg figure in which to draw
	 * @param {yoshi} parent The parent class that we use to update the rolls
	 * @param {number} minYear The minimum year of the timeline
	 * @param {number} maxYear The maximum year of the timeline
	 * @param {number} twLoBnd The lower bound of the time window, must be >= minYear and <= maxYear
	 * @param {number} twUpBnd The upper bound of the time window, must be >= minYear, <= maxYear and >= twLoBnd
	 */
	constructor(yoshi, svgId, minYear, maxYear, twLoBnd, twUpBnd) {
		// Check arguments and crash program if they are invalid
		const valid =
			(typeof svgId === "string") ||
			(typeof minYear === "number") || (typeof maxYear === "number") ||
			(typeof twLoBnd === "number") || (typeof twUpBnd === "number") ||
			(minYear <= maxYear) || (twLoBnd <= twUpBnd) ||
			(twLoBnd >= minYear) || (twLoBnd <= maxYear) ||
			(twUpBnd >= minYear) || (twUpBnd <= maxYear)

		if (!valid) {
			const errMsg = "TimelineControl: invalid arguments (" +
				`\n\tminYear = ${minYear},` +
				`\n\tmaxYear = ${maxYear},` +
				`\n\ttwLoBnd = ${twLoBnd},` +
				`\n\ttwUpBnd = ${twUpBnd}` +
				"\n)"
			throw new Error(errMsg)
		}

		// Store arguments
		this.parent = yoshi
		this.svg = d3.select(svgId)
		this.minYear = minYear
		this.maxYear = maxYear
		this._updateTWBounds(twLoBnd, twUpBnd)

		// Display
		this.display()

		// Add drag n drop and resize

		// 1. Compute global time span width in pixels
		// Use https://stackoverflow.com/questions/21990857/d3-js-how-to-get-the-computed-width-and-height-for-an-arbitrary-element
		// TODO: update this BBox when the viewport is resized
		const tsBBox = this.svg.select("#time-span rect").node().getBoundingClientRect()
		const tsXStart_px = tsBBox.left
		const tsXEnd_px = tsBBox.right

		// 2. Create useful scales for conversions
		this.pxToPC = d3.scaleLinear().domain([tsXStart_px, tsXEnd_px]).range([0, 100]).clamp(true)
		this.yearToPc = d3.scaleLinear().domain([this.minYear, this.maxYear]).range([0, 100]).clamp(true)
		this.pxToYear = d3.scaleLinear().domain([tsXStart_px, tsXEnd_px]).range([this.minYear, this.maxYear]).clamp(true)

		// 3. Do selections in advance
		const tw = this.svg.select("#time-window")
		const twRect = tw.select("rect")

		// I wish I was doing Scala, or Rust, or even C would be better
		const thisClass = this

		// These flag determine if the time window is being dragged or resized
		// This allows us to prevent the global class from updating the time window
		// while it is being dragged or resized
		this.inDrag = false
		this.inResize = false

		// 4. Handle drag n drop and resize using https://interactjs.io/
		const twInteract = interact("#time-window")
		twInteract.draggable({
			// Set listeners for drag start, move and end events
			listeners: {
				start(event) {
					thisClass.inDrag = true
				},
				move(event) {
					// -- Update x position of lower and upper bound texts
					// -- Update lower and upper bound class attributes
					const bbox = twRect.node().getBoundingClientRect()
					// Get original left position
					const left_px = bbox.left
					// Get original right position
					const right_px = bbox.right
					// Compute new left position by adding delta x
					// And making sure this does not go under 0 or make the right bound overflow
					// This might be a terrible way to prevent the range from shifting beyond the bounds
					// But I don't have time to look into something cleaner
					const min_px = thisClass.pxToYear.invert(thisClass.minYear)
					const max_px = thisClass.pxToYear.invert(thisClass.maxYear)
					const newLoBnd = thisClass.pxToYear(_.clamp(
						left_px + event.dx, min_px, max_px - (right_px - left_px)
					))
					// Compute new right position by adding delta x
					// And making sure we do not go over 100 or make the left bound underflow
					// This might be a terrible way to prevent the range from shifting beyond the bounds
					// But I don't have time to look into something cleaner
					const newUpBnd = thisClass.pxToYear(_.clamp(
						right_px + event.dx, min_px + (right_px - left_px), max_px
					))

					thisClass._updateTWBounds(newLoBnd, newUpBnd)
					thisClass._redrawTW()
					thisClass._redrawTWBounds()
				},
				end(event) {
					thisClass.inDrag = false
					thisClass._updateYoshi()
				}
			}
		})
			.resizable({
				// Resize only from left and right side
				edges: { left: true, right: true, bottom: false, top: false },
				// React to resize events
				listeners: {
					start(event) {
						thisClass.inResize = true

						// Dirty fix for weird px shift bug
						// If we resize from left, save right value
						// If we resize from right, save left value
						if (event.edges.left) {
							// this.oldLoBnd = null
							thisClass.oldUpBnd = thisClass.twUpBnd
						} else if (event.edges.right) {
							// this.oldUpBnd = null
							thisClass.oldLoBnd = thisClass.twLoBnd
						}
					},
					move(event) {
						// -- Update x position of lower and upper bound texts
						// -- Update lower and upper bound class attributes

						// I don't know why, I don't want to know why, I shouldn't have to wonder why,
						// but for whatever reason the goddamn time window's opposite side won't stay put
						// unless we do this terribleness
						const newLoBnd = event.edges.left ? thisClass.pxToYear(event.rect.left) : thisClass.oldLoBnd
						const newUpBnd = event.edges.right ? thisClass.pxToYear(event.rect.right) : thisClass.oldUpBnd

						thisClass._updateTWBounds(newLoBnd, newUpBnd)
						thisClass._redrawTWBounds()

						// Update time window display
						thisClass._redrawTW()
					},
					end(event) {
						// Update Yoshi
						thisClass.inResize = false
						thisClass._updateYoshi()
					}
				},
				// Limits of resizing
				modifiers: [
					interact.modifiers.restrictSize({
						min: { width: 100 } // Limit width to 100 px
					})
				]
			})
	}

	/**
	 * Update bounds
	 * 
	 * @param {number} loBnd 
	 * @param {number} upBnd 
	 */
	_updateTWBounds(loBnd, upBnd) {
		if (loBnd > upBnd) throw new Error(`update tw bounds: Error: lower bound cannot be greater than upper bound! (lo = ${loBnd}, up = ${upBnd})`)
		if (loBnd < this.minYear) throw new Error(`update tw bounds: Error: lower bound cannot be lower than min year! (lo = ${loBnd}, this.minYear = ${this.minYear})`)
		if (upBnd > this.maxYear) throw new Error(`update tw bounds: Error: upper bound cannot be greater than max year! (up = ${upBnd}, this.maxYear = ${this.maxYear})`)
		this.twLoBnd = loBnd
		this.twUpBnd = upBnd
	}

	/**
	 * Redraw the time dinwow
	 */
	_redrawTW() {
		const twRect = this.svg.select("#time-window rect")
		const left_pc = this.yearToPc(this.twLoBnd)
		const width_pc = this.yearToPc(this.twUpBnd) - left_pc
		twRect.style("x", `${left_pc}%`)
		twRect.style("width", `${width_pc}%`)
	}

	/**
	 * Redraw the text of the bounds of the time window.
	 */
	_redrawTWBounds() {
		const tw = this.svg.select("#time-window")
		tw.select(".time-window-lo-year")
			.attr("x", `${this.yearToPc(this.twLoBnd)}%`)
			.text(`${parseInt(this.twLoBnd)}`)
		tw.select(".time-window-up-year")
			.attr("x", `${this.yearToPc(this.twUpBnd)}%`)
			.text(`${parseInt(this.twUpBnd)}`)
	}

	/**
	 * Update the parent class responsible for displaying the data
	 * within the range this class chooses.
	 */
	_updateYoshi() {
		// Record whether the roll was running when the event fired
		const wasOn = this.parent.on

		// -- Update roll display with lower bound and upper bound --

		// Update roll display bounds
		const year0 = this.twLoBnd
		const window = this.twUpBnd - this.twLoBnd

		this.parent.reset(Math.floor(year0), Math.floor(window))
		
		// Restart the rolls if they were running
		if (wasOn) {
			this.parent.start()
		}
	}

	/**
	 * Update the lower and upper bound, then redraw.
	 * Will NOT update anything if the window is being dragged or resized.
	 * @param {number} loBnd The lowest year to display
	 * @param {number} upBnd The highest year to display
	 */
	update(loBnd, upBnd) {
		if (!(this.inDrag || this.inResize)) {
			// Check arguments and crash program if they are invalid
			const valid =
				(typeof loBnd === "number") || (typeof upBnd === "number") ||
				(loBnd <= upBnd) ||
				(loBnd >= this.minYear) || (loBnd <= this.maxYear) ||
				(upBnd >= this.minYear) || (upBnd <= this.maxYear)

			if (!valid) {
				const errMsg = "TimelineControl: invalid arguments (" +
					`\n\ttwLoBnd = ${loBnd},` +
					`\n\ttwUpBnd = ${upBnd}` +
					"\n)"
				throw new Error(errMsg)
			}
			// Update the upper and lower bounds
			this._updateTWBounds(loBnd, upBnd)
			// Redraw time window and bounds
			this._redrawTW()
			this._redrawTWBounds()
		}
	}

	/**
	 * (Re)draw the timeline in the svg passed with svgId
	 */
	display() {
		// Clear previous elements
		const children = this.svg.select("*")
		children.remove()

		// Create top level group, contains everything
		this.svg.append("g")
			.attr("id", "time-span")
		const timeControl = this.svg.select("#time-span")

		// Create main rectangle that contains the whole span [minDate, maxDate]
		// (Style that does not depend on time window bounds is handled in CSS)
		timeControl.append("rect")

		// Add date labels with vertical lines to top level group
		const numLabels = 8
		const yearLabels = [...Array(numLabels).keys()].map(i => {
			return Math.round(this.minYear + (this.maxYear - this.minYear) * i / (numLabels - 1))
		})
		yearLabels.forEach(y => {
			// Add text
			const textAnchor = y === this.minYear ? "start" : (y === this.maxYear ? "end" : "middle")
			const yearPos_pc = 100 * (y - this.minYear) / (this.maxYear - this.minYear)
			timeControl.append("text")
				.text(y)
				.attr("text-anchor", textAnchor)
				.attr("x", `${yearPos_pc}%`)
				.attr("y", "100%")

			// Add vertical marker
			const tsBBox = this.svg.select("#time-span rect").node().getBoundingClientRect()
			const tsWidth = tsBBox.right - tsBBox.left
			const tsHeight = tsBBox.bottom - tsBBox.top
			timeControl.append("path")
				.attr("d", `M ${yearPos_pc * tsWidth / 100} 0 V ${0.95 * tsHeight}`)
		})

		// Create time window group, contains time window and text
		timeControl.append("g")
			.attr("id", "time-window")
			.style("touch-action", "none") // Suggested by interact.js
		const timeControlWindow = timeControl.select("#time-window")

		// Create time window rectangle that defines the time window [twLoBnd, twUpBnd]
		// (Style that does not depend on time window bounds is handled in CSS)
		const scale_x = d3.scaleLinear().domain([this.minYear, this.maxYear]).range([0, 100])
		const tcw_x = scale_x(this.twLoBnd)
		const tcw_w = scale_x(this.twUpBnd) - scale_x(this.twLoBnd)
		timeControlWindow.append("rect")
			.style("x", `${tcw_x}%`)
			.style("width", `${tcw_w}%`)

		// Add lower/upper bound labels
		const tcw_lox = tcw_x
		const tcw_upx = tcw_x + tcw_w
		timeControlWindow.append("text")
			.text(`${this.twLoBnd}`)
			.attr("class", "time-window-lo-year")
			.attr("text-anchor", "start")
			.attr("x", `${tcw_lox}%`)
			.attr("y", "84%")
		timeControlWindow.append("text")
			.text(`${this.twUpBnd}`)
			.attr("class", "time-window-up-year")
			.attr("text-anchor", "end")
			.attr("x", `${tcw_upx}%`)
			.attr("y", "84%")
	}
}