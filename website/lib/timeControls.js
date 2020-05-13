/**
 * Represents the timeline controls at the bottom of the left column.
 * 
 * Contains a time window somewhere in a given date range.
 * 
 * The time window is movable, and extendable. I.e. its length can be changed.
 * 
 * TODO: take Yoshi as argument in constructor, and update when timeline control is updated.
 */
class TimelineControl {
	/**
	 * @param {string} svgId The id of the svg figure in which to draw
	 * @param {Date} minDate The minimum date of the timeline
	 * @param {Date} maxDate The maximum date of the timeline
	 * @param {Date} twLoBnd The lower bound of the time window, must be >= minDate and <= maxDate
	 * @param {Date} twUpBnd The upper bound of the time window, must be >= minDate, <= maxDate and >= twLoBnd
	 */
	constructor(svgId, minDate, maxDate, twLoBnd, twUpBnd) {
		// Check arguments and crash program if they are invalid
		const valid =
			(typeof svgId === "string") ||
			(minDate instanceof Date) || (maxDate instanceof Date) ||
			(twLoBnd instanceof Date) || (twUpBnd instanceof Date) ||
			(minDate <= maxDate) || (twLoBnd <= twUpBnd) ||
			(twLoBnd >= minDate) || (twLoBnd <= maxDate) ||
			(twUpBnd >= minDate) || (twUpBnd <= maxDate)

		if (!valid) {
			const errMsg = "TimelineControl: invalid arguments (" +
				`\n\tminDate = ${minDate},` +
				`\n\tmaxDate = ${maxDate},` +
				`\n\ttwLoBnd = ${twLoBnd},` +
				`\n\ttwUpBnd = ${twUpBnd}` +
				"\n)"
			throw new Error(errMsg)
		}

		// Store arguments
		this.svg = d3.select(svgId)
		this.minDate = minDate
		this.maxDate = maxDate
		this.twLoBnd = twLoBnd
		this.twUpBnd = twUpBnd

		// Display
		this.display()

		// Add drag n drop
		// 1. Compute global time span width in pixels
		// Use https://stackoverflow.com/questions/21990857/d3-js-how-to-get-the-computed-width-and-height-for-an-arbitrary-element
		// TODO: update this BBox when the viewport is resized
		const tsBBox = this.svg.select("#time-span rect").node().getBBox()
		const tsXStart_px = tsBBox.x
		const tsXEnd_px = tsBBox.x + tsBBox.width

		function clamp(v, lo, up) {
			if (up < lo) throw new Error("Invalid clamps")
			if (v < lo) return lo
			if (v > up) return up
			return v
		}

		// 2. Use it to create drag and drop
		const tw = this.svg.select("#time-window")
		const twRect = tw.select("rect")
		const pxToPC = d3.scaleLinear().domain([tsXStart_px, tsXEnd_px]).range([0, 100])
		const yearToPc = d3.scaleTime().domain([this.minDate, this.maxDate]).range([0, 100])
		let dx_px;
		const thisClass = this;
		const dragHandler = d3.drag()
			.on("start", function () {
				// Get x-distance in px between left side of time window and drag point
				dx_px = d3.event.x - twRect.node().getBBox().x
			})
			.on("drag", function () {
				// Update x position of rectangle as event.x - dx
				// Clamp x position in [0, tsXEnd - twWidth]
				const twWidth_px = twRect.node().getBBox().width;
				const newXLeft_pc = pxToPC(clamp(d3.event.x - dx_px, tsXStart_px, tsXEnd_px - twWidth_px))
				const newXRight_pc = newXLeft_pc + pxToPC(twWidth_px)
				twRect.style("x", `${newXLeft_pc}%`)

				// Update x position of lower and upper bound texts
				// Update lower and upper bound class attributes
				thisClass.twLoBnd = yearToPc.invert(newXLeft_pc)
				thisClass.twUpBnd = yearToPc.invert(newXRight_pc)
				
				tw.select(".time-window-lo-year")
					.attr("x", `${newXLeft_pc}%`)
					.text(`${thisClass.twLoBnd.getFullYear()}`)
				tw.select(".time-window-up-year")
					.attr("x", `${newXRight_pc}%`)
					.text(`${thisClass.twUpBnd.getFullYear()}`)
			})
		dragHandler(twRect)
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

		// Add minDate and maxDate labels to top level group
		timeControl.append("text")
			.text(`${this.minDate.getFullYear()}`)
			.attr("class", "time-span-min-year")
			.attr("text-anchor", "start")
			.attr("x", "0%")
			.attr("y", "100%")
		timeControl.append("text")
			.text(`${this.maxDate.getFullYear()}`)
			.attr("class", "time-span-max-year")
			.attr("text-anchor", "end")
			.attr("x", "100%")
			.attr("y", "100%")

		// Create time window group, contains time window and text
		timeControl.append("g")
			.attr("id", "time-window")
		const timeControlWindow = timeControl.select("#time-window")

		// Create time window rectangle that defines the time window [twLoBnd, twUpBnd]
		// (Style that does not depend on time window bounds is handled in CSS)
		const scale_x = d3.scaleLinear().domain([this.minDate.getTime(), this.maxDate.getTime()]).range([0, 100])
		const tcw_x = scale_x(this.twLoBnd)
		const tcw_w = scale_x(this.twUpBnd) - scale_x(this.twLoBnd)
		timeControlWindow.append("rect")
			.style("x", `${tcw_x}%`)
			.style("width", `${tcw_w}%`)

		// Add lower/upper bound labels
		const tcw_lox = tcw_x
		const tcw_upx = tcw_x + tcw_w
		timeControlWindow.append("text")
			.text(`${this.twLoBnd.getFullYear()}`)
			.attr("class", "time-window-lo-year")
			.attr("text-anchor", "start")
			.attr("x", `${tcw_lox}%`)
			.attr("y", "88%")
		timeControlWindow.append("text")
			.text(`${this.twUpBnd.getFullYear()}`)
			.attr("class", "time-window-up-year")
			.attr("text-anchor", "end")
			.attr("x", `${tcw_upx}%`)
			.attr("y", "88%")
	}
}