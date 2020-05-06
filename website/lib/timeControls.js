/**
 * Represents the timeline controls at the bottom of the left column.
 * 
 * Contains a time window somewhere in a given date range.
 * 
 * The time window is movable, and extendable. I.e. its length can be changed.
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
	}

	/**
	 * (Re)draw the timeline in the svg passed with svgId
	 */
	display() {
		// Clear previous elements
		const children = this.svg.select("*")
		children.remove()

		// Create main rectangle that contains the whole span [minDate, maxDate]
		// (Style that does not depend on time window bounds is handled in CSS)
		this.svg.append("rect").attr("id", "time-control-span")

		// Add minDate and maxDate labels
		this.svg.append("text")
			.text(`${this.minDate.getFullYear()}`)
			.attr("class", "time-control-min-year")
			.attr("text-anchor", "start")
			.attr("x", "0%")
			.attr("y", "100%")
		this.svg.append("text")
			.text(`${this.maxDate.getFullYear()}`)
			.attr("class", "time-control-max-year")
			.attr("text-anchor", "end")
			.attr("x", "100%")
			.attr("y", "100%")

		// Create time window rectangle that defines the time window [twLoBnd, twUpBnd]
		// (Style that does not depend on time window bounds is handled in CSS)
		const scale_x = d3.scaleLinear().domain([this.minDate.getTime(), this.maxDate.getTime()]).range([0, 100])
		const tcw_x = scale_x(this.twLoBnd)
		const tcw_w = scale_x(this.twUpBnd) - scale_x(this.twLoBnd)
		this.svg.append("rect").attr("id", "time-control-window")
			.style("x", `${tcw_x}%`)
			.style("width", `${tcw_w}%`)

		// Add lower/upper bound labels
		const tcw_lox = tcw_x
		const tcw_upx = tcw_x + tcw_w
		this.svg.append("text")
			.text(`${this.twLoBnd.getFullYear()}`)
			.attr("class", "time-control-twlo-year")
			.attr("text-anchor", "start")
			.attr("x", `${tcw_lox}%`)
			.attr("y", "88%")
		this.svg.append("text")
			.text(`${this.twUpBnd.getFullYear()}`)
			.attr("class", "time-control-twup-year")
			.attr("text-anchor", "end")
			.attr("x", `${tcw_upx}%`)
			.attr("y", "88%")
	}
}